# クレーム判定: dashboard 直近30日チャートの multi-series 描画バグ

- **claim id**: C20260601-002
- **実施日**: 2026-06-01
- **対象**: ../README.md（dashboard）+ 共通 `src/components/MetricChart.tsx` + collection/runner 横断
- **基準 SPEC**: ../revise_timeseries-topchart_20260528/001_REVISE_SPEC.md（§16/30/31 multi-series 重ね描き規定）+ ../revise_biz-charts_20260530_revenue-cost-profit/（現行メトリクス4枚）
- **クレーム内容**: 2 サービス登録で折れ線が 2 本出る期待だが ①2 値になると線が途切れる ②同時刻が x 軸でずれる ③x 軸がミリ秒表示で見づらい（分まででよい）。
- **状態**: 判定完了 → 分岐実行（fix）
- **判定結果**: バグ (fix) / severity=high — SPEC が要求する multi-series 重ね描きが実装欠陥（per-row timestamp / 完全一致マージ / カテゴリ軸 / connectNulls 既定）で不成立
- **分岐先**: ../fix_C20260601-002_20260601_chart-multiseries-render/

## このフォルダに置くドキュメント
- `000_CLAIM_REPORT.md` — クレーム整理
- `001_TRIAGE.md` — 判定レポート

## 関連
- 基準 SPEC: ../revise_biz-charts_20260528_revenue-cost-profit/001_REVISE_SPEC.md
- 発生源: src/components/MetricChart.tsx（XAxis カテゴリ軸 / tickFormatter 無 / mergeSeries / connectNulls 既定 false）, src/features/collection/runner.ts:57（per-row capturedAt）
- 関連 claim: ../../collection/claim_C20260601-001_20260601_error-diagnostics/（同セッションの 404 別件、解消済み）
