# E2E テストレポート: feedback-inbox inquiries-reply-channel (revise)

## 実施日時
2026-06-19 (JST)

## 実行環境
- Playwright 1.60 (chromium, route-mock 方式)

## 結果

| シナリオ ID | 内容 | 結果 |
|---|---|---|
| RE-R1/R2/R3 | inquiry item の返信導線: mailto (Re:subject) + admin deep-link (rel=noopener) | ✅ |
| RE-RR1 | 標準 (context なし) item に返信導線が出ない | ✅ |
| UC1-S1/S3/S4 (回帰) | 一覧 / kind chips / 空状態 + 視覚 baseline | ✅ (baseline 変更なし) |
| RE-N1 / RE-P1·P3 / RE-P2 (回帰) | ホームリンク / 今すぐ pull / pull 401 | ✅ |
| RE-UC1-S1 (回帰) | 件数サマリ | ✅ |

**feedback-inbox spec: 9 passed**。視覚 baseline 変更なし (標準 VM は context を持たないため返信導線は描画されず、list/empty スクショ不変)。

## サマリー
| 項目 | 値 |
|---|---|
| 新規シナリオ | 2 (返信導線 + 標準 item 回帰) |
| 回帰シナリオ | 7 |
| 成功 | 9 / 9 |
