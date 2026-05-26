import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "./testdb.js";
import {
  upsertSnapshots, recordRun, recordAlert, latestPerService, timeseries, openAlerts, recentRuns, serviceSnapshots,
  type AnyDb,
} from "./queries.js";
import type { SnapshotRow, AlertEvent, CollectionRun } from "../types/index.js";

let db: AnyDb;
beforeEach(async () => { db = await createTestDb(); });

const snap = (over: Partial<SnapshotRow>): SnapshotRow => ({
  id: crypto.randomUUID(), serviceSlug: "svc-a", provider: "ping",
  metricKey: "up", metricValue: 1, unit: "bool", capturedAt: "2026-05-26T00:00:00.000Z",
  ...over,
});

describe("upsertSnapshots", () => {
  it("DB-N1: inserts rows", async () => {
    await upsertSnapshots(db, [snap({}), snap({ serviceSlug: "svc-b" })]);
    expect(await latestPerService(db)).toHaveLength(2);
  });
  it("DB-N2/B2: idempotent on (slug,metric,captured_at)", async () => {
    const at = "2026-05-26T01:00:00.000Z";
    await upsertSnapshots(db, [snap({ capturedAt: at, metricValue: 1 })]);
    await upsertSnapshots(db, [snap({ capturedAt: at, metricValue: 2 })]);
    const rows = await latestPerService(db);
    expect(rows).toHaveLength(1);
    expect(rows[0].metricValue).toBe(2); // 更新された
  });
  it("DB-B1: empty array is no-op", async () => {
    await upsertSnapshots(db, []);
    expect(await latestPerService(db)).toEqual([]);
  });
});

describe("latestPerService", () => {
  it("DB-N3: returns latest per (service,metric)", async () => {
    await upsertSnapshots(db, [
      snap({ capturedAt: "2026-05-26T00:00:00.000Z", metricValue: 1 }),
      snap({ capturedAt: "2026-05-26T02:00:00.000Z", metricValue: 5 }),
      snap({ metricKey: "mau", metricValue: 42, unit: "count" }),
    ]);
    const rows = await latestPerService(db);
    const up = rows.find((r) => r.metricKey === "up");
    expect(up?.metricValue).toBe(5); // 最新
    expect(rows.find((r) => r.metricKey === "mau")?.metricValue).toBe(42);
  });
});

describe("timeseries", () => {
  it("DB-N4: returns since-filtered ascending", async () => {
    await upsertSnapshots(db, [
      snap({ capturedAt: "2026-05-20T00:00:00.000Z", metricValue: 1 }),
      snap({ capturedAt: "2026-05-25T00:00:00.000Z", metricValue: 2 }),
      snap({ capturedAt: "2026-05-26T00:00:00.000Z", metricValue: 3 }),
    ]);
    const ts = await timeseries(db, "svc-a", "up", "2026-05-24T00:00:00.000Z");
    expect(ts.map((r) => r.metricValue)).toEqual([2, 3]);
  });
  it("DB-E2/B3: no data / future since → empty", async () => {
    expect(await timeseries(db, "svc-a", "up", "2026-05-01T00:00:00.000Z")).toEqual([]);
  });
});

describe("alerts & runs", () => {
  it("DB-N5: openAlerts returns only unresolved", async () => {
    const base: AlertEvent = { id: "", serviceSlug: "svc-a", provider: "ping", rule: "down", triggeredAt: "2026-05-26T00:00:00.000Z", value: 0 };
    await recordAlert(db, { ...base, id: crypto.randomUUID() });
    await recordAlert(db, { ...base, id: crypto.randomUUID(), resolvedAt: "2026-05-26T01:00:00.000Z" });
    const open = await openAlerts(db);
    expect(open).toHaveLength(1);
    expect(open[0].resolvedAt).toBeUndefined();
  });
  it("DB-N6: recentRuns newest first, limited", async () => {
    const mk = (id: string, started: string, status: CollectionRun["status"]): CollectionRun =>
      ({ id, startedAt: started, status, servicesCount: 1 });
    await recordRun(db, mk("r1", "2026-05-26T00:00:00.000Z", "ok"));
    await recordRun(db, mk("r2", "2026-05-26T02:00:00.000Z", "partial"));
    const runs = await recentRuns(db, 1);
    expect(runs).toHaveLength(1);
    expect(runs[0].id).toBe("r2");
    expect(runs[0].status).toBe("partial");
  });
});

describe("serviceSnapshots", () => {
  it("returns all metrics for a slug since", async () => {
    await upsertSnapshots(db, [
      snap({ serviceSlug: "a", metricKey: "up", metricValue: 1 }),
      snap({ serviceSlug: "a", metricKey: "mau", metricValue: 42, unit: "count" }),
      snap({ serviceSlug: "b", metricKey: "up", metricValue: 1 }),
    ]);
    const rows = await serviceSnapshots(db, "a", "2026-05-01T00:00:00.000Z");
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.serviceSlug === "a")).toBe(true);
  });
});
