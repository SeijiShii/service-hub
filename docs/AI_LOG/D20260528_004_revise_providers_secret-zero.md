# AI_LOG セッション D20260528_004 — /flow:revise + 実装 (_shared/providers 秘密ゼロ化)

**実行日時**: 2026-05-28 (+09:00)
**コマンド**: /flow:revise（設計）+ 連続して実装（§0.1.1 Class A 進行）
**モード**: revise
**対象**: _shared/providers (revise_secret-zero_20260528_mau-selfreport)
**実行者**: Claude (Opus 4.7) + seiji
**状態**: 完了（設計 + 実装 + 全テスト green）
**含まれる decision**: D20260528-010 〜 D20260528-011 (2 件)
**ファイル**: `D20260528_004_revise_providers_secret-zero.md`

---

## 主要決定サマリ

| ID | テーマ | 採用 | type |
|---|---|---|---|
| D20260528-010 | MAU 取れないサービスのフォールバック | A. なし（MAU は service-info 自己申告のみ、未実装は MAU 非表示） | explicit-choice |
| D20260528-011 | 共通鍵 HUB_SERVICE_INFO_SECRET 未設定時 | A. Authorization ヘッダなしで叩く（現状 graceful 踏襲） | explicit-choice |

## 依存関係
- depends_on: [D20260528-002]（秘密ゼロ化）, [D20260528-006]（step 2 で secretEnv を optional 残置→本 revise で撤去 = sequencing 完了）。
- 元 feature: providers SPEC / [論点-003] service-info 契約。

## 実装サマリ
- **Clerk adapter 撤去**: createClerkAdapter（per-service clerk.secretEnv で Clerk API users/count → mau emit）を削除。getAdapters / export から除去。MAU は createServiceInfoAdapter が metrics[] key="mau" を emit（自己申告、フォールバックなし=D-010）。
- **service-info 共通鍵**: auth を per-service `ref.secretEnv` → 共通 `deps.env.HUB_SERVICE_INFO_SECRET`。未設定はヘッダなし（D-011）。
- **型/スキーマ撤去**: ProviderRefs.clerk.secretEnv / ServiceInfoRef.secretEnv を types + Zod から削除。
- **秘密直書きガード移設**: registry/schema.ts の SECRET_LITERAL を識別子フィールド（vercel.projectId / neon.projectId / clerk.appId / cloudflare.accountId / sentry.org / sentry.project）に `idStr` で適用（envName は撤去）。レジストリは秘密を一切持たない保証を維持。
- **.env.example**: per-service `*_CLERK_SECRET`/`*_HUB_SECRET` 削除、共通 `HUB_SERVICE_INFO_SECRET` 追記。
- **テスト**: adapters.test（clerk テスト削除、service-info 共通鍵 Bearer/ヘッダなし + mau passthrough 追加）/ types.test（secretEnv 例撤去）/ validate.test（U-12 を識別子の秘密直書きに）。

## 全テスト
`npx vitest run` → **177 passed / 30 files / 0 failed**。typecheck exit 0。commit 0eb64bb（コード）。

## 後続（別作業）
- hana-memo に service-info（metrics に mau 自己申告 + 共通鍵 HUB_SERVICE_INFO_SECRET）retrofit（別リポ /flow:revise）。
- HUB env / hana-memo env の双方に同じ HUB_SERVICE_INFO_SECRET 値を設定（Class B 運用）。
- db:push（services テーブル）+ デプロイ（Class B）。

## 学習・改善
- なし。

---

## Decisions

```yaml
- id: D20260528-010
  timestamp: 2026-05-28T00:00:00+09:00
  command: /flow:revise
  phase: Step 3 / MAU フォールバック
  question: service-info から MAU が取れないサービスの扱い
  options:
    - A. フォールバックなし（MAU は service-info 自己申告のみ） (recommended)
    - B. Clerk fallback を残す
  recommended: A
  chosen: A
  chosen_type: explicit-choice
  depends_on: [D20260528-002]
  context: |
    Clerk per-service secret 撤廃が目的。未実装/未申告サービスは MAU 非表示で許容
    (O48 後方互換「未実装は PaaS pull のみ」と整合)。B は Clerk がアプリ別 secret のため
    アカウント共通トークンで全アプリ MAU を取れず、秘密ゼロ化に反する。ユーザー回答 A。

- id: D20260528-011
  timestamp: 2026-05-28T00:00:00+09:00
  command: /flow:revise
  phase: Step 3 / 共通鍵未設定時の挙動
  question: HUB_SERVICE_INFO_SECRET 未設定時の service-info pull
  options:
    - A. Authorization ヘッダなしで叩く（現状 graceful 踏襲） (recommended)
    - B. 未設定なら叩かずスキップ
  recommended: A
  chosen: A
  chosen_type: explicit-choice
  depends_on: [D20260528-010]
  context: |
    既存の `secret ? {Authorization} : undefined` 挙動を踏襲。dev/モック/未認証 endpoint でも動く。
    サービスが認証必須なら 401 → 既存 error ハンドリング(provider 単位 error 計上、collection 全体は止めない)
    で graceful。ユーザー回答 A。
```
