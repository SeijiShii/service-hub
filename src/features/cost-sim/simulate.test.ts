import { describe, it, expect } from "vitest";
import { simulateAccount, type AccountInput } from "./simulate.js";
import type { ProviderPricing } from "./pricing.js";

const vercel: ProviderPricing = {
  provider: "vercel",
  plan: "Hobby",
  paidPlan: "Pro",
  paidPriceMonthUsd: 20,
  freeLimits: { bandwidth_bytes: 100 },
};

const base = (over: Partial<AccountInput>): AccountInput => ({
  provider: "vercel",
  account: "acct_main",
  serviceCount: 2,
  usage: {},
  aggregateRevenueUsd: 0,
  ...over,
});

describe("simulateAccount (business-observability Phase D)", () => {
  it("BO-CS1: 合算90% → maxUsagePct≈0.9, keep ではない (警告)", () => {
    const r = simulateAccount(base({ usage: { bandwidth_bytes: 90 }, aggregateRevenueUsd: 50 }), vercel);
    expect(r.maxUsagePct).toBeCloseTo(0.9, 5);
    expect(r.recommendation).not.toBe("keep");
  });
  it("BO-CS2: 超過 + 合算収益 > 格上げコスト → upgrade", () => {
    const r = simulateAccount(base({ usage: { bandwidth_bytes: 120 }, aggregateRevenueUsd: 50 }), vercel);
    expect(r.recommendation).toBe("upgrade");
  });
  it("BO-CS3: 超過 + 収益 < コスト + 複数サービス → consolidate", () => {
    const r = simulateAccount(base({ usage: { bandwidth_bytes: 120 }, aggregateRevenueUsd: 5, serviceCount: 3 }), vercel);
    expect(r.recommendation).toBe("consolidate");
  });
  it("BO-CS3b: 超過 + 収益 < コスト + 単一サービス → sunset", () => {
    const r = simulateAccount(base({ usage: { bandwidth_bytes: 120 }, aggregateRevenueUsd: 5, serviceCount: 1 }), vercel);
    expect(r.recommendation).toBe("sunset");
  });
  it("BO-CS4: 無料枠内で余裕 → keep", () => {
    const r = simulateAccount(base({ usage: { bandwidth_bytes: 30 }, aggregateRevenueUsd: 0 }), vercel);
    expect(r.recommendation).toBe("keep");
    expect(r.daysToCeiling).toBeNull();
  });
  it("BO-CS5: 系列が上限を超える予測 → daysToCeiling を返す", () => {
    const r = simulateAccount(
      base({ usage: { bandwidth_bytes: 90 }, series: { bandwidth_bytes: [50, 70, 90] }, aggregateRevenueUsd: 50 }),
      vercel,
    );
    expect(r.daysToCeiling).not.toBeNull();
    expect(r.daysToCeiling!).toBeGreaterThan(0);
  });
  it("BO-CS6: upgradeCost/aggregateRevenue を結果に反映", () => {
    const r = simulateAccount(base({ usage: { bandwidth_bytes: 30 }, aggregateRevenueUsd: 7 }), vercel);
    expect(r.upgradeCostUsd).toBe(20);
    expect(r.aggregateRevenueUsd).toBe(7);
  });
});
