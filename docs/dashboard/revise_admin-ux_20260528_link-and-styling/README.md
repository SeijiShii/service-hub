# 改修: dashboard → admin 導線 + admin フォーム styling

- **issue / slug**: admin-ux / link-and-styling
- **実施日**: 2026-05-28
- **対象**: dashboard（../README.md）+ admin (src/features/admin、cross-touch)
- **改修要望**:
  - top ページ（/）に `/admin` へのリンクがない（orphan、O55）
  - admin 画面の登録フォームにスタイルが当たっておらず使いづらい（素 HTML、スクショ確認済）
- **設計**: ダッシュボードヘッダに「管理」リンク追加 + ServicesAdminView にスタイリング適用（縦並び・ラベル上・セクション分け 基本情報/Providers/Service-info・ボタン強調）。機能変更なし、見た目のみ。design-system のダーク/コックピット theme に揃える。
- **関連観点**: perspectives O55 (orphaned page 禁止、新規ページは導線とセット)
- **状態**: 設計完了 → 実装

## ドキュメント
- 001_REVISE_SPEC / 002_REVISE_PLAN / 003_REVISE_UNIT_TEST / 004_REVISE_E2E_TEST
- 101_REVISE_IMPL_REPORT / 102_REVISE_UNIT_TEST_REPORT（実装後）

## 関連
- 基準 SPEC: `../001_dashboard_SPEC.md`
- 触る他フォルダ: `src/features/admin/ServicesAdminView.tsx` (registry の admin write 実装)
- 後続: `/flow:tdd dashboard admin-ux` で実装（Phase 1 リンク → Phase 2 styling）
