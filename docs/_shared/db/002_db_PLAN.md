# _shared/db 実装計画書

> **入力**: `./001_db_SPEC.md`, `../types/`, `../../concept.md` §4.3
> **最終更新**: 2026-05-26

---

## 1. 実装対象ファイル一覧（src/db/）

| ファイル | 責務 | 依存 | LOC 見積 |
|---|---|---|---|
| `src/db/schema.ts` | Drizzle テーブル定義（usage_snapshots/alert_events/collection_runs）+ index | types | ~90 |
| `src/db/client.ts` | Neon client + drizzle 初期化（DATABASE_URL） | schema | ~20 |
| `src/db/queries.ts` | upsertSnapshots/recordRun/recordAlert/latestPerService/timeseries/openAlerts/recentRuns | schema, client, types | ~120 |
| `src/db/index.ts` | バレル | 上記 | ~5 |
| `drizzle.config.ts` | マイグレーション設定（出力先 migrations/） | — | ~15 |
| `migrations/0000_init.sql` | 初期マイグレーション（drizzle-kit 生成物） | schema | (生成) |

## 2. 実装 Phase 分割（/flow:tdd）

### Phase 1 (RED→GREEN→IMPROVE): スキーマ + クライアント
- 対象: schema.ts, client.ts, drizzle.config.ts
- テスト: スキーマ定義の型整合（types と一致）、マイグレーション生成（drizzle-kit generate）
- ゴール: マイグレーションが通り、型が _shared/types と一致

### Phase 2: クエリ関数（mock/実 DB）
- 対象: queries.ts
- テスト: 各関数を **ローカル Postgres（Docker）or Neon ブランチ**で結合テスト。upsert 冪等性 / latestPerService の正しさ / timeseries の範囲フィルタ / openAlerts 部分インデックス。
- mock 方針: 純ロジックは mock、SQL は実 DB（testcontainers or Neon ブランチ）で検証（§4.5 ハイブリッド）。

## 3. 依存関係順序
```
types → schema.ts → client.ts → queries.ts → index.ts
```

## 4. 既存ファイルへの影響
- `_shared/types` を import（被依存ではなく依存）。types は変更不要。
- scaffold: types の tdd で tsconfig/vitest 初期化済の想定。db は drizzle-kit + DB 接続を追加。

## 5. 横断フォルダへの追加・変更
本フォルダが永続化基盤。collection/dashboard/service-detail/alerts が queries を利用。

## 6. リスク・注意点
- **upsert 冪等性**: `(service_slug, metric_key, captured_at)` のユニーク制約 + onConflict。captured_at の粒度（収集ごとに同一値か）に注意。
- **timestamptz の扱い**: 型境界は ISO string（types 905 R2）、DB は timestamptz。変換を client/queries 層で統一。
- **DATABASE_URL 秘匿**: .env のみ（O25）。
- **ローカル DB**: §4.5 ハイブリッド（Neon ブランチ or Docker Postgres）。CI は testcontainers or Neon ブランチ。

## 7. 完了の定義（DoD）
- [ ] Phase 1-2 完了、マイグレーション適用可能
- [ ] queries の結合テスト green（upsert 冪等 / latest / timeseries / openAlerts）
- [ ] 型が _shared/types と一致（typecheck green）
- [ ] E2E: 対象外（cross-cutting、利用側 feature でカバー）

## 8. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成 | /flow:feature |
