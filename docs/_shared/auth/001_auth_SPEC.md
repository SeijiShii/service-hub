# _shared/auth 仕様書（横断基盤）

> **役割**: HUB 全ルートを Clerk で **seiji 単一アカウント**に限定するアクセスゲート。
> **タグ**: cross-cutting, auth-required（ただし単一ユーザーのためリソース別 RBAC は不要）
> **最終更新**: 2026-05-26
> **入力**: `../../concept.md`（§3.X セキュリティ要件 / §4.7）, `./README.md`
> **依存**: なし（Clerk SDK）

---

## 1. 提供インターフェース
- **ルートガード**: 全ページ + 全 API を Clerk 認証必須にする（middleware / ラッパ）。未認証 → サインインへ。
- **単一ユーザー許可**: 認証済でも **seiji のアカウント以外は拒否**（Clerk allowlist or 許可ユーザー ID 照合）。
- 提供関数（例）:
```ts
requireSeiji(req): Promise<{ userId: string }>;  // 未認証/非seiji は 401/403 を投げる
isAllowedUser(userId: string): boolean;          // 許可ユーザー ID 照合（env: ALLOWED_USER_ID）
```

## 2. 入出力
- 提供: middleware（全ルート保護）+ 上記ガード関数 + Clerk Provider のラップ。
- 副作用: Clerk セッション検証（外部 SDK）。DB は触らない。

## 3. データモデル
新規 entity なし。許可ユーザー ID は env（`ALLOWED_USER_ID` / Clerk 側 allowlist）。

## 4. バリデーション + エラーケース
| ケース | 振る舞い |
|---|---|
| 未認証 | サインイン画面へリダイレクト（ページ）/ 401（API） |
| 認証済だが非 seiji | 403（許可外）。Clerk allowlist で原則ブロック + アプリ側 ID 照合の二重防御 |
| Clerk ダウン | フェイルクローズ（アクセス拒否、内部ツールのため安全側） |

## 5. 機能固有 NFR + 連携
### 5.1 NFR（concept §3.X 由来）
| 項目 | 目標 | 根拠 |
|---|---|---|
| 全ルート保護 | **2 つの明示例外 (`/api/cron/*`, `/api/public/*`) 以外**は全ページ/API を gate | O23/authn（pull データ・トークンを公開しない） |
| 単一ユーザー | seiji のみ | 内部ツール |
| フェイルクローズ | 不確実時は拒否 | 安全側 |

### 5.2 連携（被依存）
| 連携先 | 種別 | 内容 |
|---|---|---|
| dashboard / service-detail / alerts | ルート保護 | ガード適用 |
| 全 API（cron / public 除く） | 保護 | requireSeiji |

> 注: `/api/cron/collect` は Clerk ユーザーセッションでなく **Vercel Cron の secret/署名**で保護（collection SPEC で定義）。ユーザーゲートとは別経路。
> 注: `/api/public/*`（現状 `/api/public/status` のみ）は **認証なしの公開ルート**（`isPublicPath`、revise_001_public-status-api）。別サービスの公開ショーケースが消費。**公開安全サブセットのみ**を返し（`buildPublicStatus`、収益/コスト/利用数/トークン等は構造的に非公開）、これが全ルート gate の唯一の公開例外。新ルートを安易に `/api/public/` 下へ足さないこと（fail-close 維持）。
> **favicon-projection (2026-05-28、`_shared/types/revise_favicon-projection_20260528`)**: `PublicServiceStatus` に `iconUrl?: string` を additive 追加 (producer 自己申告の favicon 絶対 URL を投影)。**公開安全フィールド** (元々 web で公開されている favicon URL)、漏洩リスクなし。財務情報の allowlist 排除は引き続き維持。

## 6. タグ別追加項目
### auth-required
- 認可: 単一ロール（seiji のみ）。リソース別 RBAC/RLS 不要（O23 skip_if 単一ユーザー）。
- 認証方式: Clerk（preferences §2.4 / concept §4.3）。パスキー等は Clerk 設定で任意有効化可。

## 7. スコープ外
- マルチユーザー/招待/RBAC（単一ユーザーのため不要）。
- cron エンドポイント保護（collection の責務）。

## 8. 未決事項
現時点で論点なし (2026-05-26)。

## 9. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成（/flow:auto 反復5） | /flow:feature |
