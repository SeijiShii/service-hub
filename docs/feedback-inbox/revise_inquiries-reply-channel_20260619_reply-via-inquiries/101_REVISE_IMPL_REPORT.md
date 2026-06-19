# 実装レポート: feedback-inbox inquiries-reply-channel (revise)

## 実装日時
2026-06-19 (JST)

## モード
revise

## 関連ドキュメント
- [001_REVISE_SPEC.md](./001_REVISE_SPEC.md) / [002_REVISE_PLAN.md](./002_REVISE_PLAN.md) / [003_REVISE_UNIT_TEST.md](./003_REVISE_UNIT_TEST.md)
- [AI_LOG](../../AI_LOG/D20260619_007_tdd_feedback-inbox_revise_inquiries-reply-channel.md)

## 変更一覧

### Phase 1: FeedbackSource 型 + parse 拡張
- `src/features/collection/feedbackSources.ts`: `ServiceDescriptor[]` ベースから **`FeedbackSource = {slug,name,url,kind}`** ベースに refactor。
  `parseFeedbackSources` が `kind?` (既定 feedback、未知値 skip+warn) を解釈。`registeredToSource(desc)` で
  registered を `{...,url: serviceInfo.endpoint ?? url, kind:"feedback"}` に変換 (origin 派生 base を保持)。
  `mergeFeedbackSources`/`loadFeedbackTargets` を FeedbackSource ベースに。
- `feedbackSources.test.ts`: FeedbackSource + kind + registeredToSource をカバー (15 ケース)。

### Phase 2: inquiries adapter + dispatcher
- **新規** `src/providers/inquiries.ts`: `fetchInquiries(src, deps)` — `${origin}/api/hub/inquiries` を
  `HUB_SERVICE_INFO_SECRET` Bearer で pull → FeedbackItemRow[] (kind="inquiry")。
  **email/adminUrl/subject を context jsonb に取り込み** (adminUrl は isSafePublicUrl 検証通過分のみ)。
  **threadToken は破棄** (SEC-002)。401/404/badschema/timeout は per-source skip。
- **新規** `src/features/collection/fetchSource.ts`: `fetchFromSource(src, deps)` — kind 別 dispatch
  (feedback=合成 ServiceDescriptor 経由で既存 fetchFeedback 再利用 / inquiries=fetchInquiries)。
- `feedbackRunner.ts`: deps を FeedbackSource ベースに (svc.slug 参照は不変)。
- `collection/index.ts` に fetchSource を export。
- `inquiries.test.ts`: 10 ケース (取り込み/threadToken破棄/欠落/非安全adminUrl/401・404・badschema/空/dispatch)。

### Phase 3: 配線 + inbox 返信導線
- `api/admin/collect.ts` / `api/cron/collect.ts`: feedback pull の fetch を `fetchFromSource` に差し替え。
- `FeedbackInboxView.tsx`: item の context から email→「メールで返信」(mailto, Re: subject)、
  adminUrl→「<service> で返信」(target=_blank rel=noopener) を該当時のみ表示 (Clerk ゲート内)。
- `FeedbackInboxView.test.tsx`: 返信導線表示/非表示/email のみ の 3 ケース追加 (計 15)。

## 実装計画からの差分
| 項目 | 内容 |
|------|------|
| 追加変更 | feedbackRunner.test.ts / feedbackSources.test.ts を FeedbackSource 型に追従修正 (挙動不変) |
| 省略 | なし (MIGRATION は計画通り不要) |
| 想定外 | なし |

## PR Description
### タイトル
feedback-inbox: inquiries 消費で email 返信導線 (source kind + /api/hub/inquiries adapter)

### 概要
無登録ソースに endpoint 種別 (kind) を追加し、shipyard を `/api/hub/inquiries` で pull して
email(生)+adminUrl+subject を context jsonb に取り込み、運営者インボックスに返信導線を表示する。
DB スキーマ変更なし・標準 feedback ソースと後方互換。

### テスト
- 新規 18 ケース (sources kind 5 + inquiries 10 + inbox 返信 3) green、全 427 tests pass、tsc 新規エラー 0
