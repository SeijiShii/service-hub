# E2E テストレポート: _shared/types (favicon-projection)

- **状態**: E2E green (UI = admin/dashboard render、API 契約 = unit)
- **FW**: Playwright (icon UI) / unit (API 契約)
- **last_updated**: 2026-05-31 (flow:auto loop D20260531_001 反復8、E2E gate 取り崩し)

## サマリ
producer 申告 favicon URL (iconUrl) の projection。UI (一覧の ServiceIcon 表示) は admin/dashboard render でカバー、admin 経路で iconUrl を受け付けない SoT 一貫性 (FP-E2E-20) は API-level 契約のため unit でカバー。

## journey 別結果
| 004 journey | カバー手段 | 結果 |
|---|---|---|
| 一覧で iconUrl アイコン表示 (fallback = slug 頭文字) | admin.spec.ts AD-1 (ServiceIcon 含む行 render) / dashboard 一覧 | pass |
| FP-E2E-20: admin PATCH で iconUrl を受け付けない (services.icon_url 不変) | unit (api/admin/services.test.ts、admin 経路 iconUrl 拒否) | pass |
| service-info 経由でのみ iconUrl 投影 (公開 API + 内部 dashboard 両 VM) | unit (summary.ts VM projection test) | pass |

## flaky / fix seed
なし。admin write 経路の iconUrl 拒否は API 契約 (unit)、表示は UI render (E2E)。19 journey の大半は API/契約レベルで unit カバー、UI 表示部のみ E2E。
