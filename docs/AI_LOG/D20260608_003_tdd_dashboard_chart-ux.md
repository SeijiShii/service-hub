# D20260608_003 tdd: dashboard chart-ux (revise 実装)

**実行日時**: 2026-06-08 (+09:00)
**コマンド**: /flow:tdd dashboard chart-ux (revise モード)
**モード**: revise
**対象**: dashboard / revise_chart-ux_20260608_axis-period-usd-cleanup
**実行者**: seiji + Claude
**状態**: 完了 (unit 331 green、E2E 待ち)

**含まれる decision 範囲**: D20260608-008〜009

## 主要決定サマリ
| id | テーマ | chosen |
|---|---|---|
| D20260608-008 | Phase 軽重判定 | 全 3 Phase を軽=メイン直接実装 (表示+取得層、設計判断は revise 設計で確定済) |
| D20260608-009 | 全テスト結果 | 全 331 green、tsc 新規 0 (pre-existing TS2578 queries.test.ts:249 のみ) |

## 生成・更新ファイル
- src/features/dashboard/summary.ts / summary.test.ts (Phase1)
- src/components/MetricChart.tsx / MetricChart.test.tsx (Phase2: domain prop + bucketEpoch export)
- src/features/dashboard/DashboardCharts.tsx / DashboardCharts.test.tsx (Phase2/3: sharedXDomain + 期間セレクタ)
- src/features/dashboard/chartPeriod.ts / chartPeriod.test.ts (Phase3: 新規)
- src/features/dashboard/DashboardView.tsx / DashboardPage.tsx (Phase3: period 配線)
- api/dashboard/summary.ts (Phase3: ?period→since)
- 101_REVISE_IMPL_REPORT.md / 102_REVISE_UNIT_TEST_REPORT.md / INDEX 群

## 学習・改善
- 派生 chart の source metric 削除時は派生 chart の連鎖を Class C で人間判断 (revise D20260608-003 で usd 系一括削除に確定済) → tdd では迷いなく一本化できた。
- 期間ロジックを純関数 chartPeriod.ts に切り出すと client/api/test で共有でき、DB mock 不要で全分岐を unit テストできる。

## 依存関係
- D20260608-001〜006 (revise_chart-ux 設計): REVISE_SPEC/PLAN/UNIT_TEST に従い実装

## Phase 構成
- Phase 1: chart 集約 (usd 系 3 chart 削除) — summary.ts
- Phase 2: 共有時間軸 — MetricChart.tsx + DashboardCharts.tsx
- Phase 3: 期間セレクタ + API period — chartPeriod.ts(新) + api/summary.ts + DashboardPage/View/Charts

## Decisions
- id: D20260608-008
  timestamp: 2026-06-08T11:30:00+09:00
  command: /flow:tdd
  phase: Step 4 Phase 軽重判定
  question: 各 Phase の軽重 (メイン直接 / サブスキル委託)
  chosen: 全 3 Phase 軽=メイン直接
  chosen_type: auto-recommended
  context: 表示+取得層の mechanical change、設計判断は revise 設計で確定済。各 Phase 1-5 ファイル。テスト環境=vitest run。
- id: D20260608-009
  timestamp: 2026-06-08T11:55:00+09:00
  command: /flow:tdd
  phase: Step 6 全テスト
  question: 全テストスイート結果
  chosen: 全 331 green / tsc 新規 0
  chosen_type: auto-recommended
  context: chart-ux 3 Phase 実装後。pre-existing TS2578 (queries.test.ts:249) は本改修と無関係 (別コミット由来)。一覧採算列 (profitability.test.ts) は無変更で green = chart 削除の波及なし確認。
