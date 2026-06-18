# 実装レポート: feedback-inbox

## 実装日時
2026-06-18 (JST)

## モード
feature

## 関連ドキュメント
- [001_feedback-inbox_SPEC.md] - 仕様書
- [002_feedback-inbox_PLAN.md] - 実装計画書
- [003_feedback-inbox_UNIT_TEST.md] - 単体テスト項目
- [905_feedback-inbox_SPEC_REVIEW.md] - 実装前設計レビュー (R1-R7 反映済)
- [AI_LOG セッション](../AI_LOG/D20260618_011_tdd_feedback-inbox.md) - 設計判断ログ

## 注意事項
本レポートのファイルパスは実装日時時点のもの。以後の変更で行番号がずれる場合がある。

## 変更一覧

### Phase 1: 契約型 + DB スキーマ + queries
- `src/types/feedback.ts` (新規): `FeedbackKind` / `FeedbackItem` / `FeedbackResponse` / `FeedbackItemRow` / `FeedbackFilter` + 定数 (`FEEDBACK_KINDS` / `FEEDBACK_BODY_MAX=4000` / `FEEDBACK_LIST_LIMIT=200`)
- `src/types/index.ts`: feedback 型を re-export
- `src/db/schema.ts`: `feedbackItems` pgTable (id 合成 PK + unique(serviceSlug,externalId) + index(serviceSlug,createdAt)) + `schema` export 追加
- `src/db/testdb.ts`: pglite DDL に feedback_items + index 追加
- `src/db/queries.ts`: `upsertFeedbackItems` (冪等 upsert、onConflict last-wins、in-batch dedupe) + `listFeedback` (service/kind/since フィルタ + createdAt 降順 + limit cap)

### Phase 2: pull adapter
- `src/providers/feedback.ts` (新規): `feedbackEndpoint` (R2 origin 派生) + `fetchFeedback` (safeFetch 直接=R4、404/401/timeout/badschema を空+error に、item 検証: 未知 kind/不正 createdAt/空 body/id 欠落 skip、body length cap)

### Phase 3: feedback orchestration (runner と分離=R1) + cron 配線
- `src/features/collection/feedbackRunner.ts` (新規): `runFeedbackCollection` (per-service pull → 集約 → saveFeedback、per-service try/catch、独自エラーサマリ=R3)
- `src/features/collection/index.ts`: feedbackRunner を re-export
- `api/cron/collect.ts`: `runCollection` の後に `runFeedbackCollection` を invoke、レスポンスに `feedback` サマリ付与。**runner.ts は無改変** (R1)

### Phase 4: inbox API + ビューモデル
- `src/features/feedback-inbox/inbox.ts` (新規): `parseFeedbackFilter` (period→since、不正 kind 無視) / `buildClaimText` (トリアージ用) / `buildInboxVM` (slug→name 解決)
- `src/features/feedback-inbox/index.ts` (新規)
- `api/feedback/inbox.ts` (新規): `GET /api/feedback/inbox` (requireSeiji + フィルタ + listFeedback + buildInboxVM)

### Phase 5: UI
- `src/features/feedback-inbox/FeedbackInboxView.tsx` (新規): 一覧 + フィルタ (service/kind/period) + kind バッジ + 空状態 + トリアージ (クレーム文クリップボードコピー)。`ServiceIcon` 再利用 (R5)
- `src/features/feedback-inbox/FeedbackInboxPage.tsx` (新規): useFetch でデータ取得
- `src/main.tsx`: `/feedback` ルート追加

## 実装計画からの差分

| 項目 | 内容 |
|------|------|
| 計画にない追加変更 | なし |
| 計画から省略した変更 | なし (spec-review R1 で runner.ts 統合 → feedbackRunner 別関数に設計変更済、PLAN 反映済) |
| 想定外の問題と対処 | UI テストで navigator.clipboard が getter のため Object.defineProperty でモック (テストのみ) |

## PR Description

### タイトル
feedback-inbox: 運営者フィードバック/問い合わせインボックス ([論点-007]/O67 consumer)

### 概要
各サービスの `GET /api/hub/feedback` (O66 producer) を `HUB_SERVICE_INFO_SECRET` で pull し、運営者が `/feedback` で横断閲覧する consumer 機能。service-info pull と同型・別責務 (別 orchestration)。ServiceHUB 側の追従漏れを O67 + audit #4 が検出する。

### 変更内容
- feedback 契約型 + `feedback_items` テーブル + 冪等 queries
- feedback pull adapter (origin 派生 endpoint、safeFetch、graceful degradation)
- `runFeedbackCollection` 別 orchestration + cron 配線 (runner.ts 無改変)
- inbox API + ビューモデル + React 一覧/フィルタ/トリアージ UI + `/feedback` ルート

### テスト
- unit: 37 tests green (queries 10 / adapter 10 / runner 4 / VM 5 / api 3 / view 5)
- 全スイート 390 passed (回帰なし、353→390)
- 残: prod DB 反映 (`db:push` で feedback_items 列 = Class B、/flow:release)
