# E2E テストレポート: dashboard (nav-and-pull — back-link-and-relocation)

- **状態**: E2E green
- **FW**: Playwright (chromium headless、route-mock、Class A)
- **last_updated**: 2026-05-31 (flow:auto loop D20260531_001 反復8、E2E gate 取り崩し)

## サマリ
双方向 navigation (`/` → `/admin` → `/`) + force-pull relocation (admin → dashboard) を E2E で検証。

## journey 別結果
| 004 journey | spec | 結果 |
|---|---|---|
| E-NAV-FWD: `/` の「管理」→ /admin | dashboard.spec.ts DA-NAV (admin-link href=/admin) | pass |
| E-NAV-BACK-1: /admin の「← ダッシュボード」→ / | admin.spec.ts AD-2 (back-link href=/) | pass |
| force-pull が dashboard に relocation 済 (admin から除去) | dashboard.spec.ts DA-FP (dashboard で 今すぐ pull 動作) | pass |

## flaky / fix seed
なし。双方向 nav (admin-link / back-link) 確立を確認。
