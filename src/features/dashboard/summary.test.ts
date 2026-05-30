import { describe, it, expect } from "vitest";
import { buildDashboard } from "./summary.js";
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

  // ── biz-charts (revise_biz-charts_20260530) : ユーザー数/課金額/コスト/採算 ──
  it("BC-U-01: charts = 4 件、順序 [mau, revenue, cost, profit]、日本語 label", () => {
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
    expect(vm.charts).toHaveLength(4);
    expect(vm.charts.map((c) => c.metricKey)).toEqual([
      "mau",
      "revenue_month_usd",
      "ai_cost_month_usd",
      "profit",
    ]);
    expect(vm.charts.map((c) => c.label)).toEqual([
      "ユーザー数",
      "課金額",
      "コスト",
      "採算",
    ]);
    // up / db_storage_bytes は chart 対象外 (一覧 status 列・収集は別)
    expect(vm.charts.map((c) => c.metricKey)).not.toContain("up");
    expect(vm.charts.map((c) => c.metricKey)).not.toContain("db_storage_bytes");
  });

  it("BC-U-02: 採算(profit) = revenue − cost の派生系列", () => {
    const chartSnaps: SnapshotRow[] = [
      snap({
        serviceSlug: "a",
        metricKey: "revenue_month_usd",
        metricValue: 50,
        unit: "usd",
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
      snap({
        serviceSlug: "a",
        metricKey: "revenue_month_usd",
        metricValue: 80,
        unit: "usd",
        capturedAt: "2026-05-11T00:00:00.000Z",
      }),
      snap({
        serviceSlug: "a",
        metricKey: "ai_cost_month_usd",
        metricValue: 10,
        unit: "usd",
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
      snap({
        serviceSlug: "a",
        metricKey: "ai_cost_month_usd",
        metricValue: 30,
        unit: "usd",
        capturedAt: "2026-05-11T00:00:00.000Z",
      }),
    ];
    const vm = buildDashboard([svc("a")], [], [], undefined, chartSnaps);
    const profit = vm.charts.find((c) => c.metricKey === "profit")!;
    expect(profit.series[0].points).toEqual([
      { capturedAt: "2026-05-10T00:00:00.000Z", value: 40 },
      { capturedAt: "2026-05-11T00:00:00.000Z", value: 50 },
    ]);
  });

  it("BC-U-03: cost 欠落の時点 → profit = revenue (cost 0 扱い)", () => {
    const chartSnaps: SnapshotRow[] = [
      snap({
        serviceSlug: "a",
        metricKey: "revenue_month_usd",
        metricValue: 50,
        unit: "usd",
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
    ];
    const vm = buildDashboard([svc("a")], [], [], undefined, chartSnaps);
    const profit = vm.charts.find((c) => c.metricKey === "profit")!;
    expect(profit.series[0].points).toEqual([
      { capturedAt: "2026-05-10T00:00:00.000Z", value: 50 },
    ]);
  });

  it("BC-U-10: revenue 無し / cost のみ → profit 系列に点を作らない (revenue 起点)", () => {
    const chartSnaps: SnapshotRow[] = [
      snap({
        serviceSlug: "a",
        metricKey: "ai_cost_month_usd",
        metricValue: 20,
        unit: "usd",
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
    ];
    const vm = buildDashboard([svc("a")], [], [], undefined, chartSnaps);
    const profit = vm.charts.find((c) => c.metricKey === "profit")!;
    expect(profit.series[0].points).toEqual([]);
  });

  it("BC-U-11: 全欠落 → charts 4 件、各 series points = []", () => {
    const vm = buildDashboard([svc("a")], [], []); // chartSnapshots 省略
    expect(vm.charts).toHaveLength(4);
    expect(vm.charts.every((c) => c.series.length === 1)).toBe(true);
    expect(vm.charts.every((c) => c.series[0].points.length === 0)).toBe(true);
  });

  it("BC-U-20: revenue=0, cost=5 → profit = -5 (revenue=0 でも点を作る)", () => {
    const chartSnaps: SnapshotRow[] = [
      snap({
        serviceSlug: "a",
        metricKey: "revenue_month_usd",
        metricValue: 0,
        unit: "usd",
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
      snap({
        serviceSlug: "a",
        metricKey: "ai_cost_month_usd",
        metricValue: 5,
        unit: "usd",
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
    ];
    const vm = buildDashboard([svc("a")], [], [], undefined, chartSnaps);
    const profit = vm.charts.find((c) => c.metricKey === "profit")!;
    expect(profit.series[0].points).toEqual([
      { capturedAt: "2026-05-10T00:00:00.000Z", value: -5 },
    ]);
  });

  it("BC-U-21: revenue と cost の capturedAt がずれる → revenue 起点、対応 cost 無し→0", () => {
    const chartSnaps: SnapshotRow[] = [
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
        metricValue: 30,
        unit: "usd",
        capturedAt: "2026-05-11T00:00:00.000Z",
      }),
    ];
    const vm = buildDashboard([svc("a")], [], [], undefined, chartSnaps);
    const profit = vm.charts.find((c) => c.metricKey === "profit")!;
    // revenue は 05-10 のみ → cost(05-11) は対応せず 0 → profit 50
    expect(profit.series[0].points).toEqual([
      { capturedAt: "2026-05-10T00:00:00.000Z", value: 50 },
    ]);
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
    expect(vm.charts).toHaveLength(4);
    expect(vm.charts.map((c) => c.metricKey)).not.toContain("up");
    expect(vm.charts.map((c) => c.metricKey)).not.toContain("db_storage_bytes");
  });

  it("BC-U-61: 0 service + chartSnapshots 有 → charts = 4 件、各 series=[]", () => {
    const chartSnaps: SnapshotRow[] = [
      snap({
        serviceSlug: "a",
        metricKey: "mau",
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
    ];
    const vm = buildDashboard([], [], [], undefined, chartSnaps);
    expect(vm.charts).toHaveLength(4);
    expect(vm.charts.every((c) => c.series.length === 0)).toBe(true);
  });

  it("TS-M-03: 既存呼び出し (4 引数) でも charts required で必ず含む (後方互換確認)", () => {
    const vm = buildDashboard([svc("a")], [], []);
    expect(vm.charts).toBeDefined();
    expect(vm.charts).toHaveLength(4);
  });

  it("BC-U-30: 採算チャート最新点 = 一覧採算列 (computeProfitability) の一致 (spec-review R1)", () => {
    const chartSnaps: SnapshotRow[] = [
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
    // 一覧採算列は latest snapshot から computeProfitability → profit=40
    const latest: SnapshotRow[] = [
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
    const vm = buildDashboard([svc("a")], latest, [], undefined, chartSnaps);
    const profitChart = vm.charts.find((c) => c.metricKey === "profit")!;
    const chartLatest = profitChart.series[0].points.at(-1)!.value;
    const colProfit = vm.rows[0].profitability.profit;
    expect(chartLatest).toBe(colProfit); // 同じ profitAt 経由で一致
    expect(chartLatest).toBe(40);
  });

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
