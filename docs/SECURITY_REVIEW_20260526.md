<!-- auto-generated-start -->
# 設計レベル脆弱性レビュー — service-hub（プロダクト全体）

**レビュー日**: 2026-05-26
**レビュー実施者**: Claude (Opus 4.7) + seiji（/flow:auto P3 dispatch）
**対象**: プロダクト全体（concept.md）
**入力**: docs/concept.md (§1 / §3 / §4 / §5 / §6 / §10)
**観点ソース**: ~/.claude/flow-data/perspectives.md (O23-O28 + O48)
**phase**: design（L4 依存スキャンは実装後に --phase=deps で別途）
**severity-threshold**: medium

## 1. PJ 性質判定
- 単一ユーザー個人ツール（seiji 1 名）
- デプロイあり（Vercel）だが **Clerk で seiji 単一アカウントに限定**（実質非公開）
- 無償 / 商用化想定なし
- **エンドユーザー個人情報の扱い: なし**（seiji 自身のインフラ運用データ + read-only プロバイダトークンのみ）
- 外部 AI 利用: なし

## 2. 脆弱性パターン照合結果

### 2.1 サマリ
- Critical: 0 件
- High: 0 件（O25 は最重要だが設計で対応済 → accepted-as-requirement）
- Medium: 1 件（SEC-002 O24、status=open、実装時対応）
- Low/Info: 数件（報告のみ）
- 法令必須未対応: 0 件（O26 は PII 不扱いで非該当）

### 2.2 詳細（severity 降順）

#### [SEC-001] O25 秘密情報の管理 — accepted-as-requirement（最重要）
- **照合結果**: **対応済**。本 PJ は複数 PaaS（Vercel/Neon/Clerk/Cloudflare/Sentry）の**トークンが 1 か所に集中**する構造で、漏洩リスクが集中する = 設計上の最重要脅威。
- **設計での対処**（concept 由来）:
  - §3 NFR セキュリティ行で最優先と明記
  - 全トークンを **read-only スコープ**で発行（§6 / PREREQUISITES §1）
  - `.env` / `.env.local` のみで管理、リポジトリに置かない（§4.5.3 / §10.7）
  - `.gitignore` で `.env*.local` / `.env` 除外（実ファイル作成済・追跡は `.env.example` のみ・秘密混入なし確認済）
  - pre-commit hook で gitleaks/detect-secrets 推奨（§10.7）
  - HUB 自体を Clerk で seiji 限定（§4.7）
- **判定**: 設計で十分に対処 → §3 にセキュリティ要件として明文化（本レビューで §3.X auto-add）。

#### [SEC-002] O24 入力検証 — Medium（status=open、実装時対応）
- **照合結果**: 部分対応。攻撃面は単一ユーザー + Git 管理 config で小さいが、本 PJ 特有の 2 点に実装時注意が必要:
  1. **外向き fetch の SSRF/取り扱い**: HUB は `services.toml` 由来の **サービス URL を ping** し、プロバイダ API を叩く。URL は seiji が Git 管理するため第三者注入はないが、`collection`/`providers` 実装で「タイムアウト・リダイレクト追従の制限・内部アドレスへの fetch 抑止」を入れておくと堅牢。
  2. **プロバイダ JSON の安全パース + raw_json の秘密混入回避**: `usage_snapshots.raw_json`（§5.1）に生レスポンスを保全する設計のため、**トークン/シークレットを含むフィールドを保存しない**スクラブを実装する（O25 と連動）。
- **推奨**: `registry` のスキーマ検証（Zod 等）+ `providers` の fetch 制限 + raw_json スクラブ。実装時（`_shared/providers` / `collection` 設計）に対応。
- **§8 登録**: [論点-004]（Medium, open）。

#### O48 service-info エンドポイントの共有シークレット — 設計注記
- service-info（[論点-003]）の認証は **HUB↔サービス間の共有シークレット**。このシークレットは**各サービスごとに env で保持**し、**Git 管理の `services.toml` には絶対に書かない**（services.toml は非機密の記述子のみ）。L2/実装時チェックリストに反映予定。

### スキップした観点（PJ 性質フィルタ）
| 観点 | 理由 |
|---|---|
| O23 認可 | skip_if[単一ユーザー個人ツール]。Clerk authn（seiji 限定）で境界を担保、リソース別 RBAC/RLS は不要 |
| O26 PII ログ | require[個人情報扱い] 非該当（エンドユーザー PII なし） |
| O27 レート制限（攻撃面） | skip_if[単一ユーザー]。HUB 公開面は Clerk gate。**外向き provider API レート遵守**は concept §3 でカバー済 |
| O28 依存 CVE | --phase=design のため非実行。実装後に `--phase=deps` |

## 3. §8 未決事項に登録した論点
| 論点 ID | severity | title | status |
|---|---|---|---|
| [論点-004] | Medium | [SEC-002] O24 入力検証（SSRF/パース/raw_json スクラブ） | open |

## 4. 次のステップ
- §3.X セキュリティ要件（本レビューで auto-add）を機能設計時に参照。
- `_shared/providers` / `collection` 実装時に [論点-004] を解消（fetch 制限 + raw_json スクラブ）。
- service-info 共有シークレットは env 保持・services.toml 非記載を徹底（[論点-003] 契約定義時）。
- 実装後に `/flow:secure --phase=deps`（依存 CVE）+ Anthropic `security-review`（L3 コードレビュー）。
- Dependabot を CI に組み込み（L4-cont、§10.5）。
<!-- auto-generated-end -->
