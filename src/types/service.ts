import type { MetricKey } from "./metric.js";

/** サービスの運用状態 (services.toml の status)。 */
export type ServiceStatus = "active" | "paused" | "retired";

export const SERVICE_STATUSES: readonly ServiceStatus[] = [
  "active",
  "paused",
  "retired",
] as const;

/** 各プロバイダの非機密識別子。シークレットは env 参照名のみ持ち値は持たない (O25)。 */
export interface ProviderRefs {
  vercel?: { projectId: string };
  neon?: { projectId: string };
  clerk?: { appId: string; secretEnv?: string };
  cloudflare?: { accountId: string; r2Bucket?: string };
  sentry?: { org: string; project: string };
}

/** service-info エンドポイント接続情報 (services.toml 記述子側)。 */
export interface ServiceInfoRef {
  endpoint?: string;
  secretEnv?: string;
}

/** service-info レスポンス契約 ([論点-003]/[論点-T1]、最小固定 + extra)。 */
export type ServiceInfoStatus = "ok" | "degraded" | "down";
export interface ServiceInfoResponse {
  schemaVersion: number;
  service: string;
  status: ServiceInfoStatus;
  metrics?: Array<{ key: string; value: number; unit: string }>;
  version?: string;
  extra?: Record<string, unknown>;
}

/** 無料枠アラート閾値 (任意、メトリクス別)。 */
export type Thresholds = Partial<
  Record<MetricKey, { warnPct?: number; limit?: number }>
>;

/** services.toml の 1 サービス記述子 (レジストリ SoT)。 */
export interface ServiceDescriptor {
  slug: string;
  name: string;
  url: string;
  subdomain?: string;
  status: ServiceStatus;
  providers: ProviderRefs;
  serviceInfo?: ServiceInfoRef;
  thresholds?: Thresholds;
}
