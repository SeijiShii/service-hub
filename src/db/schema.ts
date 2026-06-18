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
  // summary-projection ([論点-011]/O48 v3、2026-06-10): producer 自己申告の showcase 用短文。
  // 書き込みは service-info adapter 経由のみ (iconUrl と同じ、admin write 不可)。公開 status API が露出。
  summary: text("summary"),
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

// feedback-inbox ([論点-007]/O67): 各サービスの GET /api/hub/feedback を pull して保存する
// consumer 行。id = `${serviceSlug}:${externalId}` 合成キー、(serviceSlug, externalId) で冪等 upsert。
// metrics (usage_snapshots) とは別責務 (spec-review R1) のため別テーブル。
export const feedbackItems = pgTable(
  "feedback_items",
  {
    id: text("id").primaryKey(),
    serviceSlug: text("service_slug").notNull(),
    externalId: text("external_id").notNull(),
    kind: text("kind").notNull(),
    body: text("body").notNull(),
    rating: doublePrecision("rating"),
    context: jsonb("context").$type<Record<string, unknown>>(),
    status: text("status"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    pulledAt: timestamp("pulled_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    // 横断一覧 (サービス別フィルタ + createdAt 降順) 用
    bySvcCreated: index("idx_feedback_svc_created").on(
      t.serviceSlug,
      t.createdAt,
    ),
    // upsert 冪等キー (producer item の取り込み重複吸収)
    uniqSvcExternal: uniqueIndex("uniq_feedback_svc_external").on(
      t.serviceSlug,
      t.externalId,
    ),
  }),
);

export const schema = {
  services,
  usageSnapshots,
  alertEvents,
  collectionRuns,
  feedbackItems,
};
export type Schema = typeof schema;
