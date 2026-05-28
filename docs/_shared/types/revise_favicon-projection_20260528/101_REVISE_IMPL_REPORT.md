# 実装レポート: _shared/types favicon-projection

## 実装日時
2026-05-28 16:45 - 17:17 (JST) (実時間 ~30 min、Phase 1-4 連続実行)

## モード
revise (subfolder: `revise_favicon-projection_20260528/`)

## 関連ドキュメント
- [001_REVISE_SPEC.md](./001_REVISE_SPEC.md) - 変更仕様
- [002_REVISE_PLAN.md](./002_REVISE_PLAN.md) - 実装計画 (Phase 1-4 + spec-review R1-R9 反映)
- [003_REVISE_UNIT_TEST.md](./003_REVISE_UNIT_TEST.md) - 単体テスト計画
- [905_REVISE_SPEC_REVIEW.md](./905_REVISE_SPEC_REVIEW.md) - 設計レビュー (R1-R9 全件解決)
- [005_REVISE_MIGRATION.md](./005_REVISE_MIGRATION.md) - DB migration (db:push 運用)
- [AI_LOG セッション D20260528_022](../../AI_LOG/D20260528_022_tdd__shared_types_favicon-projection.md)

## 注意事項
本レポートのファイルパスと行番号は実装日時時点のもの。以後の変更により行番号がずれる場合があります。

## 変更一覧

### Phase 1: safeUrl 共通化 + DB schema + 型拡張 + updateServiceMeta + testdb DDL
**commit**: `a025cb3 feat(backend): _shared/types favicon-projection Phase 1`

**新規ファイル** (2):
- `src/lib/safeUrl.ts` (36 LoC) — `isSafePublicUrl(value, opts?)` SSRF 予防 SoT
- `src/lib/safeUrl.test.ts` (96 LoC) — 25 ケース 100% カバレッジ

**変更ファイル** (8):
- `src/types/service.ts` — ServiceInfoResponse v2 (iconUrl?) + ServiceDescriptor.iconUrl? + ServiceMeta 新規
- `src/types/provider.ts` — ProviderAdapter.collect 戻り値型に meta?: ServiceMeta + JSDoc
- `src/types/types.test.ts` — FP-U-01/02/03/37 4 ケース追加
- `src/db/schema.ts` — services.iconUrl: text("icon_url") 追加
- `src/db/testdb.ts` — インライン DDL に icon_url text 同期
- `src/db/queries.ts` — toServiceDescriptor 拡張 + updateServiceMeta 新関数追加 (22 LoC)
- `src/db/services.test.ts` — FP-U-06/07/08/09/26/26b/32 7 ケース追加
- `src/registry/schema.ts` — publicUrl を safeUrl 経由に置換 (重複実装回避、P19/P3)

**テスト**: 239/239 GREEN (Phase 1 後の累積)

### Phase 2: service-info adapter iconUrl 抽出 + format check + stderr 警告 + runner 連携
**commit**: `26a4508 feat(backend): _shared/types favicon-projection Phase 2`

**変更ファイル** (5):
- `src/providers/adapters.ts` — CollectResult に meta? + wrapWithMeta helper + pickServiceInfoIconUrl helper + createServiceInfoAdapter を wrapWithMeta 化
- `src/providers/adapters.test.ts` — FP-U-04/05/20-25/33 9 ケース追加 (vi import 追加)
- `src/features/collection/runner.ts` — RunnerDeps に updateServiceMeta? optional + meta 経路 1 分岐 + try/catch + warn
- `src/features/collection/runner.test.ts` — FP-U-35/35b/35c/36 4 ケース追加
- `api/cron/collect.ts` — RunnerDeps に updateServiceMeta 配線 (1 行)

**テスト**: 252/252 GREEN (Phase 1 + 2 累積、+13)

### Phase 3: buildPublicStatus iconUrl 投影
**commit**: `f818d28 feat(backend): _shared/types favicon-projection Phase 3`

**変更ファイル** (2):
- `src/features/public-status/buildPublicStatus.ts` — PublicServiceStatus.iconUrl? + 構築ロジック 1 行追加
- `src/features/public-status/buildPublicStatus.test.ts` — FP-U-10/11/FP-M-01 3 ケース追加

**テスト**: 255/255 GREEN (Phase 1 + 2 + 3 累積、+3)

### Phase 4: 既存 SPEC 整合更新 + 005 を db:push 運用に整合
**commit**: `6bf8a69 docs: _shared/types favicon-projection Phase 4`

