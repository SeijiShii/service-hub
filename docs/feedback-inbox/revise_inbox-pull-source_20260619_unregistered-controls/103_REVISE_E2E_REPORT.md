# E2E テストレポート: feedback-inbox inbox-pull-source (revise)

## 実施日時
2026-06-19 (JST)

## 関連ドキュメント
- [004_REVISE_E2E_TEST.md](./004_REVISE_E2E_TEST.md) — E2E テスト計画

## 実行環境
- Playwright 1.60 (chromium, route-mock 方式)
- preview build: `VITE_CLERK_PUBLISHABLE_KEY= npm run build && npm run preview --port 4173`

## 結果

| シナリオ ID | 内容 | 結果 |
|---|---|---|
| RE-N1 | ホームへ戻るリンク (href=/) 表示 | ✅ |
| RE-P1/P3 | 今すぐ pull → POST /api/admin/collect → inbox refetch で shipyard 新着反映 | ✅ |
| RE-P2 | pull 401 → エラー (http_401) 表示・一覧不変 | ✅ |
| UC1-S1 (回帰) | 横断一覧 + kind バッジ + 新しい順 + 視覚 baseline | ✅ (nav 追加で baseline 再生成) |
| UC1-S4 (回帰) | 空状態 + 視覚 baseline | ✅ (baseline 再生成) |
| UC1-S3 (回帰) | kind chips 絞り込み | ✅ |
| RE-UC1-S1 (回帰) | 件数サマリ | ✅ |

**feedback-inbox spec: 7 passed**。視覚 baseline 2 枚 (list / empty) を nav 追加に合わせ再生成。
nav は既存 design token (border/surface) を踏襲し視覚的に整合 (Design gate 目視確認 green)。

## 移行検証
DB マイグレーションなし → 移行シナリオ該当なし。

## サマリー
| 項目 | 値 |
|---|---|
| 新規シナリオ | 3 (RE-N1 / RE-P1·P3 / RE-P2) |
| 回帰シナリオ | 4 |
| 成功 | 7 / 7 |
| 視覚 baseline 再生成 | 2 (nav 追加) |
