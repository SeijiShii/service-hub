# E2E テストレポート: _shared/auth (public-status-api)

- **状態**: E2E green (API-level、smoke + unit でカバー)
- **FW**: Playwright (UI journey なし) / post-deploy smoke (HTTP)
- **last_updated**: 2026-05-31 (flow:auto loop D20260531_001 反復8、E2E gate 取り崩し)

## サマリ
public status エンドポイント (`/api/public/status`) は**認証不要の JSON API** で UI journey を持たない。headless ブラウザ E2E は非該当。**本番 HTTP smoke + unit** でカバー。

## journey 別結果
| 004 journey | カバー手段 | 結果 |
|---|---|---|
| GET /api/public/status が 200 + 公開可能な status JSON を返す | 本番 post-deploy smoke (D20260531_008: `/api/public/status` → 200) | pass |
| 認証必須 API (/api/dashboard/summary 等) は 401 ゲート | 本番 smoke (`/api/dashboard/summary` → 401) | pass |
| status JSON のフィールド/秘密非露出 | unit (api/public/status.test.ts) | pass |

## flaky / fix seed
なし。pure-API のため UI E2E 非該当を明示。public 200 / authed 401 の差は 10th deploy smoke で実証済。
