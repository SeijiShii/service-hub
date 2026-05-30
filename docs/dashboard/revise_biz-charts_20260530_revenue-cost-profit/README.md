# 改修: 上部チャートをビジネス指標化 (ユーザー数/課金額/コスト/採算)

- **issue / slug**: biz-charts (revenue-cost-profit)
- **実施日**: 2026-05-30
- **対象機能**: ../README.md
- **基準 SPEC**: ../001_dashboard_SPEC.md
- **改修要望**: 「サービスが UP か DOWN かをチャートで示す必要はない。チャートで見たいのは課金がどれくらい発生しているか、コストがどれくらい。ユーザー数も。採算も。上から: ユーザー数 / 課金額 / コスト / 採算」
- **状態**: 設計完了 (tdd 待ち)
- **AI_LOG**: `../../AI_LOG/D20260530_010_revise_dashboard_biz-charts.md`

## 背景

dashboard 上部チャートは現状 `up / mau / db_storage_bytes`（インフラ寄り）。死活(UP/DOWN)は一覧の `status` 列（StatusDot）が常時表示しており chart は冗長。ユーザーが本当に見たいのは**ビジネス指標の推移**（ユーザー数・課金額・コスト・採算）。チャートをビジネス4枚に転換する。直前の last-deploy-col（単一値メトリクスを chart から外す）と同じ「推移に意味があるものだけ chart 化」方針の延長。

## このフォルダに置くドキュメント
- `001_REVISE_SPEC.md` — 変更仕様（変更前 vs 変更後）
- `002_REVISE_PLAN.md` — 変更計画
- `003_REVISE_UNIT_TEST.md` — 単体テスト計画
- `004_REVISE_E2E_TEST.md` — E2E テスト計画
- `905_REVISE_SPEC_REVIEW.md` — 設計レビュー (spec-review 後)
- `101_REVISE_IMPL_REPORT.md` — 実装レポート (tdd 後)

## 関連
- 直前改修: ../revise_last-deploy-col_20260530_chart-to-column/（chart から単一値除外、本改修と同方針）
- 元: ../revise_timeseries-topchart_20260528/（chart 導入）
- データ源: ../../_shared/providers/revise_001_20260527_business-observability/（revenue/cost メトリクス導入）
