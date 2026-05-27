# registry 変更仕様書（レジストリ SoT を Git services.toml → Neon services テーブル + admin write へ）

> **改修種別**: 機能変更（データソース転換 + 書き込み経路新設）
> **issue / slug**: db-sot / db-admin-write
> **基準 SPEC**: `../001_registry_SPEC.md`
> **最終更新**: 2026-05-28
> **タグ**: auth-required（admin write は Clerk ゲート内）, stateful（DB）
> **確定根拠**: concept §7 [D20260528-001]（DB SoT + admin write）/ [D20260528-002]（秘密ゼロ化）

---

## 1. 変更概要

レジストリの SoT を Git 管理の `services.toml`（ビルド同梱・編集に再デプロイ必須）から **Neon の `services` テーブル**へ移す。新サービス追加は **HUB の Clerk ゲート内 admin フォーム + API** で行い、**再デプロイ不要**にする。公開 POST / 共通登録鍵の自己登録は不採用（公開 write 穴・鍵漏洩の爆発半径を回避）。メトリクス収集の pull（D20260526-002）は不変。

**未運用のためデータ移行は行わない**（[D20260528-004]）。`services.toml` は削除し DB 一本化（[D20260528-005]）。hana-memo は運用開始時に admin フォームから 1 件登録する。

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC ID | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| UC4 サービス追加 | `services.toml` に追記 → commit → redeploy | HUB の admin フォームから 1 件登録（再デプロイなし） | [D20260528-001] |
| UC4 ロード | 起動時に toml を読む（同期） | `services` テーブルを読む（**非同期**） | DB 化 |

### 2.2 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| `loadServices(opts)` | 同期・toml 読み・`ServiceDescriptor[]` | **`loadServices(db, opts)` 非同期**・DB 読み・`Promise<ServiceDescriptor[]>` | **内部非互換**（呼び出し側を await 化） |
| `validateServicesToml(raw)` | toml 文字列を検証 | **廃止**（toml 廃止）。検証ロジックは `serviceDescriptorSchema` に集約し write で再利用 | 廃止 |
| 新規 `api/admin/services` | （なし） | **新設**: Clerk ゲート内 CRUD（POST/PATCH/DELETE）。Zod 検証 + slug 一意性 | 新規 |
| 新規 admin フォーム画面 | （なし） | ダッシュボード内の Clerk ゲート内ページ（登録/編集/retire） | 新規 |

### 2.3 データモデル変更
| エンティティ | 変更内容 | マイグレーション要否 |
|---|---|---|
| `services`（新テーブル） | `ServiceDescriptor` を DB 化（slug PK）。`providers`/`service_info`/`thresholds` は jsonb | スキーマ追加のみ（`db:push`）。**データ移行なし**（未運用） |

### 2.4 バリデーション・エラー変更
| 対象 | 変更前 | 変更後 |
|---|---|---|
| 検証タイミング | toml ロード時のみ | **write 経路（admin API）でも必須**（SSRF=内部アドレス禁止 / 秘密直書き検出 / slug 形式）+ slug 一意性（DB） |

## 3. 影響範囲

| 対象 | 影響度 | 説明 |
|---|---|---|
| `src/registry/`（load/schema/index） | 高 | toml ローダ撤去 → DB ローダ。schema は write 検証に再利用 |
| `src/db/`（schema/queries/client） | 高 | `services` テーブル + CRUD クエリ追加 |
| `api/admin/services.ts` | 高 | 新規（Clerk ゲート内 write） |
| ダッシュボード（admin フォーム） | 中 | 新規 UI（Clerk ゲート内ルート） |
| `api/cron/collect.ts` / `api/public/status.ts` | 中 | `loadServices` の sync→async 波及 |
| `src/features/collection/runner.ts` | 中 | `deps.loadServices` 型を `() => Promise<ServiceDescriptor[]>` に |
| `services.toml` / `vercel.json` | 中 | 削除 / `includeFiles` から services.toml 除去 |
| `src/providers/adapters.ts`（clerk/serviceInfo の secretEnv 消費） | **低（本 revise では触らない）** | step 3（①）の対象。§4 後方互換の sequencing 参照 |

## 4. 後方互換性

- **互換維持**: ❌（内部 API `loadServices` が sync→async の破壊的変更）。ただし **外部公開 API への影響なし・データ移行なし**（未運用、[D20260528-004]）。
- **sequencing（重要）**: `src/providers/adapters.ts:119-142` が `clerk.secretEnv`（MAU 用）と `serviceInfo.secretEnv` を消費している。これらは **step 3（providers ①: MAU を service-info 自己申告へ + 共通鍵 `HUB_SERVICE_INFO_SECRET`）** で撤去する対象。
  - **本 revise（step 2）では `clerk.secretEnv` / `serviceInfo.secretEnv` を schema.ts / types に optional（deprecated）のまま残す**（build green 維持）。admin フォームはこれらを収集しない（秘密ゼロ化、[D20260528-002]）。
  - step 3 で adapters.ts を共通鍵 + MAU 自己申告に切替えた後、これらフィールドと型を撤去する。
