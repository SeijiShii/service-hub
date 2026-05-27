import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "./testdb.js";
import {
  listServices,
  getService,
  upsertService,
  setServiceStatus,
  deleteService,
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
    await upsertService(db, svc({ serviceInfo: undefined, thresholds: undefined }));
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
