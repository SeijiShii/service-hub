# _shared/providers 変更計画書（秘密ゼロ化）

> **入力**: `./001_REVISE_SPEC.md`, 既存 src/providers/adapters.ts, src/types/service.ts, src/registry/schema.ts
> **最終更新**: 2026-05-28

---

## 1. 既存ファイル変更一覧
| ファイル | 変更内容 | リスク |
|---|---|---|
| `src/providers/adapters.ts` | `createClerkAdapter` 撤去。`createServiceInfoAdapter` の auth を `deps.env?.HUB_SERVICE_INFO_SECRET` に（per-service `ref.secretEnv` 撤去） | 中（mau の出所変更） |
| `src/providers/index.ts` | `getAdapters` から clerk adapter を除去（clerk export も削除） | 中 |
| `src/types/service.ts` | `ProviderRefs.clerk` から `secretEnv` 削除、`ServiceInfoRef` から `secretEnv` 削除 | 中 |
| `src/registry/schema.ts` | `clerk` の `secretEnv` Zod 削除、`serviceInfo` の `secretEnv` Zod 削除（`envName` import が未使用化したら整理） | 低 |
| `.env.example` | `*_CLERK_SECRET` / `*_HUB_SECRET` 削除、`HUB_SERVICE_INFO_SECRET` 追記 | 低 |

## 2. 新規ファイル一覧
（なし。既存改修のみ）

## 3. 削除ファイル一覧
（ファイル削除なし。`createClerkAdapter` 関数 + clerk テストの削除）

## 4. マイグレーション要否
- DB スキーマ変更: ❌（secretEnv は jsonb 内のフィールドで列ではない。型のみ変更）
- データ変換: ❌（未運用）
- 設定変更: ✅（.env.example、HUB env に HUB_SERVICE_INFO_SECRET）
- → 005_MIGRATION 不要。

## 5. 実装 Phase 分割
### Phase 1: 型 + スキーマから secretEnv 撤去
- types/service.ts + registry/schema.ts。typecheck で参照箇所を炙り出し。
- RED: types.test の secretEnv 前提を更新 / registry schema テスト更新。

### Phase 2: providers adapter 改修
- adapters.ts: createClerkAdapter 撤去、service-info auth を共通鍵に。index.ts の getAdapters 更新。
- adapters.test.ts: clerk テスト削除、service-info の共通鍵 auth テスト追加（HUB_SERVICE_INFO_SECRET あり→Bearer / なし→ヘッダなし）。mau が service-info 経由で出ることを確認。
- .env.example 更新。
- RED→GREEN→IMPROVE。

## 6. 依存関係順序
Phase 1（型/スキーマ）→ Phase 2（adapter、型に追従）

## 7. ロールアウト計画
| ステップ | 内容 | 検証 |
|---|---|---|
| 1 | デプロイ | build green |
| 2 | HUB env に HUB_SERVICE_INFO_SECRET 設定（Class B、ユーザー手動） | collect が service-info を共通鍵で叩く |
| 3 | per-service `*_CLERK_SECRET`/`*_HUB_SECRET` を HUB env から削除 | .env 不変化の確認 |

## 8. リスク・注意点
- mau の provider が clerk→service-info に変わる。dashboard/cost-sim が `provider="clerk"` で mau をフィルタしていないか要確認（metricKey="mau" でのみ参照なら影響なし）。
- `envName` ヘルパが registry/schema.ts で未使用になる場合は import を整理（typecheck/lint）。
- hana-memo 側が共通鍵 + mau 自己申告に追従するまで、hana-memo の MAU は出ない（許容、別 revise）。

## 9. 完了の定義 (DoD)
- [ ] Phase 1-2 完了、全テスト green、typecheck clean
- [ ] createClerkAdapter 撤去 + service-info 共通鍵 auth
- [ ] 型/スキーマから secretEnv 撤去
- [ ] .env.example 更新
- [ ] mau が service-info 経由で出ることをテストで確認

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 | /flow:revise |
