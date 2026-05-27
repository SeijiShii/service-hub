import { aggregateByAccount, type ServiceUsage } from "./aggregate.js";
import { simulateAccount, type AccountSim } from "./simulate.js";
import type { PricingTable } from "./pricing.js";

/**
 * サービス別使用量を account 単位で合算 → pricing と照合 → 格上げ判断を出す
 * (business-observability Phase D オーケストレーション)。pricing に無い provider はスキップ。
 */
export function runCostSim(
  usages: ServiceUsage[],
  pricing: PricingTable,
  opts: { warnPct?: number } = {},
): AccountSim[] {
  const accounts = aggregateByAccount(usages);
  const sims: AccountSim[] = [];
  for (const acc of accounts) {
    const pp = pricing.providers.find((p) => p.provider === acc.provider);
    if (!pp) continue;
    sims.push(simulateAccount(acc, pp, opts));
  }
  return sims;
}
