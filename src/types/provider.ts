/** pull 対象プロバイダ種別。MVP=ping/vercel/neon/clerk、Phase2=cloudflare/sentry。 */
export type ProviderKind =
  | "ping"
  | "vercel"
  | "neon"
  | "clerk"
  | "cloudflare"
  | "sentry"
  | "service-info";

export const PROVIDER_KINDS: readonly ProviderKind[] = [
  "ping",
  "vercel",
  "neon",
  "clerk",
  "cloudflare",
  "sentry",
  "service-info",
] as const;

/** MVP で収集対象とするプロバイダ (Sentry / Cloudflare は Phase2)。 */
export const MVP_PROVIDERS: readonly ProviderKind[] = [
  "ping",
  "vercel",
  "neon",
  "clerk",
  "service-info",
] as const;

import type { ServiceDescriptor, ServiceMeta } from "./service.js";
import type { UsageMetric } from "./metric.js";

/**
 * pull の共通契約。各 adapter / ping / service-info adapter が実装する。失敗は throw せず error で返す。
 *
 * **戻り値 meta (favicon-projection、2026-05-28、spec-review R1)**: 副作用 (services テーブル永続化) は runner で集約。
 * adapter は producer 申告 static identity を `meta?: ServiceMeta` で返却し、runner が `updateServiceMeta` を呼ぶ。
 * service-info adapter のみ meta 返却、ping/vercel/neon は meta 返却なし (undefined のまま、optional で互換)。
 */
export interface ProviderAdapter {
  kind: ProviderKind;
  collect(service: ServiceDescriptor): Promise<{
    metrics: UsageMetric[];
    error?: string;
    meta?: ServiceMeta;
  }>;
}
