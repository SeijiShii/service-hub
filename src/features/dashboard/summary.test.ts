import { describe, it, expect } from "vitest";
import { buildDashboard, DASHBOARD_CHART_SOURCE_METRICS } from "./summary.js";
import { rowStatusKind } from "./rowStatus.js";
import type {
  ServiceDescriptor,
  SnapshotRow,
  AlertEvent,
  CollectionRun,
} from "../../types/index.js";

const svc = (
  slug: string,
  thresholds?: ServiceDescriptor["thresholds"],
): ServiceDescriptor => ({
  slug,
  name: slug,
  url: `https://${slug}.example.com`,
  status: "active",
  providers: {},
  thresholds,
});
const snap = (over: Partial<SnapshotRow>): SnapshotRow => ({
  id: "s",
  serviceSlug: "a",
  provider: "ping",
  metricKey: "up",
  metricValue: 1,
  unit: "bool",
  capturedAt: "2026-05-26T00:00:00.000Z",
  ...over,
});

describe("buildDashboard", () => {
  it("DA-N1/N4: 結合 + up/down カウント", () => {
    const vm = buildDashboard(
      [svc("a"), svc("b")],
      [
        snap({ serviceSlug: "a", metricValue: 1 }),
        snap({ serviceSlug: "b", metricValue: 0 }),
        snap({
          serviceSlug: "a",
          metricKey: "mau",
          metricValue: 42,
          unit: "count",
        }),
      ],
      [],
    );
    expect(vm.upCount).toBe(1);
    expect(vm.downCount).toBe(1);
    expect(vm.rows.find((r) => r.slug === "a")?.metrics.mau?.value).toBe(42);
  });

  it("DA-N2: 無料枠 % → warn/over", () => {
    const s = svc("a", { db_storage_bytes: { warnPct: 80, limit: 1000 } });
    const warn = buildDashboard(
      [s],
      [
        snap({
          provider: "neon",
          metricKey: "db_storage_bytes",
          metricValue: 850,
          unit: "bytes",
        }),
      ],
      [],
    );
    expect(warn.rows[0].freeTierState).toBe("warn");
    const over = buildDashboard(
      [s],
      [
        snap({
          provider: "neon",
          metricKey: "db_storage_bytes",
          metricValue: 1200,
          unit: "bytes",
        }),
      ],
      [],
    );
    expect(over.rows[0].freeTierState).toBe("over");
  });

  it("DA-E3: メトリクス欠損 → up=null", () => {
    const vm = buildDashboard([svc("a")], [], []);
    expect(vm.rows[0].up).toBeNull();
  });

  it("openAlertCount 集計", () => {
    const a: AlertEvent = {
      id: "1",
      serviceSlug: "a",
      provider: "ping",
      rule: "down",
      triggeredAt: "x",
      value: 0,
    };
    const vm = buildDashboard([svc("a")], [], [a, { ...a, id: "2" }]);
    expect(vm.rows[0].openAlertCount).toBe(2);
  });

  it("DA-B1: 0 service → 空", () => {
    expect(buildDashboard([], [], []).rows).toEqual([]);
  });

  // ── favicon-projection 内部 dashboard 表示 (CF-20260528-020) ──
  it("FP-DA-01: ServiceDescriptor.iconUrl が ServiceRowVM.iconUrl に投影される", () => {
    const sWithIcon = {
      ...svc("a"),
      iconUrl: "https://a.example/favicon.svg",
    };
    const vm = buildDashboard([sWithIcon], [], []);
    expect(vm.rows[0].iconUrl).toBe("https://a.example/favicon.svg");
  });

  it("FP-DA-02: iconUrl 無 → ServiceRowVM.iconUrl は undefined (キー含有しない)", () => {
    const vm = buildDashboard([svc("a")], [], []);
    expect(vm.rows[0].iconUrl).toBeUndefined();
  });

  // revenue-metrics-display (C20260607-001): revenue_* は generic に VM へ投影される (回帰防止)
  it("REV-DA-01: revenue_count / revenue_total_yen が ServiceRowVM.metrics に generic 投影される", () => {
    const vm = buildDashboard(
      [svc("a")],
      [
        snap({ metricKey: "revenue_count", metricValue: 1, unit: "count" }),
        snap({
          id: "s2",
          metricKey: "revenue_total_yen",
          metricValue: 100,
          unit: "jpy",
        }),
      ],
      [],
    );
    expect(vm.rows[0].metrics.revenue_count).toEqual({
      value: 1,
      unit: "count",
    });
    expect(vm.rows[0].metrics.revenue_total_yen).toEqual({
      value: 100,
      unit: "jpy",
    });
  });

  // ── chart-ux (revise_chart-ux_20260608) : ユーザー数/収益¥ の 2 chart に集約 ──
  it("BC-U-01: charts = 2 件、順序 [mau, revenue_total_yen]、日本語 label (usd 系 3 chart 削除)", () => {
    const chartSnaps: SnapshotRow[] = [
      snap({
        serviceSlug: "a",
        metricKey: "mau",
        metricValue: 100,
        unit: "count",
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
      snap({
        serviceSlug: "a",
        metricKey: "revenue_total_yen",
        metricValue: 200,
        unit: "jpy",
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
      // 課金額/コスト snapshot が混入しても chart には現れない (source metric 対象外)
      snap({
        serviceSlug: "a",
        metricKey: "revenue_month_usd",
        metricValue: 50,
        unit: "usd",
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
      snap({
        serviceSlug: "a",
        metricKey: "ai_cost_month_usd",
        metricValue: 10,
        unit: "usd",
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
    ];
    const vm = buildDashboard([svc("a")], [], [], undefined, chartSnaps);
    expect(vm.charts).toHaveLength(2);
    expect(vm.charts.map((c) => c.metricKey)).toEqual([
      "mau",
      "revenue_total_yen",
    ]);
    expect(vm.charts.map((c) => c.label)).toEqual(["ユーザー数", "収益"]);
    // 収益 chart に revenue_total_yen series が点を持つ (推移)
    const rev = vm.charts.find((c) => c.metricKey === "revenue_total_yen")!;
    expect(rev.series[0].points).toEqual([
      { capturedAt: "2026-05-10T00:00:00.000Z", value: 200 },
    ]);
    // 削除した usd 系 + up / db_storage_bytes は chart 対象外
    const keys = vm.charts.map((c) => c.metricKey);
    expect(keys).not.toContain("revenue_month_usd"); // 課金額 削除
    expect(keys).not.toContain("ai_cost_month_usd"); // コスト 削除
    expect(keys).not.toContain("profit"); // 採算 削除
    expect(keys).not.toContain("up");
    expect(keys).not.toContain("db_storage_bytes");
  });

  it("BC-U-02: SOURCE_METRICS = [mau, revenue_total_yen] (usd 系を取得しない)", () => {
    expect([...DASHBOARD_CHART_SOURCE_METRICS]).toEqual([
      "mau",
      "revenue_total_yen",
    ]);
  });

  it("BC-U-11: 全欠落 → charts 2 件、各 series points = []", () => {
    const vm = buildDashboard([svc("a")], [], []); // chartSnapshots 省略
    expect(vm.charts).toHaveLength(2);
    expect(vm.charts.every((c) => c.series.length === 1)).toBe(true);
    expect(vm.charts.every((c) => c.series[0].points.length === 0)).toBe(true);
  });

  it("BC-U-13: 1 service のみ source あり → series に全 service (なし側 points=[])", () => {
    const services2 = [svc("a"), svc("b")];
    const chartSnaps: SnapshotRow[] = [
      snap({
        serviceSlug: "a",
        metricKey: "mau",
        metricValue: 100,
        unit: "count",
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
    ];
    const vm = buildDashboard(services2, [], [], undefined, chartSnaps);
    const mauChart = vm.charts.find((c) => c.metricKey === "mau")!;
    expect(mauChart.series.find((s) => s.slug === "a")!.points).toHaveLength(1);
    expect(mauChart.series.find((s) => s.slug === "b")!.points).toEqual([]);
  });

  it("BC-U-51: 非対象 metric (up/db_storage_bytes) 混入 → chart に含まれない", () => {
    const chartSnaps: SnapshotRow[] = [
      snap({
        serviceSlug: "a",
        metricKey: "up",
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
      snap({
        serviceSlug: "a",
        metricKey: "db_storage_bytes",
        metricValue: 999,
        unit: "bytes",
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
      snap({
        serviceSlug: "a",
        metricKey: "mau",
        metricValue: 7,
        unit: "count",
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
    ];
    const vm = buildDashboard([svc("a")], [], [], undefined, chartSnaps);
    expect(vm.charts).toHaveLength(2);
    expect(vm.charts.map((c) => c.metricKey)).not.toContain("up");
    expect(vm.charts.map((c) => c.metricKey)).not.toContain("db_storage_bytes");
  });

  it("BC-U-61: 0 service + chartSnapshots 有 → charts = 2 件、各 series=[]", () => {
    const chartSnaps: SnapshotRow[] = [
      snap({
        serviceSlug: "a",
        metricKey: "mau",
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
    ];
    const vm = buildDashboard([], [], [], undefined, chartSnaps);
    expect(vm.charts).toHaveLength(2);
    expect(vm.charts.every((c) => c.series.length === 0)).toBe(true);
  });

  it("TS-M-03: 既存呼び出し (4 引数) でも charts required で必ず含む (後方互換確認)", () => {
    const vm = buildDashboard([svc("a")], [], []);
    expect(vm.charts).toBeDefined();
    expect(vm.charts).toHaveLength(2);
  });

  // BC-U-02/03/10/20/21/30 (採算 profit 派生系列) は採算 chart 削除に伴い廃止。
  // profitAt 純関数の SoT は profitability.test.ts (一覧採算列用) に残る。

  it("RC-N1: lastRun (status=ok, finishedAt あり) → VM に lastUpdatedAt + lastRunStatus", () => {
    const run: CollectionRun = {
      id: "r1",
      startedAt: "2026-05-28T03:00:00.000Z",
      finishedAt: "2026-05-28T03:00:30.000Z",
      status: "ok",
      servicesCount: 2,
    };
    const vm = buildDashboard([svc("a")], [], [], run);
    expect(vm.lastUpdatedAt).toBe("2026-05-28T03:00:30.000Z");
    expect(vm.lastRunStatus).toBe("ok");
  });

  it("RC-E1: lastRun 無し → lastUpdatedAt=null / lastRunStatus=null", () => {
    const vm = buildDashboard([svc("a")], [], []);
    expect(vm.lastUpdatedAt).toBeNull();
    expect(vm.lastRunStatus).toBeNull();
  });

  it("RC-B1: lastRun.finishedAt 未確定 (実行中) → startedAt を採用", () => {
    const run: CollectionRun = {
      id: "r2",
      startedAt: "2026-05-28T03:00:00.000Z",
      status: "ok",
      servicesCount: 2,
    };
    const vm = buildDashboard([svc("a")], [], [], run);
    expect(vm.lastUpdatedAt).toBe("2026-05-28T03:00:00.000Z");
  });
});

describe("rowStatusKind", () => {
  const base = {
    slug: "a",
    name: "a",
    url: "u",
    status: "active" as const,
    metrics: {},
    openAlertCount: 0,
  };
  it("down/over → down, warn → warn, up → up, null → unknown", () => {
    expect(rowStatusKind({ ...base, up: false, freeTierState: null })).toBe(
      "down",
    );
    expect(rowStatusKind({ ...base, up: true, freeTierState: "over" })).toBe(
      "down",
    );
    expect(rowStatusKind({ ...base, up: true, freeTierState: "warn" })).toBe(
      "warn",
    );
    expect(rowStatusKind({ ...base, up: true, freeTierState: "ok" })).toBe(
      "up",
    );
    expect(rowStatusKind({ ...base, up: null, freeTierState: null })).toBe(
      "unknown",
    );
  });
});
