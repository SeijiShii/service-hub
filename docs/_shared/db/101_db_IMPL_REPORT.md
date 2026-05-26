# _shared/db 実装レポート (101)

**実装日**: 2026-05-26 / **コマンド**: /flow:tdd（/flow:auto Phase3 反復2）/ **状態**: 完了（GREEN）

## 実装ファイル（src/db/）
| ファイル | 内容 |
|---|---|
| schema.ts | Drizzle pg-core: usage_snapshots / alert_events / collection_runs + index + 冪等 unique index |
| client.ts | createDb(DATABASE_URL): neon-http drizzle（本番/preview） |
| queries.ts | upsertSnapshots(冪等)/recordRun/recordAlert/latestPerService(distinctOn)/timeseries/openAlerts/recentRuns |
| testdb.ts | pglite(in-memory Postgres) + drizzle のテスト用 DB（Docker 不要、offline 可） |
| index.ts | バレル |

## 設計反映
- 冪等 upsert: (service_slug, metric_key, captured_at) unique + onConflictDoUpdate(excluded.*)。
- latestPerService: DISTINCT ON で各(svc,metric)最新。timeseries: 複合 index 活用 + since フィルタ。
- 日時は型境界 ISO string ⇄ DB timestamptz を queries 層で変換（types 905 R2）。
- 追加 dep: drizzle-orm / @neondatabase/serverless（prod）, @electric-sql/pglite / drizzle-kit（dev）。

## 検証
- `npm run test`: 21 passed（db 8 + types 13）/ `npm run typecheck`: green。
- pglite DDL は client.exec（simple protocol）で適用（複数文対応）。
