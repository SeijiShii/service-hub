# 単体テストレポート: feedback-inbox

## 実施日時
2026-06-18 (JST)

## 関連ドキュメント
- [003_feedback-inbox_UNIT_TEST.md] - 単体テスト項目 (計画)

## テスト実行環境
- TypeScript / Node 22
- vitest 2.1.9 (`npx vitest run`)
- DB テスト: @electric-sql/pglite (in-memory)
- UI テスト: @testing-library/react + jsdom

## テスト結果

| # | テストケース | テストファイル | 結果 |
|---|------------|-------------|------|
| U-02/03/03b/04/05/06/07/31 + rating/limit | feedback queries (upsert 冪等 / フィルタ / 降順 / 任意フィールド / limit cap) | src/db/feedback.test.ts (10) | ✅ |
| R2/U-08/20/21/22/23/24/25/30/32 | pull adapter (endpoint 派生 / 正常 / 404 / 401 / timeout / badschema / 未知kind / 不正item / cap / 空) | src/providers/feedback.test.ts (10) | ✅ |
| U-11/U-27 + error/db-fail | runFeedbackCollection (集約 / per-service 隔離 / 独自エラー記録) | src/features/collection/feedbackRunner.test.ts (4) | ✅ |
| U-09 + filter/VM | inbox VM (parseFeedbackFilter / buildClaimText / buildInboxVM) | src/features/feedback-inbox/inbox.test.ts (5) | ✅ |
| U-26 + 偽装 | inbox API 認可ゲート (401 paths) | api/feedback/inbox.test.ts (3) | ✅ |
| FI-V1/V2/V3/L2-3/UC3-S1 | FeedbackInboxView (一覧 / 空状態 / フィルタ上配置 / フィルタ操作 / トリアージコピー) | src/features/feedback-inbox/FeedbackInboxView.test.tsx (5) | ✅ |

## 追加テストケース
- 同一バッチ内重複の後勝ち (U-03b)、saveFeedback 失敗の `*` 記録、period=all epoch 起点、未登録 slug の name フォールバック — 計画の異常系を実装中に具体化。

## サマリー

| 項目 | 値 |
|------|-----|
| 本機能テスト数 | 37 件 |
| 本機能テスト成功 | 37 件 |
| 全スイート | 390 passed / 45 files |
| 回帰 | なし (実装前 353 → 390、runner.test.ts 14 件無改変 green) |
| 成功率 | 100% |
| 既知 Low (非ブロッカー) | queries.test.ts TS2578 (実装前から存在、feedback 無関係) |
