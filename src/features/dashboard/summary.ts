import type {
  ServiceDescriptor,
  SnapshotRow,
  AlertEvent,
  CollectionRun,
  MetricKey,
} from "../../types/index.js";
import {
  computeProfitability,
  profitAt,
  type Profitability,
} from "./profitability.js";
import { computeFunnel, type FunnelRates } from "../service-detail/funnel.js";

export type FreeTierState = "ok" | "warn" | "over" | null;

export interface ServiceRowVM {
  slug: string;
  name: string;
  url: string;
  status: ServiceDescriptor["status"];
  up: boolean | null; // up メトリクスがなければ null
  metrics: Partial<Record<MetricKey, { value: number; unit: string }>>;
  freeTierState: FreeTierState;
  openAlertCount: number;
  lastCaptured?: string;
  /** 採算 (revenue−ai_cost)。未申告は state=null。business-observability。 */
  profitability: Profitability;
  /** 決済ファネル離脱率。未申告は null。business-observability。 */
  funnel: FunnelRates;
  /**
   * producer 申告 favicon URL (favicon-projection、2026-05-28)。
   * 内部 dashboard でアイコン表示に使う。NULL なら fallback (slug 頭文字 or プレースホルダ)。
   * CF-20260528-020: 新フィールド追加時、公開 API + 内部 dashboard 両方の VM に投影する。
   */
  iconUrl?: string;
}

/**
 * dashboard 上部 chart 用の per-service 時系列 (timeseries-topchart、spec-review R5)。
 */
export interface DashboardChartSeries {
  slug: string;
  name: string;
  points: Array<{ capturedAt: string; value: number }>;
}

/**
 * dashboard 上部に表示する 1 metric の時系列 chart データ。
 * series = 全 active service の重ね描き (空 service も series エントリは含む、points=[] で fallback)。
 */
export interface DashboardChart {
  metricKey: MetricKey;
  /** UI 見出し用の日本語ラベル (biz-charts、ユーザー数/課金額/コスト/採算)。 */
  label: string;
  unit: string;
  series: DashboardChartSeries[];
}

/**
 * 上部 chart が recentSnapshots で**取得する** source metric (biz-charts)。
 * profit(採算) は保存メトリクスでなく revenue−cost の派生のため取得キーには含めない。
 * up(死活) は一覧 status 列、db_storage_bytes はリソース系で chart 対象外 (収集は継続、一覧/将来用)。
 */
export const DASHBOARD_CHART_SOURCE_METRICS: readonly MetricKey[] = [
  "mau",
  "revenue_total_yen",
  "revenue_month_usd",
  "ai_cost_month_usd",
] as const;

/**
 * 上部 chart の定義 (固定順序、biz-charts、ユーザー確定 2026-05-30)。
 * 上から: ユーザー数 → 課金額 → コスト → 採算。
 * profit は derived=true (buildCharts が revenue−cost を profitAt で合成、spec-review R1)。
 */
export const DASHBOARD_CHARTS: ReadonlyArray<{
  metricKey: MetricKey;
  label: string;
  unit: string;
  derived?: boolean;
}> = [
  { metricKey: "mau", label: "ユーザー数", unit: "count" },
  // 収益 (revenue-metrics-display, C20260607-001)。累計収益 (jpy) の推移。
  // producer 自己申告 (寄付/売上等)。旧 tip_total_yen は adapter で revenue_total_yen へ正規化済。
  { metricKey: "revenue_total_yen", label: "収益", unit: "jpy" },
  { metricKey: "revenue_month_usd", label: "課金額", unit: "usd" },
  { metricKey: "ai_cost_month_usd", label: "コスト", unit: "usd" },
  { metricKey: "profit", label: "採算", unit: "usd", derived: true },
] as const;

export interface DashboardVM {
  rows: ServiceRowVM[];
  upCount: number;
  downCount: number;
  /** 直近 collection_runs.status (run 無しは null)。 */
  lastRunStatus: CollectionRun["status"] | null;
  /** 直近 run の finishedAt (実行中なら startedAt、無しなら null)、ISO 8601。 */
  lastUpdatedAt: string | null;
  /**
   * dashboard 上部 chart 用のビジネス metric × 全 service 時系列 (biz-charts、required)。
   * 常に 4 件 (DASHBOARD_CHARTS の順: ユーザー数/課金額/コスト/採算)、空 chartSnapshots でも各 chart.series に
   * 全 service の {slug,name,points:[]} を含む (UI で「データなし」 fallback)。採算は派生。
   */
  charts: DashboardChart[];
}

/**
 * chartSnapshots から DashboardChart[] を集約 (biz-charts)。
 * DASHBOARD_CHARTS の定義順 (ユーザー数/課金額/コスト/採算) で全 service 重ね描き series を生成。
 * 採算(profit)は保存メトリクスでなく、各 service の revenue−cost を capturedAt で整合させた派生系列
 * (profitAt 共通化、spec-review R1)。空 chartSnapshots でも各 chart.series に全 service の points=[] を含む。
 */
