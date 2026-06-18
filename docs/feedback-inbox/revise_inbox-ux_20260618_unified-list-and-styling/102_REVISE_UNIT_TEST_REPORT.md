# 単体テストレポート: feedback-inbox inbox-ux

## 実施日時
2026-06-18 (JST)

## テスト実行環境
- TypeScript / Node 22 / vitest 2.1.9 / @testing-library/react + jsdom

## テスト結果
| # | テストケース | ファイル | 結果 |
|---|---|---|---|
| RU-01 | buildInboxVM counts (total + kind 別) | src/features/feedback-inbox/inbox.test.ts | ✅ |
| RU-02 | buildInboxVM counts (空) | 同 | ✅ |
| RU-03 | 件数サマリ「全 N 件」表示 | src/features/feedback-inbox/FeedbackInboxView.test.tsx | ✅ |
| RU-05 | kind segmented chips → onKindChange (すべて→空文字) | 同 | ✅ |
| 既存 FI-V1〜UC3-S1 (5) | testid/role 維持で回帰なし | 同 | ✅ |
| 既存 inbox VM (5) | parseFeedbackFilter/buildClaimText/buildInboxVM | inbox.test.ts | ✅ |

## 追加テストケース
- RU-04 (per-item サービス強調) は既存 FI-V1 (サービス名表示) で実質カバーのため独立追加なし。

## サマリー
| 項目 | 値 |
|------|-----|
| 本改修テスト数 | +4 (RU-01/02/03/05) |
| feedback-inbox 計 | 14 (inbox 7 + View 7) |
| 全スイート | 394 passed / 45 files |
| 回帰 | なし (390→394) |
| 成功率 | 100% |
| typecheck | clean (既知 TS2578 のみ、本改修無関係) |
