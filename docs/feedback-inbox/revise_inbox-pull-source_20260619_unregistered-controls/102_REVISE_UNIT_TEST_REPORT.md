# 単体テストレポート: feedback-inbox inbox-pull-source (revise)

## 実施日時
2026-06-19 (JST)

## 関連ドキュメント
- [003_REVISE_UNIT_TEST.md](./003_REVISE_UNIT_TEST.md) — 単体テスト計画

## テスト実行環境
- ランタイム: Node (TS, ESM)
- フレームワーク: vitest 2.1.9 (`vitest run`)

## テスト結果

| # | テストケース | テストファイル | 結果 | 備考 |
|---|------------|-------------|------|------|
| RU-S1 | 正常 JSON → 合成 descriptor | feedbackSources.test.ts | ✅ | status=active/providers={} |
| RU-E1 | env 未設定/空文字 → [] | feedbackSources.test.ts | ✅ | 従来挙動 |
| RU-E2 | 不正 JSON → [] + warn | feedbackSources.test.ts | ✅ | throw しない |
| RU-E2b | 非配列 JSON → [] | feedbackSources.test.ts | ✅ | |
| RU-E3 | 非安全 url skip / 安全分採用 | feedbackSources.test.ts | ✅ | http/internal host |
| RU-E4 | 不正 slug / 空 name skip | feedbackSources.test.ts | ✅ | |
| RU-B1 | url 1024 採用 / 1025 skip | feedbackSources.test.ts | ✅ | 境界 |
| RU-S2 | merge: registered+env 両方 | feedbackSources.test.ts | ✅ | |
| RU-S3 | merge: slug 重複 registered 優先 | feedbackSources.test.ts | ✅ | |
| RU-B2 | merge: env=[] は registered のみ | feedbackSources.test.ts | ✅ | |
| RE-N1 | ホームリンク href=/ | FeedbackInboxView.test.tsx | ✅ | |
| RE-P1 | 今すぐ pull click → cb | FeedbackInboxView.test.tsx | ✅ | |
| RE-P1b | running で disabled+実行中… | FeedbackInboxView.test.tsx | ✅ | |
| RE-P2 | error 表示 | FeedbackInboxView.test.tsx | ✅ | |
| RE-P3 | onForcePull 未指定で非表示 | FeedbackInboxView.test.tsx | ✅ | additive 後方互換 |

## 追加テストケース
上記 15 ケースが本改修の追加分 (parser 10 + inbox UI 5)。Page の onForcePull 統合 (RU-S5/RE-P 系の POST 配線) は E2E (`/flow:e2e`) でカバー。

## サマリー

| 項目 | 値 |
|------|-----|
| 計画テスト数 | 15 |
| 追加テスト数 | 0 (計画通り) |
| 合計 | 15 |
| 成功 | 15 |
| 失敗 | 0 |
| 成功率 | 100% |
| 全スイート | 409 passed (46 files)、回帰 0、tsc 新規エラー 0 |
