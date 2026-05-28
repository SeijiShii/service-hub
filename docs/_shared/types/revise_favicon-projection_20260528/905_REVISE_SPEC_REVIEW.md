<!-- auto-generated-start -->
# 設計レビューレポート — _shared/types favicon-projection

**レビュー日**: 2026-05-28
**レビュー実施者**: Claude (Opus 4.7 1M) + seiji
**対象**: `_shared/types` revise_favicon-projection_20260528 (001-005 設計 5 文書)
**入力**: `docs/_shared/types/revise_favicon-projection_20260528/{001-005}.md` + concept.md §1.3/§3 + 連動 PJ bousai-bag-checker 現状実装
**観点ソース**: 組み込みチェックリスト + `~/.claude/review-perspectives.md` (P1-P77 全 77 原則を Read、本件関連は P3/P5/P19/P39/P43/P48/P51/P52/P53/P54/P56/P57/P58/P65/P74/P77)
**モード**: **auto-pick** (Class A、可逆)
**severity-threshold**: low (Info を除外しない、本件は契約変更のため網羅優先)

## 1. レビューサマリー

| 観点 | 評価 | 備考 |
|---|---|---|
| 仕様の明確性 | 要確認 | iconUrl 永続化セマンティクス・format check 詳細は明示済、ProviderAdapter 拡張方式は要追加 (R1) |
| 既存パターンとの一貫性 | 要確認 | `publicUrl` 共通化機会あり (R3)、admin write SoT 一貫性の補強要 (R2) |
| API 設計 | OK | ServiceInfoResponse v2 + PublicServiceStatus 拡張は additive 後方互換、適切 |
| エラーハンドリング | 要確認 | format check fail 時の運用可視性 (stderr ログ) 補強要 (R6) |
| テストカバレッジ | OK | FP-U-01〜32 + FP-M-01〜03 + FP-E2E-01〜21 + FP-RG-01〜06 + FP-MIG-01〜03 で網羅、format check 100% |
| 影響範囲・副作用 | 要確認 | ServiceDescriptor 型変更が 15+ ファイルに波及 (admin UI 含む)、ProviderAdapter 拡張方式 (R1) と連動 |
| API 流用・責務逸脱 | OK | service-info adapter が iconUrl 永続化責務を持つ拡張は妥当 (R1 採用案による) |
| 既存実装の再利用 | 要確認 | `publicUrl` 共通化機会 (R3)、updateServiceMeta は新規が正解 |
| データ移行・互換性 | OK | additive 後方互換、metadata-only operation、v1/v2 両受信 |
| 権限・認可 | OK | admin write 経路 iconUrl 不可 (SoT 一貫性) 設計は妥当 (R2 補強で型レベル防御強化) |
| UX・操作性 | (本 PJ 範囲外) | shipyard 側 fallback パターンを R9 で参考情報として提示 |
| 学習済み観点 (P 系) | 適用済 | P3/P19 (R3), P51/P74 (R2), P52 (R5), P56 (R1), 他観点ペネトレーション完了 |

## 2. 指摘事項 (severity 降順)

### [R1] ProviderAdapter インターフェース型変更による波及範囲が SPEC 未明示 — severity=**High**

- **対象**: `src/types/service.ts` (ProviderAdapter 定義) + `src/providers/adapters.ts` (wrap helper) + `src/features/collection/runner.ts` + 002_REVISE_PLAN §1
- **現状**: 全 adapter (ping/vercel/neon/service-info) が `collect: (svc) => Promise<{metrics, error?}>` を返す統一インターフェース
- **問題**: 002_PLAN §1 で「createServiceInfoAdapter 戻り値型を `{metrics, meta?: {iconUrl?}}` に拡張、wrap helper の戻り値型を拡張するか別関数で meta を返す」と書いたが、**ProviderAdapter インターフェース変更が ping/vercel/neon adapter にも波及する**ことが明示されていない。3 つの実装方式候補:
  - **(a) ProviderAdapter 拡張案**: 全 adapter 戻り値型に `meta?: ServiceMeta` 追加 (ping/vercel/neon は meta 返さず undefined のまま、変更不要)、runner で `if (res.meta?.iconUrl) await deps.updateServiceMeta(...)` で集約
  - **(b) ServiceInfoAdapter 分岐案**: ProviderAdapter 不変、ServiceInfoAdapter 派生型新設、runner で `kind === 'service-info'` 判定
  - **(c) Side-effect injection 案**: createServiceInfoAdapter が `deps.updateServiceMeta` を受け取り adapter 内部で副作用、runner 変更不要