**変更ファイル** (3、docs only):
- `docs/_shared/types/001_types_SPEC.md` — ServiceInfoResponse v2 / ServiceDescriptor / ServiceMeta / ProviderAdapter meta? + §9 履歴
- `docs/_shared/auth/001_auth_SPEC.md` — public-status §5 注に iconUrl additive 追記
- `docs/_shared/types/revise_favicon-projection_20260528/005_REVISE_MIGRATION.md` — db:push 運用に整合 (drizzle migration generate 不要)

## 実装計画からの差分

| 項目 | 内容 |
|---|---|
| 計画にない追加変更 | (1) `wrapWithMeta` adapter helper を新設 (既存 `wrap` 維持で ping/vercel/neon 破壊変更ゼロ)。(2) `pickServiceInfoIconUrl` helper で format check + reason 分類 + stderr 警告を adapters.ts 内に集約。(3) runner.ts に updateServiceMeta 失敗時の warn + try/catch (P80 silent reject 運用可視性)。(4) FP-U-26b (UPDATE 時 SoT 一貫性) + FP-U-35b/35c (RunnerDeps optional + throw 耐性) を追加テスト。(5) Phase 4 で 005 MIGRATION を db:push 運用に整合更新 (Phase 1 TDD で発覚した本 PJ 運用補正)。 |
| 計画から省略した変更 | drizzle migration generate (本 PJ 既存運用 `drizzle-kit push` に合わせて skip、`drizzle/` ディレクトリ未管理) |
| 想定外の問題と対処 | (1) 本 PJ は `drizzle/` 未管理、`db:push` 運用と判明 → Phase 1 で migration generate skip、Phase 4 で 005 整合更新。(2) `pickServiceInfoIconUrl` の reason 推定で URL parse 試行 → isSafePublicUrl と二重 parse になるが運用 debug 価値 > パフォーマンス微差でトレードオフ許容。 |

## PR Description

### タイトル
_shared/types favicon-projection: service-info contract v2 + icon_url + public-status DTO 投影

### 概要
公開ショーケース (shipyard) でサービス一覧アイコン表示を可能化するため、`service-info` contract (service-hub ↔ 各マイクロサービス) を v1 → v2 に bump し、`iconUrl?: string` を 1st-class field として追加。各 producer が自分の favicon 絶対 URL を申告 → service-hub が `services.icon_url` に永続化 → 公開 API `/api/public/status` の `PublicServiceStatus` に投影。後方互換完全 (v1 producer 受信時は iconUrl=undefined として扱い、producer 順次対応可能)。

### 変更内容
- `ServiceInfoResponse` (対外契約) を v2 化: iconUrl?: string optional 追加 (v1 受信完全許容)
- `services` テーブルに `icon_url text` カラム追加 (nullable、admin write 経路では受け付けない SoT 一貫性)
- `src/lib/safeUrl.ts` 新設 (SSRF 予防 SoT、registry/schema.ts と adapters.ts で共有)
- `createServiceInfoAdapter` で iconUrl 抽出 + format check (URL/https/1024/internal 拒否) + stderr 警告ログ (rejection 理由メタのみ、値はログしない PII/secret 漏洩防止)
- `ProviderAdapter` 戻り値型に `meta?: ServiceMeta` 追加 (ping/vercel/neon は影響なし、副作用は runner で集約)
- `updateServiceMeta(db, slug, meta)` 新設 (`services.icon_url` 専用 update、保持セマンティクス [論点-FP2])
- `buildPublicStatus` で `svc.iconUrl` を公開 DTO に投影 (財務情報の allowlist 排除は引き続き維持)

### テスト
- 全 255 tests passed (リグレッション 0、新規 26 ケース FP-U-01〜37 + FP-M-01)
- 行 80% / 分岐 70% カバレッジ目標達成
- format check 100% カバレッジ (FP-U-34 25 sub-cases)
- updateServiceMeta 100% カバレッジ (新規 / no-op / 既存値保持 / 存在しない slug)
- admin write SoT 一貫性 (FP-U-26/26b: 新規 INSERT 時 NULL + UPDATE 時 既存値保持)
- 値ログ漏洩防止 (FP-U-33: PII/secret 漏洩がないこと)
- runner meta 経路 + optional hook + throw 耐性 (FP-U-35/35b/35c/36)

### 連動 PJ リマインダ
- **bousai-bag-checker** (現状唯一の producer): 本 PR マージ後に同 slug `favicon-projection-producer` で連動 revise dispatch 推奨。`ServiceInfoResponse.schemaVersion: 1 as const` literal を 2 に bump + `iconUrl: 'https://bousai-bag-checker.givers.work/favicon.svg'` (or 実値) 返却。**P52 観点必須**: `grep schemaVersion.*1` で既存テスト破壊検証
- **shipyard** (consumer、別 PJ): `<img src={iconUrl} onError={fallback}>` + iconUrl undefined 初期 fallback (slug の 1 文字 / 統一プレースホルダ SVG)
