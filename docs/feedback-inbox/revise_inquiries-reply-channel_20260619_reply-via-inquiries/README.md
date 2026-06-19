# 改修: inquiries 消費で返信導線 (email + adminUrl)

- **issue / slug**: inquiries-reply-channel
- **実施日**: 2026-06-19
- **対象機能**: ../README.md
- **基準 SPEC**: ../001_feedback-inbox_SPEC.md
- **改修要望**: 無登録 feedback ソースに「エンドポイント種別」を追加し、shipyard は標準
  `/api/hub/feedback` (scrubbed、email なし) ではなく `/api/hub/inquiries` を pull できるようにする。
  inquiries は email(生・返信チャネル) + adminUrl(Clerk ガード deep-link) + subject を含む。これらを
  取り込み・保存し、運営者インボックスに返信導線（メールで返信 / shipyard admin で返信）を表示する。
  threadToken は複製しない (SEC-002)。email は認証済み運営者画面のみ表示 (PII、inquiries-contract で許容済み)。
  標準 feedback ソース (email なし) との後方互換を維持。
- **状態**: 設計中

## 背景
直前の revise (inbox-pull-source) で shipyard を**標準 scrubbed** `/api/hub/feedback` で pull するようにしたが、
標準 O66 は email/threadToken を意図的に scrub するため**返信先が取得できない** (運営者が返信不能)。
shipyard は返信用に `/api/hub/inquiries` を別契約として用意済み (email 生 + adminUrl)。本改修で HUB がそれを消費する。

## このフォルダに置くドキュメント
- `001_REVISE_SPEC.md` / `002_REVISE_PLAN.md` / `003_REVISE_UNIT_TEST.md` / `004_REVISE_E2E_TEST.md`
- MIGRATION (005): **不要** (email/adminUrl/subject は既存 context jsonb に格納)

## 関連
- 直前 revise: `../revise_inbox-pull-source_20260619_unregistered-controls/`
- 連携先 SoT: shipyard `lib/hub/inquiries-contract.ts` (email 生 / adminUrl / threadToken 非露出)
- AI_LOG: `../../AI_LOG/D20260619_005_revise_feedback-inbox_inquiries-reply-channel.md`
