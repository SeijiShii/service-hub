import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CostSimView, type CostSimResponse } from "./CostSimView.js";
import type { AccountSim } from "./simulate.js";

const acct = (over: Partial<AccountSim> = {}): AccountSim => ({
  provider: "vercel", account: "vercel", serviceCount: 2, metrics: [],
  maxUsagePct: 0.9, daysToCeiling: 30, upgradeCostUsd: 20, aggregateRevenueUsd: 5,
  recommendation: "consolidate", ...over,
});

const resp = (over: Partial<CostSimResponse> = {}): CostSimResponse => ({
  accounts: [], pricingUpdated: "2026-05-27", stale: false, ...over,
});

describe("CostSimView (business-observability Phase D)", () => {
  it("BO-CV1: アカウント別に消費率 + 提案を表示", () => {
    render(<CostSimView data={resp({ accounts: [acct()] })} />);
    const row = document.querySelector('tr[data-account="vercel"]')!;
    expect(row.getAttribute("data-rec")).toBe("consolidate");
    expect(row.querySelector("[data-usage-pct]")?.textContent).toBe("90%");
    expect(row.querySelector("[data-rec-label]")?.textContent).toContain("統合");
  });
  it("BO-CV2: pricing stale なら警告を表示", () => {
    render(<CostSimView data={resp({ accounts: [acct()], stale: true })} />);
    expect(document.querySelector("[data-stale]")).toBeTruthy();
  });
  it("BO-CV3: アカウント無し → EmptyState", () => {
    render(<CostSimView data={resp()} />);
    expect(screen.getByTestId("empty-state")).toBeTruthy();
  });
});
