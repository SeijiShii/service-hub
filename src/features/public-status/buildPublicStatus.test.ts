import { describe, it, expect } from "vitest";
import { buildPublicStatus } from "./buildPublicStatus.js";
import type { ServiceDescriptor, SnapshotRow } from "../../types/index.js";

const svc = (over: Partial<ServiceDescriptor> = {}): ServiceDescriptor =>
  ({
    slug: "hana-memo",
    name: "hana-memo",
    url: "https://hana-memo.example.com",
    status: "active",
    providers: {},
    ...over,
  }) as ServiceDescriptor;

const snap = (over: Partial<SnapshotRow>): SnapshotRow => ({
  id: "x",
  serviceSlug: "hana-memo",
  provider: "ping",
  metricKey: "up",
  metricValue: 1,
  unit: "bool",
  capturedAt: "2026-05-27T00:00:00.000Z",
  ...over,
});

describe("buildPublicStatus (public-status-api Phase 1)", () => {
  it("PS-N1: active + up=1 → status=up + lastCheckedAt", () => {
    const r = buildPublicStatus(
      [svc()],
      [snap({ metricKey: "up", metricValue: 1 })],
    );
    expect(r).toEqual([
      {
        slug: "hana-memo",
        name: "hana-memo",
        url: "https://hana-memo.example.com",
        status: "up",
        lastCheckedAt: "2026-05-27T00:00:00.000Z",
      },
    ]);
  });
  it("PS-N2: up=0 → down", () => {
    expect(
      buildPublicStatus([svc()], [snap({ metricValue: 0 })])[0]!.status,
    ).toBe("down");
  });
  it("PS-N2b: up が 0/1 以外 (0.5/NaN) → down と誤表示せず unknown (feedback FB)", () => {
    expect(
      buildPublicStatus([svc()], [snap({ metricValue: 0.5 })])[0]!.status,
    ).toBe("unknown");
    expect(
      buildPublicStatus([svc()], [snap({ metricValue: NaN })])[0]!.status,
    ).toBe("unknown");
  });
  it("PS-N2c: lastCheckedAt は up メトリクスの時刻 (他メトリクスの時刻に引っ張られない)", () => {
    const r = buildPublicStatus(
      [svc()],
      [
        snap({
          metricKey: "up",
          metricValue: 1,
          capturedAt: "2026-05-27T09:00:00.000Z",
        }),
        snap({
          metricKey: "db_storage_bytes",
          metricValue: 100,
          capturedAt: "2026-05-27T23:59:00.000Z",
        }),
      ],
    );
    expect(r[0]!.lastCheckedAt).toBe("2026-05-27T09:00:00.000Z");
  });
  it("PS-N3: up スナップショット無し → unknown", () => {
    const r = buildPublicStatus([svc()], []);
    expect(r[0]!.status).toBe("unknown");
    expect(r[0]!.lastCheckedAt).toBeUndefined();
  });
  it("PS-N4: paused/retired は出力に含まれない (active のみ)", () => {
    const services = [
      svc({ slug: "a", status: "active" }),
      svc({ slug: "b", status: "paused" }),
      svc({ slug: "c", status: "retired" }),
    ];
    const r = buildPublicStatus(services, []);
    expect(r.map((x) => x.slug)).toEqual(["a"]);
  });
  it("PS-S1 (セキュリティ最重要): 内部指標を含む snapshots でも内部キーが JSON に漏れない", () => {
    const dirty: SnapshotRow[] = [
      snap({ metricKey: "up", metricValue: 1 }),
      snap({ metricKey: "revenue_month_usd", metricValue: 9999 }),
      snap({ metricKey: "ai_cost_month_usd", metricValue: 42 }),
      snap({ metricKey: "mau", metricValue: 12345 }),
      snap({
        metricKey: "checkout_card_failed_month",
        metricValue: 7,
        rawJson: { secret: "x" },
      }),
    ];
    const json = JSON.stringify(buildPublicStatus([svc()], dirty));
    for (const leak of [
      "revenue",
      "ai_cost",
      "mau",
      "checkout",
      "rawJson",
      "raw_json",
      "9999",
      "42",
      "12345",
      "secret",
    ]) {
      expect(json).not.toContain(leak);
    }
    // 公開キーのみ
    expect(JSON.parse(json)[0]).toEqual({
      slug: "hana-memo",
      name: "hana-memo",
      url: "https://hana-memo.example.com",
      status: "up",
      lastCheckedAt: "2026-05-27T00:00:00.000Z",
    });
  });
  it("PS-B1: active 0 件 → []", () => {
    expect(buildPublicStatus([], [])).toEqual([]);
  });
});
