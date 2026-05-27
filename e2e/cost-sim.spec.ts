import { test, expect } from "@playwright/test";
import { costSimResponse } from "./fixtures.js";

test("BO-E4: コストシミュレーション — アカウント別 提案表示", async ({ page }) => {
  await page.route("**/api/cost-sim/summary", (r) => r.fulfill({ json: costSimResponse }));
  await page.goto("/cost-sim");
  await expect(page.locator('tr[data-account="vercel"]')).toHaveAttribute("data-rec", "upgrade");
  await expect(page.locator('tr[data-account="neon"]')).toHaveAttribute("data-rec", "consolidate");
  await expect(page.locator('tr[data-account="clerk"]')).toHaveAttribute("data-rec", "keep");
  await expect(page.locator('tr[data-account="vercel"] [data-usage-pct]')).toContainText("92%");
  await expect(page).toHaveScreenshot("cost-sim-happy.png", { maxDiffPixels: 200 });
});

test("BO-E5: pricing stale → 警告表示", async ({ page }) => {
  await page.route("**/api/cost-sim/summary", (r) =>
    r.fulfill({ json: { ...costSimResponse, stale: true } }),
  );
  await page.goto("/cost-sim");
  await expect(page.locator("[data-stale]")).toBeVisible();
});
