import type { ProviderKind } from "./provider.js";

/** 既知メトリクスキー。typo 防止のため既知分は集約。 */
export type KnownMetricKey =
  | "up"
  | "mau"
  | "db_storage_bytes"
  | "db_compute_seconds"
  | "bandwidth_bytes"
  | "r2_storage_bytes"
  | "error_count"
  | "last_deploy_at";

/** open union: Phase2 でのメトリクス追加を破壊変更なく許容。 */
export type MetricKey = KnownMetricKey | (string & {});

/** 収集で得た正規化済みメトリクス (DB 保存前)。 */
export interface UsageMetric {
  provider: ProviderKind;
  key: MetricKey;
  value: number;
  unit: string;
}

/** usage_snapshots テーブル 1 行 (id は DB 生成 string、日時は ISO 8601)。 */
export interface SnapshotRow {
  id: string;
  serviceSlug: string;
  provider: ProviderKind;
  metricKey: MetricKey;
  metricValue: number;
  unit: string;
  capturedAt: string;
  rawJson?: unknown;
}
