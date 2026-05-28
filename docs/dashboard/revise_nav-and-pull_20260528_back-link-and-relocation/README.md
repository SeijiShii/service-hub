# 改修: nav-and-pull (戻る link + 「今すぐ pull」を dashboard へ relocation)

- **issue / slug**: nav-and-pull / back-link-and-relocation
- **実施日**: 2026-05-28
- **対象機能**: ../README.md (dashboard)
- **基準 SPEC**: ../001_dashboard_SPEC.md
- **改修要望** (ユーザー直接、2026-05-28):
  1. /admin 画面に top (/) へ戻るボタンが無い → 双方向 navigation にする
  2. 「今すぐ pull」ボタンが /admin 登録画面ではなく **top (dashboard /) にあるべき**
- **状態**: 設計中

## このフォルダに置くドキュメント
- `001_REVISE_SPEC.md` — 変更仕様書
- `002_REVISE_PLAN.md` — 変更計画書
- `003_REVISE_UNIT_TEST.md` — 単体テスト計画
- `004_REVISE_E2E_TEST.md` — E2E テスト計画
- `101_REVISE_IMPL_REPORT.md` — 実装レポート (`/flow:tdd` 後)
- `102_REVISE_UNIT_TEST_REPORT.md` — 単体テストレポート

## 関連
- 過去の改修: ../revise_admin-ux_20260528_link-and-styling/ (順方向 / → /admin link) / ../../collection/revise_force-pull_20260528_admin-button/ (force-pull section を /admin に追加した直前 revise)
- O55 orphan の逆方向ケース (admin → /) を解消する
