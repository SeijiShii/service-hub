import {
  pgTable,
  text,
  doublePrecision,
  timestamp,
  jsonb,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type {
  ProviderRefs,
  ServiceInfoRef,
  Thresholds,
} from "../types/index.js";

// レジストリ SoT (D20260528-001、旧 services.toml から移行)。
// シークレットは保持しない (D20260528-002)。providers/serviceInfo/thresholds は jsonb。
export const services = pgTable("services", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  subdomain: text("subdomain"),
  status: text("status").notNull().default("active"),
  providers: jsonb("providers").$type<ProviderRefs>(),
  serviceInfo: jsonb("service_info").$type<ServiceInfoRef>(),
  thresholds: jsonb("thresholds").$type<Thresholds>(),
  // favicon-projection (revise_favicon-projection_20260528): producer 自己申告の favicon 絶対 URL。
  // 書き込みは service-info adapter 経由のみ (admin write 不可、SoT 一貫性、spec-review R2)。
  iconUrl: text("icon_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

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
      t.serviceSlug,
      t.metricKey,
      t.capturedAt,
    ),
    // upsert 冪等キー
    uniqSnap: uniqueIndex("uniq_snap_svc_metric_time").on(
      t.serviceSlug,
      t.metricKey,
      t.capturedAt,
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

export const schema = { services, usageSnapshots, alertEvents, collectionRuns };
export type Schema = typeof schema;
