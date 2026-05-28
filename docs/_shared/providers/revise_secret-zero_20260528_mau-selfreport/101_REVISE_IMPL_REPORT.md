# 実装レポート: _shared/providers 秘密ゼロ化（MAU 自己申告 + 共通鍵）

## 実装日時
2026-05-28 (JST)

## モード
revise

## 関連ドキュメント
- 001_REVISE_SPEC / 002_REVISE_PLAN / 003_REVISE_UNIT_TEST / 004_REVISE_E2E_TEST
- [AI_LOG](../../AI_LOG/D20260528_004_revise_providers_secret-zero.md)
- concept §7 [D20260528-002] / perspectives O48(2026-05-28 改訂)

## 変更一覧

### Phase 1: 型 + スキーマから secretEnv 撤去
- `src/types/service.ts`: `ProviderRefs.clerk` から `secretEnv` 削除（appId のみ）、`ServiceInfoRef` から `secretEnv` 削除（endpoint のみ）。
- `src/registry/schema.ts`: clerk.secretEnv / serviceInfo.secretEnv の Zod 撤去。`envName` を `idStr` に置換し、秘密直書きガード（SECRET_LITERAL）を識別子フィールド（vercel.projectId / neon.projectId / clerk.appId / cloudflare.accountId / sentry.org / sentry.project）へ移設。

### Phase 2: providers adapter 改修
- `src/providers/adapters.ts`: `createClerkAdapter` 撤去。`createServiceInfoAdapter` の auth を共通 `deps.env.HUB_SERVICE_INFO_SECRET`（未設定はヘッダなし）に。MAU は service-info の metrics[] key="mau" をそのまま emit。
- `src/providers/index.ts`: getAdapters / import から clerk adapter 除去。
- `.env.example`: per-service `*_CLERK_SECRET`/`*_HUB_SECRET` 削除、共通 `HUB_SERVICE_INFO_SECRET` 追記。

## 実装計画からの差分
| 項目 | 内容 |
|------|------|
| 計画外の追加 | 秘密直書きガードを識別子フィールドへ移設（secretEnv 撤去で SECRET_LITERAL が宙に浮くため、defense-in-depth として projectId 等に適用）。validate.test U-12 をそれに合わせ更新。 |
| 省略 | 005_MIGRATION 不要（型変更のみ、DB スキーマ変更なし）。Step 12 feedback は session 長大化回避で skip（推奨提示）。 |
| 想定外 | なし。mau の provider 変更（clerk→service-info）だが features は metricKey="mau" で参照しており表示影響なし（grep 確認済）。 |

## PR Description
### タイトル
providers: 秘密ゼロ化（MAU を service-info 自己申告へ + service-info 共通鍵化）

### 概要
HUB のサービス固有シークレット（per-service Clerk secret / service-info secret）を撤廃。Clerk API 直叩きをやめ MAU を各サービスの service-info 自己申告から取得、service-info 認証を共通 1 本に統一。これで新サービス追加時に HUB の .env が増えない（再デプロイ不要を .env 面でも達成）。

### 変更内容
- createClerkAdapter 撤去、MAU は service-info metrics[] key="mau" から
- service-info auth = 共通 HUB_SERVICE_INFO_SECRET（未設定はヘッダなし）
- 型/Zod から secretEnv 撤去、秘密直書きガードを識別子に移設
- .env.example を共通鍵モデルに

### テスト
- adapters / types / validate / load 影響テスト更新、全スイート 177 passed / typecheck clean
