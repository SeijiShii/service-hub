# バグ修正: admin-form 編集保存 + UX 3 件

- **issue / slug**: admin-form-bug-and-ux / edit-save-and-help-and-wording
- **重大度**: High (#3 PATCH 編集が保存されないように見える) + Low 3 件併合
- **実施日**: 2026-05-28
- **対象**: ../README.md (registry)
- **基準 SPEC**: ../001_registry_SPEC.md
- **バグレポート**: ユーザー直接 (4th deploy 後実機確認、2026-05-28 13:25)
- **状態**: 修正計画済 (Phase 1-5 完了)

## このフォルダに置くドキュメント
- `000_調査レポート.md` — 4 指摘の症状 + 影響 + 再現
- `001_ROOT_CAUSE.md` — 5 Whys × 4 指摘 (主は #3 PATCH 保存見えない問題)
- `002_FIX_PLAN.md` — 修正対象 + before/after + リリース戦略
- `003_REGRESSION_TEST.md` — async save UX のリグレッションテスト
- `004_POSTMORTEM.md` — High 由来必須 (なぜ admin-ux + force-pull 経て検知漏れだったか)
- `101_FIX_IMPL_REPORT.md` — /flow:tdd 後

## 関連
- 過去類似: ../../dashboard/revise_admin-ux_20260528_link-and-styling/ (admin form の styling 担当、async UX は scope 外だった)
- 関連実装: src/features/admin/ServicesAdminView.tsx (submit + onRetire)、src/features/admin/ServicesAdminPage.tsx (onSave PATCH)、api/admin/services.ts (PATCH handler)、src/db/queries.ts (upsertService)
