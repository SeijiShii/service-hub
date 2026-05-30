# 単体テストレポート: dashboard biz-charts

## 実施日時
2026-05-30 19:15 (JST)

## 関連ドキュメント
- [003_REVISE_UNIT_TEST.md](./003_REVISE_UNIT_TEST.md)

## テスト実行環境
- Vitest 2.1.9 + @testing-library/react + jsdom

## テスト結果 (biz-charts 関連)

| # | テストケース | ファイル | 結果 |
|---|------------|---------|------|
| BC-U-01 | charts 4 件・順序 [mau,revenue,cost,profit]・日本語 label | summary.test.ts | ✅ |
| BC-U-02 | 採算 = revenue−cost 派生系列 | summary.test.ts | ✅ |
| BC-U-03 | cost 欠落時点 → profit=revenue (0扱い) | summary.test.ts | ✅ |
| BC-U-10 | revenue 無し/cost のみ → profit 点なし | summary.test.ts | ✅ |
| BC-U-11 | 全欠落 → 4 charts、points=[] | summary.test.ts | ✅ |
| BC-U-13 | 1 service のみ → 全 service series (なし側 []) | summary.test.ts | ✅ |
| BC-U-20 | revenue=0,cost=5 → profit=-5 | summary.test.ts | ✅ |
| BC-U-21 | capturedAt ずれ → revenue 起点・cost無→0 | summary.test.ts | ✅ |
| BC-U-30 | 採算チャート最新点 = 一覧採算列 (R1 一致) | summary.test.ts | ✅ |
| BC-U-51 | up/db_storage_bytes 非対象 → chart 不在 | summary.test.ts | ✅ |
| BC-U-61 | 0 service → 4 charts、series=[] | summary.test.ts | ✅ |
| TS-M-03 (修正) | charts 後方互換 4 件 | summary.test.ts | ✅ |
| BC-U-05 | 4 chart render + 日本語 label、旧 chart 不在 | DashboardCharts.test.tsx | ✅ |
| TS-U-32 (修正) | 空 chart 4 件 + データなし | DashboardCharts.test.tsx | ✅ |
| BC-U-04 | MetricChart label 指定 → 見出し label | MetricChart.test.tsx | ✅ |
| BC-U-12 | MetricChart label 未指定 → metricKey fallback | MetricChart.test.tsx | ✅ |
| PA-1〜3 | profitAt 純関数 (40 / 50 / -5) | profitability.test.ts | ✅ |
| (helper) | DashboardView charts helper 4 件化 | DashboardView.test.tsx | ✅ |

## 追加テストケース
| # | 対象 | 追加理由 |
|---|------|---------|
| BC-U-01〜61, BC-U-30 | summary buildCharts | 4 chart 構成 + profit 派生 + 採算一致 |
| BC-U-04/12 | MetricChart label | label prop + fallback |
| PA-1〜3 | profitAt | 採算定義 SoT 純関数 |

## サマリー

| 項目 | 値 |
|------|-----|
| dashboard 機能テスト | 63 |
| 全スイート合計 | 307 |
| 成功 | 307 |
| 失敗 | 0 |
| 成功率 | 100% |
| 新規 tsc エラー | 0 (queries.test.ts TS2578 は本改修前から存在、deploy 非ブロッカー) |
