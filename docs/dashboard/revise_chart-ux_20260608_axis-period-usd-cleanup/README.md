# 改修: dashboard 上部 chart — 時間軸統一 + 期間選択 + usd 系 chart 削除

- **issue / slug**: chart-ux / axis-period-usd-cleanup
- **実施日**: 2026-06-08
- **対象機能**: ../README.md
- **基準 SPEC**: ../001_dashboard_SPEC.md
- **改修要望**:
  1. 複数 chart の時間軸（X 軸）が揃っておらず見づらい → 揃える
  2. 表示期間を「全期間（データがあれば）/ 30日 / 7日」で選択できるようにする
  3. データを取得していない「課金額」(revenue_month_usd) は収益と同義なので chart から削除（→ 採算・コストも含む usd 系 3 chart を削除し、ユーザー数 + 収益(¥) の 2 chart に集約。ユーザー確定 2026-06-08）
- **状態**: 設計中

## このフォルダに置くドキュメント

- `001_REVISE_SPEC.md` — 変更仕様書（変更前 vs 変更後）
- `002_REVISE_PLAN.md` — 変更計画書（ファイル変更 + 新規 + 削除）
- `003_REVISE_UNIT_TEST.md` — 単体テスト計画（追加 / 修正 / 削除）
- `004_REVISE_E2E_TEST.md` — E2E テスト計画（変更 UC + リグレッション）
- `101_REVISE_IMPL_REPORT.md` — 実装レポート（`/flow:tdd`）

## 関連

- 過去の改修: ../revise_biz-charts_20260530_revenue-cost-profit/（usd 系 4 chart 化の元）, ../revise_C20260607-001_20260607_tip-metrics-display/（収益¥列）
- AI_LOG: ../../AI_LOG/D20260608_001_revise_dashboard_chart-ux.md
