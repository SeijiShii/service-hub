import { describe, it, expect } from "vitest";
import { computeProfitability, profitAt } from "./profitability.js";

// biz-charts spec-review R1: 採算定義 SoT の純関数 (一覧採算列とチャート採算が共有)
describe("profitAt (biz-charts、採算定義 SoT)", () => {
  it("PA-1: profitAt(50, 10) = 40", () => {
    expect(profitAt(50, 10)).toBe(40);
  });
  it("PA-2: profitAt(50, null/undefined) = 50 (cost 欠落は 0 扱い)", () => {
    expect(profitAt(50, null)).toBe(50);
    expect(profitAt(50, undefined)).toBe(50);
  });
  it("PA-3: profitAt(0, 5) = -5", () => {
    expect(profitAt(0, 5)).toBe(-5);
  });
});

describe("computeProfitability (business-observability Phase A)", () => {
  it("BO-PR1: revenue=10, ai_cost=3 → profit=7, 黒字", () => {
    const r = computeProfitability({
      revenue_month_usd: 10,
      ai_cost_month_usd: 3,
    });
    expect(r.profit).toBe(7);
    expect(r.state).toBe("profit");
  });
  it("BO-PR2: revenue=1, ai_cost=0.9 → profit≈0.1, 薄利", () => {
    const r = computeProfitability({
      revenue_month_usd: 1,
      ai_cost_month_usd: 0.9,
    });
    expect(r.profit).toBeCloseTo(0.1, 5);
    expect(r.state).toBe("thin");
  });
  it("BO-PR3: revenue=2, ai_cost=5 → profit=-3, 赤字", () => {
    const r = computeProfitability({
      revenue_month_usd: 2,
      ai_cost_month_usd: 5,
    });
    expect(r.profit).toBe(-3);
    expect(r.state).toBe("loss");
  });
  it("BO-PR4: revenue 未申告 → データなし (null)", () => {
    const r = computeProfitability({});
    expect(r.state).toBeNull();
    expect(r.profit).toBeNull();
  });
  it("BO-PR4b: revenue あり cost 未申告 → cost=0 で算出", () => {
    const r = computeProfitability({ revenue_month_usd: 5 });
    expect(r.profit).toBe(5);
    expect(r.state).toBe("profit");
  });
  it("BO-PR5: revenueThresholds(thinMarginMax) で薄利境界を上書き", () => {
    // margin 0.5 でも thinMarginMax=0.6 なら薄利
    const r = computeProfitability(
      { revenue_month_usd: 10, ai_cost_month_usd: 5 },
      { thinMarginMax: 0.6 },
    );
    expect(r.state).toBe("thin");
  });
});
