# D20260608_004 e2e: dashboard chart-ux

**実行日時**: 2026-06-08 (+09:00)
**コマンド**: /flow:e2e dashboard chart-ux
**対象**: dashboard / revise_chart-ux_20260608_axis-period-usd-cleanup
**実行者**: seiji + Claude
**状態**: 完了 (E2E green、full suite 16 pass)

**含まれる decision 範囲**: D20260608-011〜012

## 主要決定サマリ
| id | テーマ | chosen |
|---|---|---|
| D20260608-011 | route glob 修正 | `summary` → `summary*` で ?period クエリに対応 (mock 不一致を解消) |
| D20260608-012 | visual baseline 再生成 | ユーザー承認のうえ dashboard-happy.png を新 UI (2 chart + 期間セレクタ) で再生成 |

## metrics
metrics: { e2e_specs: 16, pass: 16, fail: 0, flaky: 0 }

## 生成・更新ファイル
- e2e/dashboard.spec.ts (route glob + chart assertion + CX-E2E-01 期間セレクタ追加)
- e2e/fixtures.ts (fixtureCharts 2 件化)
- e2e/dashboard.spec.ts-snapshots/dashboard-happy-chromium-linux.png (再生成)
- 103_REVISE_E2E_REPORT.md / INDEX 群

## Decisions
- id: D20260608-011
  timestamp: 2026-06-08T12:20:00+09:00
  command: /flow:e2e
  phase: Step 3 RED 切り分け
  question: dashboard 全 route-mock が効かない原因
  chosen: route glob を `**/api/dashboard/summary*` に修正
  chosen_type: auto-recommended
  context: DashboardPage が `/api/dashboard/summary?period=30d` を要求するようになり、末尾ワイルドカード無しの glob が query 付き URL に一致しなくなった。テスト側の問題 (実装バグではない)。

- id: D20260608-012
  timestamp: 2026-06-08T12:25:00+09:00
  command: /flow:e2e
  phase: Step 4 visual 回帰
  question: dashboard-happy.png baseline の再生成可否 (Class C: 誤更新は隠れ回帰)
  options: [再生成してコミット, screenshot assertion 削除, 今はやらない]
  chosen: 再生成してコミット
  chosen_type: explicit-choice
  context: chart 4→2 集約 + 期間セレクタ追加で 6676px (0.01) の意図した差分。機能 assertion は全 pass。ユーザー承認のうえ --update-snapshots で再生成、再実行で green 確認。
