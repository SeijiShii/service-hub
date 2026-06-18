import type {
  ProviderAdapter,
  ProviderKind,
  ServiceDescriptor,
  ServiceMeta,
  UsageMetric,
  ServiceInfoResponse,
  MetricKey,
} from "../types/index.js";
import { safeFetch, type SafeFetchOpts } from "./fetch.js";
import { isSafePublicUrl } from "../lib/safeUrl.js";

export interface AdapterDeps {
  fetchImpl?: typeof fetch;
  allowInternal?: boolean;
  env?: Record<string, string | undefined>;
}

type CollectResult = {
  metrics: UsageMetric[];
  error?: string;
  meta?: ServiceMeta;
};

async function getJson(
  url: string,
  deps: AdapterDeps,
  headers?: Record<string, string>,
): Promise<any> {
  const opts: SafeFetchOpts = {
    fetchImpl: deps.fetchImpl,
    allowInternal: deps.allowInternal,
    headers,
  };
  const res = await safeFetch(url, opts);
  if (res.status === 401 || res.status === 403) throw new Error("auth");
  if (res.status === 429) throw new Error("rate_limited");
  if (!res.ok) throw new Error(`http_${res.status}`);
  return res.json();
}

function wrap(
  kind: ProviderKind,
  fn: (s: ServiceDescriptor, deps: AdapterDeps) => Promise<UsageMetric[]>,
) {
  return (deps: AdapterDeps = {}): ProviderAdapter => ({
    kind,
    async collect(service): Promise<CollectResult> {
      try {
        return { metrics: await fn(service, deps) };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "error";
        return {
          metrics: [],
          error: /timeout|abort/i.test(msg) ? "timeout" : msg,
        };
      }
    },
  });
}

/**
 * meta? を返す adapter 用 wrap (favicon-projection、spec-review R1)。
 * service-info adapter が producer 申告 static identity (iconUrl 等) を runner へ橋渡しする。
 * ping/vercel/neon は既存 `wrap` を維持 (meta 不要)。
 */
function wrapWithMeta(
  kind: ProviderKind,
  fn: (
    s: ServiceDescriptor,
    deps: AdapterDeps,
  ) => Promise<{ metrics: UsageMetric[]; meta?: ServiceMeta }>,
) {
  return (deps: AdapterDeps = {}): ProviderAdapter => ({
    kind,
    async collect(service): Promise<CollectResult> {
      try {
        const r = await fn(service, deps);
        const out: CollectResult = { metrics: r.metrics };
        if (r.meta) out.meta = r.meta;
        return out;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "error";
        return {
          metrics: [],
          error: /timeout|abort/i.test(msg) ? "timeout" : msg,
        };
      }
    },
  });
}

export const createPingAdapter = wrap("ping", async (s, deps) => {
  try {
    const res = await safeFetch(s.url, {
      fetchImpl: deps.fetchImpl,
      allowInternal: deps.allowInternal,
    });
    const up = res.status >= 200 && res.status < 400 ? 1 : 0;
    return [{ provider: "ping", key: "up", value: up, unit: "bool" }];
  } catch {
    return [{ provider: "ping", key: "up", value: 0, unit: "bool" }];
  }
});

export const createVercelAdapter = wrap("vercel", async (s, deps) => {
  const id = s.providers.vercel?.projectId;
  if (!id) return [];
  const token = deps.env?.VERCEL_API_TOKEN;
  const j = await getJson(
    `https://api.vercel.com/v6/deployments?projectId=${id}&limit=1`,
    deps,
    token ? { Authorization: `Bearer ${token}` } : undefined,
  );
  const dep = j.deployments?.[0];
  if (!dep) return [];
  return [
    {
      provider: "vercel",
      key: "last_deploy_at",
      value: Number(dep.createdAt ?? dep.created ?? 0),
      unit: "epoch_ms",
    },
  ];
});

export const createNeonAdapter = wrap("neon", async (s, deps) => {
  const id = s.providers.neon?.projectId;
  if (!id) return [];
  const token = deps.env?.NEON_API_KEY;
  const j = await getJson(
    `https://console.neon.tech/api/v2/projects/${id}`,
    deps,
    token ? { Authorization: `Bearer ${token}` } : undefined,
  );
  const p = j.project ?? {};
  const m: UsageMetric[] = [];
  if (p.synthetic_storage_size != null)
    m.push({
      provider: "neon",
      key: "db_storage_bytes",
      value: Number(p.synthetic_storage_size),
      unit: "bytes",
    });
  if (p.compute_time_seconds != null)
    m.push({
      provider: "neon",
      key: "db_compute_seconds",
      value: Number(p.compute_time_seconds),
      unit: "seconds",
    });
  return m;
});

// createClerkAdapter は撤去 ([D20260528-002])。MAU は各サービスが service-info の
// metrics[] key="mau" で自己申告し createServiceInfoAdapter が emit する。HUB は
// per-service Clerk secret を持たない (秘密ゼロ化)。未申告サービスはフォールバックなし ([D20260528-010])。

/**
 * iconUrl format check + silent reject with stderr 警告ログ (favicon-projection、spec-review R6 / P80)。
 * 値はログしない、rejection 理由のメタ情報 (slug / reason / typeof) のみ stderr へ出力。
 * 失敗時は undefined を返し、呼び出し側は updateServiceMeta を呼ばない (既存値保持、[論点-FP2])。
 */
