import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import {
  services,
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
  ServiceDescriptor,
  ServiceStatus,
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

export async function serviceSnapshots(
  db: AnyDb,
  slug: string,
  sinceIso: string,
): Promise<SnapshotRow[]> {
  const rows = await db
    .select()
    .from(usageSnapshots)
    .where(
      and(
        eq(usageSnapshots.serviceSlug, slug),
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

export async function resolveAlert(db: AnyDb, id: string): Promise<void> {
  await db
    .update(alertEvents)
    .set({ resolvedAt: new Date() })
    .where(eq(alertEvents.id, id));
}

export async function markAlertNotified(db: AnyDb, id: string): Promise<void> {
  await db
    .update(alertEvents)
    .set({ notifiedAt: new Date() })
    .where(eq(alertEvents.id, id));
}

// ── services レジストリ (D20260528-001 DB SoT) ──────────────────────────

function toServiceDescriptor(
  r: typeof services.$inferSelect,
): ServiceDescriptor {
  return {
    slug: r.slug,
    name: r.name,
    url: r.url,
    subdomain: r.subdomain ?? undefined,
    status: r.status as ServiceStatus,
    providers: r.providers ?? {},
    serviceInfo: r.serviceInfo ?? undefined,
    thresholds: r.thresholds ?? undefined,
  };
}

/** レジストリ一覧。onlyActive で status=active のみ。 */
export async function listServices(
  db: AnyDb,
  opts: { onlyActive?: boolean } = {},
): Promise<ServiceDescriptor[]> {
  const rows = opts.onlyActive
    ? await db.select().from(services).where(eq(services.status, "active"))
    : await db.select().from(services);
  return rows
    .map(toServiceDescriptor)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export async function getService(
  db: AnyDb,
  slug: string,
): Promise<ServiceDescriptor | null> {
  const rows = await db.select().from(services).where(eq(services.slug, slug));
  return rows[0] ? toServiceDescriptor(rows[0]) : null;
}

/** 登録/更新。slug を一意キーに upsert (updated_at を更新)。 */
export async function upsertService(
  db: AnyDb,
  d: ServiceDescriptor,
): Promise<void> {
  const now = new Date();
  await db
    .insert(services)
    .values({
      slug: d.slug,
      name: d.name,
      url: d.url,
      subdomain: d.subdomain ?? null,
      status: d.status,
      providers: d.providers ?? {},
      serviceInfo: d.serviceInfo ?? null,
      thresholds: d.thresholds ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: services.slug,
      set: {
        name: sql`excluded.name`,
        url: sql`excluded.url`,
        subdomain: sql`excluded.subdomain`,
        status: sql`excluded.status`,
        providers: sql`excluded.providers`,
        serviceInfo: sql`excluded.service_info`,
        thresholds: sql`excluded.thresholds`,
        updatedAt: now,
      },
    });
}

/** status 変更 (retire / pause 等、論理削除に使う)。 */
export async function setServiceStatus(
  db: AnyDb,
  slug: string,
  status: ServiceStatus,
): Promise<void> {
  await db
    .update(services)
    .set({ status, updatedAt: new Date() })
    .where(eq(services.slug, slug));
}

/** 物理削除 (admin の ?hard=1 用)。既定は setServiceStatus(retired) を使う。 */
export async function deleteService(db: AnyDb, slug: string): Promise<void> {
  await db.delete(services).where(eq(services.slug, slug));
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
