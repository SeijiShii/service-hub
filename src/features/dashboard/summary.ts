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
}

export interface DashboardVM {
  rows: ServiceRowVM[];
  upCount: number;
  downCount: number;
  lastRunStatus?: CollectionRun["status"];
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

    return {
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
  });

  const upCount = rows.filter((r) => r.up === true).length;
  const downCount = rows.filter((r) => r.up === false).length;
  return { rows, upCount, downCount, lastRunStatus: lastRun?.status };
}
