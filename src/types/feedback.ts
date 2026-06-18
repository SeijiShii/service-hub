/**
 * feedback/問い合わせ契約型 ([論点-007]/O66 producer ↔ O67 consumer)。
 * service-info ([論点-003]) と同型の pull / 共有シークレットモデル。
 * 各サービスが `GET /api/hub/feedback` を公開し、ServiceHUB が consumer として pull する。
 */

/** フィードバック種別。producer 申告、未知値は consumer 側で skip。 */
export type FeedbackKind = "feedback" | "bug" | "inquiry";

export const FEEDBACK_KINDS: readonly FeedbackKind[] = [
  "feedback",
  "bug",
  "inquiry",
] as const;

/** consumer 本文の length cap (DB 肥大・PII 露出面の抑制、SPEC §4.1)。 */
export const FEEDBACK_BODY_MAX = 4000;

/** 一覧表示・pull のデフォルト/上限件数 (SPEC §5.1)。 */
export const FEEDBACK_LIST_LIMIT = 200;

/**
 * `GET /api/hub/feedback` のレスポンス item (producer → consumer の契約単位)。
 * `id` は producer 内一意 (externalId)。本文は producer 側 PII scrub 済み前提。
 */
export interface FeedbackItem {
  id: string;
  kind: FeedbackKind;
  body: string;
  rating?: number;
  context?: Record<string, unknown>;
  /** ISO 8601。producer 側の発生時刻。 */
  createdAt: string;
  /** producer 自己申告ステータス (任意、HUB は表示のみ)。 */
  status?: string;
}

/** `GET /api/hub/feedback` のレスポンス全体 (最小固定 + extra、O66)。 */
export interface FeedbackResponse {
  schemaVersion: number;
  service: string;
  items: FeedbackItem[];
  /** MVP は未使用 ([論点-FI-3])。型には残し将来の増分 pull に備える。 */
  nextCursor?: string;
  extra?: Record<string, unknown>;
}

/**
 * consumer (ServiceHUB) が保存・表示する feedback 行。
 * 合成 PK = `${serviceSlug}:${externalId}` で (serviceSlug, externalId) 冪等。
 */
export interface FeedbackItemRow {
  serviceSlug: string;
  externalId: string;
  kind: FeedbackKind;
  body: string;
  rating?: number;
  context?: Record<string, unknown>;
  status?: string;
  /** ISO 8601 (producer 発生時刻)。 */
  createdAt: string;
  /** ISO 8601 (HUB 取り込み時刻)。 */
  pulledAt: string;
}

/** インボックス一覧の取得フィルタ (SPEC §2.2)。 */
export interface FeedbackFilter {
  service?: string;
  kind?: FeedbackKind;
  /** ISO 8601。これ以降の createdAt のみ。 */
  since?: string;
  /** 上限件数 (default/cap = FEEDBACK_LIST_LIMIT)。 */
  limit?: number;
}
