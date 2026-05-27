# registry 変更計画書（DB SoT + admin write）

> **入力**: `./001_REVISE_SPEC.md`, `../../concept.md` §1.4 / §5.1, 既存実装（src/registry, src/db, api/*）
> **最終更新**: 2026-05-28

---

## 1. 既存ファイル変更一覧

| ファイル | 変更内容（概要） | リスク | 関連 SPEC § |
|---|---|---|---|
| `src/db/schema.ts` | `services` pgTable 追加（slug PK + jsonb 3 列 + timestamps）、`schema` export に追加 | 低（additive） | 7.3 |
| `src/db/queries.ts` | `listServices` / `getService` / `upsertService` / `setServiceStatus` / `deleteService` 追加 + `toServiceDescriptor` マッパ | 低 | 7.2 |
| `src/registry/load.ts` | toml 読み（readFileSync/@iarna/toml）を撤去 → DB クエリ委譲。`loadServices(db, opts)` 非同期化。`validateServicesToml` 削除 | 中（呼び出し側波及） | 2.2 |
| `src/registry/schema.ts` | `serviceDescriptorSchema` は write 検証で再利用（維持）。`clerk.secretEnv`/`serviceInfo.secretEnv` は **optional のまま残置**（step 3 で撤去） | 中（sequencing） | 4 |
| `src/registry/index.ts` | export 整理（validateServicesToml 削除分） | 低 | — |
| `api/cron/collect.ts` | `loadServices: () => loadServices(db, {onlyActive:true})` を **async** に。`createDb()` の db を渡す | 中 | 3 |
| `api/public/status.ts` | `loadServices({onlyActive})` → `await loadServices(db, {onlyActive})` | 中 | 3 |
| `src/features/collection/runner.ts` | `RunnerDeps.loadServices` 型を `() => Promise<ServiceDescriptor[]>` に、`const services = await deps.loadServices()` | 中 | 3 |
| `vercel.json` | `functions.includeFiles` から `services.toml` を除去（`docs/pricing.toml` は残す） | 低 | 6 |

## 2. 新規ファイル一覧

| ファイル | 責務 | 依存 | LOC 見積 |
|---|---|---|---|
| `api/admin/services.ts` | Clerk ゲート内 CRUD（POST/PATCH/DELETE）。Zod 検証 + slug 一意性 + Clerk セッション検証 | registry schema, db queries, @clerk/backend | ~90 |
| `src/features/admin/index.ts`（or registry write ヘルパ） | write ロジック（検証 → upsert / status 更新）の純関数化（テスト容易性） | registry schema, db queries | ~50 |
| `src/features/admin/ServicesAdmin.tsx`（最小フォーム） | ダッシュボード内 Clerk ゲート内ページ。一覧 + 登録/編集/retire フォーム | clerk-react, fetch /api/admin/services | ~140 |

## 3. 削除ファイル一覧

| ファイル | 削除理由 | 代替 |
|---|---|---|
| `services.toml`（ルート） | DB 一本化（[D20260528-005]、未運用ゆえ移行不要） | services テーブル + admin フォーム |
| `validateServicesToml`（load.ts 内の関数） | toml 廃止 | `serviceDescriptorSchema` を write で直接使用 |

> `@iarna/toml` 依存は **残す**（`src/features/cost-sim/pricing.ts` が `docs/pricing.toml` で使用中）。registry の利用のみ撤去。

## 4. マイグレーション要否

- DB スキーマ変更: ✅（`services` テーブル新規）→ `npm run db:push`（additive、ダウンタイム不要）
- 既存データ変換: ❌（**未運用、移行データなし**）
- 設定ファイル変更: ✅（`vercel.json` includeFiles、`services.toml` 削除）
- → **独立した 005_MIGRATION 文書は不要**。本 PLAN §4 + デプロイ手順（SPEC §6）で足りる。

## 5. 実装 Phase 分割（/dev-tdd-phase 連携）

### Phase 1: DB スキーマ + クエリ（基盤）
- `services` テーブル（schema.ts）+ `listServices`/`getService`/`upsertService`/`setServiceStatus`/`deleteService`（queries.ts）+ マッパ。
- RED: pglite で CRUD + onlyActive フィルタ + slug 一意（重複 upsert で更新）テスト。

### Phase 2: registry ローダの DB 化
- `loadServices(db, opts)` を DB 委譲・非同期化。`validateServicesToml` 削除。
- 連携波及: runner.ts の型 async 化、collect.ts / public/status.ts を await 化。
- RED: loadServices(db,{onlyActive}) が active のみ返す。runner が await で動く。

### Phase 3: admin write（API + 検証ヘルパ）
- 検証ヘルパ（純関数）: Zod safeParse → SSRF/秘密/slug 形式 + 一意性チェック → upsert/status。
- `api/admin/services.ts`: Clerk セッション検証 + POST/PATCH/DELETE。
- RED: 検証失敗 400、slug 重複 409、未認証 401、正常 201/200、internal URL 拒否、秘密直書き拒否。

### Phase 4: admin フォーム UI（最小）
- Clerk ゲート内ルートに一覧 + 登録/編集/retire フォーム。
- RED: フォーム送信が API を叩く（fetch モック）、検証エラー表示、retire 反映。

## 6. 依存関係順序
```
Phase 1 (db schema/queries) → Phase 2 (registry loader + 波及) → Phase 3 (admin API) → Phase 4 (admin UI)
```

## 7. ロールアウト計画
| ステップ | 内容 | 検証方法 |
|---|---|---|
| 1 | `db:push` で services テーブル作成 | テーブル存在確認 |
| 2 | デプロイ（services.toml 削除済み） | build green / collect が DB read で 200 |
| 3 | admin フォームから hana-memo 登録 | dashboard に hana-memo 表示 |

## 8. リスク・注意点
- **sync→async 波及漏れ**: `loadServices` の同期呼び出しが他に残ると型エラー。typecheck で網羅確認。
- **sequencing**: `adapters.ts` の `clerk.secretEnv`/`serviceInfo.secretEnv` は本 revise で触らない（optional 残置）。step 3 完了まで MAU は従来経路のままだが、未運用ゆえ実害なし。
- **Clerk セッション検証**: API ルートでの検証実装（@clerk/backend の `authenticateRequest` 等）を public-status の無認証パターンと混同しない。

## 9. 完了の定義 (DoD)
- [ ] Phase 1-4 完了、全テスト green
- [ ] typecheck green（sync→async 波及の取りこぼしなし）
- [ ] services.toml 削除 + vercel.json 更新
- [ ] admin API が未認証 401 / 検証 400 / 重複 409 を返す
- [ ] /dev-review or /flow:feedback 通過
- [ ] `clerk.secretEnv`/`serviceInfo.secretEnv` は optional 残置（step 3 撤去メモあり）

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 | /flow:revise |
