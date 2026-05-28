# _shared/types 変更計画書（favicon-projection）

> **入力**: `./001_REVISE_SPEC.md`, `../../concept.md` §1.4, Step 2 Read で確認した実装 (src/types/, src/db/, src/providers/, src/features/public-status/, src/registry/ + bousai-bag-checker 連動 PJ の現状)
> **最終更新**: 2026-05-28

---

## 1. 既存ファイル変更一覧

| ファイル | 変更内容（概要） | リスク | 関連 SPEC § |
|---|---|---|---|
| `src/types/service.ts` | `ServiceInfoResponse` に `iconUrl?: string` 追加 (JSDoc に v2 schemaVersion bump 説明)、`ServiceDescriptor` に `iconUrl?: string` 追加 | 低 (additive 型) | §7.2 |
| `src/types/index.ts` | re-export 変更なし (既に service.ts 全 export) | 無 | - |
| `src/db/schema.ts` | `services` テーブルに `iconUrl: text("icon_url")` カラム追加 (nullable) | 低 (DB schema 追加、migration で適用) | §7.3 |
| `src/db/queries.ts` | (1) `toServiceDescriptor` に `iconUrl: r.iconUrl ?? undefined` 追加 (2) `upsertService` は iconUrl 経路を**意図的に追加しない** (admin write からは設定不可、SoT 衝突防止) — `serviceInfo` と同列に追加してしまわないよう注意 (3) 新規 `updateServiceMeta(db, slug, {iconUrl})` 関数追加 — `services.icon_url` のみを update | 中 (admin 経路で誤って iconUrl を上書きしないことを test で担保) | §7.3, §7.4 |
| `src/providers/adapters.ts` | `createServiceInfoAdapter` 戻り値型を `{metrics: UsageMetric[]; meta?: {iconUrl?: string}}` に拡張 — 既存の wrap ヘルパが metrics のみ扱う構造のため、wrap の戻り値型を `CollectResult & {meta?: ServiceMeta}` に拡張するか、別関数で meta を返す。具体実装は §5 Phase 1 で決定 | **中** (型拡張が runner.ts まで波及) | §7.1 SI-UC2 |
| `src/registry/schema.ts` | **変更なし** — `serviceDescriptorSchema` に iconUrl は追加しない (admin write 経路では受け付けない、SoT 一貫性) | 無 | §3 影響範囲 |
| `src/features/public-status/buildPublicStatus.ts` | DTO build 部の `out: PublicServiceStatus = {slug, name, url, status}` に `if (svc.iconUrl) out.iconUrl = svc.iconUrl;` 追加 | 低 (1 行追加) | §7.2 |
| `src/features/public-status/buildPublicStatus.test.ts` | iconUrl 投影テスト追加 + 内部キー非含有テストの allowlist に iconUrl 追加 | 低 | 003_UNIT_TEST §1.1 |
| `src/types/types.test.ts` | ServiceInfoResponse v2 型テストに iconUrl 含むケース追加 (v1 互換も維持) | 低 | 003_UNIT_TEST §1.1 |
| `src/db/services.test.ts` | services テーブル round-trip テストに iconUrl 含むケース追加 + admin write 経路で iconUrl を渡しても無視される (or schema 検証で拒否される) ことを assert | 中 | 003_UNIT_TEST §1.3 |
| `src/providers/adapters.test.ts` | service-info adapter テストに iconUrl 抽出ケース + format check (https / 1024 / 内部アドレス) ケース追加 | 中 | 003_UNIT_TEST §1.1, §1.2 |
| `src/features/collection/runner.ts` | adapter 戻り値の `meta` を受け取って `updateServiceMeta` を呼ぶ経路追加 (具体は §5 Phase 1 で実装方式確定) | **中** (runner 型変更) | §7.1 SI-UC2 |
| `src/features/collection/*.test.ts` | runner テストに meta 経路追加 | 低 | 003_UNIT_TEST §4 |
| `api/public/status.ts` | **変更なし** (DTO 拡張は型レベルで吸収、handler ロジック不変) | 無 | §3 影響範囲 |
| `api/cron/collect.ts` | **変更なし** (既存 cron path で service-info adapter が自動的に iconUrl 更新) | 無 | §3 影響範囲 |
| `docs/_shared/types/001_types_SPEC.md` | §1.2 ServiceInfoResponse の schemaVersion を「v1 (legacy) / v2 (current)」に annotate、iconUrl?: string を追加。§1.2 ServiceDescriptor に iconUrl 追加。§8 未決事項に解決済 [論点-T1] を維持、新規 [論点-T2] = v1/v2 受信ロジックを追加 (本 revise SPEC を参照) | 低 | §2.1, §7.2 |
| `docs/_shared/auth/001_auth_SPEC.md` | public-status DTO の表に iconUrl 追加 (本 revise から参照) | 低 | §2.2 |

