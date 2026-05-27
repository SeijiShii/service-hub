import type {
  ServiceDescriptor,
  SnapshotRow,
  AlertEvent,
  MetricKey,
} from "../../types/index.js";
import { computeFunnel, type FunnelRates } from "./funnel.js";
import { projectAhead } from "../../lib/projection.js";

export interface SeriesPoint {
  capturedAt: string;
  value: number;
}
export interface MetricSeries {
  metricKey: MetricKey;
  unit: string;
  points: SeriesPoint[];
}
export interface ServiceDetailVM {
  slug: string;
  name: string;
  url: string;
  status: ServiceDescriptor["status"];
  series: MetricSeries[];
  alerts: AlertEvent[];
  /** 直近の決済ファネル離脱率 (business-observability)。未申告は null。 */
  funnel: FunnelRates;
  /** 収益 (revenue_month_usd) 時系列からの 1/2/3ヶ月後 見込み。データ不足は null。 */
  revenueProjection: (number | null)[];
}

/** descriptor + メトリクス別 timeseries + alerts を詳細 VM に。service が無ければ null (=404)。 */
export function buildServiceDetail(
  service: ServiceDescriptor | undefined,
  snapshots: SnapshotRow[], // 当該 service の時系列 (昇順想定)
  alerts: AlertEvent[],
): ServiceDetailVM | null {
  if (!service) return null;
  const byMetric = new Map<MetricKey, MetricSeries>();
  for (const s of snapshots) {
    if (s.serviceSlug !== service.slug) continue;
    let ser = byMetric.get(s.metricKey);
    if (!ser) {
      ser = { metricKey: s.metricKey, unit: s.unit, points: [] };
      byMetric.set(s.metricKey, ser);
    }
    ser.points.push({ capturedAt: s.capturedAt, value: s.metricValue });
  }
  // 直近値 (各メトリクスの最終点) からファネル離脱率を算出
  const latest: Partial<Record<MetricKey, number>> = {};
  for (const [k, ser] of byMetric) {
    const last = ser.points.at(-1);
    if (last) latest[k] = last.value;
  }
  // 収益時系列から 1/2/3ヶ月後を外挿
  const revenueValues =
    byMetric.get("revenue_month_usd")?.points.map((p) => p.value) ?? [];
  return {
    slug: service.slug,
    name: service.name,
    url: service.url,
    status: service.status,
    series: [...byMetric.values()],
    alerts: alerts.filter((a) => a.serviceSlug === service.slug),
    funnel: computeFunnel(latest),
    revenueProjection: projectAhead(revenueValues, [1, 2, 3]),
  };
}
