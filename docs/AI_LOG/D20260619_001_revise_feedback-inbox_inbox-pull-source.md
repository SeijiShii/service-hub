# AI_LOG — /flow:revise feedback-inbox inbox-pull-source

- **実行日時**: 2026-06-19 (JST)
- **コマンド**: /flow:revise
- **対象機能+issue**: feedback-inbox / inbox-pull-source
- **実行者**: Claude (Opus 4.8) + seiji
- **状態**: 完了
- **含まれる decision 範囲**: D20260619-001 〜 D20260619-009

## 主要決定サマリ
| id | テーマ | chosen | type |
|---|---|---|---|
| D20260619-001 | 改修要望確定 | 3 件 (①登録なし shipyard pull ②inbox→ホーム戻る ③inbox 内 pull ボタン) | explicit-choice |
| D20260619-002 | 横断連携 契約ディスカバリ | shipyard `GET /api/hub/feedback` (標準 O66、実装済・共有 secret 既存) を pull、形状発明せず | auto-recommended |
| D20260619-003 | Read スコープ | feedback-inbox + collection + providers/feedback + dashboard nav idiom + shipyard 契約 | auto-recommended |
| D20260619-004 | 無登録 pull 方式 (Class C) | 環境変数 HUB_FEEDBACK_SOURCES で追加ソース定義 | explicit-choice |
| D20260619-005 | 後方互換 | 完全互換 (env 未設定=現状、破壊変更なし) | auto-recommended |
| D20260619-006 | リリース戦略 | 一括 (UI additive + env がフラグ相当) | auto-recommended |
| D20260619-007 | テスト扱い | 全維持 + 追加 (sources parser / runner / inbox UI) | auto-recommended |
| D20260619-008 | ロールバック | code revert (DB 変更なし=安全、env 削除でも無効化) | auto-recommended |
| D20260619-009 | タグ判定 | feature + auth-required (継承、変更なし) | auto-recommended |

## 依存関係
- feature 設計: `D20260618_009_feature_feedback-inbox.md` (SPEC 主要 decision: pull/共有 secret/FeedbackItem)
- 先行 revise: `D20260618_018_revise_feedback-inbox_inbox-ux.md` (統合一覧 + styling)
- 起点 claim: `feedback-inbox/claim_C20260618-001_*` (§5 で「shipyard 標準 O66 化 + services 登録」決定) — 本 revise はその「登録」部分を**登録なし**に置換 (ユーザー新指示)

## 生成・更新したアーティファクト
- `feedback-inbox/revise_inbox-pull-source_20260619_unregistered-controls/{README,INDEX,001_REVISE_SPEC,002_REVISE_PLAN,003_REVISE_UNIT_TEST,004_REVISE_E2E_TEST}.md`
- `feedback-inbox/INDEX.md` (サブフォルダ行追加) / `docs/INDEX.md` / `AI_LOG/INDEX.md`

## 学習・改善
- claim 解決 (§5「登録する」) を後日ユーザーが「登録なし」に反転 → 過去 decision を編集せず本 revise D20260619-004 で supersede。契約ディスカバリ (Step 2.1.6) で shipyard が既に標準 `/api/hub/feedback` 実装済と確認でき、push/pull 形状の発明を回避 (CF-20260618-014 の再発防止が機能)。

## Decisions

