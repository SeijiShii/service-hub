# 実装レポート: dashboard biz-charts (revenue-cost-profit)

## 実装日時
2026-05-30 19:15 (JST)

## モード
revise

## 関連ドキュメント
- [001_REVISE_SPEC.md](./001_REVISE_SPEC.md) / [002_REVISE_PLAN.md](./002_REVISE_PLAN.md) / [003_REVISE_UNIT_TEST.md](./003_REVISE_UNIT_TEST.md)
- [905_REVISE_SPEC_REVIEW.md](./905_REVISE_SPEC_REVIEW.md) (R1-R6)
- [AI_LOG](../../AI_LOG/D20260530_013_tdd_dashboard_revise_biz-charts.md)

## 変更一覧

### Phase 1: chart 定義分離 + label + 取得キー
- `src/features/dashboard/summary.ts`: `DASHBOARD_CHART_METRICS` を **`DASHBOARD_CHART_SOURCE_METRICS`(取得=mau/revenue_month_usd/ai_cost_month_usd)** と **`DASHBOARD_CHARTS`(4定義: {metricKey,label,unit,derived?})** に分離。`DashboardChart` 型に `label: string` 追加。VM/JSDoc 更新。
- `src/components/MetricChart.tsx`: `label?: string` prop 追加、見出し `{label ?? metricKey} ({unit})`（optional fallback、service-detail 互換 R2）。testid=`chart-${metricKey}` 維持。
- `src/features/dashboard/DashboardCharts.tsx`: `label={chart.label}` を MetricChart へ。JSDoc を 4 ビジネス chart に更新。
- `api/dashboard/summary.ts`: `recentSnapshots(db, sinceIso, [...DASHBOARD_CHART_SOURCE_METRICS])`（取得キーを mau/revenue/cost に。profit は派生で取得せず）。

### Phase 2: profitAt 共通化 + 採算(profit)派生
- `src/features/dashboard/profitability.ts`: **`profitAt(revenue, cost) = revenue − (cost ?? 0)` を export**（採算定義 SoT、R1）。`computeProfitability` の profit 算出を `profitAt` 呼び出しに置換。
- `src/features/dashboard/summary.ts buildCharts`: 採算 chart を派生合成。各 service で revenue 系列の各 capturedAt について cost を map lookup（無→0）し `profitAt` で profit 点を生成（revenue 起点、cost のみの時点は点なし）。
- テスト: summary.test（chart 4件/順序/label/profit 派生/採算=一覧列一致 BC-U-30）、DashboardCharts.test（4 chart + label）、DashboardView.test（charts helper 4件）、MetricChart.test（BC-U-04/12 label）、profitability.test（profitAt PA-1〜3）。

## 実装計画からの差分

| 項目 | 内容 |
|------|------|
| 計画にない追加変更 | なし |
| 計画から省略 | なし。論点-001 (profitAt共通化) は spec-review R1 で (a) 確定 → 実装済 |
| 想定外の問題と対処 | **既存 tsc エラー (queries.test.ts:223 TS2578) は本改修と無関係**（pre-session から存在、build=vite build で deploy 非ブロッカー）。本改修による新規 tsc エラー 0 |

## PR Description

### タイトル
dashboard: 上部チャートをビジネス指標化 (ユーザー数/課金額/コスト/採算)

### 概要
死活(UP/DOWN)は一覧 status 列が担うため chart 不要。上部チャートを `up`/`db_storage_bytes` から外し、ユーザー数(mau)/課金額(revenue)/コスト(cost)/採算(profit) の4枚（上から順、日本語ラベル）に転換。採算は revenue−cost の派生系列で、一覧「採算」列と同じ profitAt を共有。

### 変更内容
- chart 取得キーと定義を分離、4 ビジネス chart + 日本語ラベル
- profitAt 純関数で採算定義 SoT 化（チャート採算 = 一覧採算列）
- MetricChart label prop (optional、service-detail 互換)

### テスト
- 全 307/307 green（biz-charts 新規 10 含む）、新規 tsc エラー 0
