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
  clerk?: { appId: string };
  cloudflare?: { accountId: string; r2Bucket?: string };
  sentry?: { org: string; project: string };
}

/**
 * service-info エンドポイント接続情報。認証は HUB 共通 1 本 `HUB_SERVICE_INFO_SECRET`
 * (env) を使うため per-service secretEnv は持たない ([D20260528-002] 秘密ゼロ化)。
 */
export interface ServiceInfoRef {
  endpoint?: string;
}

/**
 * service-info レスポンス契約 ([論点-003]/[論点-T1]、最小固定 + extra)。
 * **v2 (favicon-projection、2026-05-28)**: `iconUrl?: string` を 1st-class field として追加 (schemaVersion=2 bump 推奨)。
 * 受信側は v1 (iconUrl 無し) も完全許容、producer 順次対応可能。format check は src/lib/safeUrl.ts。
 */
export type ServiceInfoStatus = "ok" | "degraded" | "down";
export interface ServiceInfoResponse {
  schemaVersion: number;
  service: string;
  status: ServiceInfoStatus;
  metrics?: Array<{ key: string; value: number; unit: string }>;
  version?: string;
  /** v2: producer の favicon 絶対 URL (https + 公開ホスト + 1024 chars 以内、SSRF 予防)。受信時 isSafePublicUrl で format check。 */
  iconUrl?: string;
  extra?: Record<string, unknown>;
}

/**
 * service-info adapter 等が返す producer 申告メタ (favicon-projection、2026-05-28)。
 * ProviderAdapter.collect 戻り値の `meta?: ServiceMeta` に格納され、runner で `services` テーブルへ永続化される。
 * 将来 last_deploy_at 等の他 producer 申告 static identity を追加する際もここに集約 (spec-review R1)。
 */
export interface ServiceMeta {
  iconUrl?: string;
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
  /**
   * 公開アイコン URL (favicon-projection、2026-05-28)。**書き込みは service-info adapter 経由のみ** (SoT 一貫性、spec-review R2)。
   * admin write 経路 (`serviceDescriptorSchema` / admin API) では受け付けない (zod stripUnknown + upsertService SET 句不含 + テスト assert の三重防御)。
   * 本フィールドは ServiceDescriptor 型 = DB レコード全体表現として持つ (zod schema 出力型との意図的不整合、P78)。
   */
  iconUrl?: string;
}
