# E2E テストレポート: registry (db-sot — db-admin-write)

- **状態**: E2E green
- **FW**: Playwright (chromium headless、route-mock、Class A)
- **last_updated**: 2026-05-31 (flow:auto loop D20260531_001 反復8、E2E gate 取り崩し)

## サマリ
admin フォームからのサービス登録 (DB SoT = `services` テーブルへ POST /api/admin/services) の happy path を E2E で検証。

## journey 別結果
| 004 journey | spec | 結果 |
|---|---|---|
| UC4a: admin フォームからサービス登録 (happy) | admin.spec.ts AD-3 (slug/name/url 入力 → 登録 → save-status success) | pass |
| admin フォーム + 既存一覧表示 | admin.spec.ts AD-1 | pass |

## flaky / fix seed
なし。POST /api/admin/services は route-mock (Class A)。実 DB write は unit (api/admin/services.test.ts + db/services.test.ts) でカバー、認可は API 側 requireSeiji (本番)。
