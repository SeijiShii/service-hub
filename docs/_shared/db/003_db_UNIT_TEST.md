# _shared/db 単体テスト計画

> **入力**: `./001_db_SPEC.md`, `./002_db_PLAN.md`
> **最終更新**: 2026-05-26

---

## 1. テストケース一覧

> SQL を伴うため**結合テスト寄り**（ローカル Postgres / Neon ブランチ）。純変換ロジックは unit。

### 1.1 正常系
| ID | 対象 | 入力 | 期待 |
|---|---|---|---|
| DB-N1 | upsertSnapshots | 新規 SnapshotRow[] | 行が挿入される |
| DB-N2 | upsertSnapshots（冪等） | 同一(slug,key,captured_at)を2回 | 重複せず更新（1行） |
| DB-N3 | latestPerService | 複数時刻の snapshot | 各(slug,metric)の最新のみ返る |
| DB-N4 | timeseries | slug+metric+since | since 以降を時系列順で返す |
| DB-N5 | openAlerts | resolved/unresolved 混在 | unresolved のみ返る |
| DB-N6 | recordRun/recentRuns | run 複数 | 新しい順 limit 件 |

### 1.2 異常系
| ID | 対象 | 条件 | 期待 |
|---|---|---|---|
| DB-E1 | client | DATABASE_URL 不正 | 接続エラーを throw |
| DB-E2 | timeseries | 該当データなし | 空配列（throw しない） |

### 1.3 境界値
| ID | 対象 | 境界 | 期待 |
|---|---|---|---|
| DB-B1 | upsertSnapshots | 空配列 | no-op（エラーなし） |
| DB-B2 | latestPerService | 0 サービス | 空配列 |
| DB-B3 | timeseries | since が未来 | 空配列 |

## 2. Mock 方針
| 対象 | 方針 | 理由 |
|---|---|---|
| Postgres | **実 DB**（testcontainers Postgres or Neon ブランチ） | SQL の正しさは実 DB でしか検証できない |
| 時刻 | 固定 ISO 注入 | latest/timeseries の決定性 |
| uuid 生成 | seed/固定注入 | id の決定性 |

## 3. カバレッジ目標
| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | concept 継承 |
| 分岐 | 70% | concept 継承 |
| クエリ関数 | 全 7 関数に最低 1 正常 + 1 境界 | SPEC §1.2 網羅 |

## 4. 既存ユーティリティ依存
- `_shared/types`（SnapshotRow 等）
- Drizzle / @neondatabase/serverless

## 5. テスト実行環境
- フレームワーク: Vitest
- DB: testcontainers Postgres（CI）or Neon ブランチ（local、§4.5）
- 実行コマンド（例示）: `npm run test`（DB 起動を before hook で）

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成 | /flow:feature |
