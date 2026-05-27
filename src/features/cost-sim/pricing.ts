import toml from "@iarna/toml";
import { z } from "zod";
import type { MetricKey } from "../../types/index.js";

/** 1 provider の料金 (無料枠はアカウント単位で全 project 共有が基本)。 */
export interface ProviderPricing {
  provider: string;
  plan: string;
  freeLimits: Partial<Record<MetricKey, number>>;
  paidPlan: string;
  paidPriceMonthUsd: number;
}

export interface PricingTable {
  updated: string; // ISO 日付
  providers: ProviderPricing[];
}

const providerSchema = z.object({
  provider: z.string().min(1),
  plan: z.string().min(1),
  paidPlan: z.string().min(1),
  paidPriceMonthUsd: z.number().nonnegative(),
  freeLimits: z.record(z.string(), z.number()).default({}),
});

const tableSchema = z.object({
  updated: z.string().min(1),
  provider: z.array(providerSchema).min(1),
});

/** pricing.toml 文字列を PricingTable に検証・正規化。不正は throw。 */
export function validatePricing(raw: string): PricingTable {
  let parsed: unknown;
  try {
    parsed = toml.parse(raw);
  } catch (e) {
    throw new Error(`pricing TOML パースエラー: ${e instanceof Error ? e.message : String(e)}`);
  }
  const r = tableSchema.parse(parsed);
  return {
    updated: r.updated,
    providers: r.provider.map((p) => ({
      provider: p.provider,
      plan: p.plan,
      paidPlan: p.paidPlan,
      paidPriceMonthUsd: p.paidPriceMonthUsd,
      freeLimits: p.freeLimits as Partial<Record<MetricKey, number>>,
    })),
  };
}

/** updated が now から maxDays 超なら stale (= WebSearch 更新を提案する根拠)。 */
export function isStale(table: PricingTable, now: Date, maxDays: number): boolean {
  const updated = new Date(table.updated);
  const days = (now.getTime() - updated.getTime()) / 86400000;
  return days > maxDays;
}
