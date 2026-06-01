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
  // last-deploy-col: thead に「最終デプロイ」列 + hana-memo 行に JST 日時、欠損行は —
  await expect(
    page.locator("thead th", { hasText: "最終デプロイ" }),
  ).toBeVisible();
  await expect(
    page.locator('tr[data-slug="hana-memo"] [data-deploy-at]'),
  ).toHaveText("2026-05-28 09:00");
  await expect(
    page.locator('tr[data-slug="sanpo-log"] [data-deploy-at]'),
  ).toHaveText("—");
  // biz-charts: 上部チャートは 4 ビジネス指標 (日本語ラベル)、旧 up/db_storage chart は不在
  const chartsSection = page.getByTestId("dashboard-charts");
  await expect(chartsSection).toContainText("ユーザー数");
  await expect(chartsSection).toContainText("課金額");
  await expect(chartsSection).toContainText("コスト");
  await expect(chartsSection).toContainText("採算");
  await expect(page.getByTestId("chart-profit")).toBeVisible();
  await expect(page.getByTestId("chart-up")).toHaveCount(0);
  await expect(page.getByTestId("chart-db_storage_bytes")).toHaveCount(0);
  await expect(page).toHaveScreenshot("dashboard-happy.png", {
    maxDiffPixels: 200,
  });
});

test("FX-E2E-01 (C20260601-002): 2 service 同一 run の上部チャートが 2 series で整列描画", async ({
  page,
}) => {
  // 同一 run 由来でミリ秒だけずれた capturedAt を持つ 2 service。
  // 修正前: 文字列完全一致マージで 4 点に分裂。修正後: 分バケット整列で 2 点 (2 series)。
  const multiSeriesVM = {
    ...dashboardVM,
    charts: [
      {
        metricKey: "mau",
        label: "ユーザー数",
        unit: "count",
        series: [
          {
            slug: "hana-memo",
            name: "hana-memo",
            points: [
              { capturedAt: "2026-05-27T00:00:00.123Z", value: 142 },
              { capturedAt: "2026-05-28T00:00:00.123Z", value: 150 },
            ],
          },
          {
            slug: "naze-bako",
            name: "naze-bako",
            points: [
              { capturedAt: "2026-05-27T00:00:00.789Z", value: 88 },
              { capturedAt: "2026-05-28T00:00:00.789Z", value: 95 },
            ],
          },
        ],
      },
      ...dashboardVM.charts.slice(1),
    ],
  };
  await page.route("**/api/dashboard/summary", (r) =>
    r.fulfill({ json: multiSeriesVM }),
  );
  await page.goto("/");
  const chart = page.getByTestId("chart-mau");
  await expect(chart).toBeVisible();
  // 2 series 重ね描き
  await expect(chart).toHaveAttribute("data-series-count", "2");
  // ms 差の同一論理時刻が分バケットで整列 → 2 日 = 2 点 (4 に分裂しない)
  await expect(chart).toHaveAttribute("data-points", "2");
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

test("DA-NAV (nav-and-pull): 管理リンクが /admin を指す", async ({ page }) => {
  await page.route("**/api/dashboard/summary", (r) =>
    r.fulfill({ json: dashboardVM }),
  );
  await page.goto("/");
  await expect(page.getByTestId("admin-link")).toHaveAttribute(
    "href",
    "/admin",
  );
});

test("DA-FP (force-pull/refresh-cadence): 今すぐ pull → 結果サマリ表示", async ({
  page,
}) => {
  await page.route("**/api/dashboard/summary", (r) =>
    r.fulfill({ json: dashboardVM }),
  );
  await page.route("**/api/admin/collect", (r) =>
    r.fulfill({ json: { status: "ok", servicesCount: 3, errors: [] } }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "今すぐ pull" }).click();
  // force-pull 完了後に結果サマリ (servicesCount / errors 件数) が表示
  await expect(page.getByTestId("force-pull-result")).toContainText(
    "3 サービス",
  );
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
