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

export interface DashboardVM {
  rows: ServiceRowVM[];
  upCount: number;
  downCount: number;
  /** 直近 collection_runs.status (run 無しは null)。 */
  lastRunStatus: CollectionRun["status"] | null;
  /** 直近 run の finishedAt (実行中なら startedAt、無しなら null)、ISO 8601。 */
  lastUpdatedAt: string | null;
}

/** db スナップショット + registry + openAlerts を一覧 VM に結合 (provider 直叩きなし)。 */
export function buildDashboard(
  services: ServiceDescriptor[],
  snapshots: SnapshotRow[],
  openAlerts: AlertEvent[],
  lastRun?: CollectionRun,
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
  };
}
