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

export const createClerkAdapter = wrap("clerk", async (s, deps) => {
  if (!s.providers.clerk?.appId) return [];
  const secretEnvName = s.providers.clerk.secretEnv;
  const token = secretEnvName ? deps.env?.[secretEnvName] : undefined;
  const j = await getJson(
    `https://api.clerk.com/v1/users/count`,
    deps,
    token ? { Authorization: `Bearer ${token}` } : undefined,
  );
  // total_count 代理 (厳密 MAU は [論点-PR1] Phase2)
  return [
    {
      provider: "clerk",
      key: "mau",
      value: Number(j.total_count ?? 0),
      unit: "count",
    },
  ];
});

export const createServiceInfoAdapter = wrap(
  "service-info",
  async (s, deps) => {
    const ref = s.serviceInfo;
    if (!ref?.endpoint) return [];
    const secret = ref.secretEnv ? deps.env?.[ref.secretEnv] : undefined;
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
