import { describe, it, expect } from "vitest";
import type { ServiceDescriptor, ServiceInfoResponse } from "./service.js";
import type { SnapshotRow, MetricKey } from "./metric.js";

describe("structural types compile & hold shape", () => {
  it("ServiceDescriptor with env-only secrets (T-N: 値を持たない)", () => {
    const s: ServiceDescriptor = {
      slug: "hana-memo",
      name: "hana-memo",
      url: "https://hana-memo.example.com",
      status: "active",
      providers: { vercel: { projectId: "prj_x" }, clerk: { appId: "app_x", secretEnv: "HANAMEMO_CLERK_SECRET" } },
      serviceInfo: { endpoint: "https://hana-memo.example.com/api/hub/service-info", secretEnv: "HANAMEMO_HUB_SECRET" },
    };
    expect(s.slug).toBe("hana-memo");
    // secret は env 参照名のみ (値はオブジェクトに無い)
    expect(s.providers.clerk?.secretEnv).toBe("HANAMEMO_CLERK_SECRET");
  });

  it("MetricKey は既知 + 任意文字列 (open union, T-B2)", () => {
    const known: MetricKey = "mau";
    const custom: MetricKey = "custom_xyz";
    expect([known, custom]).toEqual(["mau", "custom_xyz"]);
  });

  it("SnapshotRow rawJson は unknown (narrowing 強制)", () => {
    const row: SnapshotRow = {
      id: "uuid-1", serviceSlug: "hana-memo", provider: "ping",
      metricKey: "up", metricValue: 1, unit: "bool", capturedAt: "2026-05-26T00:00:00Z",
    };
    expect(row.metricValue).toBe(1);
  });

  it("ServiceInfoResponse 最小固定 + extra", () => {
    const r: ServiceInfoResponse = {
      schemaVersion: 1, service: "hana-memo", status: "ok",
      metrics: [{ key: "active_users_7d", value: 38, unit: "count" }],
      extra: { note: "ok" },
    };
    expect(r.schemaVersion).toBe(1);
  });
});
