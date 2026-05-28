import type {
  ProviderAdapter,
  ProviderKind,
  ServiceDescriptor,
  UsageMetric,
  ServiceInfoResponse,
} from "../types/index.js";
import { safeFetch, type SafeFetchOpts } from "./fetch.js";

export interface AdapterDeps {
  fetchImpl?: typeof fetch;
  allowInternal?: boolean;
  env?: Record<string, string | undefined>;
}

type CollectResult = { metrics: UsageMetric[]; error?: string };

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

export const createServiceInfoAdapter = wrap(
  "service-info",
  async (s, deps) => {
    const ref = s.serviceInfo;
    if (!ref?.endpoint) return [];
    // 全サービス共通の 1 本 ([D20260528-002])。未設定ならヘッダなしで叩く ([D20260528-011])。
    const secret = deps.env?.HUB_SERVICE_INFO_SECRET;
    const j = (await getJson(
      ref.endpoint,
      deps,
      secret ? { Authorization: `Bearer ${secret}` } : undefined,
    )) as ServiceInfoResponse;
    if (typeof j?.schemaVersion !== "number") throw new Error("parse");
    const out: UsageMetric[] = [
      {
        provider: "service-info",
        key: "up",
        value: j.status === "down" ? 0 : 1,
        unit: "bool",
      },
    ];
    for (const m of j.metrics ?? []) {
      out.push({
        provider: "service-info",
        key: m.key,
        value: m.value,
        unit: m.unit,
      });
    }
    return out;
  },
);
