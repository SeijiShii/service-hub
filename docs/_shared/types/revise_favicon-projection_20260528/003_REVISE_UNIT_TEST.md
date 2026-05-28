# _shared/types 単体テスト計画（favicon-projection）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, Step 2 Read で確認した既存テスト (types.test.ts / buildPublicStatus.test.ts / adapters.test.ts / services.test.ts / queries.test.ts)
> **最終更新**: 2026-05-28

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| FP-U-01 | `types.test.ts` — ServiceInfoResponse v2 型 | `{schemaVersion:2, service:'x', status:'ok', iconUrl:'https://x.example/favicon.svg'}` | 型 assignable + iconUrl: string |
| FP-U-02 | `types.test.ts` — ServiceInfoResponse v1 後方互換 | `{schemaVersion:1, service:'x', status:'ok'}` (iconUrl 無し) | 型 assignable、iconUrl undefined |
| FP-U-03 | `types.test.ts` — ServiceDescriptor に iconUrl | `{slug, name, url, status, providers:{}, iconUrl:'https://...'}` | 型 assignable |
| FP-U-04 | `adapters.test.ts` — service-info adapter iconUrl 抽出 | ServiceInfoResponse v2 `{iconUrl:'https://svc.example/favicon.svg', ...}` を fetch | `{metrics: [...], meta: {iconUrl: 'https://svc.example/favicon.svg'}}` |
| FP-U-05 | `adapters.test.ts` — v1 producer (iconUrl 無し) | `{schemaVersion:1, service, status:'ok'}` を fetch | `{metrics: [...]}` (meta 未含有 or `meta: {}`) |
| FP-U-06 | `serviceMeta.test.ts` — updateServiceMeta 新規セット | `updateServiceMeta(db, 'x', {iconUrl: 'https://...'})` 実行 | `services.icon_url` 更新済、updatedAt 更新 |
| FP-U-07 | `serviceMeta.test.ts` — 既存値保持 (no-op) | iconUrl 既設定の slug に `updateServiceMeta(db, 'x', {})` 実行 | 既存 icon_url 維持、updatedAt 更新なし or 更新あり (実装次第、推奨: 更新なし) |
| FP-U-08 | `serviceMeta.test.ts` — undefined は no-op | `updateServiceMeta(db, 'x', {iconUrl: undefined})` 実行 | 既存値保持 |
| FP-U-09 | `queries.test.ts` — toServiceDescriptor で iconUrl 含む | DB に `icon_url='https://...'` 保存後 `getService(db, 'x')` | `.iconUrl === 'https://...'` |
| FP-U-10 | `buildPublicStatus.test.ts` — DTO 投影 (iconUrl 有り) | services に iconUrl 有 + latest up=1 → `buildPublicStatus()` | 配列要素に `iconUrl: 'https://...'` 含む |
| FP-U-11 | `buildPublicStatus.test.ts` — DTO 投影 (iconUrl 無し) | services に iconUrl null + latest up=1 → `buildPublicStatus()` | 配列要素に `iconUrl` キー含有しない (undefined) |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待振る舞い |
|---|---|---|---|
| FP-U-20 | `adapters.test.ts` — iconUrl http (https 必須) | `{iconUrl:'http://svc.example/favicon.svg'}` | format check fail → meta.iconUrl 未含有 (parse 自体は成功、metrics は正常返却) |
| FP-U-21 | `adapters.test.ts` — iconUrl 1024 chars 超 | `{iconUrl:'https://' + 'a'.repeat(1100)}` | format check fail → meta.iconUrl 未含有 |
| FP-U-22 | `adapters.test.ts` — iconUrl 内部アドレス | `{iconUrl:'https://10.0.0.5/favicon.ico'}` | format check fail (internal hostname) → meta.iconUrl 未含有 |
| FP-U-23 | `adapters.test.ts` — iconUrl 不正プロトコル | `{iconUrl:'javascript:alert(1)'}` | URL parse fail or protocol check fail → meta.iconUrl 未含有 |
| FP-U-24 | `adapters.test.ts` — iconUrl non-string | `{iconUrl: 12345}` | type check fail → meta.iconUrl 未含有 |
| FP-U-25 | `adapters.test.ts` — iconUrl 空文字 | `{iconUrl: ''}` | URL parse fail → meta.iconUrl 未含有 |
| FP-U-26 | `services.test.ts` — admin write からの iconUrl 無視 (SoT 一貫性) | `upsertService(db, {slug, ..., iconUrl: 'https://injected'})` | DB の `icon_url` は更新されない (NULL or 既存値保持)、admin 経路では受け付けない |
| FP-U-27 | `buildPublicStatus.test.ts` — 内部キー非含有 allowlist 更新 | services + latest → `JSON.stringify(buildPublicStatus(...))` | allowlist = `{slug, name, url, status, lastCheckedAt, iconUrl}` のみ、revenue/cost/profit/mau 等は引き続き禁止 |

