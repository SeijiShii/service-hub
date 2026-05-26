# service-detail 単体テスト計画

> **入力**: `./001_service-detail_SPEC.md`, `./002_service-detail_PLAN.md`
> **最終更新**: 2026-05-26

---

## 1. テストケース一覧
### 1.1 正常系
| ID | 対象 | 入力(mock db) | 期待 |
|---|---|---|---|
| SD-N1 | detail | slug + 30日 timeseries | series 構築、メタ結合 |
| SD-N2 | detail | 複数メトリクス | metricKey ごとに series 分離 |
| SD-N3 | MetricChart | points[] | データ点数分の描画 |
### 1.2 異常系
| ID | 対象 | 条件 | 期待 |
|---|---|---|---|
| SD-E1 | detail | 不明 slug | 404 |
| SD-E2 | MetricChart | データなし | EmptyState |
### 1.3 境界値
| ID | 対象 | 境界 | 期待 |
|---|---|---|---|
| SD-B1 | detail | since 未来 | 空 series |
| SD-B2 | detail | 1 点のみ | 単点描画（線なし） |

## 2. Mock 方針
| 対象 | 方針 |
|---|---|
| db timeseries | mock 注入（固定 SnapshotRow 系列） |
| 認証 | auth mock |
| レンダリング | Testing Library（role/text、Recharts はデータ点数で検証） |

## 3. カバレッジ目標
| 種別 | 目標 |
|---|---|
| 行 | 80% |
| 分岐 | 70%（404/empty/期間境界） |

## 4. 既存ユーティリティ依存
db/registry/auth/types、Recharts、Testing Library。

## 5. テスト実行環境
Vitest + Testing Library。`npm run test`。

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成 | /flow:feature |
