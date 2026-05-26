# リグレッションテスト計画: DB スキーマ push

> **入力**: `./001_ROOT_CAUSE.md`, `./002_FIX_PLAN.md`
> **最終更新**: 2026-05-26

## 1. 再発防止テストケース
### 1.1 直接原因を捉える確認（修正前 fail / 修正後 pass）
| ID | 対象 | 入力 | 期待 |
|---|---|---|---|
| DB-N1 | Neon スキーマ | `npm run db:push` 実行後 `pg_tables` | `usage_snapshots` / `alert_events` / `collection_runs` の 3 件存在 |
| DB-N2 | push 機構 | `package.json` | `db:push` script が存在し `drizzle-kit push` を起動 |

> 注: テーブル作成は drizzle-kit + 実 Neon の責務（drizzle 自体のロジックは再テストしない）。回帰防止の本体は「push 経路が存在し、実行で 3 テーブルが揃う」ことの smoke 確認。

## 2. 類似境界条件テスト
| ID | 境界 | 期待 |
|---|---|---|
| DB-B1 | 既存テーブルありで再 push | 冪等（差分のみ、データ破壊なし） |

## 3. 既存テスト維持確認
| ID | 既存テスト | 維持理由 |
|---|---|---|
| — | `src/db/queries.test.ts`（pglite 統合） | schema.ts 無変更、適用機構追加のみ |

## 4. Mock 方針
実 Neon に対する push は smoke（実接続）。ユニットは pglite 既存テストが担保。

## 5. カバレッジ目標
スキーマ定義は既存テストでカバー済。config はカバレッジ対象外（実行 smoke で担保）。

## 6. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版 | /flow:fix |
