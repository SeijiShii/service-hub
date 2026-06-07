# 単体テストレポート: dashboard chart-ux

## 実施日時
2026-06-08 (JST)

## 関連ドキュメント
- [003_REVISE_UNIT_TEST.md](./003_REVISE_UNIT_TEST.md) — 単体テスト計画

## テスト実行環境
- ランタイム: Node.js + jsdom (環境)
- テストフレームワーク: vitest 2.1.9 + @testing-library/react

## テスト結果

| # | テストケース | テストファイル | 結果 | 備考 |
|---|------------|-------------|------|------|
| BC-U-01 | charts=2件 [mau, revenue_total_yen] + usd系/profit 不在 | summary.test.ts | ✅ | Phase 1 |
| BC-U-02 | SOURCE_METRICS=[mau, revenue_total_yen] | summary.test.ts | ✅ | Phase 1 |
| BC-U-11 | 全欠落 → charts 2件 各 series points=[] | summary.test.ts | ✅ | Phase 1 |
| BC-U-13 | 1 service のみ source → 全 service series | summary.test.ts | ✅ | 維持 |
| BC-U-51 | 非対象 metric 混入 → chart に含まれない (2件) | summary.test.ts | ✅ | Phase 1 |
| BC-U-61 | 0 service + snap有 → charts 2件 各 series=[] | summary.test.ts | ✅ | Phase 1 |
| TS-M-03 | 4 引数呼び出しでも charts 2件 (後方互換) | summary.test.ts | ✅ | Phase 1 |
| CX-U-01 | MetricChart domain 指定 → data-domain 反映 | MetricChart.test.tsx | ✅ | Phase 2 |
| CX-U-02 | domain 未指定 → data-domain なし (fallback) | MetricChart.test.tsx | ✅ | Phase 2 |
| CX-U-10 | DashboardCharts 2 chart render + usd系不在 | DashboardCharts.test.tsx | ✅ | Phase 1/2 |
| CX-U-11 | 共有時間軸 — 全 chart 同一 data-domain | DashboardCharts.test.tsx | ✅ | Phase 2 |
| CX-U-12 | 全 series 空 → データなし + data-domain なし | DashboardCharts.test.tsx | ✅ | Phase 2 |
| CX-U-13 | charts=[] でも section+header render | DashboardCharts.test.tsx | ✅ | Phase 2 |
| CX-U-20 | 期間セレクタ render + 選択 period active | DashboardCharts.test.tsx | ✅ | Phase 3 |
| CX-U-21 | 期間ボタン click → onPeriodChange(period) | DashboardCharts.test.tsx | ✅ | Phase 3 |
| CX-U-30 | sharedXDomain min/max を bucketEpoch で算出 | DashboardCharts.test.tsx | ✅ | Phase 2 |
| CX-U-31 | 点ゼロ → undefined | DashboardCharts.test.tsx | ✅ | Phase 2 |
| CX-U-40 | parsePeriod 有効値はそのまま | chartPeriod.test.ts | ✅ | Phase 3 |
| CX-U-41 | parsePeriod 不正/未指定/空/配列/null → 30d | chartPeriod.test.ts | ✅ | Phase 3 |
| CX-U-42〜44 | periodToSinceIso 7d/30d/all | chartPeriod.test.ts | ✅ | Phase 3 |
| CX-U-45 | CHART_PERIODS 順序+ラベル | chartPeriod.test.ts | ✅ | Phase 3 |
| AS-H1〜H3 | summary API 認可ゲート (query:{}→既定30d で維持) | api/dashboard/summary.test.ts | ✅ | リグレッション |

## 追加テストケース

| # | 対象 | テストケース | 追加理由 |
|---|------|------------|---------|
| CX-U-01/02 | MetricChart | domain prop の反映/未指定 | 新 prop の挙動固定 |
| CX-U-11/30/31 | sharedXDomain | 共有 domain 算出・境界 | 時間軸統一の中核ロジック |
| CX-U-20/21 | 期間セレクタ | render + click→callback | 新 UI |
| CX-U-40〜45 | chartPeriod | parse/since/順序 全分岐 | 純関数で period ロジックを直接カバー |

## リグレッション強化
- 一覧「採算」列 (`profitability.test.ts` 9件) は無変更で全 green — chart 削除がテーブル列に波及しないことを確認。
- service-detail の MetricChart 単体利用 (TS-U-37 / FX-B-03) は domain 未指定で従来描画、green。
- `recentSnapshots` (queries.test.ts) は不変・green。

## サマリー

| 項目 | 値 |
|------|-----|
| 計画テスト数 | 24 (UNIT_TEST 計画) |
| 追加テスト数 | chart-ux 関連 約 25 ケース (CX-U-*) |
| 合計 (全スイート) | 331件 |
| 成功 | 331件 |
| 失敗 | 0件 |
| 成功率 | 100% |
| tsc 新規エラー | 0 (pre-existing TS2578 queries.test.ts:249 のみ、本改修と無関係) |
