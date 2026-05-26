import { describe, it, expect } from "vitest";
import {
  createPingAdapter, createVercelAdapter, createNeonAdapter, createClerkAdapter, createServiceInfoAdapter,
} from "./adapters.js";
import { getAdapters } from "./index.js";
import type { ServiceDescriptor } from "../types/index.js";

const svc = (over: Partial<ServiceDescriptor> = {}): ServiceDescriptor => ({
  slug: "svc", name: "svc", url: "https://svc.example.com", status: "active", providers: {}, ...over,
});

// mock fetch ファクトリ
const mockFetch = (status: number, body: unknown): typeof fetch =>
  (async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })) as any;
const throwFetch = (err: string): typeof fetch =>
  (async () => { throw new Error(err); }) as any;

describe("ping (PR-N1/N2)", () => {
  it("up=1 on 200", async () => {
    const r = await createPingAdapter({ fetchImpl: mockFetch(200, {}), allowInternal: true }).collect(svc());
    expect(r.metrics).toEqual([{ provider: "ping", key: "up", value: 1, unit: "bool" }]);
  });
  it("up=0 on 503", async () => {
    const r = await createPingAdapter({ fetchImpl: mockFetch(503, {}), allowInternal: true }).collect(svc());
    expect(r.metrics[0].value).toBe(0);
  });
});

describe("neon (PR-N3)", () => {
  it("normalizes storage/compute", async () => {
    const fetchImpl = mockFetch(200, { project: { synthetic_storage_size: 1234, compute_time_seconds: 50 } });
    const r = await createNeonAdapter({ fetchImpl, allowInternal: true, env: { NEON_API_KEY: "k" } })
      .collect(svc({ providers: { neon: { projectId: "p1" } } }));
    expect(r.metrics).toEqual([
      { provider: "neon", key: "db_storage_bytes", value: 1234, unit: "bytes" },
      { provider: "neon", key: "db_compute_seconds", value: 50, unit: "seconds" },
    ]);
  });
});

describe("vercel (PR-N4) / clerk (PR-N5)", () => {
  it("vercel last_deploy_at", async () => {
    const r = await createVercelAdapter({ fetchImpl: mockFetch(200, { deployments: [{ createdAt: 1700000000000 }] }), allowInternal: true })
      .collect(svc({ providers: { vercel: { projectId: "p" } } }));
    expect(r.metrics[0]).toMatchObject({ key: "last_deploy_at", value: 1700000000000 });
  });
  it("clerk mau proxy from total_count", async () => {
    const r = await createClerkAdapter({ fetchImpl: mockFetch(200, { total_count: 42 }), allowInternal: true })
      .collect(svc({ providers: { clerk: { appId: "a" } } }));
    expect(r.metrics[0]).toEqual({ provider: "clerk", key: "mau", value: 42, unit: "count" });
  });
});

describe("service-info (PR-N6 / PR-B2)", () => {
  it("normalizes status + metrics", async () => {
    const body = { schemaVersion: 1, service: "svc", status: "ok", metrics: [{ key: "active_users_7d", value: 38, unit: "count" }] };
    const r = await createServiceInfoAdapter({ fetchImpl: mockFetch(200, body), allowInternal: true })
      .collect(svc({ serviceInfo: { endpoint: "https://svc.example.com/api/hub/service-info" } }));
    expect(r.metrics).toEqual([
      { provider: "service-info", key: "up", value: 1, unit: "bool" },
      { provider: "service-info", key: "active_users_7d", value: 38, unit: "count" },
    ]);
  });
  it("PR-B2: unknown schemaVersion → 既知部分のみ (クラッシュなし)", async () => {
    const body = { schemaVersion: 99, service: "svc", status: "down" };
    const r = await createServiceInfoAdapter({ fetchImpl: mockFetch(200, body), allowInternal: true })
      .collect(svc({ serviceInfo: { endpoint: "https://svc.example.com/api/hub/service-info" } }));
    expect(r.metrics[0]).toEqual({ provider: "service-info", key: "up", value: 0, unit: "bool" });
  });
});

describe("errors (PR-E1/E2/E3/E4)", () => {
  it("timeout → {error:timeout}", async () => {
    const r = await createNeonAdapter({ fetchImpl: throwFetch("aborted timeout"), allowInternal: true, env: {} })
      .collect(svc({ providers: { neon: { projectId: "p" } } }));
    expect(r.error).toBe("timeout"); expect(r.metrics).toEqual([]);
  });
  it("401 → {error:auth}", async () => {
    const r = await createNeonAdapter({ fetchImpl: mockFetch(401, {}), allowInternal: true, env: {} })
      .collect(svc({ providers: { neon: { projectId: "p" } } }));
    expect(r.error).toBe("auth");
  });
  it("429 → {error:rate_limited}", async () => {
    const r = await createNeonAdapter({ fetchImpl: mockFetch(429, {}), allowInternal: true, env: {} })
      .collect(svc({ providers: { neon: { projectId: "p" } } }));
    expect(r.error).toBe("rate_limited");
  });
});

describe("getAdapters (PR-N7)", () => {
  it("selects ping + declared providers", () => {
    const list = getAdapters(svc({ providers: { vercel: { projectId: "p" }, neon: { projectId: "n" } } }));
    expect(list.map((a) => a.kind).sort()).toEqual(["neon", "ping", "vercel"]);
  });
  it("includes service-info when endpoint set", () => {
    const list = getAdapters(svc({ serviceInfo: { endpoint: "https://x.example.com/i" } }));
    expect(list.map((a) => a.kind)).toContain("service-info");
  });
});
