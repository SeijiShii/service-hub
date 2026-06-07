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
  | "last_deploy_at"
  // ビジネス/収益観測 (business-observability, revise_001)。service-info 自己申告。
  | "revenue_month_usd"
  | "mrr_usd"
  | "ai_cost_month_usd"
  | "paid_users"
  | "checkout_started_month"
  | "checkout_completed_month"
  | "checkout_card_failed_month"
  // 収益 (revenue-metrics-display, C20260607-001)。service-info 自己申告の累計収益 (jpy)。
  // サービスにより寄付/売上/投げ銭等、源泉は様々だが汎用「収益」として集約。PII なし (O48)。
  // 旧 tip_count / tip_total_yen は service-info adapter で本キーへ正規化 (後方互換、LEGACY_METRIC_KEY_ALIAS)。
  | "revenue_count"
  | "revenue_total_yen";

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