- 旧 `services.toml` 利用コードは本 revise で削除（未運用ゆえ移行不要）。

## 5. ロールバック方針

- **コード revert で戻せる**: ✅（DB テーブルは additive、revert すれば toml ローダに戻る。未運用ゆえ DB データ喪失の実害なし）。
- **DB ロールバック**: `services` テーブル DROP のみ（データなし）。
- 手順: git revert + （必要なら）`drizzle-kit` で services テーブル削除。

## 6. リリース戦略

- **方式**: 一括（内部ツール・未運用・単一ユーザー、段階展開やフィーチャーフラグ不要）。
- 手順: db:push（services テーブル作成）→ デプロイ → admin フォームから hana-memo を 1 件登録 → collect が DB から読むことを確認。

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC（新仕様）
- **UC4a 登録**: seiji が admin フォームに slug/name/url/subdomain/status/providers 識別子/serviceInfo.endpoint/thresholds を入力 → 送信 → Zod 検証通過 → `services` に upsert。
- **UC4b 編集**: 既存サービスを選び項目を更新（slug は不変キー）。
- **UC4c 停止/退役**: status を paused / retired に変更（**論理削除を既定**。物理 DELETE も API では可だが UI 既定は retire）。
- **UC4d ロード**: collection / dashboard / public-status が `loadServices(db, {onlyActive})` で DB から取得。

### 7.2 入出力（新仕様）
```ts
// src/registry（DB 版、db を受け取り非同期）
loadServices(db, opts?: { onlyActive?: boolean }): Promise<ServiceDescriptor[]>;
getService(db, slug): Promise<ServiceDescriptor | null>;
upsertService(db, descriptor): Promise<void>;        // slug で insert or update
setServiceStatus(db, slug, status): Promise<void>;   // retire / pause
// validateServicesToml は廃止。検証は serviceDescriptorSchema を write 経路で直接使用
```

admin API（`api/admin/services.ts`、Clerk 認証必須・公開例外にしない）:
- `POST /api/admin/services` body=ServiceDescriptor → 201 / 400(検証) / 409(slug 重複) / 401(未認証)
- `PATCH /api/admin/services?slug=<slug>` body=部分更新 → 200 / 404 / 400 / 401
- `DELETE /api/admin/services?slug=<slug>` → 200（既定 retire、`?hard=1` で物理削除）/ 401

### 7.3 データモデル（新仕様）
`services` テーブル（Drizzle, `src/db/schema.ts`）:
| カラム | 型 | 備考 |
|---|---|---|
| slug | text PK | 一意キー（PK で一意性担保） |
| name | text not null | |
| url | text not null | publicUrl 検証 |
| subdomain | text | 任意 |
| status | text not null default 'active' | active/paused/retired |
| providers | jsonb | 非機密識別子のみ（vercel/neon/cloudflare/sentry。clerk は appId 任意） |
| service_info | jsonb | `{ endpoint }`（secretEnv は持たない、共通鍵は env） |
| thresholds | jsonb | 任意 |
| created_at / updated_at | timestamptz default now() | |

### 7.4 バリデーション・エラー（新仕様）
- write（POST/PATCH）で `serviceDescriptorSchema.safeParse` を実行。失敗は 400 + errors[]。
- SSRF: `publicUrl`（既存 `INTERNAL` 正規表現）で url / serviceInfo.endpoint の内部アドレスを拒否。
- 秘密直書き: `envName` の `SECRET_LITERAL` 検出で provider 識別子等への秘密混入を拒否。
- slug: `^[a-z0-9-]+$` + DB 一意（重複は 409）。
- **認証**: Clerk セッション検証（seiji のみ）。未認証/別人は 401。public-status のような無認証例外には**しない**。

### 7.5 機能固有 NFR + 既存連携（新仕様）
- 読み取り低頻度（collection 開始時 + 画面表示）。DB read は軽量。
- write は seiji 手動・低頻度。レート制限は単一ユーザーゆえ不要だが Clerk ゲートで実質保護。
- 連携（被依存）: collection / dashboard / service-detail / public-status はすべて DB read に統一。

## 8. タグ別追加項目
- **auth-required**: admin API は Clerk backend でセッション検証。全ルート Clerk gate の例外（public-status）とは別に、明示的に認証必須。
- **stateful**: services テーブルが唯一の SoT。snapshots は service_slug で services を参照（FK は張らず slug 文字列参照、retire 後も履歴保持）。

## 9. 未決事項
現時点で論点なし（2026-05-28）。物理削除 vs retire は「UI 既定 retire / API で hard 可」で確定。providers の secretEnv 撤去は step 3 に委譲（本 revise はフィールドを deprecated 残置）。

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成（DB SoT + admin write、未運用ゆえ移行なし・toml 削除） | /flow:revise |
