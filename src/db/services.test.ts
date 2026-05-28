import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "./testdb.js";
import {
  listServices,
  getService,
  upsertService,
  setServiceStatus,
  deleteService,
  updateServiceMeta,
  type AnyDb,
} from "./queries.js";
import type { ServiceDescriptor } from "../types/index.js";

let db: AnyDb;
beforeEach(async () => {
  db = await createTestDb();
});

const svc = (over: Partial<ServiceDescriptor> = {}): ServiceDescriptor => ({
  slug: "demo-svc",
  name: "Demo",
  url: "https://demo.example.com",
  status: "active",
  providers: { vercel: { projectId: "prj_1" }, neon: { projectId: "neon_1" } },
  serviceInfo: { endpoint: "https://demo.example.com/api/hub/service-info" },
  ...over,
});

describe("upsertService / getService", () => {
  it("U-01: inserts a new descriptor", async () => {
    await upsertService(db, svc());
    const got = await getService(db, "demo-svc");
    expect(got?.name).toBe("Demo");
    expect(got?.providers.vercel?.projectId).toBe("prj_1");
  });

  it("U-02: re-upsert same slug updates (no duplicate)", async () => {
    await upsertService(db, svc({ name: "Demo" }));
    await upsertService(db, svc({ name: "Demo v2" }));
    expect(await listServices(db)).toHaveLength(1);
    expect((await getService(db, "demo-svc"))?.name).toBe("Demo v2");
  });

  it("U-08: providers jsonb round-trips", async () => {
    await upsertService(
      db,
      svc({ providers: { sentry: { org: "o", project: "p" } } }),
    );
    expect((await getService(db, "demo-svc"))?.providers.sentry).toEqual({
      org: "o",
      project: "p",
    });
  });

  it("U-21: serviceInfo/thresholds omitted -> undefined", async () => {
    await upsertService(
      db,
      svc({ serviceInfo: undefined, thresholds: undefined }),
    );
    const got = await getService(db, "demo-svc");
    expect(got?.serviceInfo).toBeUndefined();
    expect(got?.thresholds).toBeUndefined();
  });
});

describe("listServices", () => {
  it("U-03/U-04: onlyActive filters; full returns all", async () => {
    await upsertService(db, svc({ slug: "a", status: "active" }));
    await upsertService(db, svc({ slug: "b", status: "active" }));
    await upsertService(db, svc({ slug: "c", status: "paused" }));
    await upsertService(db, svc({ slug: "d", status: "retired" }));
    expect(await listServices(db, { onlyActive: true })).toHaveLength(2);
    expect(await listServices(db)).toHaveLength(4);
  });

  it("U-20: empty registry -> []", async () => {
    expect(await listServices(db)).toEqual([]);
  });
});

describe("setServiceStatus / deleteService", () => {
  it("U-05: retire removes from onlyActive", async () => {
    await upsertService(db, svc({ slug: "a" }));
    await setServiceStatus(db, "a", "retired");
    expect(await listServices(db, { onlyActive: true })).toHaveLength(0);
    expect((await getService(db, "a"))?.status).toBe("retired");
  });

  it("hard delete removes the row", async () => {
    await upsertService(db, svc({ slug: "a" }));
    await deleteService(db, "a");
    expect(await getService(db, "a")).toBeNull();
  });
});

// ── favicon-projection (revise_favicon-projection_20260528) ──────
describe("updateServiceMeta + iconUrl SoT 一貫性 (favicon-projection)", () => {
  it("FP-U-06: 新規セット → services.icon_url 更新", async () => {
    await upsertService(db, svc({ slug: "a" }));
    await updateServiceMeta(db, "a", {
      iconUrl: "https://a.example/favicon.svg",
    });
    expect((await getService(db, "a"))?.iconUrl).toBe(
      "https://a.example/favicon.svg",
    );
  });

  it("FP-U-07: iconUrl 既設定 + 空 meta (key 無し) → 既存値保持 (保持セマンティクス)", async () => {
    await upsertService(db, svc({ slug: "a" }));
    await updateServiceMeta(db, "a", {
      iconUrl: "https://a.example/favicon.svg",
    });
    await updateServiceMeta(db, "a", {}); // no key
    expect((await getService(db, "a"))?.iconUrl).toBe(
      "https://a.example/favicon.svg",
    );
  });

  it("FP-U-08: iconUrl=undefined 明示 → no-op (既存値保持)", async () => {
    await upsertService(db, svc({ slug: "a" }));
    await updateServiceMeta(db, "a", {
      iconUrl: "https://a.example/favicon.svg",
    });
    await updateServiceMeta(db, "a", { iconUrl: undefined });
    expect((await getService(db, "a"))?.iconUrl).toBe(
      "https://a.example/favicon.svg",
    );
  });

  it("FP-U-09: toServiceDescriptor で iconUrl 反映 (round-trip)", async () => {
    await upsertService(db, svc({ slug: "a" }));
    await updateServiceMeta(db, "a", {
      iconUrl: "https://a.example/favicon.svg",
    });
    const got = await getService(db, "a");
    expect(got?.iconUrl).toBe("https://a.example/favicon.svg");
  });

  it("FP-U-26: admin write (upsertService) で iconUrl を渡しても無視 (SoT 一貫性、SET 句不含による構造防御)", async () => {
    // upsertService に iconUrl 付き ServiceDescriptor を渡す (ServiceDescriptor 型は iconUrl 含む)
    await upsertService(
      db,
      svc({
        slug: "a",
        iconUrl: "https://injected.example/icon.png", // 注入試行
      }),
    );
    // upsertService の SET 句に iconUrl を含めない → NULL (新規 INSERT 時、spec-review R4)
    expect((await getService(db, "a"))?.iconUrl).toBeUndefined();
  });

  it("FP-U-26b: 既存 iconUrl ある状態で admin upsertService (iconUrl 含む) → 既存 iconUrl 保持 (UPDATE 時 SET 句不含)", async () => {
    await upsertService(db, svc({ slug: "a" }));
    await updateServiceMeta(db, "a", {
      iconUrl: "https://a.example/favicon.svg",
    });
    // admin が iconUrl 含む body で再 upsert (上書き試行)
    await upsertService(
      db,
      svc({ slug: "a", iconUrl: "https://hijacker.example/icon.png" }),
    );
    // 既存値保持 (UPDATE SET 句に iconUrl 含めない)
    expect((await getService(db, "a"))?.iconUrl).toBe(
      "https://a.example/favicon.svg",
    );
  });

  it("FP-U-32: 存在しない slug への updateServiceMeta → no-op (throw しない)", async () => {
    await expect(
      updateServiceMeta(db, "nonexistent", {
        iconUrl: "https://x.example/favicon.svg",
      }),
    ).resolves.toBeUndefined();
  });
});