## 2. 新規ファイル一覧

| ファイル | 責務 | 依存 | LOC 見積 |
|---|---|---|---|
| `drizzle/<NNNN>_add_services_icon_url.sql` (migration) | `ALTER TABLE services ADD COLUMN icon_url text;` (rollback: DROP COLUMN) | drizzle-kit migration system | ~5 |
| `src/db/serviceMeta.ts` (or queries.ts に追記) | `updateServiceMeta(db, slug, {iconUrl})` 純関数 — `services.icon_url` のみ update、updatedAt 更新、null/undefined 引数は no-op (保持セマンティクス, [論点-FP2]) | drizzle | ~30 |
| `src/db/serviceMeta.test.ts` (or queries.test.ts に追記) | updateServiceMeta テスト (set / no-op / format invalid → adapter 側で reject 済前提) | testdb | ~50 |

## 3. 削除ファイル一覧

| ファイル | 削除理由 | 代替 |
|---|---|---|
| (なし) | additive 改修のため削除なし | - |

## 4. マイグレーション要否

- DB スキーマ変更: ✅ **必要** (`services.icon_url text` 追加、詳細は 005_REVISE_MIGRATION.md)
- 既存データ変換: ❌ 不要 (新規 nullable カラム、既存行は NULL でデフォルト)
- 設定ファイル変更: ❌ 不要
- ストレージパス変更: ❌ 不要

## 5. 実装 Phase 分割（`/flow:tdd-phase` 連携）

### Phase 1: DB schema + 型拡張 (RED→GREEN→IMPROVE)
- **対象**: `src/types/service.ts` + `src/db/schema.ts` + drizzle migration + `src/db/queries.ts` (`toServiceDescriptor` 拡張 + `updateServiceMeta` 新設)
- **ゴール**:
  - ServiceInfoResponse + ServiceDescriptor 型に iconUrl 追加 (型テスト green)
  - services テーブル + drizzle migration 追加 (migration apply → カラム存在確認)
  - `updateServiceMeta(db, slug, {iconUrl})` 実装 + テスト (set / no-op / 既存値保持)
  - `toServiceDescriptor` に iconUrl 反映 (round-trip テスト green)
  - **admin write 経路 (`upsertService`) では iconUrl を受け付けない** ことを test で assert (SoT 一貫性)

### Phase 2: service-info adapter で iconUrl 抽出 + format check (RED→GREEN→IMPROVE)
- **対象**: `src/providers/adapters.ts` + `src/providers/adapters.test.ts` + runner 連携の最小骨格
- **ゴール**:
  - `createServiceInfoAdapter` が ServiceInfoResponse から iconUrl 抽出 (v1/v2 両対応、optional)
  - format check: URL parse + https + 1024 chars + internal アドレス拒否 (publicUrl 相当ロジック、registry/schema.ts の `publicUrl` を共通化 or 同等ロジックを adapter に書く)
  - adapter 戻り値型拡張 (`{metrics, meta?: {iconUrl?}}`) + runner で meta を受け取って `updateServiceMeta` 呼び出し
  - テスト: 正常 / iconUrl 無し / http / 内部アドレス / 1024 超 / 空文字 / non-string

### Phase 3: public-status DTO 投影 (RED→GREEN→IMPROVE)
- **対象**: `src/features/public-status/buildPublicStatus.ts` + `buildPublicStatus.test.ts`
- **ゴール**:
  - `PublicServiceStatus` 型に iconUrl 追加 (型は Phase 1 で対応済)
  - `buildPublicStatus` で `svc.iconUrl` を DTO に投影 (有/無テスト)
  - 既存 「内部キー非含有」テストの allowlist に iconUrl を加える (revenue 等は引き続き禁止のまま)

### Phase 4: 設計文書 + 整合性確認 (IMPROVE 系統)
- **対象**: `docs/_shared/types/001_types_SPEC.md` (§1.2 contract annotate)、`docs/_shared/auth/001_auth_SPEC.md` (DTO 表更新)
- **ゴール**: 既存設計文書を本 revise SPEC と整合させる (drift 防止)

## 6. 依存関係順序

```mermaid
graph TD
  A[Phase 1: DB schema + 型 + updateServiceMeta] --> B[Phase 2: service-info adapter で iconUrl 抽出 + runner 連携]
  A --> C[Phase 3: buildPublicStatus で投影]
  B --> D[Phase 4: 既存 SPEC 整合更新]
  C --> D
```

