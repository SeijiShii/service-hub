# バグ修正 #001 ドキュメントインデックス

**issue / slug**: 001 / clerk-session-verify
**重大度**: high（本番影響ゼロ＝デプロイ前検出）
**実施日**: 2026-05-26
**状態**: 修正済（GREEN）

<!-- auto-generated-start -->

## ファイル一覧
| 番号 | ファイル | 種別 |
|---|---|---|
| 000 | [000_調査レポート.md](./000_調査レポート.md) | 調査 |
| 001 | [001_ROOT_CAUSE.md](./001_ROOT_CAUSE.md) | 根本原因 |
| 002 | [002_FIX_PLAN.md](./002_FIX_PLAN.md) | 修正計画 |
| 003 | [003_REGRESSION_TEST.md](./003_REGRESSION_TEST.md) | リグレッションテスト |

## 修正サマリ
- `@clerk/backend` 導入。`src/auth/server.ts` を `async getAuthFromRequest` + `readSessionToken`（`__session` cookie）+ `verifyToken`（注入 seam）に書換。
- 無検証の `x-clerk-user-id` ヘッダ路を撤去（本番偽装防止）。
- handler 2 箇所（dashboard/summary, services/[slug]/timeseries）を `await` 化。
- `src/auth/server.test.ts` 8 tests 追加。全 95 tests / typecheck / build GREEN。

## 関連
- 親 INDEX: `../INDEX.md`
- AI_LOG: `../../../AI_LOG/D20260526_011_fix__shared_auth_deploy-blockers.md`

<!-- auto-generated-end -->
