import { describe, it, expect } from "vitest";
import type { ServiceDescriptor, ServiceInfoResponse } from "./service.js";
import type { SnapshotRow, MetricKey } from "./metric.js";

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
});
