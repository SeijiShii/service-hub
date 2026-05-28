# _shared/providers 変更仕様書（秘密ゼロ化: MAU 自己申告 + 共通シークレット）

> **改修種別**: 機能変更（取得経路転換 + シークレット統一）
> **issue / slug**: secret-zero / mau-selfreport
> **基準 SPEC**: `../001_providers_SPEC.md`（あれば）/ concept §6
> **最終更新**: 2026-05-28
> **タグ**: stateless（adapter 群）
> **確定根拠**: concept §7 [D20260528-002] / perspectives O48(2026-05-28 改訂)。step 2 (registry DB 化) の後続。

---

## 1. 変更概要

HUB が持つサービス固有シークレットを撤廃する（秘密ゼロ化）。(1) Clerk MAU の取得を per-service Clerk secret 経由の Clerk API 直叩きから**各サービスの service-info 自己申告**（`metrics[] key="mau"`）に移す。(2) service-info の認証を per-service `serviceInfo.secretEnv` から**全サービス共通 1 本 `HUB_SERVICE_INFO_SECRET`** に統一。(3) 型/スキーマから `clerk.secretEnv` / `serviceInfo.secretEnv` を撤去（step 2 で optional 残置していたものの sequencing 完了, D20260528-006）。

結果、HUB の `.env` は新サービス追加で不変（アカウント単位トークン + 共通 service-info 秘密 + HUB 自身の Clerk のみ）。

## 2. 変更前 vs 変更後

### 2.1 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| MAU の出所 | `createClerkAdapter` が per-service `clerk.secretEnv` の token で Clerk API `users/count` を叩き `provider="clerk" key="mau"` を emit | **Clerk adapter 撤去**。MAU は service-info の `metrics[] key="mau"` を `provider="service-info"` として emit（サービス自己申告、[D20260528-010] フォールバックなし） | 非互換（mau の provider が clerk→service-info、metricKey は不変 "mau"） |
| service-info 認証 | `serviceInfo.secretEnv` 名で引いた per-service secret を Bearer | **共通 `HUB_SERVICE_INFO_SECRET`** を Bearer。未設定なら Authorization ヘッダなしで叩く（[D20260528-011]、現状の graceful 挙動踏襲） | サービス側の鍵差し替えが必要（共通鍵に統一） |

### 2.2 データモデル変更（型・スキーマ）
| 対象 | 変更内容 | マイグレーション要否 |
|---|---|---|
| `ProviderRefs.clerk` | `secretEnv` を撤去（`appId` は任意で残す: 識別表示用） | 型のみ。DB に secretEnv 列はないので **DB スキーマ変更なし** |
| `ServiceInfoRef` | `secretEnv` を撤去（`endpoint` のみ） | 同上 |
| `serviceDescriptorSchema`（Zod） | clerk.secretEnv / serviceInfo.secretEnv の検証を撤去 | 同上 |

### 2.3 バリデーション・エラー変更
- service-info の auth エラー（401/403）は従来どおり当該 provider の error 計上で graceful（collection 全体は止めない）。
- 共通鍵未設定 → ヘッダなしで叩く（[D20260528-011]）。サービスが認証必須なら 401 → error 計上。

## 3. 影響範囲
| 対象 | 影響度 | 説明 |
|---|---|---|
| `src/providers/adapters.ts` | 高 | createClerkAdapter 撤去 / service-info auth を共通鍵に |
| `src/providers/index.ts`（getAdapters） | 中 | clerk adapter を一覧から除去 |
| `src/types/service.ts` | 中 | ProviderRefs.clerk.secretEnv / ServiceInfoRef.secretEnv 撤去 |
| `src/registry/schema.ts` | 中 | 同フィールドの Zod 撤去 |
| `.env.example` | 低 | per-service `*_CLERK_SECRET` / `*_HUB_SECRET` 削除、`HUB_SERVICE_INFO_SECRET` 追記 |
| dashboard / cost-sim 等 mau 消費側 | 低〜中 | mau の provider が clerk→service-info に。metricKey="mau" 不変なら表示は維持（要確認） |
| `adapters.test.ts` / `types.test.ts` / registry schema 系テスト | 中 | clerk adapter テスト削除、service-info auth テスト更新、secretEnv 撤去追従 |

## 4. 後方互換性
- **互換維持**: ❌（mau の provider 変更 + secretEnv フィールド撤去 = 破壊的）。ただし**未運用**のため実害なし（usage_snapshots に既存 mau データなし、services テーブルも未投入）。
- service-info を実装するサービス（hana-memo）側は**共通鍵に合わせる + metrics に mau を含める**改修が別途必要（hana-memo `/flow:revise`、本 revise のスコープ外）。

## 5. ロールバック方針
- コード revert で戻せる ✅（型/adapter の変更のみ、DB 変更なし）。

## 6. リリース戦略
- 一括（内部ツール・未運用・単一ユーザー）。デプロイ後、HUB env に `HUB_SERVICE_INFO_SECRET` を 1 回設定。per-service の `*_CLERK_SECRET`/`*_HUB_SECRET` は不要に。

## 7. 詳細仕様（新仕様）
- `createServiceInfoAdapter`: `const secret = deps.env?.HUB_SERVICE_INFO_SECRET;` を Bearer（あれば）。`metrics[]` をそのまま emit（`mau` 含む、現状実装どおり）。`up` も emit。
- `createClerkAdapter`: **撤去**。`getAdapters` の clerk 分岐も除去。
- 型: `clerk?: { appId: string }`（secretEnv 削除）、`ServiceInfoRef = { endpoint?: string }`（secretEnv 削除）。

## 8. タグ別追加項目
（stateless adapter。analytics なし。）

## 9. 未決事項
現時点で論点なし（2026-05-28）。Q1（フォールバックなし=A）/ Q2（未設定はヘッダなし=A）確定。

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成（秘密ゼロ化の providers 実装、MAU 自己申告 + 共通鍵） | /flow:revise |