Phase 2 と Phase 3 は型 (Phase 1) 完了後に並行可能。ただし `/flow:tdd` の単一スレッド実行では Phase 1 → 2 → 3 → 4 の順で進める。

## 7. ロールアウト計画

| ステップ | 内容 | 期日 | 検証方法 |
|---|---|---|---|
| RO-1 | service-hub Phase 1-4 実装 (本 PJ) + tdd green | 本セッション後 (次セッションで /flow:tdd 起動) | unit test green + 既存 e2e green |
| RO-2 | drizzle migration 本番適用 (`scripts/with-env.sh drizzle-kit migrate`) | RO-1 同時 | `\d services` で icon_url 列確認 |
| RO-3 | service-hub deploy (vercel production) | RO-1 直後 | `/api/public/status` 200 + iconUrl optional 含む (NULL 状態) |
| RO-4 | bousai-bag-checker で同 slug `favicon-projection` の連動 revise + tdd + deploy (producer 側) | 次々セッション (1-3 日後想定) | bousai-bag-checker `/api/hub/service-info` レスポンスに iconUrl: 'https://.../favicon.svg' 含む |
| RO-5 | service-hub cron collect 翌日実行 → services.icon_url 更新確認 | RO-4 翌日 | DB `select slug, icon_url from services` + `/api/public/status` に iconUrl 反映 |
| RO-6 | shipyard で iconUrl 利用 + fallback 実装 (shipyard PJ の責務、本 revise の責務外) | shipyard リリース時 | shipyard 一覧画面で各 service のアイコン表示 + 未対応 service は fallback アイコン |
| RO-7 | 将来登録 producer 全てが v2 contract 対応 | 継続 | 新規登録時の onboard checklist に「iconUrl 申告」追加 (perspectives O48 更新、[論点-FP1]) |

**フィーチャーフラグ**: 不要 (additive 後方互換、段階的 producer 対応)

## 8. リスク・注意点

- **runner 型変更の波及**: adapter 戻り値型を `{metrics, meta?}` に拡張するため、`src/features/collection/runner.ts` の型シグネチャ変更が必要。既存 adapter (ping/vercel/neon) は meta を返さない → runner で `meta == null` の場合は updateServiceMeta を呼ばない分岐
- **SoT 衝突防止**: `services.icon_url` を admin write からも update できる状態にすると、producer 申告と admin 編集が衝突する。本 PLAN では admin write 経路に iconUrl を**意図的に追加しない**。テストで `upsertService(svc with iconUrl)` を呼んでも iconUrl が無視されることを assert
- **format check の SSRF 予防**: producer 自己申告 URL がそのまま shipyard に渡って `<img src>` で fetch される。internal アドレス (`10.x.x.x` 等) や `javascript:` プロトコルが入ると shipyard ユーザーに影響 → adapter 側で `publicUrl` 相当ロジックで弾く。registry/schema.ts の `publicUrl` を共通モジュール化することを Phase 2 で検討
- **migration rollback の安全性**: `DROP COLUMN icon_url` は受信値を失うが、producer から再取得可能なため**永続損失なし**
- **連動 PJ タイミング**: bousai-bag-checker 側の revise を忘れると一時的に iconUrl 空のままだが、後方互換のため UI は fallback で動く (リスク小)
- **CF-20260528-016 (本 PJ 検知)**: flow:revise §Step 3.1 に「対外契約変更フラグ」項目化が未済。本 PJ では人為的に補完運用、flow-suite 側 commit はユーザー手動

## 9. 完了の定義 (DoD)

- [ ] Phase 1-4 完了
- [ ] 単体テストカバレッジ目標達成 (行 80% / 分岐 70% 継承)
- [ ] E2E シナリオ全成功 (004_REVISE_E2E_TEST.md §1, §2)
- [ ] drizzle migration apply 検証完了 (`scripts/with-env.sh drizzle-kit migrate` + `\d services` 確認)
- [ ] `/flow:spec-review` 通過 (対外契約変更のため特に推奨)
- [ ] `api/public/status` レスポンスに iconUrl optional が含まれる (NULL 状態で 200)
- [ ] admin write 経路で iconUrl を上書きできないことの test assert
- [ ] 連動 PJ bousai-bag-checker の revise dispatch リマインダ完了 (完了サマリ §10 で明示)

## 10. 更新履歴

| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 (Phase 1-4 + DB migration + runner 型変更 + SoT 一貫性配慮 + 連動 PJ ロールアウト計画) | /flow:revise |
