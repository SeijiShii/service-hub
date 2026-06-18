# 改修: 無登録 shipyard pull + インボックス操作導線 (戻る / pull)

- **issue / slug**: inbox-pull-source
- **実施日**: 2026-06-19
- **対象機能**: ../README.md
- **基準 SPEC**: ../001_feedback-inbox_SPEC.md
- **改修要望**:
  1. shipyard を **services 登録なし**で feedback (メッセージ) 取得できるようにする
  2. メッセージBOX (`/feedback` インボックス) から**ホームへ戻るボタン**を追加
  3. メッセージBOX 内にも**「今すぐ pull」ボタン**を追加 (dashboard 以外でも手動取り込み可)
- **状態**: 設計中

## このフォルダに置くドキュメント

- `001_REVISE_SPEC.md` — 変更仕様書（変更前 vs 変更後）
- `002_REVISE_PLAN.md` — 変更計画書（ファイル変更 + 新規 + 削除）
- `003_REVISE_UNIT_TEST.md` — 単体テスト計画（追加 / 修正 / 削除）
- `004_REVISE_E2E_TEST.md` — E2E テスト計画（変更 UC + リグレッション）
- `101_REVISE_IMPL_REPORT.md` — 実装レポート（`/flow:tdd`）

## 関連

- 起点 claim: `../claim_C20260618-001_20260618_shipyard-feedback-not-loading/` (§5 の「services 登録」を本 revise で「登録なし」に supersede)
- 連携先 SoT: shipyard `GET /api/hub/feedback` (標準 O66、実装済)
- AI_LOG: `../../AI_LOG/D20260619_001_revise_feedback-inbox_inbox-pull-source.md`
