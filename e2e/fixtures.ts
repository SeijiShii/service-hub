import type { DashboardVM } from "../src/features/dashboard/summary.js";
import type { ServiceDetailVM } from "../src/features/service-detail/detail.js";

export const dashboardVM: DashboardVM = {
  upCount: 2, downCount: 1, lastRunStatus: "ok",
  rows: [
    { slug: "hana-memo", name: "hana-memo", url: "https://hana-memo.example.com", status: "active", up: true, metrics: { mau: { value: 142, unit: "count" } }, freeTierState: "ok", openAlertCount: 0 },
    { slug: "sanpo-log", name: "sanpo-log", url: "https://sanpo.example.com", status: "active", up: true, metrics: { mau: { value: 38, unit: "count" } }, freeTierState: "warn", openAlertCount: 0 },
    { slug: "kakei", name: "kakei", url: "https://kakei.example.com", status: "active", up: false, metrics: {}, freeTierState: null, openAlertCount: 1 },
  ],
};

export const emptyVM: DashboardVM = { upCount: 0, downCount: 0, rows: [] };

export const detailVM: ServiceDetailVM = {
  slug: "hana-memo", name: "hana-memo", url: "https://hana-memo.example.com", status: "active",
  series: [{ metricKey: "db_storage_bytes", unit: "bytes", points: [
    { capturedAt: "2026-05-24T00:00:00.000Z", value: 100 },
    { capturedAt: "2026-05-25T00:00:00.000Z", value: 180 },
    { capturedAt: "2026-05-26T00:00:00.000Z", value: 240 },
  ] }],
  alerts: [],
};
