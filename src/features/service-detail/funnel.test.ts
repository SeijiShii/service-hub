import { describe, it, expect } from "vitest";
import { computeFunnel } from "./funnel.js";

describe("computeFunnel (business-observability Phase B)", () => {
  it("BO-FN1: started=100, completed=70, card_failed=12 → 離脱率0.30 / カード失敗率0.12", () => {
    const r = computeFunnel({
      checkout_started_month: 100,
      checkout_completed_month: 70,
      checkout_card_failed_month: 12,
    });
    expect(r.abandonmentRate).toBeCloseTo(0.3, 5);
    expect(r.cardFailureRate).toBeCloseTo(0.12, 5);
  });
  it("BO-FN2: started=0 → 両 rate=null (ゼロ除算回避)", () => {
    const r = computeFunnel({ checkout_started_month: 0, checkout_completed_month: 0 });
    expect(r.abandonmentRate).toBeNull();
    expect(r.cardFailureRate).toBeNull();
  });
  it("BO-FN3: completed>started (異常) → 離脱率は 0 下限 clamp", () => {
    const r = computeFunnel({ checkout_started_month: 50, checkout_completed_month: 60 });
    expect(r.abandonmentRate).toBe(0);
  });
  it("BO-FN4: card_failed 未申告 → 全体離脱率は算出、カード失敗率=null", () => {
    const r = computeFunnel({ checkout_started_month: 100, checkout_completed_month: 80 });
    expect(r.abandonmentRate).toBeCloseTo(0.2, 5);
    expect(r.cardFailureRate).toBeNull();
  });
  it("BO-FN5: started 未申告 → データなし (null)", () => {
    const r = computeFunnel({});
    expect(r.started).toBeNull();
    expect(r.abandonmentRate).toBeNull();
  });
});