- **chosen**: **(a) ProviderAdapter 拡張案**
- **chosen 根拠**: (a) は統一インターフェース維持 + 副作用集約は runner (単一責任) + 将来拡張性 (vercel adapter で last_deploy_at を services に永続化したい等の同パターン要求が来ても同機構で書ける) で長期的に最良。ping/vercel/neon 既存 adapter は meta 返さなければ undefined のまま (TS optional で破壊変更ゼロ)。wrap helper 戻り値型に `meta?: ServiceMeta` 追加するだけで全 adapter が型整合。runner.ts には `services.iconUrl` 永続化呼び出し 1 行追加。テスト追加: adapter level (FP-U-04/05) + runner level 1 ケース (meta が runner で updateServiceMeta を呼ぶこと) のみ
- **種別**: 設計判断項目 (auto-recommended)
- **反映先**: 001_SPEC §7.3 (データモデル) + 002_PLAN §1 (types/service.ts に `ServiceMeta` 型追加 + ProviderAdapter 拡張明示 + runner.ts 変更内容明示) + 003_UNIT_TEST (runner level meta 経路テスト 1 ケース追加)

### [R2] admin write 経路の SoT 一貫性 — ServiceDescriptor 型と zod schema 出力型の整合方針が SPEC 未明示 — severity=**High**

