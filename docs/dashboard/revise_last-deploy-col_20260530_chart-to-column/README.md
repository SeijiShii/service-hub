# 改修: last_deploy_at をチャートから外し一覧に日時カラム追加 (chart-to-column)

- **issue / slug**: last-deploy-col
- **実施日**: 2026-05-30
- **対象機能**: ../README.md
- **基準 SPEC**: ../001_dashboard_SPEC.md
- **改修要望**: 「last_deploy_at はチャート表示しない。一覧に日時カラムを追加する」
- **状態**: 設計完了
- **AI_LOG**: `../../AI_LOG/D20260530_001_revise_dashboard_last-deploy-col.md`

## 背景

timeseries-topchart revise (2026-05-28) で `last_deploy_at` を上部時系列 chart の主要 4 metric の 1 つに採用したが、デプロイ時刻は単一スナップショット値で折れ線の「推移」表現が直感的でない。一覧テーブルの「最終デプロイ日時」カラムとして表示する方が運用上有用なため差し戻す。

## このフォルダに置くドキュメント

- `001_REVISE_SPEC.md` — 変更仕様書（変更前 vs 変更後）
- `002_REVISE_PLAN.md` — 変更計画書（ファイル変更 + 新規 + 削除）
- `003_REVISE_UNIT_TEST.md` — 単体テスト計画（追加 / 修正 / 削除）
- `004_REVISE_E2E_TEST.md` — E2E テスト計画（変更 UC + リグレッション）
- `101_REVISE_IMPL_REPORT.md` — 実装レポート（`/flow:tdd`、実装後）

## 関連

- 元改修: ../revise_timeseries-topchart_20260528/ （本改修が一部差し戻す元決定）
- 高度モデルレビュー: `/flow:spec-review dashboard` 推奨
