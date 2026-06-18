import { test, expect } from "@playwright/test";
import type {
  FeedbackInboxVM,
  FeedbackInboxItem,
} from "../src/features/feedback-inbox/inbox.js";

/** items から counts を補完して VM を組む (API の buildInboxVM と同等)。 */
function withCounts(
  items: FeedbackInboxItem[],
  services: { slug: string; name: string }[],
): FeedbackInboxVM {
  const byKind = { feedback: 0, bug: 0, inquiry: 0 };
  for (const i of items) byKind[i.kind] += 1;
  return { items, services, counts: { total: items.length, byKind } };
}

const services = [
  { slug: "hana-memo", name: "ハナメモ" },
  { slug: "naze-bako", name: "なぜ箱" },
];

const vm: FeedbackInboxVM = withCounts(
  [
    {
      serviceSlug: "hana-memo",
      serviceName: "ハナメモ",
      externalId: "a",
      kind: "feedback",
      body: "とても便利に使っています",
      createdAt: "2026-06-15T00:00:00.000Z",
      pulledAt: "2026-06-18T00:00:00.000Z",
    },
    {
      serviceSlug: "naze-bako",
      serviceName: "なぜ箱",
      externalId: "b",
      kind: "bug",
      body: "保存ボタンが反応しないことがあります",
      createdAt: "2026-06-14T00:00:00.000Z",
      pulledAt: "2026-06-18T00:00:00.000Z",
    },
    {
      serviceSlug: "hana-memo",
      serviceName: "ハナメモ",
      externalId: "c",
      kind: "inquiry",
      body: "有料プランの違いを教えてください",
      createdAt: "2026-06-10T00:00:00.000Z",
      pulledAt: "2026-06-18T00:00:00.000Z",
    },
  ],
  services,
);

const emptyVm: FeedbackInboxVM = withCounts(
  [],
  [{ slug: "hana-memo", name: "ハナメモ" }],
);

test("UC1-S1: 横断一覧 + kind バッジ + 新しい順 (L2-1)", async ({ page }) => {
  await page.route("**/api/feedback/inbox**", (r) => r.fulfill({ json: vm }));
  await page.goto("/feedback");
  await expect(page.getByTestId("feedback-list")).toBeVisible();
  await expect(page.getByTestId("feedback-item")).toHaveCount(3);
  await expect(page.getByTestId("kind-badge")).toHaveCount(3);
  // L2-1: createdAt 降順 (各 item の data-created が単調減少)
  const created = await page
    .getByTestId("feedback-item")
    .evaluateAll((els) => els.map((e) => e.getAttribute("data-created")));
  const sorted = [...created].sort().reverse();
  expect(created).toEqual(sorted);
  await expect(page).toHaveScreenshot("feedback-inbox-list.png", {
    maxDiffPixels: 300,
    mask: [page.locator("time")],
  });
});

test("UC1-S4: 空状態", async ({ page }) => {
  await page.route("**/api/feedback/inbox**", (r) =>
    r.fulfill({ json: emptyVm }),
  );
  await page.goto("/feedback");
  await expect(page.getByTestId("empty-state")).toBeVisible();
  await expect(page.getByTestId("feedback-list")).toHaveCount(0);
  await expect(page).toHaveScreenshot("feedback-inbox-empty.png", {
    maxDiffPixels: 200,
  });
});

test("UC1-S3: kind segmented chips で絞り込み (refetch)", async ({ page }) => {
  await page.route("**/api/feedback/inbox**", (r) => {
    const kind = new URL(r.request().url()).searchParams.get("kind");
    const items =
      kind === "bug" ? vm.items.filter((i) => i.kind === "bug") : vm.items;
    return r.fulfill({ json: withCounts(items, services) });
  });
  await page.goto("/feedback");
  await expect(page.getByTestId("feedback-item")).toHaveCount(3);
  // kind は segmented chips (role=group)。「不具合」chip をクリックして絞り込み。
  const group = page.getByRole("group", { name: "種別で絞り込む" });
  await group.getByText("不具合", { exact: true }).click();
  await expect(page.getByTestId("feedback-item")).toHaveCount(1);
});

test("RE-UC1-S1: 件数サマリ (全 N 件) を表示", async ({ page }) => {
  await page.route("**/api/feedback/inbox**", (r) => r.fulfill({ json: vm }));
  await page.goto("/feedback");
  await expect(page.getByTestId("count-summary")).toContainText("全 3 件");
});
