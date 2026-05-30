# D20260530_013 — /flow:tdd dashboard (revise biz-charts)

**実行日時**: 2026-05-30 (+09:00)
**コマンド**: /flow:tdd
**モード**: revise
**対象**: dashboard / revise_biz-charts_20260530_revenue-cost-profit
**実行者**: SeijiShii (via Claude Code) — flow:auto P4 dispatch
**状態**: 完了

## 含まれる decision 範囲
D20260530-050 〜 D20260530-052

## 生成・更新アーティファクト
- src: summary.ts (SOURCE_METRICS+DASHBOARD_CHARTS+label+buildCharts派生) / profitability.ts (profitAt export) / MetricChart.tsx (label prop) / DashboardCharts.tsx (label) / api/dashboard/summary.ts (取得キー)
- test: summary.test (BC-U-01〜61 + BC-U-30) / DashboardCharts.test (BC-U-05) / DashboardView.test (helper 4件) / MetricChart.test (BC-U-04/12) / profitability.test (PA-1〜3)
- 101 + 102 + INDEX 3 階層
- commit: f852745 (実装+テスト) / Step Z (レポート)

## テスト結果
全 307/307 green (dashboard 機能 63、biz-charts 新規 10)。新規 tsc エラー 0 (queries.test.ts TS2578 は既存・無関係)。

## Phase 構成 (002_REVISE_PLAN §5)
- **Phase 1**: chart 定義分離 + label + 取得キー（軽寄り・メイン直接） — summary.ts (SOURCE_METRICS + DASHBOARD_CHARTS + DashboardChart.label) + MetricChart.tsx (label prop) + DashboardCharts.tsx (label) + api/dashboard/summary.ts (取得キー)
- **Phase 2**: profitAt 共通化 + profit 派生（軽寄り・メイン直接） — profitability.ts (profitAt export) + summary.ts buildCharts (profit 派生系列)

設計判断は spec-review (R1-R6) で解決済 → メイン直接 TDD。

## テスト環境
- Vitest (`npm test`)、@testing-library/react、jsdom

## Decisions

```yaml
- id: D20260530-050
  timestamp: 2026-05-30T19:35:00+09:00
  command: /flow:tdd
  phase: Step 1-4 モード + Phase 軽重判定
  question: モード + Phase 軽重
  chosen: revise モード、Phase 1/2 ともメイン直接 (設計判断 spec-review 解決済、≤4 ファイル/phase)
  chosen_type: auto-recommended
  depends_on: [D20260530-044]
  context: chart 定義分離 + label + profitAt 共通化 + profit 派生。spec-review R1 で profitAt 共通化確定済。

- id: D20260530-051
  timestamp: 2026-05-30T19:14:00+09:00
  command: /flow:tdd
  phase: Phase 1+2 完了
  question: 実装結果
  chosen: chart 定義分離+label+取得キー (Phase1) + profitAt 共通化+profit 派生 (Phase2) → dashboard 63 test green
  chosen_type: auto-recommended
  depends_on: [D20260530-050]
  context: |
    summary.ts は両 Phase が同一ファイルで密結合のため 1 feat commit (f852745)。
    profitAt を profitability.ts に export し computeProfitability と buildCharts が共有 (R1、採算=一覧列一致を BC-U-30 で検証)。

- id: D20260530-052
  timestamp: 2026-05-30T19:14:30+09:00
  command: /flow:tdd
  phase: Step 6 全テスト
  question: 全スイート結果
  chosen: 307/307 green。新規 tsc エラー 0 (queries.test.ts TS2578 は既存・無関係、build=vite build で非ブロッカー)
  chosen_type: auto-recommended
  depends_on: [D20260530-051]
  context: biz-charts 新規 10 test 追加。
```
