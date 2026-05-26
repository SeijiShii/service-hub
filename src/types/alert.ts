import type { ProviderKind } from "./provider.js";

export type CollectionStatus = "ok" | "partial" | "failed";

export const COLLECTION_STATUSES: readonly CollectionStatus[] = [
  "ok",
  "partial",
  "failed",
] as const;

/** alert_events テーブル 1 行。 */
export interface AlertEvent {
  id: string;
  serviceSlug: string;
  provider: ProviderKind;
  rule: string;
  triggeredAt: string;
  value: number;
  notifiedAt?: string;
  resolvedAt?: string;
}

/** collection_runs テーブル 1 行 (収集自体の可観測性)。 */
export interface CollectionRun {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: CollectionStatus;
  servicesCount: number;
  errors?: Array<{ serviceSlug: string; provider: ProviderKind; message: string }>;
}
