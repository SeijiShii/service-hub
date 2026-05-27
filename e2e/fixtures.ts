import type { DashboardVM } from "../src/features/dashboard/summary.js";
import type { ServiceDetailVM } from "../src/features/service-detail/detail.js";
import type { CostSimResponse } from "../src/features/cost-sim/CostSimView.js";

const noBiz = {
  profitability: { revenue: null, cost: null, profit: null, state: null },
  funnel: { started: null, abandonmentRate: null, cardFailureRate: null },
} as const;

export const dashboardVM: DashboardVM = {
  upCount: 2, downCount: 1, lastRunStatus: "ok",
  rows: [
    // 黒字 + 健全ファネル
    { slug: "hana-memo", name: "hana-memo", url: "https://hana-memo.example.com", status: "active", up: true, metrics: { mau: { value: 142, unit: "count" } }, freeTierState: "ok", openAlertCount: 0,
      profitability: { revenue: 50, cost: 10, profit: 40, state: "profit" },
      funnel: { started: 200, abandonmentRate: 0.25, cardFailureRate: 0.1 } },
    // 薄利 + 高離脱率
    { slug: "sanpo-log", name: "sanpo-log", url: "https://sanpo.example.com", status: "active", up: true, metrics: { mau: { value: 38, unit: "count" } }, freeTierState: "warn", openAlertCount: 0,
      profitability: { revenue: 5, cost: 4.5, profit: 0.5, state: "thin" },
      funnel: { started: 100, abandonmentRate: 0.6, cardFailureRate: 0.35 } },
    // 赤字 + データ欠損 (down)
    { slug: "kakei", name: "kakei", url: "https://kakei.example.com", status: "active", up: false, metrics: {}, freeTierState: null, openAlertCount: 1,
      profitability: { revenue: 1, cost: 8, profit: -7, state: "loss" },
      funnel: { started: null, abandonmentRate: null, cardFailureRate: null } },
  ],
};

export const emptyVM: DashboardVM = { upCount: 0, downCount: 0, rows: [] };

export const detailVM: ServiceDetailVM = {
  slug: "hana-memo", name: "hana-memo", url: "https://hana-memo.example.com", status: "active",
  series: [
    { metricKey: "db_storage_bytes", unit: "bytes", points: [
      { capturedAt: "2026-05-24T00:00:00.000Z", value: 100 },
      { capturedAt: "2026-05-25T00:00:00.000Z", value: 180 },
      { capturedAt: "2026-05-26T00:00:00.000Z", value: 240 },
    ] },
    { metricKey: "revenue_month_usd", unit: "usd", points: [
      { capturedAt: "2026-03-01T00:00:00.000Z", value: 30 },
      { capturedAt: "2026-04-01T00:00:00.000Z", value: 40 },
      { capturedAt: "2026-05-01T00:00:00.000Z", value: 50 },
    ] },
  ],
  alerts: [],
  funnel: { started: 200, abandonmentRate: 0.25, cardFailureRate: 0.1 },
  revenueProjection: [60, 70, 80],
};

export const costSimResponse: CostSimResponse = {
  pricingUpdated: "2026-05-27",
  stale: false,
  accounts: [
    { provider: "vercel", account: "vercel", serviceCount: 3, metrics: [], maxUsagePct: 0.92, daysToCeiling: 60, upgradeCostUsd: 20, aggregateRevenueUsd: 55, recommendation: "upgrade" },
    { provider: "neon", account: "neon", serviceCount: 3, metrics: [], maxUsagePct: 0.85, daysToCeiling: 30, upgradeCostUsd: 19, aggregateRevenueUsd: 6, recommendation: "consolidate" },
    { provider: "clerk", account: "clerk", serviceCount: 1, metrics: [], maxUsagePct: 0.4, daysToCeiling: null, upgradeCostUsd: 25, aggregateRevenueUsd: 0, recommendation: "keep" },
  ],
};