function buildCharts(
  services: ServiceDescriptor[],
  chartSnapshots: SnapshotRow[],
): DashboardChart[] {
  // metric × slug → points を集約 (source metric のみ)
  type Key = string; // `${metricKey}|${slug}`
  const pointsByKey = new Map<
    Key,
    Array<{ capturedAt: string; value: number }>
  >();
  const unitByMetric = new Map<MetricKey, string>();

  for (const s of chartSnapshots) {
    if (!DASHBOARD_CHART_SOURCE_METRICS.includes(s.metricKey)) continue; // 非対象 metric 除外
    const k: Key = `${s.metricKey}|${s.serviceSlug}`;
    const arr = pointsByKey.get(k) ?? [];
    arr.push({ capturedAt: s.capturedAt, value: s.metricValue });
    pointsByKey.set(k, arr);
    if (!unitByMetric.has(s.metricKey)) unitByMetric.set(s.metricKey, s.unit);
  }

  // 各 series の points を capturedAt 昇順 sort
  for (const arr of pointsByKey.values()) {
    arr.sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  }

  return DASHBOARD_CHARTS.map((def) => {
    if (def.derived && def.metricKey === "profit") {
      // 採算 = revenue − cost の派生系列 (revenue の capturedAt 起点、cost は同 capturedAt を lookup、無→0)
      const series: DashboardChartSeries[] = services.map((svc) => {
        const rev = pointsByKey.get(`revenue_month_usd|${svc.slug}`) ?? [];
        const costPts = pointsByKey.get(`ai_cost_month_usd|${svc.slug}`) ?? [];
        const costByCapturedAt = new Map(
          costPts.map((p) => [p.capturedAt, p.value]),
        );
        return {
          slug: svc.slug,
          name: svc.name,
          points: rev.map((r) => ({
            capturedAt: r.capturedAt,
            value: profitAt(r.value, costByCapturedAt.get(r.capturedAt)),
          })),
        };
      });
      return {
        metricKey: def.metricKey,
        label: def.label,
        unit: def.unit,
        series,
      };
    }
    const series: DashboardChartSeries[] = services.map((svc) => ({
      slug: svc.slug,
      name: svc.name,
      points: pointsByKey.get(`${def.metricKey}|${svc.slug}`) ?? [],
    }));
    const unit = unitByMetric.get(def.metricKey) ?? def.unit;
    return { metricKey: def.metricKey, label: def.label, unit, series };
  });
}

/** db スナップショット + registry + openAlerts を一覧 VM に結合 (provider 直叩きなし)。 */
export function buildDashboard(
  services: ServiceDescriptor[],
  snapshots: SnapshotRow[],
  openAlerts: AlertEvent[],
  lastRun?: CollectionRun,
  chartSnapshots: SnapshotRow[] = [],
): DashboardVM {
  const alertCountBySlug = new Map<string, number>();
  for (const a of openAlerts)
    alertCountBySlug.set(
      a.serviceSlug,
      (alertCountBySlug.get(a.serviceSlug) ?? 0) + 1,
    );

  const snapBySlug = new Map<string, SnapshotRow[]>();
  for (const s of snapshots) {
    const arr = snapBySlug.get(s.serviceSlug) ?? [];
    arr.push(s);
    snapBySlug.set(s.serviceSlug, arr);
  }

  const rows: ServiceRowVM[] = services.map((svc) => {
    const snaps = snapBySlug.get(svc.slug) ?? [];
    const metrics: ServiceRowVM["metrics"] = {};
    let up: boolean | null = null;
    let lastCaptured: string | undefined;
    let freeTierState: FreeTierState = null;

    for (const s of snaps) {
      metrics[s.metricKey] = { value: s.metricValue, unit: s.unit };
      if (s.metricKey === "up") up = s.metricValue === 1;
      if (!lastCaptured || s.capturedAt > lastCaptured)
        lastCaptured = s.capturedAt;
      const th = svc.thresholds?.[s.metricKey];
      if (th?.limit != null) {
        const pct = (s.metricValue / th.limit) * 100;
        const state: FreeTierState =
          pct >= 100
            ? "over"
            : th.warnPct != null && pct >= th.warnPct
              ? "warn"
              : "ok";
        // 最も深刻な状態を採用
        const rank = { ok: 0, warn: 1, over: 2 } as const;
        if (freeTierState === null || rank[state] > rank[freeTierState])
          freeTierState = state;
      }
    }

    // 採算/ファネルは metrics の値部分から算出 (新ビジネスメトリクスキーは generic に乗っている)
    const values: Partial<Record<MetricKey, number>> = {};
    for (const [k, v] of Object.entries(metrics))
      if (v) values[k as MetricKey] = v.value;

    const row: ServiceRowVM = {
      slug: svc.slug,
      name: svc.name,
      url: svc.url,
      status: svc.status,
      up,
      metrics,
      freeTierState,
      openAlertCount: alertCountBySlug.get(svc.slug) ?? 0,
      lastCaptured,
      profitability: computeProfitability(values),
      funnel: computeFunnel(values),
    };
    // favicon-projection (2026-05-28): 内部 dashboard 表示用に iconUrl を投影 (CF-20260528-020 補完)
    if (svc.iconUrl) row.iconUrl = svc.iconUrl;
    return row;
  });

  const upCount = rows.filter((r) => r.up === true).length;
  const downCount = rows.filter((r) => r.up === false).length;
  const lastUpdatedAt = lastRun
    ? (lastRun.finishedAt ?? lastRun.startedAt)
    : null;
  return {
    rows,
    upCount,
    downCount,
    lastRunStatus: lastRun?.status ?? null,
    lastUpdatedAt,
    charts: buildCharts(services, chartSnapshots),
  };
}
