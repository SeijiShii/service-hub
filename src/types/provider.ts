/** pull 対象プロバイダ種別。MVP=ping/vercel/neon/clerk、Phase2=cloudflare/sentry。 */
export type ProviderKind =
  | "ping"
  | "vercel"
  | "neon"
  | "clerk"
  | "cloudflare"
  | "sentry";

export const PROVIDER_KINDS: readonly ProviderKind[] = [
  "ping",
  "vercel",
  "neon",
  "clerk",
  "cloudflare",
  "sentry",
] as const;

/** MVP で収集対象とするプロバイダ (Sentry / Cloudflare は Phase2)。 */
export const MVP_PROVIDERS: readonly ProviderKind[] = [
  "ping",
  "vercel",
  "neon",
  "clerk",
] as const;

import type { ServiceDescriptor } from "./service.js";
import type { UsageMetric } from "./metric.js";

/** pull の共通契約。各 adapter / ping / service-info adapter が実装する。失敗は throw せず error で返す。 */
export interface ProviderAdapter {
  kind: ProviderKind;
  collect(service: ServiceDescriptor): Promise<{ metrics: UsageMetric[]; error?: string }>;
}
