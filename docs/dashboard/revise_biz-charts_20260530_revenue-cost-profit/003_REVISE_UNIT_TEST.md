# dashboard 単体テスト計画（上部チャートをビジネス指標化）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, Step 2 で読んだ既存テスト
> **最終更新**: 2026-05-30

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| BC-U-01 | `buildCharts` | revenue/cost/mau snapshots あり | charts = 4 件、順序 = [mau, revenue_month_usd, ai_cost_month_usd, profit]、各 label = ユーザー数/課金額/コスト/採算 |
| BC-U-02 | `buildCharts` profit 派生 | service a: revenue 50@t1/80@t2, cost 10@t1/30@t2 | profit chart の a 系列 = [{t1,40},{t2,50}] |
| BC-U-03 | `buildCharts` cost 欠落 | revenue 50@t1, cost なし | profit a 系列 = [{t1,50}]（cost=0 扱い） |
| BC-U-04 | `MetricChart` label | `label="課金額"` | 見出しに「課金額」表示 |
| BC-U-05 | `DashboardCharts` | charts 4 件 | chart-mau/chart-revenue_month_usd/chart-ai_cost_month_usd/chart-profit が render、各日本語 label |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待振る舞い |
|---|---|---|---|
| BC-U-10 | `buildCharts` profit | revenue 無し / cost のみ (cost 20@t1) | profit a 系列に t1 点を作らない（revenue 起点） |
| BC-U-11 | `buildCharts` | revenue/cost/mau 全欠落 | charts 4 件、各 series points=[]（データなし fallback） |
| BC-U-12 | `MetricChart` label | `label` 未指定 (service-detail 互換) | 見出し = metricKey fallback（従来挙動） |

### 1.3 境界値
| ID | 対象 | 境界 | 期待振る舞い |
|---|---|---|---|
| BC-U-20 | `buildCharts` profit | revenue=0, cost=5 @t1 | profit a 系列 = [{t1,-5}]（revenue=0 でも点を作る、0−5） |
| BC-U-21 | `buildCharts` | revenue capturedAt と cost capturedAt がずれる | revenue の capturedAt 基準、対応 cost 無し→0 |

## 2. 修正テストケース

| ID | 対象 | 修正前 | 修正後 | 理由 |
|---|---|---|---|---|
| TS-U-30 (DashboardCharts.test) | 3 chart (up/mau/db_storage_bytes) | **4 chart (mau/revenue/cost/profit)** + label 検証、chart-up/chart-db_storage_bytes 不在 assert | chart 入替 |
| TS-U-32 (DashboardCharts.test) | 空 chart 3 件 (up/mau/db_storage_bytes) | 空 chart 4 件 (mau/revenue/cost/profit) | 同上 |
| summary.test charts 件数 | `toHaveLength(3)` + metricKey [up,mau,db_storage_bytes] | `toHaveLength(4)` + [mau,revenue_month_usd,ai_cost_month_usd,profit] | chart 定義変更 |
| summary.test TS-U-12 (順序) | [up, mau, db_storage_bytes] | [mau, revenue_month_usd, ai_cost_month_usd, profit] | 順序変更 |
| DashboardView.test charts helper | 3 件 (up/mau/db_storage_bytes) | 4 件 (mau/revenue/cost/profit、label 付き) | helper 更新 |
| MetricChart.test 見出し | `{metricKey} ({unit})` 検証 | label 指定時は label、未指定時 metricKey fallback | label prop 追加 |

## 3. 削除テストケース
| ID | 対象 | 削除理由 |
|---|---|---|
| （chart-up / chart-db_storage_bytes の個別アサーション行） | chart から除外（収集・一覧テストは維持） |

## 4. リグレッション強化
- `up` の latestPerService 取得・一覧 status 列（rowStatusKind が row.up 由来）が**不変**であることを確認（chart 除外と独立）。
- `db_storage_bytes` の収集が不変（chart から外すだけ）。
- service-detail の MetricChart（label 未指定）が従来通り metricKey 見出しで render（BC-U-12）。
- 既存 chart の空 fallback・tickFormatter が不変。
- profitability.ts `computeProfitability`（最新値 profit）が不変（論点-001 で profitAt 共通化する場合も既存挙動維持）。

## 5. Mock 方針差分
| 対象 | 前回 | 今回 | 理由 |
|---|---|---|---|
| snapshot fixture | up/mau/db_storage_bytes 中心 | revenue_month_usd/ai_cost_month_usd/mau を時系列で | profit 派生検証に revenue/cost の複数 capturedAt が必要 |

## 6. カバレッジ目標
| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | 既存継承（profit 派生分岐を網羅） |
| 分岐 | 70% | 既存継承（cost 欠落 / revenue 無し / capturedAt ずれ） |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-30 | 初版作成 | /flow:revise |
