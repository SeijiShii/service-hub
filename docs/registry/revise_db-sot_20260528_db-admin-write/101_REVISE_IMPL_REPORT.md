# 実装レポート: registry (DB SoT + admin write)

## 実装日時
2026-05-28 (JST)

## モード
revise

## 関連ドキュメント
- [001_REVISE_SPEC.md](./001_REVISE_SPEC.md) / [002_REVISE_PLAN.md](./002_REVISE_PLAN.md) / [003_REVISE_UNIT_TEST.md](./003_REVISE_UNIT_TEST.md) / [004_REVISE_E2E_TEST.md](./004_REVISE_E2E_TEST.md)
- [AI_LOG セッション](../../AI_LOG/D20260528_003_tdd_registry_revise_db-sot.md)
- concept §7 [D20260528-001]/[D20260528-002]

## 注意事項
本レポートのファイルパスと行番号は実装日時時点のもの。

## 変更一覧

### Phase 1: DB スキーマ + クエリ（commit fba6f45）
- `src/db/schema.ts`: `services` テーブル追加（slug PK / name / url / subdomain / status / providers・service_info・thresholds=jsonb / created_at・updated_at）。`schema` export に services 追加。
- `src/db/queries.ts`: `listServices` / `getService` / `upsertService`(slug upsert) / `setServiceStatus` / `deleteService` + `toServiceDescriptor` マッパ。
- `src/db/testdb.ts`: services の DDL。
- `src/db/services.test.ts`: 新規（8 ケース）。

### Phase 2: registry ローダ DB 化（commit 69bea2a）
- `src/registry/load.ts`: `loadServices(db, opts)` 非同期化（listServices に委譲）。`validateServicesToml` + toml 依存撤去。
- `src/features/collection/runner.ts`: `RunnerDeps.loadServices` を `() => Promise<ServiceDescriptor[]>`、`await deps.loadServices()`。
- `api/cron/collect.ts` / `api/public/status.ts` / `api/dashboard/summary.ts` / `api/services/[slug]/timeseries.ts`: `loadServices` を db 渡し + await 化。
- `services.toml` 削除、`vercel.json` includeFiles から services.toml 除去（docs/pricing.toml 残置）。
- `src/registry/load.test.ts`: DB 版に書き換え（toml テスト削除）。

### Phase 3: admin write API + 検証（commit 9112621）
- `src/registry/validate.ts`: `validateServiceInput`（serviceDescriptorSchema 再利用＝SSRF/秘密直書き/slug 形式を write で担保）。
- `api/admin/services.ts`: Clerk ゲート内（`requireSeiji`、公開例外にしない）GET/POST/PATCH/DELETE。slug 一意 409 / 検証 400 / 未認証 401 / 未存在 404。DELETE 既定 retire、`?hard=1` 物理削除。
- テスト: `validate.test.ts`(7) + `api/admin/services.test.ts`(9)。

### Phase 4: 最小 admin フォーム（commit 48fb7c7）
- `src/features/admin/ServicesAdminView.tsx`（一覧 + 登録/編集/退役フォーム、secretEnv は収集しない）。
- `src/features/admin/ServicesAdminPage.tsx`（GET/POST/PATCH/DELETE を `/api/admin/services` に credentials:include で配線）。
- `src/main.tsx`: `/admin` ルート追加（Clerk ゲート内）。
- テスト: `ServicesAdminView.test.tsx`(4)。

## 実装計画からの差分

| 項目 | 内容 |
|------|------|
| 計画にない追加変更 | なし（PLAN 通り） |
| 計画から省略した変更 | 005_MIGRATION は当初から不要（未運用・データ移行なし）。Step 12 /flow:feedback 自動起動は session 長大化回避で skip（推奨提示） |
| 想定外の問題と対処 | validate.test の初版で errors(オブジェクト配列)を `.join` した assertion バグ → `.map(e=>e.message)` に修正。実装は正。 |
| sequencing | `adapters.ts` の clerk.secretEnv / serviceInfo.secretEnv は step 3 まで optional 残置（D20260528-006、build green 維持） |

## PR Description

### タイトル
registry: レジストリ SoT を DB + Clerk ゲート内 admin write に（再デプロイ不要化）

### 概要
新マイクロサービス追加のたびに services.toml + .env を書き換えて再デプロイする必要を解消する。レジストリ SoT を Neon の `services` テーブルに移し、HUB の Clerk ゲート内 admin フォーム/API から登録・編集・退役できるようにした。メトリクス収集の pull（D20260526-002）は不変。

### 変更内容
- `services` テーブル（slug PK + jsonb）+ CRUD クエリ
- `loadServices` を DB 非同期化、consumers を await 化、services.toml 退役
- `api/admin/services`（Clerk ゲート内 CRUD + SSRF/秘密/slug 検証 + slug 一意）
- `/admin` の最小フォーム UI
- secretEnv 系は収集しない（秘密ゼロ化、step 3 で完全撤去予定）

### テスト
- 新規/改修ユニット: services(8) + load(3 改修) + validate(7) + admin handler(9) + admin view(4)
- 全スイート: 176 passed / 30 files / 0 failed、typecheck clean
