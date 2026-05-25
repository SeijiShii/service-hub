# 実装前準備チェックリスト

**最終更新**: 2026-05-26 07:58
**集約元**: §4.3 リソース選定 / §6 外部連携 / §4.5 ローカル開発 / perspectives O25
**生成元**: /flow:concept

> 状態列（❌/✅/△/N/A）は `<!-- user-edit -->` 区間で手動更新可。

<!-- auto-generated-start -->

## 1. 外部 API トークン（環境変数 `.env.local` / Vercel Secrets、すべて read-only スコープ）

| サービス | 環境変数名(例) | 用途 | 取得 URL | プラン |
|---|---|---|---|---|
| Vercel | `VERCEL_API_TOKEN` | デプロイ/帯域 pull | vercel.com → Account → Tokens | Hobby |
| Neon | `NEON_API_KEY` | DB 使用量 pull | console.neon.tech → Account → API keys | Free |
| Clerk | `CLERK_SECRET_KEY`（対象サービスごと） | MAU pull | clerk.com → API Keys | Free |
| Cloudflare | `CLOUDFLARE_API_TOKEN`（R2 read） | R2 使用量 pull（Phase 2） | dash.cloudflare.com → My Profile → API Tokens | Free |
| Sentry | `SENTRY_AUTH_TOKEN` | エラー件数 pull（Phase 2） | sentry.io → Settings → Auth Tokens | Free |

> 注: 各プロバイダで「無料枠使用量」を read-only で取れるかは [論点-001] で adapter 設計時に検証。

## 2. BaaS / インフラアカウント（HUB 自身）
| サービス | 用途 | 取得 URL | プラン |
|---|---|---|---|
| Neon | HUB の DB（1 DB、時系列スナップショット） | neon.tech | Free |
| Vercel | HUB のホスティング + Cron | vercel.com | Hobby |
| Clerk | HUB のアクセス制御（seiji 単一ユーザー） | clerk.com | Free |
| Sentry | HUB 自身のエラー監視 | sentry.io | Free |

## 3. ドメイン
- 検証段階: `<project>.vercel.app`。既存ドメインあれば `hub.<domain>` サブドメ（O29、撤退は DNS 1 行削除）。

## 4. 認証プロバイダ設定（HUB アクセス制御）
| 項目 | 取得方法 | 備考 |
|---|---|---|
| Clerk App 作成 | clerk.com → New Application | Publishable/Secret を .env.local |
| アクセス許可制限 | Clerk Allowlist / 単一アカウント運用 | seiji のみ許可 |

## 6. 法務書類
N/A（内部・非公開ツール、§9 参照）。

## 7. 監視
| サービス | 用途 | プラン |
|---|---|---|
| Sentry | HUB 自身のエラー監視 | Free (5k events/月) |

## 10. ローカル開発環境準備（§4.5）
| 項目 | コマンド / 手順 |
|---|---|
| Node.js | nvm / asdf でバージョン管理 |
| `.env.example` 作成 | §1, §4 のキー名をダミー値付きで列挙 |
| `.env.local` 作成 | 実値入力、`.gitignore` 確認（O25） |
| Drizzle マイグレーション | `npm run db:migrate` |
| pre-commit hook | gitleaks / detect-secrets でトークン誤コミット防止 |

## 11. コスト試算
- 月額目安: $0（全無料枠）。

## 12. 実装着手前 最終チェックリスト
- [ ] §1 read-only トークンを取得し `.env.local` に設定
- [ ] `.gitignore` に `.env*.local` / `.env` を追加（O25）
- [ ] `services.toml` に管理対象サービス（まず hana-memo）を 1 エントリ記入
- [ ] Clerk で seiji 単一アカウントのみ許可に設定
- [ ] `/flow:secure` で L1 設計レビュー（トークン集中のリスク確認）

<!-- auto-generated-end -->

<!-- user-edit-start -->

## ユーザー手動メモ（取得状況）
| 項目 | 状態 | 取得日 / 備考 |
|---|---|---|
| Vercel API Token | ❌ | |
| Neon API Key | ❌ | |
| Clerk (HUB) | ❌ | |

<!-- user-edit-end -->
