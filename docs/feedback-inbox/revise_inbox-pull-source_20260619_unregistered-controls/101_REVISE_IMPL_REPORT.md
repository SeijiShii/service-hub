# 実装レポート: feedback-inbox inbox-pull-source (revise)

## 実装日時
2026-06-19 (JST)

## モード
revise

## 関連ドキュメント
- [001_REVISE_SPEC.md](./001_REVISE_SPEC.md) — 変更仕様
- [002_REVISE_PLAN.md](./002_REVISE_PLAN.md) — 変更計画
- [003_REVISE_UNIT_TEST.md](./003_REVISE_UNIT_TEST.md) — 単体テスト計画
- [AI_LOG](../../AI_LOG/D20260619_003_tdd_feedback-inbox_revise_inbox-pull-source.md)

## 注意事項
本レポートのファイルパス・行番号は実装日時時点のもの。

## 変更一覧

### Phase 1: feedbackSources パーサ (新規)
- **新規** `src/features/collection/feedbackSources.ts`:
  - `parseFeedbackSources(env)` — `HUB_FEEDBACK_SOURCES` (JSON `[{slug,name,url}]`) を合成 `ServiceDescriptor[]` に parse。slug 正規表現 (`^[a-z0-9-]+$`) + name 非空 + `isSafePublicUrl(url)` (SSRF/https/≤1024) で検証、不正 JSON 全体 → `[]`、不正エントリ単体 → skip + `console.warn`。
  - `mergeFeedbackSources(registered, extra)` — slug dedup マージ (registered 優先)。
  - `loadFeedbackTargets(loadRegistered, env)` — registered active ∪ env sources を返す配線用ヘルパ。
- **新規** `src/features/collection/feedbackSources.test.ts` — 10 ケース (正常/不正JSON/非配列/非安全url/不正slug・name/url境界1024/merge dedup)。
- `src/features/collection/index.ts` に `export * from "./feedbackSources.js"` 追加。

### Phase 2: collect 配線
- `api/admin/collect.ts` / `api/cron/collect.ts`: `runFeedbackCollection` の `loadServices` を
  `loadFeedbackTargets(() => loadServices(db,{onlyActive:true}), process.env)` に差し替え。
  env 未設定時は registered のみ (従来同一)。`runCollection` (metrics) には合流させない = dashboard 監視非対象。

### Phase 3: インボックス UI
- `FeedbackInboxView.tsx`: `InboxPullState` 型 + `onForcePull?`/`forcePullState?` props 追加。ヘッダ nav に
  「← ホーム」リンク (`href="/"`, data-testid=home-link) + `onForcePull` 指定時のみ「今すぐ pull」ボタン
  (running で disabled+「実行中…」、error 表示)。design token スタイル踏襲 (dashboard idiom)。
- `FeedbackInboxPage.tsx`: `useFetch` の `refetch` 取得、`onForcePull` (POST /api/admin/collect credentials:include → 成功で refetch) を実装し View へ配線。
- `FeedbackInboxView.test.tsx`: home-link / pull click / running disabled / error / 未指定時非表示 の 5 ケース追加。

## 実装計画からの差分

| 項目 | 内容 |
|------|------|
| 計画にない追加変更 | なし |
| 計画から省略した変更 | なし (MIGRATION は計画通り不要) |
| 想定外の問題と対処 | なし |

## PR Description

### タイトル
feedback-inbox: 無登録 shipyard pull (HUB_FEEDBACK_SOURCES) + inbox ホームリンク/その場 pull

### 概要
shipyard 等を `services` 登録なしで feedback 取得できる env ソース機構を追加し、運営者インボックスに
ホーム導線とその場 pull ボタンを追加。env 未設定時は従来挙動と完全互換、DB/公開 API 不変。

### 変更内容
- `HUB_FEEDBACK_SOURCES` env で無登録 feedback ソースを定義 → 手動/cron pull に合流 (registered 優先 dedup)
- `/feedback` インボックスに「← ホーム」リンク + 「今すぐ pull」ボタン

### テスト
- 新規 19 ケース (parser 10 + inbox UI 5 + 既存維持) green、全 409 tests pass、tsc clean (新規エラー 0)
