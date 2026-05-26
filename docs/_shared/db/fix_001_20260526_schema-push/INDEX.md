# バグ修正 #001 ドキュメントインデックス

**issue / slug**: 001 / schema-push
**重大度**: high（本番影響ゼロ＝デプロイ前検出）
**実施日**: 2026-05-26
**状態**: 修正済（Neon 適用済）

<!-- auto-generated-start -->

## ファイル一覧
| 番号 | ファイル | 種別 |
|---|---|---|
| 000 | [000_調査レポート.md](./000_調査レポート.md) | 調査 |
| 001 | [001_ROOT_CAUSE.md](./001_ROOT_CAUSE.md) | 根本原因 |
| 002 | [002_FIX_PLAN.md](./002_FIX_PLAN.md) | 修正計画 |
| 003 | [003_REGRESSION_TEST.md](./003_REGRESSION_TEST.md) | リグレッションテスト |

## 修正サマリ
- `drizzle.config.ts`（`DATABASE_URL` 未設定時のみ `.env.local` 自己ロード）+ `db:push`/`db:generate` script を追加。
- `npm run db:push` で Neon に 3 テーブル（`usage_snapshots` / `alert_events` / `collection_runs`）を適用。smoke 確認済。

## 関連
- 親 INDEX: `../INDEX.md`
- AI_LOG: `../../../AI_LOG/D20260526_011_fix__shared_auth_deploy-blockers.md`

<!-- auto-generated-end -->
