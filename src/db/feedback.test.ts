import { describe, it, expect } from "vitest";
import { createTestDb } from "./testdb.js";
import { upsertFeedbackItems, listFeedback } from "./queries.js";
import type { FeedbackItemRow } from "../types/index.js";

const PULLED = "2026-06-18T00:00:00.000Z";

function row(over: Partial<FeedbackItemRow> = {}): FeedbackItemRow {
  return {
    serviceSlug: "hana-memo",
    externalId: "fb-1",
    kind: "feedback",
    body: "とても便利です",
    createdAt: "2026-06-10T10:00:00.000Z",
    pulledAt: PULLED,
    ...over,
  };
}

describe("feedback queries (feedback-inbox, [論点-007]/O67)", () => {
  it("U-02: upsert で複数件保存", async () => {
    const db = await createTestDb();
    await upsertFeedbackItems(db, [
      row({ externalId: "a" }),
      row({ externalId: "b" }),
      row({ externalId: "c" }),
    ]);
    expect(await listFeedback(db)).toHaveLength(3);
  });

  it("U-03: 同 (slug, externalId) 再投入で冪等 (行数不変・上書き)", async () => {
    const db = await createTestDb();
    await upsertFeedbackItems(db, [row({ externalId: "a", body: "旧" })]);
    await upsertFeedbackItems(db, [row({ externalId: "a", body: "新" })]);
    const all = await listFeedback(db);
    expect(all).toHaveLength(1);
    expect(all[0].body).toBe("新");
  });

  it("U-03b: 同一バッチ内の重複は後勝ちで 1 件", async () => {
    const db = await createTestDb();
    await upsertFeedbackItems(db, [
      row({ externalId: "a", body: "1" }),
      row({ externalId: "a", body: "2" }),
    ]);
    const all = await listFeedback(db);
    expect(all).toHaveLength(1);
    expect(all[0].body).toBe("2");
  });

  it("U-04: createdAt 降順", async () => {
    const db = await createTestDb();
    await upsertFeedbackItems(db, [
      row({ externalId: "old", createdAt: "2026-06-01T00:00:00.000Z" }),
      row({ externalId: "new", createdAt: "2026-06-15T00:00:00.000Z" }),
    ]);
    const all = await listFeedback(db);
    expect(all.map((r) => r.externalId)).toEqual(["new", "old"]);
  });

  it("U-05: service フィルタ", async () => {
    const db = await createTestDb();
    await upsertFeedbackItems(db, [
      row({ serviceSlug: "hana-memo", externalId: "a" }),
      row({ serviceSlug: "naze-bako", externalId: "b" }),
    ]);
    const r = await listFeedback(db, { service: "naze-bako" });
    expect(r).toHaveLength(1);
    expect(r[0].serviceSlug).toBe("naze-bako");
  });

  it("U-06: kind フィルタ", async () => {
    const db = await createTestDb();
    await upsertFeedbackItems(db, [
      row({ externalId: "a", kind: "feedback" }),
      row({ externalId: "b", kind: "bug" }),
    ]);
    const r = await listFeedback(db, { kind: "bug" });
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("bug");
  });

  it("U-07: since フィルタ", async () => {
    const db = await createTestDb();
    await upsertFeedbackItems(db, [
      row({ externalId: "old", createdAt: "2026-05-01T00:00:00.000Z" }),
      row({ externalId: "new", createdAt: "2026-06-15T00:00:00.000Z" }),
    ]);
    const r = await listFeedback(db, { since: "2026-06-01T00:00:00.000Z" });
    expect(r.map((x) => x.externalId)).toEqual(["new"]);
  });

  it("U-31: 0 件は空配列", async () => {
    const db = await createTestDb();
    expect(await listFeedback(db)).toEqual([]);
  });

  it("任意フィールド (rating/context/status) の往復", async () => {
    const db = await createTestDb();
    await upsertFeedbackItems(db, [
      row({
        externalId: "a",
        rating: 5,
        context: { screen: "home" },
        status: "open",
      }),
    ]);
    const r = (await listFeedback(db))[0];
    expect(r.rating).toBe(5);
    expect(r.context).toEqual({ screen: "home" });
    expect(r.status).toBe("open");
  });

  it("limit は FEEDBACK_LIST_LIMIT を超えない", async () => {
    const db = await createTestDb();
    await upsertFeedbackItems(
      db,
      Array.from({ length: 5 }, (_, i) => row({ externalId: `x${i}` })),
    );
    expect(await listFeedback(db, { limit: 2 })).toHaveLength(2);
    expect(await listFeedback(db, { limit: 9999 })).toHaveLength(5);
  });
});
