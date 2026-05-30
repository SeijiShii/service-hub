# E2E テストレポート: collection (force-pull — admin-button)

- **状態**: E2E green
- **FW**: Playwright (chromium headless、route-mock、Class A)
- **last_updated**: 2026-05-31 (flow:auto loop D20260531_001 反復8、E2E gate 取り崩し)

## サマリ
「今すぐ pull」ボタン (POST /api/admin/collect) を E2E で検証。本ボタンは nav-and-pull (D20260528-022) で /admin → dashboard へ relocation 済のため、dashboard.spec.ts で検証。

## journey 別結果
| 004 journey | spec | 結果 |
|---|---|---|
| E-FP-01: 今すぐ pull → 実行 → 結果サマリ (servicesCount / errors) 表示 | dashboard.spec.ts DA-FP (force-pull-result に「3 サービス」) | pass |

## flaky / fix seed
なし。POST /api/admin/collect は route-mock (Class A)。disabled/「実行中…」遷移 + 結果サマリ表示を確認。実 collect runner は unit (api/admin/collect.test.ts + collection/runner.test.ts) でカバー。
