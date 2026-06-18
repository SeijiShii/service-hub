import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { schema } from "./schema.js";
import type { AnyDb } from "./queries.js";

const DDL = `
  CREATE TABLE services (
    slug text PRIMARY KEY, name text NOT NULL, url text NOT NULL, subdomain text,
    status text NOT NULL DEFAULT 'active', providers jsonb, service_info jsonb, thresholds jsonb,
    icon_url text,
    summary text,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE usage_snapshots (
    id text PRIMARY KEY, service_slug text NOT NULL, provider text NOT NULL,
    metric_key text NOT NULL, metric_value double precision NOT NULL, unit text NOT NULL,
    captured_at timestamptz NOT NULL, raw_json jsonb
  );
  CREATE UNIQUE INDEX uniq_snap_svc_metric_time ON usage_snapshots (service_slug, metric_key, captured_at);
  CREATE INDEX idx_snap_svc_metric_time ON usage_snapshots (service_slug, metric_key, captured_at);
  CREATE TABLE alert_events (
    id text PRIMARY KEY, service_slug text NOT NULL, provider text NOT NULL, rule text NOT NULL,
    triggered_at timestamptz NOT NULL, value double precision NOT NULL,
    notified_at timestamptz, resolved_at timestamptz
  );
  CREATE INDEX idx_alert_svc ON alert_events (service_slug);
  CREATE TABLE collection_runs (
    id text PRIMARY KEY, started_at timestamptz NOT NULL, finished_at timestamptz,
    status text NOT NULL, services_count integer NOT NULL, errors_json jsonb
  );
`;

/** テスト用: in-memory pglite + drizzle。DDL は schema.ts と一致させる。 */
export async function createTestDb(): Promise<AnyDb> {
  const client = new PGlite();
  await client.exec(DDL); // simple protocol = 複数文 OK
  return drizzle(client, { schema }) as unknown as AnyDb;
}
