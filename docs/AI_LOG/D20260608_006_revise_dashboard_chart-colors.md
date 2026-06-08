# AI_LOG: /flow:revise dashboard chart-colors (series-palette)

- **実行日時**: 2026-06-08 (JST)
- **コマンド**: /flow:revise
- **対象機能+issue**: dashboard / chart-colors (series-palette-variation)
- **実行者**: seiji + Claude (flow:revise)
- **状態**: 完了

## 含まれる decision 範囲
- 改修要望の確定 (Step 1.2)
- Read スコープ確定 (Step 2.2)
- 改修固有 5 項目 (動機 / 後方互換 / リリース / テスト扱い / ロールバック)
- パレット方針の確定 (Class A 設計判断、ユーザー確認 1 問)
- マイグレーション要否判定

## 主要決定サマリ
| id | 判断 | 結果 | type |
|---|---|---|---|
| D20260608-015 | 改修要望の確定 | chart 線色が青/緑に偏る → palette 並べ替え+重複解消で variation 確保 | explicit-choice |
| D20260608-016 | Read スコープ | tokens.ts / MetricChart.tsx / DashboardCharts.tsx + 各 test (4 ファイル) | auto-recommended |
| D20260608-017 | パレット方針 | 8 色維持、暖色/寒色交互+near-dup(#34d3a0/#34d399) 解消 | explicit-choice |
| D20260608-018 | 後方互換/マイグレ | 純視覚 (fallback hex のみ、CSS var 未定義)、互換維持・移行不要・revert で rollback | auto-recommended |

## 依存関係
- depends_on: dashboard feature セッション (timeseries-topchart の CHART_SERIES_COLORS 導入)、
  D20260601 fix C20260601-002 (multi-series 整列)、D20260608_001 revise chart-ux (2 chart 集約)

## 生成・更新したアーティファクト
- docs/dashboard/revise_chart-colors_20260608_series-palette/{README, INDEX, 001_REVISE_SPEC, 002_REVISE_PLAN, 003_REVISE_UNIT_TEST, 004_REVISE_E2E_TEST}.md
- docs/dashboard/INDEX.md / docs/INDEX.md (改修件数 +1)

## 学習・改善
- パレットは「色相環の自然順」より「先頭 N での知覚分離」を優先すべき。少数系列では先頭数色しか使われないため、暖色/寒色を交互配置すると低 N でも variation が出る。

## Decisions
```yaml
- id: D20260608-015
  timestamp: 2026-06-08T12:10:00+09:00
  command: /flow:revise
  phase: Step 1.2 改修要望の確定
  question: チャートの色が青と緑しかない、他のバリエーションを持たせられるか
  options: [現状維持, palette 並べ替え/拡張]
  recommended: palette を見直して低系列数でも variation を確保
  chosen: palette 並べ替え+重複解消で対応 (issue=chart-colors)
  chosen_type: explicit-choice
  depends_on: []
  context: |
    dashboard 上部 chart は service 別 line を CHART_SERIES_COLORS[idx] で着色。
    現状 8 色だが色相環順で先頭3色(青/シアン/緑)が青〜緑に固まり、
    2〜3 service だと青と緑しか出ない。idx1 #34d3a0 と idx2 #34d399 は near-dup。

- id: D20260608-016
  timestamp: 2026-06-08T12:11:00+09:00
  command: /flow:revise
  phase: Step 2.2 Read スコープ確定
  question: 影響分析に読むファイル範囲
  options: [推奨範囲(palette 関連 4 ファイル), 絞る, 広げる]
  recommended: tokens.ts + MetricChart.tsx/.test + DashboardCharts.tsx
  chosen: tokens.ts, MetricChart.tsx, MetricChart.test.tsx, DashboardCharts.tsx, design-system.md §2
  chosen_type: auto-recommended
  depends_on: []
  context: |
    palette は tokens.ts CHART_SERIES_COLORS に集約、consumer は MetricChart.tsx の
    chartSeriesColor(idx) のみ。CSS var --chart-series-N は未定義 (fallback hex が常時適用)。
    test は exact hex を assert せず → 色変更は既存 test を破壊しない。

- id: D20260608-017
  timestamp: 2026-06-08T12:18:00+09:00
  command: /flow:revise
  phase: Step 3.1 パレット方針 (Class A 設計判断、視覚的主観のため 1 問確認)
  question: 線色バリエーションの増やし方
  options: [並べ替え+重複解消(8色維持), 並べ替え+10〜12色拡張, 重複解消のみ(最小)]
  recommended: 並べ替え+重複解消(8色維持) — 最小面で「青と緑だけ」を確実に解消
  chosen: 並べ替え+重複解消(8色維持)
  chosen_type: explicit-choice
  depends_on: [D20260608-015]
  context: |
    確定 palette (idx順): 青#5b9cf5 / 橙#fb923c / 緑#34d399 / ピンク#ec4899 /
    黄#fbbf24 / シアン#22d3ee / 赤#f87171 / 紫#a78bfa。
    暖色/寒色を交互配置し低系列数でも対比を確保、near-dup の #34d3a0 を #22d3ee へ差替、
    末尾に紫#a78bfa を追加 (黄緑#a3e635 と橙の重複感を避け色相を広げる)。

- id: D20260608-018
  timestamp: 2026-06-08T12:20:00+09:00
  command: /flow:revise
  phase: Step 3.1 改修固有5項目 + マイグレ要否
  question: 後方互換 / リリース / テスト扱い / ロールバック / マイグレ要否
  options: []
  recommended: 互換維持・一括リリース・既存test維持+tokens.test追加・revert rollback・移行不要
  chosen: 同上
  chosen_type: auto-recommended
  depends_on: [D20260608-017]
  context: |
    純視覚変更。CSS var 未定義で fallback hex のみが描画に効く → 外部契約・DB・データ無関係。
    後方互換: 維持 (色値が変わるだけ、API/型/データ不変)。
    リリース: 一括 (flag 不要、視覚のみ)。
    テスト: 既存 MetricChart.test 維持 + tokens.test.ts を新規追加 (palette 不変条件を固定)。
    ロールバック: コード revert のみ。マイグレーション: 不要。
```
