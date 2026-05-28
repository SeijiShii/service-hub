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

  // ── timeseries-topchart (revise_timeseries-topchart_20260528) ──
  it("TS-U-10: chartSnapshots あり → DashboardChart 4 件、各 chart.series に 2 service 分", () => {
    const services2 = [svc("a"), svc("b")];
    const chartSnaps: SnapshotRow[] = [
      snap({
        serviceSlug: "a",
        metricKey: "up",
        metricValue: 1,
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
      snap({
        serviceSlug: "a",
        metricKey: "mau",
        metricValue: 100,
        unit: "count",
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
      snap({
        serviceSlug: "b",
        metricKey: "up",
        metricValue: 1,
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
    ];
    const vm = buildDashboard(services2, [], [], undefined, chartSnaps);
    expect(vm.charts).toHaveLength(4);
    expect(vm.charts.every((c) => c.series.length === 2)).toBe(true); // 全 chart に 2 service
    const upChart = vm.charts.find((c) => c.metricKey === "up")!;
    expect(upChart.series.find((s) => s.slug === "a")!.points).toHaveLength(1);
    expect(upChart.series.find((s) => s.slug === "b")!.points).toHaveLength(1);
  });

  it("TS-U-11: chartSnapshots 未渡し (optional) → charts = 4 件、各 series.points = []", () => {
    const vm = buildDashboard([svc("a")], [], []); // 第 5 引数省略
    expect(vm.charts).toHaveLength(4);
    expect(vm.charts.every((c) => c.series.length === 1)).toBe(true);
    expect(vm.charts.every((c) => c.series[0].points.length === 0)).toBe(true);
  });

  it("TS-U-12: chart metric 順序固定 (up → mau → db_storage_bytes → last_deploy_at)", () => {
    const chartSnaps: SnapshotRow[] = [
      // ランダム順で渡す
      snap({
        serviceSlug: "a",
        metricKey: "last_deploy_at",
        metricValue: 1779958293585,
        unit: "epoch_ms",
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
      snap({
        serviceSlug: "a",
        metricKey: "mau",
        metricValue: 100,
        unit: "count",
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
        metricKey: "up",
        metricValue: 1,
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
    ];
    const vm = buildDashboard([svc("a")], [], [], undefined, chartSnaps);
    expect(vm.charts.map((c) => c.metricKey)).toEqual([
      "up",
      "mau",
      "db_storage_bytes",
      "last_deploy_at",
    ]);
  });

  it("TS-U-13: 1 service のみ snapshots あり → chart.series に 2 service 含む (なし側は points=[])", () => {
    const services2 = [svc("a"), svc("b")];
    const chartSnaps: SnapshotRow[] = [
      snap({
        serviceSlug: "a",
        metricKey: "up",
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
    ];
    const vm = buildDashboard(services2, [], [], undefined, chartSnaps);
    const upChart = vm.charts.find((c) => c.metricKey === "up")!;
    expect(upChart.series.find((s) => s.slug === "a")!.points).toHaveLength(1);
    expect(upChart.series.find((s) => s.slug === "b")!.points).toEqual([]);
  });

  it("TS-U-51: 非対象 metric (revenue_month_usd) 混入 → charts に含まれない (4 件のみ)", () => {
    const chartSnaps: SnapshotRow[] = [
      snap({
        serviceSlug: "a",
        metricKey: "up",
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
      snap({
        serviceSlug: "a",
        metricKey: "revenue_month_usd",
        metricValue: 9999,
        unit: "usd",
        capturedAt: "2026-05-10T00:00:00.000Z",
      }),
    ];
    const vm = buildDashboard([svc("a")], [], [], undefined, chartSnaps);
    expect(vm.charts).toHaveLength(4);
    expect(vm.charts.map((c) => c.metricKey)).not.toContain(
      "revenue_month_usd",
    );
  });

  it("TS-U-61: 0 service + chartSnapshots 有 → charts = 4 件、各 series=[]", () => {
    const chartSnaps: SnapshotRow[] = [
      snap({
        serviceSlug: "a",
        metricKey: "up",
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
