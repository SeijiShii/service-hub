import type {
  ServiceDescriptor,
  SnapshotRow,
  AlertEvent,
  CollectionRun,
  MetricKey,
} from "../../types/index.js";
import { computeProfitability, type Profitability } from "./profitability.js";
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
  unit: string;
  series: DashboardChartSeries[];
}

/**
 * 上部 chart 化する主要 metric 3 件 (固定順序、spec-review R2 確定)。
 * 順序: 死活 → ビジネス → リソース。
 * last_deploy_at は単一デプロイ時刻で折れ線不向きのため chart 対象外とし、
 * 一覧テーブルの「最終デプロイ」カラムへ移設 (last-deploy-col、2026-05-30)。
 */
export const DASHBOARD_CHART_METRICS: readonly MetricKey[] = [
  "up",
  "mau",
  "db_storage_bytes",
] as const;

/** metric 別の unit fallback (snapshots に unit があれば優先、無ければ既知デフォルト)。 */
const METRIC_UNIT_FALLBACK: Record<string, string> = {
  up: "bool",
  mau: "count",
  db_storage_bytes: "bytes",
  last_deploy_at: "epoch_ms",
};

export interface DashboardVM {
  rows: ServiceRowVM[];
  upCount: number;
  downCount: number;
  /** 直近 collection_runs.status (run 無しは null)。 */
  lastRunStatus: CollectionRun["status"] | null;
  /** 直近 run の finishedAt (実行中なら startedAt、無しなら null)、ISO 8601。 */
  lastUpdatedAt: string | null;
  /**
   * dashboard 上部 chart 用の主要 metric × 全 service 時系列 (timeseries-topchart、required、spec-review R2)。
   * 常に 3 件 (DASHBOARD_CHART_METRICS の順)、空 chartSnapshots でも各 chart.series に
   * 全 service の {slug,name,points:[]} を含む (UI で「データなし」 fallback)。
   */
  charts: DashboardChart[];
}

/**
 * chartSnapshots から DashboardChart[] を集約 (timeseries-topchart、spec-review R2)。
 * 固定 3 metric × 全 service で重ね描き用 series を生成、metric 順序は DASHBOARD_CHART_METRICS で固定。
 * 空 chartSnapshots でも各 chart.series に全 service の {slug,name,points:[]} を含む (UI fallback)。
 */
function buildCharts(
  services: ServiceDescriptor[],
  chartSnapshots: SnapshotRow[],
): DashboardChart[] {
  // metric × slug → points を集約
  type Key = string; // `${metricKey}|${slug}`
  const pointsByKey = new Map<
    Key,
    Array<{ capturedAt: string; value: number }>
  >();
  const unitByMetric = new Map<MetricKey, string>();

  for (const s of chartSnapshots) {
    if (!DASHBOARD_CHART_METRICS.includes(s.metricKey)) continue; // 非対象 metric 除外
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

  return DASHBOARD_CHART_METRICS.map((metricKey) => {
    const series: DashboardChartSeries[] = services.map((svc) => ({
      slug: svc.slug,
      name: svc.name,
      points: pointsByKey.get(`${metricKey}|${svc.slug}`) ?? [],
    }));
    const unit =
      unitByMetric.get(metricKey) ?? METRIC_UNIT_FALLBACK[metricKey] ?? "";
    return { metricKey, unit, series };
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
