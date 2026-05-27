import { describe, it, expect } from "vitest";
import { runCostSim } from "./orchestrate.js";
import type { ServiceUsage } from "./aggregate.js";
import type { PricingTable } from "./pricing.js";

const pricing: PricingTable = {
  updated: "2026-05-27",
  providers: [
    { provider: "vercel", plan: "Hobby", paidPlan: "Pro", paidPriceMonthUsd: 20, freeLimits: { bandwidth_bytes: 100 } },
  ],
};

describe("runCostSim (business-observability Phase D orchestration)", () => {
  it("BO-OR1: 合算 → pricing 照合 → simulate を返す", () => {
    const usages: ServiceUsage[] = [
      { slug: "a", provider: "vercel", account: "vercel", usage: { bandwidth_bytes: 60 }, revenueUsd: 30 },
      { slug: "b", provider: "vercel", account: "vercel", usage: { bandwidth_bytes: 60 }, revenueUsd: 30 },
    ];
    const sims = runCostSim(usages, pricing);
    expect(sims).toHaveLength(1);
    expect(sims[0]!.maxUsagePct).toBeCloseTo(1.2, 5); // 120/100
    expect(sims[0]!.recommendation).toBe("upgrade"); // 合算収益60 > 格上げ20
  });
  it("BO-OR2: pricing に無い provider はスキップ", () => {
    const usages: ServiceUsage[] = [
      { slug: "a", provider: "sentry", account: "sentry", usage: {}, revenueUsd: 0 },
    ];
    expect(runCostSim(usages, pricing)).toEqual([]);
  });
});
