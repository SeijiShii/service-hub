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
    // 公開キーのみ (FP-M-01: iconUrl を allowlist に追加、財務情報は引き続き禁止)
    expect(JSON.parse(json)[0]).toEqual({
      slug: "hana-memo",
      name: "hana-memo",
      url: "https://hana-memo.example.com",
      status: "up",
      lastCheckedAt: "2026-05-27T00:00:00.000Z",
    });
  });

  // ── favicon-projection (revise_favicon-projection_20260528) ──────
  it("FP-U-10: services に iconUrl 有 + up=1 → DTO に iconUrl 含む", () => {
    const r = buildPublicStatus(
      [svc({ iconUrl: "https://hana-memo.example.com/favicon.svg" })],
      [snap({ metricKey: "up", metricValue: 1 })],
    );
    expect(r[0]!.iconUrl).toBe("https://hana-memo.example.com/favicon.svg");
    expect(r[0]!.status).toBe("up");
  });

  it("FP-U-11: services に iconUrl 無し → DTO に iconUrl キー含有しない", () => {
    const r = buildPublicStatus(
      [svc({ iconUrl: undefined })],
      [snap({ metricKey: "up", metricValue: 1 })],
    );
    expect(r[0]!.iconUrl).toBeUndefined();
    expect(Object.keys(r[0]!)).not.toContain("iconUrl");
  });

  it("FP-M-01: 内部キー allowlist 更新 — iconUrl は公開、財務情報は引き続き禁止", () => {
    const dirty: SnapshotRow[] = [
      snap({ metricKey: "up", metricValue: 1 }),
      snap({ metricKey: "revenue_month_usd", metricValue: 9999 }),
    ];
    const r = buildPublicStatus(
      [svc({ iconUrl: "https://hana-memo.example.com/favicon.svg" })],
      dirty,
    );
    const json = JSON.stringify(r);
    // iconUrl は公開
    expect(json).toContain("iconUrl");
    expect(json).toContain("favicon.svg");
    // 財務情報は引き続き禁止
    for (const leak of ["revenue", "9999"]) {
      expect(json).not.toContain(leak);
    }
    // shape 厳密一致 (iconUrl + 既存 5 キーのみ)
    expect(JSON.parse(json)[0]).toEqual({
      slug: "hana-memo",
      name: "hana-memo",
      url: "https://hana-memo.example.com",
      status: "up",
      lastCheckedAt: "2026-05-27T00:00:00.000Z",
      iconUrl: "https://hana-memo.example.com/favicon.svg",
    });
  });
  // ── summary-projection ([論点-011]/O48 v3) ──────
  it("SM-PS-01: services に summary 有 + up=1 → DTO に summary 含む", () => {
    const r = buildPublicStatus(
      [svc({ summary: "草花を撮るだけの発見ノートです。" })],
      [snap({ metricKey: "up", metricValue: 1 })],
    );
    expect(r[0]!.summary).toBe("草花を撮るだけの発見ノートです。");
    expect(r[0]!.status).toBe("up");
  });

  it("SM-PS-02: services に summary 無し → DTO に summary キー含有しない", () => {
    const r = buildPublicStatus(
      [svc({ summary: undefined })],
      [snap({ metricKey: "up", metricValue: 1 })],
    );
    expect(r[0]!.summary).toBeUndefined();
    expect(Object.keys(r[0]!)).not.toContain("summary");
  });

  it("SM-PS-03: summary + iconUrl 同時 → 両方 DTO に含む (公開安全フィールドのみ)", () => {
    const r = buildPublicStatus(
      [
        svc({
          summary: "短い紹介文。",
          iconUrl: "https://hana-memo.example.com/favicon.svg",
        }),
      ],
      [snap({ metricKey: "up", metricValue: 1 })],
    );
    expect(JSON.parse(JSON.stringify(r))[0]).toEqual({
      slug: "hana-memo",
      name: "hana-memo",
      url: "https://hana-memo.example.com",
      status: "up",
      lastCheckedAt: "2026-05-27T00:00:00.000Z",
      iconUrl: "https://hana-memo.example.com/favicon.svg",
      summary: "短い紹介文。",
    });
  });

  it("PS-B1: active 0 件 → []", () => {
    expect(buildPublicStatus([], [])).toEqual([]);
  });
});
