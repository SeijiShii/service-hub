# バグ修正 #admin-form-bug-and-ux ドキュメントインデックス

**issue / slug**: admin-form-bug-and-ux / edit-save-and-help-and-wording
**重大度**: High (#3) + Low 3 件併合
**実施日**: 2026-05-28
**状態**: 修正計画済 → 実装待ち

<!-- auto-generated-start -->

## ファイル一覧
| 番号 | ファイル | 種別 | 最終更新 |
|---|---|---|---|
| — | README.md | 改修概要 | 2026-05-28 |
| 000 | 000_調査レポート.md | 症状 + 影響 + 再現 + 関連 AI_LOG タイムライン + 仮説 | 2026-05-28 |
| 001 | 001_ROOT_CAUSE.md | 5 Whys + 直接原因 + 根本原因 (観点欠落) + 寄与要因 | 2026-05-28 |
| 002 | 002_FIX_PLAN.md | 修正対象 (View/Page/saveState.ts/handler stderr/test) + リリース戦略 (即時 5th deploy) | 2026-05-28 |
| 003 | 003_REGRESSION_TEST.md | SAVE-N1〜N4/E1 + FORM-N1/N2 + WORD-N1 + 境界 SAVE-B1〜B3 | 2026-05-28 |
| 004 | 004_POSTMORTEM.md | High 必須、再発防止策 5 件 (うち [flow] 2 件は別セッション handoff) | 2026-05-28 |

## 関連
- 親 INDEX: `../INDEX.md`
- 基準 SPEC: `../001_registry_SPEC.md` (admin write、D20260528-001)
- 過去類似: なし (admin form は本セッションで初の運用観測)
- 関連改修: `../../dashboard/revise_admin-ux_20260528_link-and-styling/` (styling 担当、async UX scope 外だった)
- 関連観点候補: perspectives に「フォームの非同期完了 UX (4 状態)」を新設提案 (Postmortem §8 (c))

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
