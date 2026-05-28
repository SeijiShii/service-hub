# collection 単体テスト計画（15 分 cron + 最終更新表示）

> **入力**: 001/002, 既存 `src/features/dashboard/summary.test.ts` / `DashboardView.test.tsx`
> **最終更新**: 2026-05-28

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待 |
|---|---|---|---|
| RC-N1 | `buildDashboard` VM | services + latest + alerts + run (status=ok, finishedAt) | VM に `lastUpdatedAt` = ISO 文字列 / `lastRunStatus="ok"` |
| RC-N2 | `DashboardView` | VM に `lastUpdatedAt` を渡す | DOM に「最終更新: YYYY-MM-DD HH:MM」または相対時間が表示される |
| RC-N3 | `DashboardView` 相対時間 | finishedAt = 7 分前 | 「7 分前」相当の表示 |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待 |
|---|---|---|---|
| RC-E1 | VM (run 無し) | recentRuns が空 | `lastUpdatedAt=null` / View で「未収集」表示 |
| RC-E2 | run status=failed | run.status=failed | View で警告色 + status 表示 |

### 1.3 境界値
| ID | 対象 | 境界 | 期待 |
|---|---|---|---|
| RC-B1 | finishedAt が null（実行中） | run.finishedAt=null だが startedAt あり | startedAt を表示 + 「実行中」など |

## 2. 修正テストケース
| ID | 対象 | 修正前 | 修正後 |
|---|---|---|---|
| M-01 | 既存 buildDashboard テスト | run 無視 / VM フィールド固定 | run を渡して `lastUpdatedAt` / `lastRunStatus` を期待 |

## 3. 削除テストケース
なし。

## 4. リグレッション強化
- 既存ダッシュボードの services 一覧表示・最新 snapshot 表示は不変。
- `api/cron/collect.ts` は変更なし（既存テスト維持）。

## 5. Mock 方針差分
| 対象 | 前回 | 今回 | 理由 |
|---|---|---|---|
| time | 固定なし | `vi.setSystemTime` 等で相対時間（xx 分前）の決定的テスト | 「7 分前」のような表示テストに必要 |

## 6. カバレッジ目標
| 種別 | 目標 |
|---|---|
| 行 | 80% / 分岐 70%（既存継承） |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 | /flow:revise |
