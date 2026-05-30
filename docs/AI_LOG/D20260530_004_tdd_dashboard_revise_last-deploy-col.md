# D20260530_004 — /flow:tdd dashboard (revise last-deploy-col)

**実行日時**: 2026-05-30 (+09:00)
**コマンド**: /flow:tdd
**モード**: revise
**対象**: dashboard / revise_last-deploy-col_20260530_chart-to-column
**実行者**: SeijiShii (via Claude Code) — flow:auto P4 次フェーズ dispatch
**状態**: 完了

## 含まれる decision 範囲
D20260530-021 〜 D20260530-024

## 生成・更新アーティファクト
- src: summary.ts / DashboardCharts.tsx / DashboardView.tsx / ServiceRow.tsx / lastUpdatedFormat.ts (formatJst export) / **deployAtFormat.ts (新規)** / api/dashboard/summary.ts
- test: summary.test / DashboardCharts.test / DashboardView.test / **deployAtFormat.test (新規)** / **ServiceRow.test (新規)**
- 101_REVISE_IMPL_REPORT.md + 102_REVISE_UNIT_TEST_REPORT.md + INDEX 3 階層
- commits: 77105ae (Phase1) / a264d66 (Phase2) / Step Z (本レポート)

## テスト結果
全 297/297 green (dashboard 機能 52、うち新規 deployAtFormat 5 + ServiceRow 4 + DashboardView LDC-U-03 1)。本改修による新規 tsc エラー 0。

## 既知の既存問題 (本改修と無関係)
`src/db/queries.test.ts(223,7) TS2578 Unused '@ts-expect-error'` が pre-session commit 802899b から存在 (worktree/checkout 検証済)。last-deploy-col とは無関係 (MetricKey/queries 非変更) のため本改修では未修正、別途対応として surface。

## Phase 構成 (002_REVISE_PLAN §5)
- **Phase 1**: chart から last_deploy_at 除外（軽・メイン直接） — summary.ts 定数 + DashboardCharts/api コメント + 既存 chart test 3 件化
- **Phase 2**: 一覧に最終デプロイ日時カラム追加（軽・メイン直接） — deployAtFormat.ts 新規 (formatJst export 再利用 R4) + DashboardView thead + ServiceRow td + test

両 Phase とも ≤3 ファイルの機械的変更 = 軽判定、メイン直接実装 (Step 5-L)。

## テスト環境
- Vitest (`npm test` = `vitest run`)、@testing-library/react、jsdom

## Decisions

```yaml
- id: D20260530-021
  timestamp: 2026-05-30T11:00:00+09:00
  command: /flow:tdd
  phase: Step 1-4 モード判定 + Phase 軽重判定
  question: モード + Phase 軽重
  chosen: revise モード、Phase 1/2 とも軽 (メイン直接)
  chosen_type: auto-recommended
  depends_on: [D20260530-014]
  context: |
    subfolder prefix revise_*。Phase 1 = summary.ts 定数 + コメント (機械的)、
    Phase 2 = deployAtFormat 新規 + 2 file edit + test。いずれも ≤3 ファイルで設計判断は
    spec-review で解決済 (R1-R5) → 軽。委託オーバーヘッド回避でメイン直接 TDD。

- id: D20260530-022
  timestamp: 2026-05-30T12:49:00+09:00
  command: /flow:tdd
  phase: Phase 1 完了 (chart 除外)
  question: Phase 1 RED→GREEN 結果
  chosen: DASHBOARD_CHART_METRICS 4→3、chart/summary/View test 3 件化 → dashboard 36 test green
  chosen_type: auto-recommended
  depends_on: [D20260530-021]
  context: commit 77105ae。api recentSnapshots は定数 spread で自動 3 metric 化。

- id: D20260530-023
  timestamp: 2026-05-30T12:52:00+09:00
  command: /flow:tdd
  phase: Phase 2 完了 (日時カラム)
  question: Phase 2 RED→GREEN 結果
  chosen: deployAtFormat (formatJst export 再利用) + thead/td 追加 → dashboard 52 test green
  chosen_type: auto-recommended
  depends_on: [D20260530-016, D20260530-022]
  context: commit a264d66。列データは latestPerService 由来で chart と独立 (R2) を実装で担保。

- id: D20260530-024
  timestamp: 2026-05-30T12:54:00+09:00
  command: /flow:tdd
  phase: Step 6 全テスト + tsc
  question: 全スイート結果 + 既存 tsc エラーの扱い
  options: [本改修で無関係エラーも修正, surface して別対応]
  recommended: surface して別対応
  chosen: 全 297 green。queries.test.ts TS2578 は pre-session 802899b から存在 = 既存問題、本改修スコープ外のため未修正で surface
  chosen_type: auto-recommended
  depends_on: [D20260530-023]
  context: |
    worktree/checkout で 802899b 時点に同エラーが存在することを確認。last-deploy-col の
    変更は MetricKey/queries を触らないため新規エラー 0。無関係な既存問題を revise commit に
    混ぜるのはスコープ汚染のため、レポート + 完了サマリで surface し別対応に委ねる。
```