```yaml
- id: D20260619-001
  timestamp: 2026-06-19T00:00:00+09:00
  command: /flow:revise
  phase: Step 1.2 改修要望取得
  question: 本 revise の改修要望の確定
  options:
    - "①shipyard を登録なしで feedback 取得"
    - "②メッセージBOX→ホーム戻るボタン"
    - "③メッセージBOX 内に pull ボタン追加"
  recommended: 引数 3 件をそのまま 1 revise イシューとして束ねる (全て feedback-inbox の運営者 pull/閲覧導線)
  chosen: 3 件を 1 イシュー inbox-pull-source として処理
  chosen_type: explicit-choice
  depends_on: []
  context: |
    ユーザー引数 3 件。②③は /flow:fix プレフィクスだが additive UI (ボタン追加) のため
    revise 領域、①と同一 feature・同一 inbox 面に集約されるため 1 サブフォルダに束ねた。

- id: D20260619-002
  timestamp: 2026-06-19T00:05:00+09:00
  command: /flow:revise
  phase: Step 2.1.6 横断連携の契約ディスカバリ
  question: shipyard の feedback を pull する連携形状 (push/pull・endpoint)
  options:
    - "shipyard /api/hub/feedback (標準 O66) を pull"
    - "shipyard /api/hub/inquiries (専用) を pull"
    - "push forwarder を新設 (発明)"
  recommended: 標準 /api/hub/feedback を pull (相手側 SoT 確認結果)
  chosen: shipyard `GET /api/hub/feedback` を既存 fetchFeedback でそのまま pull
  chosen_type: auto-recommended
  depends_on: [D20260618_009_feature, C20260618-001]
  context: |
    連携先 shipyard repo 実コードを grep。app/api/hub/feedback/route.ts が標準 O66 producer
    として実装済 (buildFeedbackResponse → {schemaVersion, items:[FeedbackItem]}, 認証=
    HUB_SERVICE_INFO_SECRET Bearer)。service-hub 側 src/providers/feedback.ts の fetchFeedback
    が無改修で消費可。形状を発明せず相手 SoT に従った (Step 2.1.6 / CF-20260618-014 準拠)。
    shipyard は /api/hub/inquiries も持つが標準 feedback の方が HUB 既存 pull に直結。

- id: D20260619-003
  timestamp: 2026-06-19T00:08:00+09:00
  command: /flow:revise
  phase: Step 2.2 Read スコープ確定
  question: 改修分析に読む範囲
  options: [推奨範囲, 絞る, 広げる]
  recommended: feedback-inbox UI + collection(runner/feedbackRunner) + providers/feedback + registry/load + dashboard nav/forcePull idiom + shipyard 契約
  chosen: 推奨範囲
  chosen_type: auto-recommended
  depends_on: []
  context: |
    UI 2 件は dashboard の nav(href=/) + force-pull section を idiom 源として参照。
    無登録 pull は collection 配線 (api/admin/collect, api/cron/collect) + feedbackRunner が中核。

- id: D20260619-004
  timestamp: 2026-06-19T00:15:00+09:00
  command: /flow:revise
  phase: Step 3.1-? 無登録 pull 方式 (真の Class C: 記録済み decision の反転)
  question: shipyard を「登録なし」で feedback pull する方式
  options:
    - "環境変数 HUB_FEEDBACK_SOURCES で追加ソース定義"
    - "feedback 専用の軽量登録 (別テーブル/フラグ + admin UI)"
    - "shipyard をハードコード"
  recommended: 環境変数で追加ソース定義 (最小変更・登録なし要件に忠実・将来拡張可)
  chosen: 環境変数 HUB_FEEDBACK_SOURCES で追加ソース定義
  chosen_type: explicit-choice
  depends_on: [C20260618-001]
  context: |
    claim C20260618-001 §5 は「shipyard を services 登録 (provider 設定込み)」と決定したが、
    ユーザーが本 revise で「登録なしで取得」に反転。Class C (記録済み decision の supersede)
    として 1 問提示。ユーザーは option1 を選択。
    形式: HUB_FEEDBACK_SOURCES = JSON [{slug,name,url}]。slug 正規表現 + isSafePublicUrl
    (SSRF) で検証し、登録済み active services にマージ (slug 重複は registered 優先で dedup)。
    secret は既存 HUB_SERVICE_INFO_SECRET 共用。metrics 収集 (runCollection) には混ぜない
    = dashboard 監視/provider 設定不要。
    supersedes: C20260618-001 §5 の「services 登録」部分 (標準 O66 化方針自体は維持)。

- id: D20260619-005
  timestamp: 2026-06-19T00:18:00+09:00
  command: /flow:revise
  phase: Step 3.1 後方互換性方針
  question: 後方互換性
  options: [互換維持, 段階的非互換, 一括非互換]
  recommended: 互換維持
  chosen: 完全互換 (HUB_FEEDBACK_SOURCES 未設定 = 現状と同一挙動、破壊変更/型変更なし)
  chosen_type: auto-recommended
  depends_on: [D20260619-004]
  context: env additive。inbox UI 追加 (nav link / pull button) も既存導線を壊さない。

- id: D20260619-006
  timestamp: 2026-06-19T00:19:00+09:00
  command: /flow:revise
  phase: Step 3.1 リリース戦略
  question: リリース方式
  options: [一括, 段階的, フィーチャーフラグ]
  recommended: 一括
  chosen: 一括 (UI additive + env 設定自体が有効化フラグ相当)
  chosen_type: auto-recommended
  depends_on: [D20260619-004]
  context: UI-only + env additive で影響極小。別途フラグ機構不要。

- id: D20260619-007
  timestamp: 2026-06-19T00:20:00+09:00
  command: /flow:revise
  phase: Step 3.1 既存テストの扱い
  question: 既存テストの扱い
  options: [全維持, 一部修正, 一部削除]
  recommended: 全維持 + 追加
  chosen: 全維持 + 追加 (sources parser / feedbackRunner マージ / inbox nav+pull)
  chosen_type: auto-recommended
  depends_on: []
  context: 既存挙動を変えない additive 改修のため既存 390 tests は回帰確認のみ。

- id: D20260619-008
  timestamp: 2026-06-19T00:21:00+09:00
  command: /flow:revise
  phase: Step 3.1 ロールバック方針
  question: ロールバック方針
  options: [コード revert, フィーチャーフラグ OFF, DB rollback]
  recommended: コード revert
  chosen: コード revert (DB 変更なしで安全。env 削除でもデータソースのみ無効化可)
  chosen_type: auto-recommended
  depends_on: [D20260619-004]
  context: マイグレーション不要 = ロールバックに DB 操作不要。

- id: D20260619-009
  timestamp: 2026-06-19T00:22:00+09:00
  command: /flow:revise
  phase: Step 3.2 機能性質タグ判定
  question: タグ
  options: [feature, auth-required, ...]
  recommended: feature + auth-required (既存継承、変更なし)
  chosen: feature + auth-required
  chosen_type: auto-recommended
  depends_on: [D20260618_009_feature]
  context: inbox は Clerk ゲート内、pull は requireSeiji の /api/admin/collect。タグ追加なし。
```
