# 改修: dashboard chart — 線色パレットのバリエーション拡充

- **issue / slug**: chart-colors / series-palette-variation
- **実施日**: 2026-06-08
- **対象機能**: ../README.md
- **基準 SPEC**: ../001_dashboard_SPEC.md
- **改修要望**: チャートの色が青と緑しかない。他にもバリエーションを持たせられるか
- **状態**: 設計完了 → 実装待ち

## 背景 / 根本原因

dashboard 上部 chart は service 別 line を `CHART_SERIES_COLORS[idx]` (tokens.ts) で着色する。
現状 8 色あるが **色相環の自然順 (青→シアン→緑→黄緑→黄→橙→赤→ピンク)** で並んでいるため:

1. 先頭 3 色 (青 / シアン / 緑) が青〜緑のクール域に固まり、service が 2〜3 個だと
   暖色が一切使われず「青と緑だけ」に見える。
2. idx1 シアン `#34d3a0` と idx2 緑 `#34d399` がほぼ同色で見分けづらい (near-duplicate)。

## 改修方針 (確定 2026-06-08)

8 色を維持したまま **暖色/寒色を交互配置** に並べ替え、near-dup を解消:

| idx | 色 | hex |
|---|---|---|
| 0 | 青 | `#5b9cf5` |
| 1 | 橙 | `#fb923c` |
| 2 | 緑 | `#34d399` |
| 3 | ピンク | `#ec4899` |
| 4 | 黄 | `#fbbf24` |
| 5 | シアン | `#22d3ee` (←near-dup 解消) |
| 6 | 赤 | `#f87171` |
| 7 | 紫 | `#a78bfa` (←追加) |

## このフォルダに置くドキュメント

- `001_REVISE_SPEC.md` — 変更仕様書（変更前 vs 変更後）
- `002_REVISE_PLAN.md` — 変更計画書
- `003_REVISE_UNIT_TEST.md` — 単体テスト計画
- `004_REVISE_E2E_TEST.md` — E2E テスト計画
- （マイグレーション不要 — 純視覚変更）
- `101_REVISE_IMPL_REPORT.md` — 実装レポート（`/flow:tdd`）

## 関連

- 元 palette 導入: timeseries-topchart (CHART_SERIES_COLORS)
- ../revise_chart-ux_20260608_axis-period-usd-cleanup/（2 chart 集約）
- ../fix_C20260601-002_20260601_chart-multiseries-render/（multi-series 整列）
- AI_LOG: ../../AI_LOG/D20260608_006_revise_dashboard_chart-colors.md
- 高度モデルレビュー: `/flow:spec-review` 推奨