- **対象**: `src/registry/schema.ts` (`serviceDescriptorSchema`) + `src/types/service.ts` (ServiceDescriptor) + `src/registry/validate.ts` (`validateServiceInput`) + `api/admin/services.ts`
- **現状**: `validateServiceInput(req.body)` は `serviceDescriptorSchema.safeParse` の結果を `r.data as ServiceDescriptor` で型キャスト。zod の output 型は schema 定義したフィールドのみ
- **問題**: 計画書 002_PLAN §1 は「`src/registry/schema.ts` 変更なし — `serviceDescriptorSchema` に iconUrl は追加しない (admin write 経路では受け付けない、SoT 一貫性)」とあるが、**ServiceDescriptor 型に iconUrl?: string を追加すると、zod schema output (iconUrl 無し) と ServiceDescriptor 型 (iconUrl 含む) で型不整合**。`as ServiceDescriptor` キャスト時に iconUrl=undefined を黙認する形だが、SPEC で明示しないと実装者が混乱する。実装方式候補:
  - **(a) zod schema で iconUrl 明示拒否** (`z.never()`): admin 経路で iconUrl 送信 → 400、UX 厳しすぎ + フロントが送ってきたら silent fail 不可
  - **(b') stripUnknown 任せ + 二重防御 (zod schema iconUrl 不含 + `upsertService` SET 句 iconUrl 不含) + テスト assert (FP-U-26, FP-E2E-20)**: ServiceDescriptor 型に iconUrl?: string 追加、zod は stripUnknown で req.body.iconUrl を除去、`as ServiceDescriptor` キャストで iconUrl=undefined が表れるが許容、UPDATE SET 句に iconUrl を含めない構造防御 + INSERT 時は icon_url=NULL
  - **(c) 型分離案** (`ServiceDescriptor` = admin write 用 / `ServiceRecord = ServiceDescriptor & {iconUrl?: string}` = DB read 用): 型レベルで iconUrl が admin write に出てこない、SoT 違反を compile time 検出、複数型併存コスト
- **chosen**: **(b') stripUnknown + 二重防御 + テスト assert**
- **chosen 根拠**: (c) は理想だが既存 ServiceDescriptor 利用箇所 15+ ファイルの引数型再検討が必要 (本 revise スコープを超過)。(b') は zod schema を変えず (stripUnknown 任せ)、`upsertService` SET 句に iconUrl を含めない**構造防御** + テストで実 DB 反映を assert する**動作防御**の二重防御で SoT 一貫性を実現。SPEC で「型と zod schema の不整合は意図的 (ServiceDescriptor = DB レコード全体型、zod = admin write subset)」を明示すれば実装者の混乱回避
- **種別**: 設計判断項目 (auto-recommended)
- **反映先**: 001_SPEC §3 (admin write 経路) + 001_SPEC §7.3 (データモデル) + 002_PLAN §1 (registry/schema.ts 「変更なし」の理由補強 + validate.ts キャスト挙動明示) + 003_UNIT_TEST FP-U-26 (動作 assert 維持)

### [R3] `publicUrl` 関数 (registry/schema.ts:17-29) が export されておらず、adapter 側 format check で再実装リスク (P19/P3 違反) — severity=**High**

- **対象**: `src/registry/schema.ts` (`publicUrl` zod refinement = internal const) vs adapter 側 iconUrl format check
- **現状**: `publicUrl` は registry/schema.ts 内部 const、SSRF 予防 (`INTERNAL` regex + URL parse + protocol 検証) を実装済。export なし
- **問題**: 002_PLAN §8 リスク・注意点で「registry/schema.ts の `publicUrl` を共通モジュール化することを Phase 2 で検討」とあるが、**判断が Phase 2 まで持ち越し** = Phase 2 実装時に「再実装 vs 共通化」の二択が再発する。P19 (新規追加前に既存有無確認) + P3 (新規関数前に既存 Grep) 違反。再実装すると SSRF 予防ロジックの SoT が 2 つになり、将来内部アドレス pattern 更新時の drift リスク
- **chosen**: **Phase 1 で `src/lib/safeUrl.ts` (or `src/registry/url.ts`) として共通化**、registry/schema.ts と adapters.ts 両方が利用
- **chosen 根拠**: 重複実装回避 + SSRF 予防ロジックの単一 SoT + テストも 1 ファイルに集約。実装コストは関数を 1 ファイルに切り出すだけ (~15 LoC) で低い。Phase 1 で先行することで Phase 2 adapter 実装時に「再実装の誘惑」を断つ
- **種別**: 指摘事項 (auto-recommended)
- **反映先**: 002_PLAN §2 (新規ファイル `src/lib/safeUrl.ts` 追加: `isSafePublicUrl(s: string): boolean` 関数 + テスト) + 002_PLAN §5 Phase 1 ゴールに「safeUrl 共通化」明示 + 002_PLAN §8 リスクから該当項目削除 (解決済)

### [R4] services テーブル INSERT 時の iconUrl 上書き挙動が SPEC 未明示 — severity=**Medium**

- **対象**: `upsertService` の INSERT 句 (queries.ts:237) と SPEC §7.3
- **現状**: `upsertService` は INSERT 句で全カラム値を渡し、ON CONFLICT で UPDATE。SPEC §7.3 では「`services.icon_url` の書き込みは service-info adapter のみ」と書いたが、admin 経由の **新規 INSERT 時 (POST /api/admin/services)** に iconUrl カラムへの初期値が暗黙的 (NULL) になる挙動が SPEC 未明示
- **chosen**: SPEC §7.3 + PLAN §1 に「admin 経由 INSERT 時 = icon_url=NULL で新規行作成、その後の producer cron collect で更新」「admin 経由 UPDATE 時 = SET 句に iconUrl 含めないため既存 icon_url 保持」を明示
- **chosen 根拠**: 仕様明示で実装者の混乱回避、テスト FP-U-26 (admin write 経由 iconUrl 不可) の期待値も「新規行 = NULL、既存行 = 保持」で明確化
- **種別**: 指摘事項 (auto-recommended)
- **反映先**: 001_SPEC §7.3 + 002_PLAN §1 `upsertService` 行

### [R5] 連動 PJ bousai-bag-checker 側の schemaVersion literal 制約変更時の P52 観点リマインダ未明示 — severity=**Medium**

- **対象**: bousai-bag-checker `ServiceInfoResponse.schemaVersion: 1 as const` + 既存テスト
- **現状**: producer 側で `schemaVersion: 1 as const` literal 固定、TS 型レベルで `1` のみ許容
- **問題**: 001_SPEC §7.2 で「schemaVersion: 2」と書いたが、**producer 側 literal 型を `1` → `2` に変える際、既存テストで `schemaVersion === 1` を assert している箇所 (P52 観点) が破壊される**。連動 PJ revise で grep `schemaVersion.*1` 必須化を本 revise の完了サマリで明示すべきだが現状記載なし
- **chosen**: 本 revise の Step 7 完了サマリ「次のステップ §4 連動 PJ dispatch」リマインダに **P52 観点 (schemaVersion literal=1 を assert している既存テストの破壊検証)** を明示。連動 PJ revise の SPEC 段階で `grep schemaVersion.*1` を必須化
- **chosen 根拠**: P52「旧パラメータの隠れ機能」観点。bousai-bag-checker の collectMetrics.ts は `SCHEMA_VERSION = 1 as const` + interface で `schemaVersion: 1` literal、テスト類が literal=1 を比較している可能性高い → 連動 revise SPEC で先に grep + テスト更新計画を立てる必要
- **種別**: 指摘事項 (auto-recommended)
- **反映先**: 001_SPEC §3 (連動改修対象 bousai-bag-checker 行に P52 リマインダ追加) + AI_LOG decision 記録

### [R6] producer 申告 iconUrl が無効 URL 時 → 既存値保持の挙動の運用可視性が低い — severity=**Medium**

- **対象**: service-info adapter format check (003_UNIT_TEST FP-U-20〜25) + 002_PLAN §1 adapters.ts
- **現状計画**: format check fail → meta.iconUrl 未含有 → updateServiceMeta no-op → 既存値保持 (silent)
- **問題**: producer 側で誤った URL を申告し続けると、運用上「気づかない」 (admin UI に表示なし、cron 完了で 200 返す)。Vercel function logs で確認するための stderr ログが計画書に明示されていない
- **chosen**: format check fail 時に `console.warn('service-info iconUrl rejected: slug=<slug> reason=<protocol|length|internal|parse|empty> rawType=<typeof>')` (値はログしない、メタ情報のみ) を実装に含める。Vercel function logs で `iconUrl rejected` で grep して問題 producer を特定可能化
- **chosen 根拠**: 運用可視性 vs 漏洩防止のバランス。値ではなく rejection 理由のメタ情報のみログすることで PII / secret 漏洩リスクゼロ。admin UI への可視化は本 revise scope 外 (将来別 revise で対応可、現時点では stderr ログで最低限の運用観察可能)
- **種別**: 指摘事項 (auto-recommended)
- **反映先**: 002_PLAN §1 adapters.ts 変更内容に「format check fail 時の stderr 警告ログ実装」追記 + 003_UNIT_TEST に「stderr 警告ログが出力される」検証 1 ケース追加 (vitest の vi.spyOn(console, 'warn') で確認)

### [R7] subfolder slug `favicon-projection` の意図補強 — severity=**Low**

- **対象**: subfolder README §概要 + subfolder INDEX
- **現状**: slug `favicon-projection` は「投影」のみ表現、実態は「contract 拡張 + DB 永続化 + 公開 DTO 投影」3 段の technical pipeline
- **chosen**: README に「technical な投影パイプライン (producer→contract→DB→public-status DTO→consumer) を表現する slug、主担当は contract 拡張、投影は最終段」を明示 (D20260528-035 AI_LOG decision の context を README に転記)
- **chosen 根拠**: slug 変更コスト > 補強コスト、命名済 slug は維持して説明で補強する方が経済的
- **種別**: 指摘事項 (auto-recommended)
- **反映先**: subfolder README §改修要望 末尾 or §関連 セクションに pipeline 説明追記

### [R8] 005_MIGRATION rollback ファイル作成手順が抽象的 — severity=**Low**

- **対象**: 005_REVISE_MIGRATION.md §3
- **現状**: 「rollback migration ファイル経由で適用」とあるが、drizzle-kit には `migrate:rollback` コマンドがなく、rollback 用 migration ファイルの手動作成が必要
- **chosen**: 005_MIGRATION §3 を補強:
  1. `drizzle/<NNNN+1>_revert_add_services_icon_url.sql` を手動作成: `ALTER TABLE services DROP COLUMN icon_url;`
  2. `bash scripts/with-env.sh drizzle-kit migrate` で再 apply (forward に rollback migration として適用)
  3. drizzle migration journal を確認して整合性チェック
- **chosen 根拠**: drizzle-kit の運用実態に即した手順明示、実装者が rollback 時に迷わない
- **種別**: 指摘事項 (auto-recommended)
- **反映先**: 005_MIGRATION.md §3

### [R9] (Info) shipyard 側フォールバック表示パターン参考情報 — severity=Info

- **対象**: 本 revise 完了サマリ「次のステップ §5 shipyard 側 (別 PJ)」
- **内容**: `<img src={iconUrl} onError={() => setFallback(true)}>` パターン + iconUrl undefined 初期 fallback + fallback アイコン候補 (slug の 1 文字 / 統一プレースホルダ SVG / favicon ジェネレータ)
- **chosen**: 完了サマリに上記参考情報を追記
- **chosen 根拠**: 本 revise 責務外だが、shipyard 側 PJ で連動 revise する際の設計時間短縮、Info severity
- **種別**: 参考情報 (auto-recommended)
- **反映先**: 完了サマリ + AI_LOG decision に記録のみ (905 では参照情報として残す)

## 3. コードベース調査結果

### 3.1 既存パターン

- **services テーブル書き込みパス**: `src/db/queries.ts` の `upsertService` / `setServiceStatus` / `deleteService` の 3 関数に集約済。`api/admin/services.ts` (POST/PATCH/DELETE) が呼び出し元、他経路なし。新規 `updateServiceMeta` も同ファイル追加で既存パターンに整合。
- **adapter インターフェース**: 全 adapter が `wrap(kind, fn)` ヘルパで包まれ、戻り値は `{metrics, error?}` 統一。`createServiceInfoAdapter` のみ ServiceInfoResponse parse + metrics 抽出を行う特殊化。
- **SSRF 予防**: `src/registry/schema.ts:4-5` の `INTERNAL` regex (localhost/127./10./192.168./169.254./172.16-31./0.0.0.0) + `publicUrl` zod refinement で `new URL(u).hostname` を判定。internal-only const、未 export。
- **admin auth**: `requireSeiji(await getAuthFromRequest(req.headers))` で Clerk セッション検証、seiji のみ。401/403 で gate。
- **公開 API 安全投影**: `buildPublicStatus` は明示的に `const out: PublicServiceStatus = { slug, name, url, status }` で構築 (スプレッド使用せず)、内部 VM/財務情報の流入を構造的に防止。iconUrl 追加時も同パターンで `if (svc.iconUrl) out.iconUrl = svc.iconUrl` で明示的に追加が必要。

### 3.2 影響範囲分析

| 変更対象 | 既存呼び出し箇所 (件数 / 主要ファイル) | 呼び出し元の前提 (契約) | 破壊リスク |
|---|---|---|---|
| `ServiceInfoResponse` 型 | 3 件: `src/types/service.ts` (定義) + `src/types/types.test.ts` (assert) + `src/providers/adapters.ts` (parse) | schemaVersion: number / service: string / status: ok\|degraded\|down / metrics?: Array / version?: string / extra?: Record | **低**: iconUrl additive optional、後方互換完全 |
| `PublicServiceStatus` 型 | 2 件: `src/features/public-status/buildPublicStatus.ts` (定義 + 構築) + `api/public/status.test.ts` (assert) | slug/name/url/status/lastCheckedAt? の安全サブセット | **低**: iconUrl additive optional |
| `ServiceDescriptor` 型 | 15+ 件: types + db/queries + db/services.test + registry/load + registry/validate + features/alerts/evaluate + features/collection/runner + features/dashboard/summary + features/service-detail/detail + **features/admin/ServicesAdminView (admin UI)** + その他テスト | slug/name/url/subdomain?/status/providers/serviceInfo?/thresholds? | **中**: 全 import 元で iconUrl?: string が増えるが optional のため compile-time 破壊なし。**ただし admin UI が iconUrl 編集 UI を勝手に追加するリスク** → R2 二重防御 + テスト assert (FP-U-26, FP-E2E-20) で動作レベル防御 |
| `ProviderAdapter` インターフェース (R1 採用 (a) 案) | 4 件: ping/vercel/neon/service-info adapter + runner.ts | `collect: (svc) => Promise<{metrics, error?}>` | **低**: `meta?: ServiceMeta` 追加は optional、既存 3 adapter (ping/vercel/neon) は meta 返さず undefined で互換、runner で 1 行追加 |
| `services` テーブル | 書き込み 3 関数のみ (queries.ts) | upsertService (全カラム上書き) / setServiceStatus / deleteService | **低**: 新規 icon_url カラムは nullable、`upsertService` SET 句に iconUrl 含めないため既存 admin 経路の挙動不変 |
| `serviceDescriptorSchema` (zod) | 1 件: `validate.ts` (`r.data as ServiceDescriptor` キャスト) | admin write 検証 | **低**: iconUrl 含めない方針 (R2 (b'))、stripUnknown で req.body.iconUrl 除去、キャストで型不整合吸収 |

### 3.3 API 責務の評価

- **createServiceInfoAdapter** の責務拡張 (metrics 抽出 + iconUrl 抽出 + meta 返却): R1 (a) 案で「adapter は受信 contract から派生情報を構造化して返す」責務の自然な拡張。副作用 (`updateServiceMeta`) は runner.ts に集約 = adapter の純粋性維持。責務逸脱なし。
- **upsertService** に iconUrl を追加しない判断: SoT 一貫性 (R2)、producer 申告経路と admin write 経路の混在防止。責務分離として妥当。
- **services テーブル iconUrl カラム**: 静的 identity 属性として services テーブルに置く設計は適切 (usage_snapshots は時系列、iconUrl は時系列ではない)。代替案 (新規 service_meta テーブル) は services テーブルの存在意義と重複するため不要。

## 4. 設計判断ログ

| # | 判断項目 | 結論 | chosen_type | 反映先 |
|---|---|---|---|---|
| D1 (R1) | ProviderAdapter 拡張方式 | (a) ProviderAdapter 戻り値型に `meta?: ServiceMeta` 追加、全 adapter で optional、runner で集約 | auto-recommended | 001_SPEC §7.3 + 002_PLAN §1, §5 + 003_UNIT_TEST runner 1 ケース追加 |
| D2 (R2) | admin write SoT 一貫性の実装方式 | (b') stripUnknown + upsertService SET 句不含 + テスト assert の二重防御 | auto-recommended | 001_SPEC §3, §7.3 + 002_PLAN §1 |
| D3 (R3) | `publicUrl` 共通化タイミング | Phase 1 で `src/lib/safeUrl.ts` に共通化 | auto-recommended | 002_PLAN §2 (新規ファイル) + §5 Phase 1 |
| D4 (R4) | INSERT 時 iconUrl 挙動明示 | admin INSERT 時 = NULL、UPDATE 時 = 既存値保持 を SPEC 明示 | auto-recommended | 001_SPEC §7.3 + 002_PLAN §1 |
| D5 (R5) | 連動 PJ schemaVersion literal 変更時の P52 観点リマインダ | 完了サマリに「`grep schemaVersion.*1` 必須化」明示 + AI_LOG 記録 | auto-recommended | 完了サマリ §次のステップ |
| D6 (R6) | format check fail 時の運用可視性 | stderr 警告ログ追加 (rejection 理由のメタ情報のみ、値はログしない) | auto-recommended | 002_PLAN §1 + 003_UNIT_TEST 1 ケース追加 |
| D7 (R7) | subfolder slug 意図補強 | README に pipeline 説明追記 | auto-recommended | revise subfolder README |
| D8 (R8) | rollback migration 手順具体化 | drizzle-kit forward migration として手動 SQL ファイル作成手順明示 | auto-recommended | 005_MIGRATION §3 |
| D9 (R9) | shipyard 側 fallback パターン参考情報 | 完了サマリ §次のステップ §5 に追記 | auto-recommended | 完了サマリ + 905 §2 R9 |

## 5. 次のステップ
- 反映済み `001-005` を確認 (各反映箇所に `<!-- spec-review R{N}: ... -->` コメント付与)
- 準備ができたら `/flow:tdd _shared/types favicon-projection` で実装着手 (Phase 1 から: safeUrl 共通化 → DB schema + 型 + updateServiceMeta → adapter + ProviderAdapter 拡張 → buildPublicStatus 投影 → 既存 SPEC 整合更新)
- 連動 PJ bousai-bag-checker dispatch (本 revise 完了後): `cd /home/seiji/projects/bousai-bag-checker && /flow:revise _shared/service-info favicon-projection-producer` で producer 側 revise (P52 観点 = `grep schemaVersion.*1` でテスト破壊検証必須)
- shipyard 側 (別 PJ): `<img src={iconUrl}>` + onError fallback + iconUrl undefined 初期 fallback 実装

<!-- auto-generated-end -->
