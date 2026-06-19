# AI_LOG — /flow:revise feedback-inbox inquiries-reply-channel

- **実行日時**: 2026-06-19 (JST)
- **コマンド**: /flow:revise
- **対象機能+issue**: feedback-inbox / inquiries-reply-channel (slug=reply-via-inquiries)
- **実行者**: Claude (Opus 4.8) + seiji
- **状態**: 完了
- **含まれる decision 範囲**: D20260619-020 〜 D20260619-029

## 主要決定サマリ
| id | テーマ | chosen | type |
|---|---|---|---|
| D20260619-020 | 改修要望確定 | 無登録ソースに endpoint 種別追加 → shipyard inquiries pull (email+adminUrl) で返信導線 | explicit-choice |
| D20260619-021 | 契約ディスカバリ | shipyard `GET /api/hub/inquiries` (email 生 + adminUrl + subject、threadToken 非露出) を pull | auto-recommended |
| D20260619-022 | Read スコープ | feedbackSources + providers/feedback + feedbackRunner + collect 配線 + inbox UI + DB schema + shipyard inquiries-contract | auto-recommended |
| D20260619-023 | email/adminUrl/subject 格納方式 (Class A 中核) | 既存 context jsonb に格納 → **DB migration 不要** | auto-recommended |
| D20260619-024 | 後方互換 | 完全互換 (kind 既定=feedback、context additive、標準ソース無影響) | auto-recommended |
| D20260619-025 | リリース戦略 | 一括 (env additive、22nd deploy 想定) | auto-recommended |
| D20260619-026 | テスト扱い | 全維持 + 追加 (inquiries adapter / source kind / inbox 返信導線) | auto-recommended |
| D20260619-027 | ロールバック | code revert (DB 変更なし) | auto-recommended |
| D20260619-028 | タグ | feature + auth-required (継承) | auto-recommended |
| D20260619-029 | SEC (email PII at rest) | HUB Neon に email 保存 = Clerk ゲート内のみ表示、inquiries-contract で許容済 (運営者返信チャネル)。accepted-as-requirement | auto-recommended |

## 依存関係
- 直前 revise: `D20260619_001_revise_feedback-inbox_inbox-pull-source.md` (env ソース基盤、D20260619-004)
- shipyard 側: inquiries-contract (email 生=返信チャネル / threadToken 非露出 SEC-002 / adminUrl=Clerk ガード)
- feature: `D20260618_009_feature_feedback-inbox.md`

## Decisions

