import { describe, it, expect } from "vitest";
import type {
  ServiceDescriptor,
  ServiceInfoResponse,
  ServiceMeta,
} from "./service.js";
import type { SnapshotRow, MetricKey } from "./metric.js";
import type { ProviderAdapter } from "./provider.js";

describe("structural types compile & hold shape", () => {
  it("ServiceDescriptor は識別子のみ・秘密を持たない (T-N, [D20260528-002])", () => {
    const s: ServiceDescriptor = {
      slug: "hana-memo",
      name: "hana-memo",
      url: "https://hana-memo.example.com",
      status: "active",
      providers: { vercel: { projectId: "prj_x" }, clerk: { appId: "app_x" } },
      serviceInfo: {
        endpoint: "https://hana-memo.example.com/api/hub/service-info",
      },
    };
    expect(s.slug).toBe("hana-memo");
    // secretEnv は撤去済み (秘密ゼロ化)。providers は非機密識別子のみ。
    expect(s.providers.clerk?.appId).toBe("app_x");
  });

  it("MetricKey は既知 + 任意文字列 (open union, T-B2)", () => {
    const known: MetricKey = "mau";
    const custom: MetricKey = "custom_xyz";
    expect([known, custom]).toEqual(["mau", "custom_xyz"]);
  });

  it("SnapshotRow rawJson は unknown (narrowing 強制)", () => {
    const row: SnapshotRow = {
      id: "uuid-1",
      serviceSlug: "hana-memo",
      provider: "ping",
      metricKey: "up",
      metricValue: 1,
      unit: "bool",
      capturedAt: "2026-05-26T00:00:00Z",
    };
    expect(row.metricValue).toBe(1);
  });

  it("ServiceInfoResponse 最小固定 + extra", () => {
    const r: ServiceInfoResponse = {
      schemaVersion: 1,
      service: "hana-memo",
      status: "ok",
      metrics: [{ key: "active_users_7d", value: 38, unit: "count" }],
      extra: { note: "ok" },
    };
    expect(r.schemaVersion).toBe(1);
  });

  // ── favicon-projection (revise_favicon-projection_20260528) ──────
  it("FP-U-01: ServiceInfoResponse v2 (iconUrl 含む)", () => {
    const r: ServiceInfoResponse = {
      schemaVersion: 2,
      service: "x",
      status: "ok",
      iconUrl: "https://x.example/favicon.svg",
    };
    expect(r.iconUrl).toBe("https://x.example/favicon.svg");
  });

  it("FP-U-02: ServiceInfoResponse v1 後方互換 (iconUrl 無し許容)", () => {
    const r: ServiceInfoResponse = {
      schemaVersion: 1,
      service: "x",
      status: "ok",
    };
    expect(r.iconUrl).toBeUndefined();
  });

  it("FP-U-03: ServiceDescriptor に iconUrl optional 追加", () => {
    const s: ServiceDescriptor = {
      slug: "x",
      name: "x",
      url: "https://x.example/",
      status: "active",
      providers: {},
      iconUrl: "https://x.example/favicon.svg",
    };
    expect(s.iconUrl).toBe("https://x.example/favicon.svg");
  });

  it("FP-U-37: ProviderAdapter 戻り値型に meta?: ServiceMeta 拡張 (ping/vercel/neon は meta 無しで互換)", () => {
    // ping adapter 風 (meta 返さない、optional のため compile OK)
    const pingLike: ProviderAdapter["collect"] = async () => ({
      metrics: [],
    });
    // service-info adapter 風 (meta 返す)
    const meta: ServiceMeta = { iconUrl: "https://x.example/favicon.svg" };
    const serviceInfoLike: ProviderAdapter["collect"] = async () => ({
      metrics: [],
      meta,
    });
    expect(typeof pingLike).toBe("function");
    expect(typeof serviceInfoLike).toBe("function");
  });
});
