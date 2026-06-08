# 実装レポート: dashboard chart-colors (series-palette)

## 実装日時
2026-06-08 13:28 (JST)

## モード
revise

## 関連ドキュメント
- [001_REVISE_SPEC.md](./001_REVISE_SPEC.md) - 変更仕様書
- [002_REVISE_PLAN.md](./002_REVISE_PLAN.md) - 変更計画書
- [003_REVISE_UNIT_TEST.md](./003_REVISE_UNIT_TEST.md) - 単体テスト計画
- [AI_LOG セッション](../../AI_LOG/D20260608_007_tdd_dashboard_chart-colors.md) - 設計判断ログ

## 注意事項
本レポートのファイルパスと行番号は実装日時時点のものです。以後の変更により行番号がずれる場合があります。

## 変更一覧

### Phase 1: 線色パレット並べ替え + near-dup 解消 (軽・メイン直接)

**`src/components/tokens.ts`** — `CHART_SERIES_COLORS` を色相環の自然順から**暖寒交互順**へ並べ替え:

| idx | 旧 | 新 |
|---|---|---|
| 0 | 青 `#5b9cf5` | 青 `#5b9cf5`（据置） |
| 1 | シアン `#34d3a0` | 橙 `#fb923c` |
| 2 | 緑 `#34d399` | 緑 `#34d399` |
| 3 | 黄緑 `#a3e635` | ピンク `#ec4899` |
| 4 | 黄 `#fbbf24` | 黄 `#fbbf24` |
| 5 | 橙 `#fb923c` | シアン `#22d3ee`（near-dup 解消） |
| 6 | 赤 `#f87171` | 赤 `#f87171` |
| 7 | ピンク `#ec4899` | 紫 `#a78bfa`（追加） |

- 旧 idx1 シアン `#34d3a0`（idx2 緑 `#34d399` と near-dup）を明瞭なシアン `#22d3ee` へ差替。
- 旧 idx3 黄緑 `#a3e635` を廃し、末尾に紫 `#a78bfa` を追加して色相を拡張。
- idx0 の青は据置（single-series / service-detail の見た目を温存）。
- JSDoc コメントを新方針（暖寒交互・near-dup 解消の経緯）へ更新。

**`src/components/tokens.test.ts`** — 新規。パレット不変条件を固定（8 色 / idx0 青据置 / idx1 暖色 / idx0-3 暖寒交互順 / 全色相異 = near-dup 不在 / `chartSeriesColor` の `%8` 循環）。

**consumer 変更なし**: `MetricChart.tsx` は `chartSeriesColor(idx)` を呼ぶのみ（出力色が変わるだけでコード変更不要）。

## 実装計画からの差分

| 項目 | 内容 |
|------|------|
| 計画にない追加変更 | なし |
| 計画から省略した変更 | TK-U-06（負 index の堅牢化）は実呼び出しが常に ≥0（`series.map` の idx）のため実害なく、現状仕様維持として test 化を見送り |
| 想定外の問題と対処 | `npx tsc` で `src/db/queries.test.ts(249)` の TS2578 警告が出るが、本改修と無関係の**既存**事象（変更を stash しても再現）。スコープ外として未対応 |

## PR Description

### タイトル
dashboard: chart 線色パレットを暖寒交互順に並べ替え（青緑偏りの解消）

### 概要
dashboard 上部 chart の service 別 line 色が、少数 service 時に「青と緑だけ」に見える問題を解消する。色相環の自然順だった `CHART_SERIES_COLORS` を暖色/寒色の交互配置に並べ替え、ほぼ同色だったシアン/緑の near-duplicate を解消した。色数は 8 のまま。

### 変更内容
- `CHART_SERIES_COLORS` を 青→橙→緑→ピンク→黄→シアン→赤→紫 の暖寒交互順へ並べ替え
- near-dup の旧シアン `#34d3a0` を `#22d3ee` へ差替、末尾に紫 `#a78bfa` を追加
- idx0 の青は据置（既存互換）
- `tokens.test.ts` を新規追加してパレット不変条件を固定

### テスト
- 新規 `tokens.test.ts` 6 件 green
- 全スイート 337/337 green（既存 331 + 新規 6、リグレッションなし）
- テスト結果: 337/337 (100%)
