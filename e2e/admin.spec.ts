import { test, expect } from "@playwright/test";
import type { ServiceDescriptor } from "../src/types/index.js";

// admin route-mock fixture (Clerk bare = サインインゲート無効、認可本体は API 側 requireSeiji)。
// 2026-05-28 batch の admin 系 revise (admin-ux / nav-and-pull / db-sot) の E2E gate を閉じる。
const adminServices: ServiceDescriptor[] = [
  {
    slug: "hana-memo",
    name: "hana-memo",
    url: "https://hana-memo.example.com",
    status: "active",
    providers: { vercel: { projectId: "prj_hana" } },
    serviceInfo: {
      endpoint: "https://hana-memo.example.com/api/hub/service-info",
    },
  },
  {
    slug: "kakei",
    name: "kakei",
    url: "https://kakei.example.com",
    status: "paused",
    providers: {},
  },
];

test("AD-1 (admin-ux/db-sot): /admin がサービス一覧 + 登録フォームを表示", async ({
  page,
}) => {
  await page.route("**/api/admin/services", (r) =>
    r.fulfill({ json: adminServices }),
  );
  await page.goto("/admin");
  // 一覧: 既存 service が行で表示 (slug / status バッジ)
  await expect(page.locator('tr[data-slug="hana-memo"]')).toHaveAttribute(
    "data-status",
    "active",
  );
  await expect(page.locator('tr[data-slug="kakei"]')).toHaveAttribute(
    "data-status",
    "paused",
  );
  // 登録フォーム (db-sot DB-admin-write)
  await expect(page.getByRole("form", { name: "サービス登録" })).toBeVisible();
});

test("AD-2 (nav-and-pull E-NAV-BACK-1): /admin から ← ダッシュボードで / へ戻る", async ({
  page,
}) => {
  await page.route("**/api/admin/services", (r) =>
    r.fulfill({ json: adminServices }),
  );
  await page.goto("/admin");
  const back = page.getByTestId("back-link");
  await expect(back).toHaveAttribute("href", "/");
});

test("AD-3 (db-sot UC4a): 新規サービス登録 → 保存成功表示", async ({
  page,
}) => {
  await page.route("**/api/admin/services", (r) => {
    if (r.request().method() === "POST")
      return r.fulfill({ json: { ok: true } });
    return r.fulfill({ json: adminServices });
  });
  await page.goto("/admin");
  const form = page.getByRole("form", { name: "サービス登録" });
  await form.getByLabel("slug").fill("naze-bako");
  await form.getByLabel("名前").fill("naze-bako");
  await form
    .getByLabel("URL", { exact: true })
    .fill("https://naze-bako.example.com");
  await form.getByRole("button", { name: "登録" }).click();
  // saveState success 表示 (admin-form async UX 4 状態)
  await expect(page.getByTestId("save-status")).toHaveAttribute(
    "data-status",
    "success",
  );
});