### 1.3 境界値
| ID | 対象 | 境界 | 期待振る舞い |
|---|---|---|---|
| FP-U-30 | `adapters.test.ts` — iconUrl 1024 chars ちょうど | `'https://' + 'a'.repeat(1015) + '/x'` (合計 1024) | 受理 |
| FP-U-31 | `adapters.test.ts` — iconUrl 1025 chars | 同上 +1 char | 拒否 |
| FP-U-32 | `serviceMeta.test.ts` — services 行が存在しない slug | `updateServiceMeta(db, 'nonexistent', {iconUrl})` | no-op (update 0 行) — エラー throw しない |
| **FP-U-33** | `adapters.test.ts` — format check fail 時の stderr 警告ログ | `{iconUrl:'http://x.example/...'}` で v2 ServiceInfoResponse を fetch + `vi.spyOn(console, 'warn')` | console.warn が `'service-info iconUrl rejected: slug=X reason=protocol rawType=string'` パターンで呼ばれる、値はログされない <!-- spec-review R6: 運用可視性 --> |
| **FP-U-34** | `safeUrl.test.ts` — `isSafePublicUrl` 全パターン 100% カバレッジ | https / http / data: / javascript: / internal (10.x/127./192.168./172.16-31./169.254./0.0.0.0) / 1024 chars 境界 / 空文字 / non-string / undefined | 各々の expected boolean が一致 <!-- spec-review R3: SSRF 予防 SoT 単一化 --> |
| **FP-U-35** | `runner.test.ts` — adapter meta 経路で updateServiceMeta が呼ばれる | adapter mock が `{metrics:[], meta:{iconUrl:'https://x/icon'}}` 返却、`deps.updateServiceMeta` = vi.fn() | updateServiceMeta が `(svc.slug, {iconUrl:'https://x/icon'})` で 1 回呼ばれる <!-- spec-review R1: runner で副作用集約 --> |
| **FP-U-36** | `runner.test.ts` — adapter meta 無しは updateServiceMeta 呼ばれない | adapter mock が `{metrics:[]}` (meta 無し) 返却 | updateServiceMeta が呼ばれない (no-op 分岐) <!-- spec-review R1 --> |
| **FP-U-37** | `runner.test.ts` — ping/vercel/neon adapter は meta 返却なしで互換 | 既存 adapter wrap helper の戻り値型に meta?: 追加後の compile + runtime green | 既存テスト全て破壊なし、ping/vercel/neon の collect 戻り値が `meta:undefined` で TS optional 互換 <!-- spec-review R1: 互換性検証 --> |

## 2. 修正テストケース

| ID | 対象 | 修正前 | 修正後 | 理由 |
|---|---|---|---|---|
| FP-M-01 | `buildPublicStatus.test.ts` 内部キー非含有 allowlist | `['slug','name','url','status','lastCheckedAt']` のみが allow | allowlist に `iconUrl` 追加、それ以外は引き続き禁止 (revenue/cost/profit/mau/raw_json/thresholds/providers/secretEnv/token) | iconUrl 公開許可、財務情報は依然非公開 |
| FP-M-02 | `types.test.ts` ServiceInfoResponse 最小固定テスト | schemaVersion=1 の literal/fix value 前提 | schemaVersion = 1 \| 2 両受信許容 (literal でなく number) | v2 bump 対応 |
| FP-M-03 | `services.test.ts` round-trip テスト | iconUrl 無し前提 | iconUrl 含むケース追加 (updateServiceMeta 経由のみ) | カラム追加対応 |

## 3. 削除テストケース

| ID | 対象 | 削除理由 |
|---|---|---|
| (なし) | additive 改修のため削除なし | - |

## 4. リグレッション強化

- **既存テスト維持**:
  - `buildPublicStatus.test.ts` の財務情報非含有 assert (revenue/cost/profit) は引き続き green
  - service-info adapter 既存 metrics 抽出パス (up, mau, users_total 等) は変更なしで green
  - public-status API 既存レスポンス shape (slug/name/url/status/lastCheckedAt) は iconUrl 追加で破壊しない
- **追加チェック**:
  - SoT 一貫性: admin write 経路 (`upsertService`) から iconUrl が DB に書き込まれないこと (FP-U-26)
  - 後方互換: v1 producer + v2 producer 両方のレスポンスが parse 成功すること (FP-U-04/05)
  - format check 完全性: SSRF 予防 (internal アドレス) と XSS 予防 (javascript:) を test で網羅 (FP-U-22/23)

## 5. Mock 方針差分

| 対象 | 前回 | 今回 | 理由 |
|---|---|---|---|
| service-info fetch response | metrics のみ含む mock | iconUrl 含むケース + 含まないケース両方の mock | v1/v2 両対応テスト |
| DB (testdb) | services テーブル round-trip | + icon_url カラム + updateServiceMeta 直接呼び出し | migration apply 後の schema 想定 |
| 内部アドレス検証 | (なし or registry/schema.test) | adapter テストで `https://10.0.0.5/...` を inject | format check の SSRF 予防確認 |

## 6. カバレッジ目標

| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | 既存継承 (concept §3 NFR) |
| 分岐 | 70% | 既存継承 |
| iconUrl format check 関数 | 100% (全異常系を網羅) | SSRF/XSS 予防は完全カバー必須 |
| updateServiceMeta | 100% | SoT 書き込み経路の唯一の関数、全分岐網羅 |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 (FP-U-01〜32 + FP-M-01〜03 + リグレッション強化 + format check 100% カバレッジ要求) | /flow:revise |
