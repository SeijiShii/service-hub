import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import {
  usageSnapshots,
  alertEvents,
  collectionRuns,
  type Schema,
} from "./schema.js";
import type {
  SnapshotRow,
  AlertEvent,
  CollectionRun,
  ProviderKind,
  MetricKey,
  CollectionStatus,
} from "../types/index.js";

/** neon-http / pglite いずれの drizzle インスタンスも受ける。 */
export type AnyDb = PgDatabase<any, Schema, any>;

const iso = (d: Date | null): string | undefined =>
  d ? d.toISOString() : undefined;

function toSnapshotRow(r: typeof usageSnapshots.$inferSelect): SnapshotRow {
  return {
    id: r.id,
    serviceSlug: r.serviceSlug,
    provider: r.provider as ProviderKind,
    metricKey: r.metricKey as MetricKey,
    metricValue: r.metricValue,
    unit: r.unit,
    capturedAt: r.capturedAt.toISOString(),
    rawJson: r.rawJson ?? undefined,
  };
}

/** 収集結果を保存。(service,metric,captured_at) で冪等 upsert。 */
export async function upsertSnapshots(
  db: AnyDb,
  rows: SnapshotRow[],
): Promise<void> {
  if (rows.length === 0) return;
  await db
    .insert(usageSnapshots)
    .values(
      rows.map((r) => ({
        id: r.id,
        serviceSlug: r.serviceSlug,
        provider: r.provider,
        metricKey: r.metricKey,
        metricValue: r.metricValue,
        unit: r.unit,
        capturedAt: new Date(r.capturedAt),
        rawJson: r.rawJson ?? null,
      })),
    )
    .onConflictDoUpdate({
      target: [
        usageSnapshots.serviceSlug,
        usageSnapshots.metricKey,
        usageSnapshots.capturedAt,
      ],
      set: {
        metricValue: sql`excluded.metric_value`,
        unit: sql`excluded.unit`,
        rawJson: sql`excluded.raw_json`,
      },
    });
}

export async function recordRun(db: AnyDb, run: CollectionRun): Promise<void> {
  await db
    .insert(collectionRuns)
    .values({
      id: run.id,
      startedAt: new Date(run.startedAt),
      finishedAt: run.finishedAt ? new Date(run.finishedAt) : null,
      status: run.status,
      servicesCount: run.servicesCount,
      errorsJson: run.errors ?? null,
    })
    .onConflictDoUpdate({
      target: collectionRuns.id,
      set: {
        finishedAt: collectionRuns.finishedAt,
        status: collectionRuns.status,
      },
    });
}

export async function recordAlert(db: AnyDb, ev: AlertEvent): Promise<void> {
  await db
    .insert(alertEvents)
    .values({
      id: ev.id,
      serviceSlug: ev.serviceSlug,
      provider: ev.provider,
      rule: ev.rule,
      triggeredAt: new Date(ev.triggeredAt),
      value: ev.value,
      notifiedAt: ev.notifiedAt ? new Date(ev.notifiedAt) : null,
      resolvedAt: ev.resolvedAt ? new Date(ev.resolvedAt) : null,
    })
    .onConflictDoNothing();
}

/** 各 (service, metric) の最新スナップショット。 */
export async function latestPerService(db: AnyDb): Promise<SnapshotRow[]> {
  const rows = await db
    .selectDistinctOn([usageSnapshots.serviceSlug, usageSnapshots.metricKey])
    .from(usageSnapshots)
    .orderBy(
      usageSnapshots.serviceSlug,
      usageSnapshots.metricKey,
      desc(usageSnapshots.capturedAt),
    );
  return rows.map(toSnapshotRow);
}

export async function timeseries(
  db: AnyDb,
  slug: string,
  metricKey: MetricKey,
  sinceIso: string,
): Promise<SnapshotRow[]> {
  const rows = await db
    .select()
    .from(usageSnapshots)
    .where(
      and(
        eq(usageSnapshots.serviceSlug, slug),
        eq(usageSnapshots.metricKey, metricKey),
        gte(usageSnapshots.capturedAt, new Date(sinceIso)),
      ),
    )
    .orderBy(usageSnapshots.capturedAt);
  return rows.map(toSnapshotRow);
}

export async function openAlerts(db: AnyDb): Promise<AlertEvent[]> {
  const rows = await db
    .select()
    .from(alertEvents)
    .where(isNull(alertEvents.resolvedAt));
  return rows.map((r) => ({
    id: r.id,
    serviceSlug: r.serviceSlug,
    provider: r.provider as ProviderKind,
    rule: r.rule,
    triggeredAt: r.triggeredAt.toISOString(),
    value: r.value,
    notifiedAt: iso(r.notifiedAt),
    resolvedAt: iso(r.resolvedAt),
  }));
}

export async function recentRuns(
  db: AnyDb,
  limit: number,
): Promise<CollectionRun[]> {
  const rows = await db
    .select()
    .from(collectionRuns)
    .orderBy(desc(collectionRuns.startedAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    startedAt: r.startedAt.toISOString(),
    finishedAt: iso(r.finishedAt),
    status: r.status as CollectionStatus,
    servicesCount: r.servicesCount,
    errors: (r.errorsJson as CollectionRun["errors"]) ?? undefined,
  }));
}