function pickServiceInfoIconUrl(
  slug: string,
  raw: unknown,
): string | undefined {
  if (raw === undefined) return undefined; // key 無しは silent (rejection ではない)
  if (typeof raw !== "string") {
    console.warn(
      `service-info iconUrl rejected: slug=${slug} reason=type rawType=${typeof raw}`,
    );
    return undefined;
  }
  if (raw.length === 0) {
    console.warn(
      `service-info iconUrl rejected: slug=${slug} reason=empty rawType=string`,
    );
    return undefined;
  }
  if (!isSafePublicUrl(raw)) {
    // reason 推定 (値そのものはログしない): protocol / internal / length / parse のいずれか
    let reason = "parse";
    if (raw.length > 1024) reason = "length";
    else {
      try {
        const u = new URL(raw);
        if (u.protocol !== "https:") reason = "protocol";
        else reason = "internal";
      } catch {
        reason = "parse";
      }
    }
    console.warn(
      `service-info iconUrl rejected: slug=${slug} reason=${reason} rawType=string`,
    );
    return undefined;
  }
  return raw;
}

/**
 * summary sanitize + silent reject with stderr 警告 (summary-projection、[論点-011]/O48 v3)。
 * 値はログしない (PII ではないが一貫性のため)、rejection 理由のメタ情報のみ stderr へ。
 * - 非 string / 空 (trim 後) → undefined (申告なし扱い、既存値保持)
 * - 改行・制御文字は空白へ畳み、前後 trim (showcase 1 行表示の安全化)
 * - SUMMARY_MAX_LEN (200) 超は length reject (producer 側契約は ~120 字、余裕を見て 200 で cap)
 */
const SUMMARY_MAX_LEN = 200;
function pickServiceInfoSummary(
  slug: string,
  raw: unknown,
): string | undefined {
  if (raw === undefined) return undefined; // key 無しは silent (rejection ではない)
  if (typeof raw !== "string") {
    console.warn(
      `service-info summary rejected: slug=${slug} reason=type rawType=${typeof raw}`,
    );
    return undefined;
  }
  // 制御文字 (改行/タブ等) を空白へ畳み、連続空白を 1 つに、前後 trim。
  const cleaned = raw
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length === 0) {
    console.warn(
      `service-info summary rejected: slug=${slug} reason=empty rawType=string`,
    );
    return undefined;
  }
  if (cleaned.length > SUMMARY_MAX_LEN) {
    console.warn(
      `service-info summary rejected: slug=${slug} reason=length len=${cleaned.length}`,
    );
    return undefined;
  }
  return cleaned;
}

/**
 * 旧メトリクスキーの正規化エイリアス (後方互換、revenue-metrics-display C20260607-001)。
 * producer が旧名で申告しても HUB 側 canonical キーへ正規化して保存する。
 * tip_count / tip_total_yen は当初 producer が tip 専用名で本番申告したが、収益源泉は
 * サービスにより寄付/売上/投げ銭等さまざまなため汎用 revenue_* を契約 canonical とした。
 * 旧名での申告は本マップで受理し続ける (producer の強制再デプロイを不要にする)。
 */
const LEGACY_METRIC_KEY_ALIAS: Record<string, MetricKey> = {
  tip_count: "revenue_count",
  tip_total_yen: "revenue_total_yen",
};

export const createServiceInfoAdapter = wrapWithMeta(
  "service-info",
  async (s, deps) => {
    const ref = s.serviceInfo;
    if (!ref?.endpoint) return { metrics: [] };
    // 全サービス共通の 1 本 ([D20260528-002])。未設定ならヘッダなしで叩く ([D20260528-011])。
    const secret = deps.env?.HUB_SERVICE_INFO_SECRET;
    const j = (await getJson(
      ref.endpoint,
      deps,
      secret ? { Authorization: `Bearer ${secret}` } : undefined,
    )) as ServiceInfoResponse;
    if (typeof j?.schemaVersion !== "number") throw new Error("parse");
    const metrics: UsageMetric[] = [
      {
        provider: "service-info",
        key: "up",
        value: j.status === "down" ? 0 : 1,
        unit: "bool",
      },
    ];
    for (const m of j.metrics ?? []) {
      metrics.push({
        provider: "service-info",
        key: LEGACY_METRIC_KEY_ALIAS[m.key] ?? m.key,
        value: m.value,
        unit: m.unit,
      });
    }
    // v2: iconUrl 抽出 + format check (favicon-projection) / v3: summary 抽出 + sanitize ([論点-011])。
    // 失敗 (申告なし/reject) した field は meta に含めない (silent reject、既存値保持)。
    const meta: ServiceMeta = {};
    const iconUrl = pickServiceInfoIconUrl(s.slug, j.iconUrl);
    if (iconUrl !== undefined) meta.iconUrl = iconUrl;
    const summary = pickServiceInfoSummary(s.slug, j.summary);
    if (summary !== undefined) meta.summary = summary;
    if (meta.iconUrl !== undefined || meta.summary !== undefined) {
      return { metrics, meta };
    }
    return { metrics };
  },
);
