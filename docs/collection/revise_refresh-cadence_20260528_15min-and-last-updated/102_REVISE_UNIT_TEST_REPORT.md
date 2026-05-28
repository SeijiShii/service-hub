# 単体テストレポート: collection refresh-cadence

## 実施日時
2026-05-28 12:15 (JST)

## テスト実行環境
- vitest 2.1.9 (happy-dom + @testing-library/react)
- `vi.useFakeTimers()` + `vi.setSystemTime` で相対時間の決定的化

## テスト結果

| # | テストケース | ファイル | 結果 |
|---|---|---|---|
| RC-N1 | `buildDashboard` VM に `lastUpdatedAt`=finishedAt + `lastRunStatus="ok"` | summary.test.ts | ✓ |
| RC-E1 (VM) | lastRun 無し → null 両フィールド | summary.test.ts | ✓ |
| RC-B1 | finishedAt 未確定 (実行中) → startedAt 採用 | summary.test.ts | ✓ |
| RC-N2 | View: JST 表記 "2026-05-28" + "12:00" を含む | DashboardView.test.tsx | ✓ |
| RC-N3 | View: 10 分前 (現在 03:10 vs 03:00) → "10 分前" 表記 | DashboardView.test.tsx | ✓ |
| RC-E1 (View) | lastUpdatedAt=null → "未収集" 表記 | DashboardView.test.tsx | ✓ |
| RC-E2 | lastRunStatus="failed" → `data-status="failed"` + "failed" 文字 | DashboardView.test.tsx | ✓ |
| 既存 | DA-N1/N2/N4/E1/E3 + UX-N1 など | dashboard 配下 | ✓ (全保持) |

## 追加テストケース
- RC-N1/E1/B1: SPEC §7.2 VM 拡張の正常 / 未収集 / 実行中
- RC-N2/N3/E1/E2: SPEC §7.1 UC-LU1 「最終更新: ...」「未収集」「failed 警告色」

## サマリー
| 項目 | 値 |
|---|---|
| 本 revise 関連の新規テスト | 7 (RC-N1/N2/N3 + RC-E1/E2 + RC-B1、E1 は VM 側と View 側で別ケース) |
| 全スイート合計 | 186 |
| 成功 | 186 |
| 失敗 | 0 |
| 成功率 | 100% |
| typecheck | exit 0 |
| 既存テスト破壊 | なし (`vm()` ヘルパに `lastUpdatedAt: null / lastRunStatus: null` 既定追加で吸収) |
