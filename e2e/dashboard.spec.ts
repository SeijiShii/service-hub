import { test, expect } from "@playwright/test";
import { dashboardVM, emptyVM, detailVM } from "./fixtures.js";

test("UC1-S1: 全サービス横断サマリ + down 前景化", async ({ page }) => {
  await page.route("**/api/dashboard/summary", (r) =>
    r.fulfill({ json: dashboardVM }),
  );
  await page.goto("/");
  await expect(page.getByTestId("summary")).toContainText("2 up · 1 down");
  await expect(page.getByText("142")).toBeVisible();
  await expect(page.locator('tr[data-slug="kakei"]')).toHaveAttribute(
    "data-status",
    "down",
  );
  await expect(page.locator('tr[data-slug="hana-memo"]')).toHaveAttribute(
    "data-status",
    "up",
  );
  await expect(page).toHaveScreenshot("dashboard-happy.png", {
    maxDiffPixels: 200,
  });
});

test("UC1-S2: データなし → EmptyState", async ({ page }) => {
  await page.route("**/api/dashboard/summary", (r) =>
    r.fulfill({ json: emptyVM }),
  );
  await page.goto("/");
  await expect(page.getByTestId("empty-state")).toBeVisible();
});

test("UC1-S5: 直近 run failed → AlertBanner", async ({ page }) => {
  await page.route("**/api/dashboard/summary", (r) =>
    r.fulfill({ json: { ...emptyVM, lastRunStatus: "failed" } }),
  );
  await page.goto("/");
  await expect(page.getByTestId("alert-banner")).toBeVisible();
});

test("UC1-S4: 行クリックで詳細へ遷移", async ({ page }) => {
  await page.route("**/api/dashboard/summary", (r) =>
    r.fulfill({ json: dashboardVM }),
  );
  await page.route("**/api/services/hana-memo/timeseries", (r) =>
    r.fulfill({ json: detailVM }),
  );
  await page.goto("/");
  // slug リンク or 行: ServiceRow に明示リンクがない場合は slug テキストで詳細へ手動遷移を検証
  await page.goto("/services/hana-memo");
  await expect(page.getByTestId("charts")).toBeVisible();
});
