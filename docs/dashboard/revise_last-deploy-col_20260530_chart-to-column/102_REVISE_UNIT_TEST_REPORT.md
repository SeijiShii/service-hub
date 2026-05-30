# 単体テストレポート: dashboard last-deploy-col

## 実施日時
2026-05-30 12:55 (JST)

## 関連ドキュメント
- [003_REVISE_UNIT_TEST.md](./003_REVISE_UNIT_TEST.md) — 単体テスト計画

## テスト実行環境
- ランタイム: Node.js (ESM)
- テストフレームワーク: Vitest 2.1.9 + @testing-library/react + jsdom
- 実行コマンド: `npm test` (`vitest run`)

## テスト結果 (last-deploy-col 関連)

| # | テストケース | テストファイル | 結果 |
|---|------------|-------------|------|
| LDC-U-01 | 有効 epoch_ms → JST `YYYY-MM-DD HH:MM` | deployAtFormat.test.ts | ✅ |
| LDC-U-20 | JST 日付境界 (UTC15:00→JST 翌00:00) | deployAtFormat.test.ts | ✅ |
| LDC-U-10 | undefined/null → — | deployAtFormat.test.ts | ✅ |
| LDC-U-11 | NaN/Infinity → — | deployAtFormat.test.ts | ✅ |
| LDC-U-13 | 0/負値 → — (adapters 0 防御) | deployAtFormat.test.ts | ✅ |
| LDC-U-02 | last_deploy_at あり → JST 表示 | ServiceRow.test.tsx | ✅ |
| LDC-U-12 | last_deploy_at 未収集 → — | ServiceRow.test.tsx | ✅ |
| LDC-U-13b | last_deploy_at=0 → — | ServiceRow.test.tsx | ✅ |
| (regression) | 既存セル (slug/alerts) 維持 | ServiceRow.test.tsx | ✅ |
| LDC-U-03 | thead に「最終デプロイ」列見出し | DashboardView.test.tsx | ✅ |
| TS-U-30 (修正) | chart 3 枚 + last_deploy_at chart 不在 | DashboardCharts.test.tsx | ✅ |
| TS-U-32 (修正) | 空 chart 3 枚 + last_deploy_at empty 不在 | DashboardCharts.test.tsx | ✅ |
| TS-U-12 (修正) | chart 順序 3 件 + last_deploy_at 非含 | summary.test.ts | ✅ |
| TS-U-10/11/51/61/M-03 (修正) | charts 件数 4→3 | summary.test.ts | ✅ |
| TS-U-40/41 (修正) | charts helper 3 件で二部構成維持 | DashboardView.test.tsx | ✅ |

## 追加テストケース

| # | 対象 | テストケース | 追加理由 |
|---|------|------------|---------|
| LDC-U-01,10,11,13,20 | deployAtFormat | 整形/フォールバック/境界 | 新規フォーマッタ |
| LDC-U-02,12,13b,regression | ServiceRow | 列表示/未収集/0/既存維持 | 新規カラム |
| LDC-U-03 | DashboardView thead | 列見出し追加 | 新規カラム |

## サマリー

| 項目 | 値 |
|------|-----|
| 計画テスト数 (003) | 追加系 LDC-U-01〜20 + 修正系 chart count |
| 追加テスト数 | 10 (deployAtFormat 5 + ServiceRow 4 + DashboardView 1) |
| 修正テスト数 | chart count/order 系 (DashboardCharts 2 + summary 6 + DashboardView 3) |
| dashboard 機能テスト合計 | 52 |
| 全スイート合計 | 297 |
| 成功 | 297 |
| 失敗 | 0 |
| 成功率 | 100% |

## 補足: 既存 typecheck 問題 (本改修と無関係)
`src/db/queries.test.ts(223,7) TS2578 Unused '@ts-expect-error'` が pre-session commit (802899b) から存在。last-deploy-col の変更 (MetricKey/queries 非変更) とは無関係。本改修による新規 tsc エラーは 0 件。別途対応推奨。
