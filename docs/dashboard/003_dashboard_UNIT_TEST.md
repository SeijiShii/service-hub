# dashboard 単体テスト計画

> **入力**: `./001_dashboard_SPEC.md`, `./002_dashboard_PLAN.md`
> **最終更新**: 2026-05-26

---

## 1. テストケース一覧
### 1.1 正常系
| ID | 対象 | 入力(mock db) | 期待 |
|---|---|---|---|
| DA-N1 | summary | 3 service の latest | descriptor×metrics 結合、行データ生成 |
| DA-N2 | summary | thresholds + 使用量 | 無料枠% 算出（80%+ で warn フラグ） |
| DA-N3 | ServiceRow | up service | StatusDot=up色+形状、mono メトリクス |
| DA-N4 | DashboardPage | 3 up 1 down | ヘッダ "3 up · 1 down"、down 行前景化 |
### 1.2 異常系
| ID | 対象 | 条件 | 期待 |
|---|---|---|---|
| DA-E1 | DashboardPage | データなし | EmptyState 表示 |
| DA-E2 | DashboardPage | 直近 run=failed | AlertBanner 表示 |
| DA-E3 | ServiceRow | メトリクス欠損 | `—` 表示、行は出る |
### 1.3 境界値
| ID | 対象 | 境界 | 期待 |
|---|---|---|---|
| DA-B1 | summary | 0 service | 空一覧 + EmptyState |
| DA-B2 | QuotaBar | 100%超 | down 色 |

## 2. Mock 方針
| 対象 | 方針 |
|---|---|
| db クエリ | mock（注入）で固定 SnapshotRow/AlertEvent |
| 認証 | auth mock（seiji 通過） |
| レンダリング | Testing Library（role/text ベース、class 名 assert 最小） |

## 3. カバレッジ目標
| 種別 | 目標 |
|---|---|
| 行 | 80% |
| 分岐 | 70%（up/down/warn/欠損/empty/failed） |

## 4. 既存ユーティリティ依存
db/registry/auth/types、共通 components、Testing Library。

## 5. テスト実行環境
Vitest + Testing Library（jsdom）。`npm run test`。

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成 | /flow:feature |
