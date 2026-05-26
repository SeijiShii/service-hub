import { test, expect } from "@playwright/test";
import { detailVM } from "./fixtures.js";

test("UC2-S1: 個別サービス時系列グラフ", async ({ page }) => {
  await page.route("**/api/services/hana-memo/timeseries", (r) => r.fulfill({ json: detailVM }));
  await page.goto("/services/hana-memo");
  await expect(page.getByText("hana-memo", { exact: true })).toBeVisible();
  await expect(page.getByTestId("chart-db_storage_bytes")).toHaveAttribute("data-points", "3");
  await expect(page).toHaveScreenshot("detail-happy.png", { maxDiffPixels: 300 });
});

test("UC2-S3: 不明 slug → 404", async ({ page }) => {
  await page.route("**/api/services/unknown/timeseries", (r) => r.fulfill({ status: 404, json: null }));
  await page.goto("/services/unknown");
  await expect(page.getByTestId("not-found")).toBeVisible();
});

test("UC2-S4: snapshot なし → EmptyState", async ({ page }) => {
  await page.route("**/api/services/hana-memo/timeseries", (r) => r.fulfill({ json: { ...detailVM, series: [] } }));
  await page.goto("/services/hana-memo");
  await expect(page.getByTestId("empty-state")).toBeVisible();
});