```yaml
- id: D20260619-020
  timestamp: 2026-06-19T01:20:00+09:00
  command: /flow:revise
  phase: Step 1.2 改修要望取得
  question: 改修要望
  chosen: |
    無登録 feedback ソースに endpoint 種別 (feedback|inquiries) を追加し、shipyard は
    /api/hub/inquiries を pull。email(生・返信チャネル) + adminUrl(Clerk deep-link) + subject を
    取り込み、運営者インボックスに返信導線を表示。threadToken は複製しない。標準ソース後方互換維持。
  chosen_type: explicit-choice
  depends_on: [D20260619-004]
  context: |
    ユーザー質問「ServiceHUB はメッセージ API で email を取得しているか (返信に必要)」→ 調査で
    標準 /api/hub/feedback は email/threadToken を scrub (feedback-export.ts) と判明。返信不能。
    ユーザーが「/api/hub/inquiries を消費 (email + adminUrl)」を選択。

- id: D20260619-021
  timestamp: 2026-06-19T01:21:00+09:00
  command: /flow:revise
  phase: Step 2.1.6 契約ディスカバリ
  question: 返信情報を含む連携形状
  chosen: |
    shipyard `GET /api/hub/inquiries` を pull。レスポンス = {schemaVersion, service:"shipyard",
    items:[{id, kind:"inquiry", subject, body, email(生), createdAt, status, adminUrl}], nextCursor}。
    認証 = HUB_SERVICE_INFO_SECRET Bearer (feedback と同系統)。threadToken は意図的非露出 (SEC-002 IDOR)。
  chosen_type: auto-recommended
  depends_on: [D20260619-021]
  context: |
    shipyard lib/hub/inquiries-contract.ts を実 read で確認 (形状発明せず、Step 2.1.6 準拠)。
    email は「認証済み運営者への返信チャネル供給 = SEC-001 禁止 sink でない」と producer 側で明記。

- id: D20260619-023
  timestamp: 2026-06-19T01:24:00+09:00
  command: /flow:revise
  phase: Step 3.1 データモデル (中核、格納方式)
  question: email/adminUrl/subject の格納先
  options:
    - "既存 context jsonb に格納 (migration 不要)"
    - "feedback_items に dedicated columns 追加 (migration 要)"
  recommended: context jsonb (additive・migration 不要・後方互換・PII 露出は列/jsonb で不変)
  chosen: 既存 context jsonb に格納
  chosen_type: auto-recommended
  depends_on: []
  context: |
    feedback_items は既に context jsonb 列を持ち、FeedbackInboxItem extends FeedbackItemRow の
    spread で VM/client (Clerk ゲート内) にそのまま流れる。dedicated 列は filter/index 不要なので
    過剰。context jsonb で DB migration を回避 = Class B prod DB 変更なし。

- id: D20260619-024
  timestamp: 2026-06-19T01:25:00+09:00
  command: /flow:revise
  phase: Step 3.1 後方互換
  chosen: 完全互換 (source kind 既定=feedback、context additive、標準 pull 無影響)
  chosen_type: auto-recommended
  depends_on: [D20260619-023]
  context: 既存 registered services / 標準 env ソースは kind=feedback で従来同一。

- id: D20260619-025
  timestamp: 2026-06-19T01:26:00+09:00
  command: /flow:revise
  phase: Step 3.1 リリース戦略
  chosen: 一括 (UI additive + env、22nd deploy 想定)
  chosen_type: auto-recommended
  depends_on: []
  context: migration 不要・低リスク。

- id: D20260619-026
  timestamp: 2026-06-19T01:27:00+09:00
  command: /flow:revise
  phase: Step 3.1 テスト扱い
  chosen: 全維持 + 追加 (inquiries adapter parse / source kind / inbox 返信導線)
  chosen_type: auto-recommended
  depends_on: []
  context: 既存 409 tests は回帰確認。

- id: D20260619-027
  timestamp: 2026-06-19T01:28:00+09:00
  command: /flow:revise
  phase: Step 3.1 ロールバック
  chosen: code revert (DB 変更なし)
  chosen_type: auto-recommended
  depends_on: [D20260619-023]
  context: migration 不要 = rollback に DB 操作不要。env 削除でも無効化可。

- id: D20260619-028
  timestamp: 2026-06-19T01:29:00+09:00
  command: /flow:revise
  phase: Step 3.2 タグ
  chosen: feature + auth-required (継承)
  chosen_type: auto-recommended
  depends_on: [D20260618_009_feature]
  context: email 表示は Clerk ゲート内 inbox のみ。

- id: D20260619-029
  timestamp: 2026-06-19T01:30:00+09:00
  command: /flow:revise
  phase: Step 3.1 NFR/SEC (email PII at rest)
  question: HUB DB に email(PII) を保存することの SEC 評価
  chosen: accepted-as-requirement (Clerk ゲート内のみ表示、inquiries-contract で運営者返信チャネルとして許容、threadToken 非複製)
  chosen_type: auto-recommended
  depends_on: [D20260619-021]
  context: |
    email は PII だが (1) HUB inbox は単一ユーザー Clerk ゲート、(2) producer (shipyard) が
    返信チャネルとして意図的に供給、(3) threadToken (IDOR キー) は複製しない。返信可能化の
    ユーザー目的に必要。/flow:secure で再評価可能 (accepted maintain)。
```
