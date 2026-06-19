# 単体テストレポート: feedback-inbox inquiries-reply-channel (revise)

## 実施日時
2026-06-19 (JST)

## テスト実行環境
- vitest 2.1.9 (`vitest run`)

## テスト結果 (新規/変更分)

| # | テストケース | ファイル | 結果 |
|---|---|---|---|
| RI-S1 | kind:inquiries を解釈 | feedbackSources.test.ts | ✅ |
| RI-S2 | kind 省略は feedback | feedbackSources.test.ts | ✅ |
| RI-E1 | 未知 kind skip+warn | feedbackSources.test.ts | ✅ |
| (registeredToSource) | serviceInfo.endpoint / url 採用 | feedbackSources.test.ts | ✅✅ |
| RI-S3 | email/adminUrl/subject を context に取り込み + kind=inquiry | inquiries.test.ts | ✅ |
| RI-E2 | threadToken 破棄 (SEC-002) | inquiries.test.ts | ✅ |
| RI-E4 | 返信情報欠落 → context なし取り込み | inquiries.test.ts | ✅ |
| RI-E5 | 非安全 adminUrl は context に入れない | inquiries.test.ts | ✅ |
| RI-E3 | 401/404/badschema skip | inquiries.test.ts | ✅ |
| RI-B1 | items=[] 空 graceful | inquiries.test.ts | ✅ |
| (不正 item) | id欠落/body空/createdAt不正 skip | inquiries.test.ts | ✅ |
| RI-S4 | fetchFromSource kind 別 dispatch (inquiries/feedback URL) | inquiries.test.ts | ✅✅ |
| RI-S5 | context.email/adminUrl で返信導線表示 | FeedbackInboxView.test.tsx | ✅ |
| RI-E6 | context なし通常 item に返信導線なし | FeedbackInboxView.test.tsx | ✅ |
| RI-E5(view) | email のみ → mail のみ表示 | FeedbackInboxView.test.tsx | ✅ |

## リグレッション
既存 feedbackSources / feedbackRunner / feedback / FeedbackInboxView テストを FeedbackSource 型へ追従 (挙動不変)、全維持。

## サマリー
| 項目 | 値 |
|---|---|
| 新規/変更テスト | 18 |
| 成功 | 18 / 18 |
| 全スイート | 427 passed (47 files)、回帰 0、tsc 新規エラー 0 |
