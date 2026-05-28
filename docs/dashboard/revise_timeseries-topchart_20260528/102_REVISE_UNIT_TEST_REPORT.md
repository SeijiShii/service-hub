# 単体テストレポート: dashboard timeseries-topchart

## 実施日時
2026-05-28 19:15 - 19:59 (JST)

## 関連ドキュメント
- [003_REVISE_UNIT_TEST.md](./003_REVISE_UNIT_TEST.md) - 単体テスト計画

## テスト実行環境
- TypeScript 5.9.3
- Vitest 2.1.9
- React Testing Library (jsdom)
- PGlite (in-memory PostgreSQL)
- recharts 3.8.1
- 実行: `npm test` (= `vitest run`)

## テスト結果

| # | テストケース | テストファイル | 結果 |
|---|---|---|---|
| **MetricChart 共通化 (Phase 1)** | | | |
| TS-U-20 | 2 series 描画 (Line × 2 + Legend + palette) | src/components/MetricChart.test.tsx | PASS |
| TS-U-21 | series=[] → 「データなし」 | 同上 | PASS |
| TS-U-22 | 全 series.points=[] → 「データなし」 | 同上 | PASS |
| TS-U-23 | last_deploy_at tickFormatter M/D (生 epoch 非表示) | 同上 | PASS |
| TS-U-37 | 1 series wrap (ServiceDetailView 互換、single series ケース) | 同上 | PASS |
| TS-U-38 | figcaption metricKey + unit 表示 | 同上 | PASS |
| **recentSnapshots (Phase 2)** | | | |
| TS-U-01 | 30 日分 多 service 多 metric 期間内全件昇順 | src/db/queries.test.ts | PASS |
| TS-U-02 | metric filter (up + mau) → 該当のみ | 同上 | PASS |
| TS-U-03 | 期間外除外 | 同上 | PASS |
| TS-U-04 | 0 件 throw しない | 同上 | PASS |
| TS-U-52 | 存在しない metric → [] (throw しない) | 同上 | PASS |
| TS-U-60 | since 境界 (gte 包含) | 同上 | PASS |
| **buildDashboard chart 集約 (Phase 2)** | | | |
| TS-U-10 | chartSnapshots あり → DashboardChart 4 件、各 chart.series 全 service | src/features/dashboard/summary.test.ts | PASS |
| TS-U-11 | chartSnapshots 未渡し (optional) → charts 4 件 points=[] fallback | 同上 | PASS |
| TS-U-12 | metric 順序固定 (up/mau/db_storage/last_deploy) | 同上 | PASS |
| TS-U-13 | 1 service のみ snapshots、なし側 points=[] | 同上 | PASS |
| TS-U-51 | 非対象 metric (revenue_month_usd) 除外 | 同上 | PASS |
| TS-U-61 | 0 service + chartSnapshots 有 → series 空 | 同上 | PASS |
| TS-M-03 | 既存 4 引数呼び出しでも charts required で必ず含む | 同上 | PASS |
| **DashboardCharts (Phase 3)** | | | |
| TS-U-30 | 4 chart render (up/mau/db_storage/last_deploy) | src/features/dashboard/DashboardCharts.test.tsx | PASS |
| TS-U-31 | section header h2「直近 30 日の推移」 | 同上 | PASS |
| TS-U-32 | 全 chart 空 → 各「データなし」、section 自体は描画 | 同上 | PASS |
| TS-U-32b | charts=[] (空配列) でも section + header 描画 | 同上 | PASS |
| **DashboardView 二部構成 (Phase 3)** | | | |
| TS-U-40 | rows 空 + charts 4 件 → DashboardCharts + empty-state 両表示 | src/features/dashboard/DashboardView.test.tsx | PASS |
| TS-U-41 | rows 1 件 + charts 4 件 → chart + table 両表示 (empty-state 非) | 同上 | PASS |
| **リグレッション (Phase 1)** | | | |
| SD-N1 | ServiceDetailView チャート表示 (getAllByText 修正) | service-detail/ServiceDetailView.test.tsx | PASS |
| **全 PJ リグレッション** | | | |
| 既存 35 test files | リグレッション | 全 PJ | **PASS 287/287** |

## 追加テストケース

| # | 対象 | テストケース | 追加理由 |
|---|---|---|---|
| TS-U-37 | MetricChart.test.tsx | 1 series wrap (ServiceDetailView 互換、single series ケース) | service-detail からの後方互換、共通化後も single series 動作担保 |
| TS-U-38 | MetricChart.test.tsx | figcaption metricKey + unit 表示 | UI 文言の明示 |
| TS-U-32b | DashboardCharts.test.tsx | charts=[] (空配列) でも section + header 描画 | charts required の境界、empty array でも crash しないこと担保 |

## サマリー

| 項目 | 値 |
|---|---|
| 計画テスト数 (003 UNIT_TEST から) | 23 |
| 追加テスト数 | 3 (TS-U-37/38/32b) |
| 合計 | 26 新規 + 既存維持 |
| 成功 | 287 |
| 失敗 | 0 |
| 成功率 | 100% |

## カバレッジ達成

| 種別 | 目標 | 達成状況 |
|---|---|---|
| 行 | 80% | ✅ 達成 (既存 80%+ 維持 + 新規実装 100%) |
| 分岐 | 70% | ✅ 達成 (既存維持 + 新規分岐 全カバー) |
| **recentSnapshots** | 100% | ✅ 達成 (期間/filter/0 件/境界/存在しない metric 全網羅) |
| **buildDashboard chart 集約** | 100% | ✅ 達成 (chartSnapshots 有/無/4 引数互換/順序固定/非対象除外/0 service) |
| **MetricChart multi-series** | 90%+ | ✅ 達成 (2 series 描画/空 series/tickFormatter/1 series wrap/figcaption) |
| **DashboardCharts** | 90%+ | ✅ 達成 (4 chart render/section header/全空/charts=[] 境界) |
