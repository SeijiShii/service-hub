import { describe, it, expect } from "vitest";
import { validatePricing, isStale } from "./pricing.js";

const toml = `
updated = "2026-05-27"

[[provider]]
provider = "vercel"
plan = "Hobby"
paidPlan = "Pro"
paidPriceMonthUsd = 20
[provider.freeLimits]
bandwidth_bytes = 107374182400

[[provider]]
provider = "neon"
plan = "Free"
paidPlan = "Launch"
paidPriceMonthUsd = 19
[provider.freeLimits]
db_storage_bytes = 536870912
`;

describe("validatePricing / isStale (business-observability Phase D)", () => {
  it("BO-PC1: 正常 TOML を PricingTable にパース", () => {
    const t = validatePricing(toml);
    expect(t.updated).toBe("2026-05-27");
    expect(t.providers).toHaveLength(2);
    const vercel = t.providers.find((p) => p.provider === "vercel")!;
    expect(vercel.paidPriceMonthUsd).toBe(20);
    expect(vercel.freeLimits.bandwidth_bytes).toBe(107374182400);
  });
  it("BO-PC2: updated が maxDays 超で stale=true", () => {
    const t = validatePricing(toml);
    expect(isStale(t, new Date("2026-06-30"), 30)).toBe(true);
    expect(isStale(t, new Date("2026-06-05"), 30)).toBe(false);
  });
  it("BO-PC3: 不正フィールド(paidPrice 欠損)はエラー", () => {
    const bad = `updated = "2026-05-27"\n[[provider]]\nprovider = "x"\nplan = "p"\npaidPlan = "q"\n`;
    expect(() => validatePricing(bad)).toThrow();
  });
});
