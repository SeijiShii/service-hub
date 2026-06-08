# 単体テストレポート: dashboard chart-colors (series-palette)

## 実施日時
2026-06-08 13:28 (JST)

## 関連ドキュメント
- [003_REVISE_UNIT_TEST.md](./003_REVISE_UNIT_TEST.md) - 単体テスト項目 (計画)

## テスト実行環境
- ランタイム: Node.js (ESM, `.js` 拡張 import)
- テストフレームワーク: Vitest 2.1.x (`vitest run`)

## テスト結果

| # | テストケース | テストファイル | 結果 | 備考 |
|---|------------|-------------|------|------|
| TK-U-01 | 8 色である | src/components/tokens.test.ts | ✅ | |
| TK-U-02 | idx0 は青 #5b9cf5 据置 | src/components/tokens.test.ts | ✅ | 既存互換 |
| TK-U-03 | idx1 は暖色 (橙 #fb923c) | src/components/tokens.test.ts | ✅ | 寒色固まり解消 |
| TK-U-04 | idx0..3 は青/橙/緑/ピンクの暖寒交互順 | src/components/tokens.test.ts | ✅ | |
| TK-U-04b | idx8→idx0 / idx10→idx2 循環 | src/components/tokens.test.ts | ✅ | `%8` |
| TK-U-07 | 全色相異 + 旧 #34d3a0 不在 | src/components/tokens.test.ts | ✅ | near-dup 解消 |
| (regression) | MetricChart.test.tsx 全件 | src/components/MetricChart.test.tsx | ✅ | exact hex 非依存・維持 |
| (regression) | 全スイート | (39 ファイル) | ✅ | 337/337 |

## 追加テストケース

| # | 対象 | テストケース | 追加理由 |
|---|------|------------|---------|
| TK-U-01〜07 | tokens.ts | 上記 6 件 | 新規 `tokens.test.ts`。palette の不変条件（色数・順序・near-dup 不在・循環）を固定し、将来の並べ替えリグレッションを検出 |

> 計画 003 の TK-U-06（負 index）は実呼び出しが常に ≥0 のため test 化を見送り（101 差分参照）。

## サマリー

| 項目 | 値 |
|------|-----|
| 計画テスト数 | 8件 (TK-U-01〜08) |
| 追加テスト数 | 0件（計画内で完結、TK-U-06/08 は統合・見送り → 実装 6 件） |
| 合計（新規） | 6件 |
| 成功 | 337件（全スイート） |
| 失敗 | 0件 |
| 成功率 | 100% |
