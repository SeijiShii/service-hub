# 単体テストレポート: dashboard 収益(revenue)指標表示 + 契約正規化 (REVISE)

## 実施日時
2026-06-07 20:10 (JST)

## 関連ドキュメント
- [003_REVISE_UNIT_TEST.md](./003_REVISE_UNIT_TEST.md) - 単体テスト計画

## テスト実行環境
- ランタイム: Node.js (vite/vitest)
- テストフレームワーク: Vitest (`npx vitest run`)
- DOM: jsdom + @testing-library/react

## テスト結果

| # | テストケース | テストファイル | 結果 | 備考 |
|---|------------|-------------|------|------|
| REV-U-01 | revenue_total_yen あり → ¥100 | ServiceRow.test.tsx | ✅ | data-revenue-yen |
| REV-U-02 | revenue_count あり → 1 | ServiceRow.test.tsx | ✅ | data-revenue-count |
| REV-U-03 | revenue_count/revenue_total_yen 両方申告 | ServiceRow.test.tsx | ✅ | 1 / ¥100 |
| REV-U-10 | 収益 未申告 → 両セル — | ServiceRow.test.tsx | ✅ | undefined 判定 |
| REV-U-20 | 申告ありで値 0 → ¥0 / 0 | ServiceRow.test.tsx | ✅ | 0 は有効値 |
| REV-DA-01 | revenue_* が VM.metrics に generic 投影 | summary.test.ts | ✅ | VM 汎用の回帰防止 |
| REV-AD-01 | 旧 tip_* → canonical revenue_* 正規化 | adapters.test.ts | ✅ | 後方互換 alias |
| REV-AD-02 | 新 revenue_* native 受理 | adapters.test.ts | ✅ | 素通り |

## 追加テストケース

| # | 対象 | テストケース | 追加理由 |
|---|------|------------|---------|
| REV-U-01〜20 | ServiceRow | 収益 値あり/未申告/0境界 | 収益列描画の正常系・異常系・境界 |
| REV-DA-01 | buildDashboard | revenue_* の generic VM 投影 | VM 層が汎用であることの回帰防止 |
| REV-AD-01/02 | service-info adapter | 旧 tip_* 正規化 / 新 revenue_* 素通り | 後方互換エイリアスの検証 |

## サマリー

| 項目 | 値 |
|------|-----|
| 計画テスト数 | 8件 |
| 追加テスト数 | 0件 (計画通り) |
| 合計 | 8件 |
| 成功 | 8件 (本改修分) / 全 323 件 (スイート全体) |
| 失敗 | 0件 |
| 成功率 | 100% |

## リグレッション

- 全 37 テストファイル / 323 テスト パス（着手前 321 → +2 adapter alias）。既存 dashboard セル・上部 chart・service-detail・既存 service-info adapter ケースに影響なし。
- 既知の pre-existing typecheck 債務（`src/db/queries.test.ts:249` Unused @ts-expect-error）は本改修と無関係（stash しても再現）。
