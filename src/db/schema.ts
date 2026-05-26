import {
  pgTable, text, doublePrecision, timestamp, jsonb, integer, index, uniqueIndex,
} from "drizzle-orm/pg-core";

export const usageSnapshots = pgTable(
  "usage_snapshots",
  {
    id: text("id").primaryKey(),
    serviceSlug: text("service_slug").notNull(),
    provider: text("provider").notNull(),
    metricKey: text("metric_key").notNull(),
    metricValue: doublePrecision("metric_value").notNull(),
    unit: text("unit").notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    rawJson: jsonb("raw_json"),
  },
  (t) => ({
    // 個別サービスの時系列クエリ用
    byServiceMetricTime: index("idx_snap_svc_metric_time").on(
      t.serviceSlug, t.metricKey, t.capturedAt,
    ),
    // upsert 冪等キー
    uniqSnap: uniqueIndex("uniq_snap_svc_metric_time").on(
      t.serviceSlug, t.metricKey, t.capturedAt,
    ),
  }),
);

export const alertEvents = pgTable(
  "alert_events",
  {
    id: text("id").primaryKey(),
    serviceSlug: text("service_slug").notNull(),
    provider: text("provider").notNull(),
    rule: text("rule").notNull(),
    triggeredAt: timestamp("triggered_at", { withTimezone: true }).notNull(),
    value: doublePrecision("value").notNull(),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => ({ bySvc: index("idx_alert_svc").on(t.serviceSlug) }),
);

export const collectionRuns = pgTable("collection_runs", {
  id: text("id").primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: text("status").notNull(),
  servicesCount: integer("services_count").notNull(),
  errorsJson: jsonb("errors_json"),
});

export const schema = { usageSnapshots, alertEvents, collectionRuns };
export type Schema = typeof schema;
