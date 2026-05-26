import type { ServiceDescriptor, SnapshotRow, AlertEvent, MetricKey } from "../../types/index.js";

export interface SeriesPoint { capturedAt: string; value: number }
export interface MetricSeries { metricKey: MetricKey; unit: string; points: SeriesPoint[] }
export interface ServiceDetailVM {
  slug: string;
  name: string;
  url: string;
  status: ServiceDescriptor["status"];
  series: MetricSeries[];
  alerts: AlertEvent[];
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
  return {
    slug: service.slug, name: service.name, url: service.url, status: service.status,
    series: [...byMetric.values()],
    alerts: alerts.filter((a) => a.serviceSlug === service.slug),
  };
}
