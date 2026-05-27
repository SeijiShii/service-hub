import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "../db/testdb.js";
import { upsertService, type AnyDb } from "../db/index.js";
import { loadServices } from "./load.js";
import type { ServiceDescriptor } from "../types/index.js";

// D20260528-001: レジストリ SoT = Neon services テーブル。loadServices は DB から読む。
// 旧 validateServicesToml (toml パース) は退役 (D20260528-005)。CRUD 詳細は db/services.test.ts。

let db: AnyDb;
beforeEach(async () => {
  db = await createTestDb();
});

const svc = (over: Partial<ServiceDescriptor> = {}): ServiceDescriptor => ({
  slug: "hana-memo",
  name: "hana-memo",
  url: "https://hana-memo.example.com",
  status: "active",
  providers: { vercel: { projectId: "prj_x" } },
  ...over,
});

describe("loadServices (DB SoT)", () => {
  it("RG-N1: DB の全サービスを返す", async () => {
    await upsertService(db, svc({ slug: "a" }));
    await upsertService(db, svc({ slug: "b", status: "paused" }));
    expect(await loadServices(db)).toHaveLength(2);
  });

  it("RG-N2: onlyActive で active のみ", async () => {
    await upsertService(db, svc({ slug: "a", status: "active" }));
    await upsertService(db, svc({ slug: "b", status: "paused" }));
    const active = await loadServices(db, { onlyActive: true });
    expect(active.map((s) => s.slug)).toEqual(["a"]);
  });

  it("RG-B1: 空レジストリ → []", async () => {
    expect(await loadServices(db, { onlyActive: true })).toEqual([]);
  });
});
