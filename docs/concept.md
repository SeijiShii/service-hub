# service-hub

> **一行で言うと**: flow で連発するマイクロサービス群の稼働・利用・コスト・障害を、各 PaaS の API を pull して一画面で横断把握する**開発者 (seiji) 専用の内部運用ダッシュボード**。

| 項目 | 内容 |
|---|---|
| ユーザー | seiji 1 名（単一ユーザー内部ツール、エンドユーザー非公開） |
| 解決する課題 | 週1ペースで連発するマイクロサービスが増えるほど、各サービスの稼働・利用・コスト・障害が散在し、横断把握できなくなる |
| 提供価値 | 全リリース済みサービスの運用状況を 1 画面に集約。サービス側を無改修のまま (pull 方式) 後付けで観測できる |
| 現フェーズ | 企画（concept 初版） |
| 最終更新 | 2026-05-26 |

---

## 1. プロダクト概要

service-hub は、flow 系コマンド（AI 駆動開発・週1ペースのマイクロサービス連発）で公開した複数マイクロサービスの**運用状況を一括把握する内部ダッシュボード**である。

サービスが増えるほど「どれが生きていて、どれだけ使われ、いくらかかり、どこで落ちているか」が各 PaaS の管理画面に散在する。service-hub は各 PaaS の API を**定期的に pull** してデータを集約・時系列保存し、全サービスを横断する 1 画面に可視化する。サービス側にコードを仕込む必要がない（pull 方式）ため、毎週新サービスを足しても運用負担が増えない。

スコープは**閲覧のみ（observability）**。外部 PaaS への書き込み操作（停止・デプロイ等）は MVP では行わず、将来フェーズに残す。

### 1.1 主要ユースケース
1. **全サービス横断サマリ**: ダッシュボードを開くと、登録済み全サービスの「稼働 (up/down) / 直近の利用数 (MAU 等) / 月内コスト概算 / 直近エラー件数」が一覧で見える。
2. **サービス個別の時系列**: 1 サービスを選ぶと、利用数・DB 使用量・帯域・エラーの推移グラフが見える。
3. **無料枠超過アラート**: 各 PaaS の無料枠に対する消費率を監視し、80% / 100% 等の閾値到達を seiji に通知する。
4. **サービスの追加（運用フロー）**: 新サービスを公開したら、宣言ファイル (`services.toml` 等) に 1 エントリ追記 → commit → redeploy するだけで HUB の管理対象に入る。
5. **死活確認**: 各サービス URL を定期 ping し、ダウンしているサービスを即座に把握する。

### 1.2 スコープ
**含むもの**:
- 各 PaaS API からの pull 集約（稼働 ping / 利用数 / インフラ使用量 / コスト概算 / エラー件数）
- 時系列スナップショットの保存と可視化（一覧 + 個別グラフ）
- 無料枠閾値アラート（seiji への通知）
- Git 管理の宣言ファイルによるサービスレジストリ

**含まないもの（明示除外）**:
- 外部 PaaS への**書き込み操作**（デプロイ再実行 / サービス停止 / 環境変数更新）→ 将来フェーズ
- エンドユーザー向け公開機能・マルチテナント
- 各サービスのアプリ層イベントの push 受信（ハイブリッド化は将来の拡張余地）
- サービス自体の APM / 分散トレーシング（Sentry 等の既存ツールに委ねる）

### 1.3 ドキュメントフォルダ分割設計

#### 1.3.1 機能フォルダ（業務ドメイン別）

| フォルダ (docs/ 配下) | 含む機能 | 担当する画面 / API | 依存 | 優先度 | 基盤 |
|---|---|---|---|---|---|
| docs/registry/ | 管理対象サービスの宣言ファイル定義・ローダ・バリデーション | services.toml スキーマ / サービス一覧取得 | _shared/types | 2 | ✅ |
| docs/collection/ | 定期 pull オーケストレーション（どのサービスのどのプロバイダを叩くか・スケジューリング・スナップショット保存） | Cron handler / pull runner API | _shared/providers, _shared/db, registry | 3 | ✅ |
| docs/dashboard/ | 全サービス横断サマリ一覧画面 | `/` ダッシュボード画面 | _shared/db, _shared/auth, registry | 4 | ❌ |
| docs/service-detail/ | 個別サービスの時系列・詳細 | `/services/:slug` 画面 + 時系列取得 API | _shared/db, _shared/auth, registry | 4 | ❌ |
| docs/alerts/ | 無料枠超過等の閾値判定 + seiji への通知 | アラート評価 / 通知送信 | _shared/db, collection | 4 | ❌ |

#### 1.3.2 横断フォルダ（_shared/*）

| フォルダ (docs/ 配下) | 責務 | 含む設計 | 依存 | 優先度 | 基盤 |
|---|---|---|---|---|---|
| docs/_shared/types/ | 共通型定義 | ServiceDescriptor / UsageMetric / ProviderKind / SnapshotRow | (なし) | 1 | ✅ |
| docs/_shared/db/ | Neon スキーマ・マイグレーション | usage_snapshots / alert_events / collection_runs テーブル + Drizzle スキーマ | _shared/types | 1 | ✅ |
| docs/_shared/providers/ | 各 PaaS API アダプタ（pull の核） | Vercel / Neon / Clerk / Cloudflare / Sentry adapter + uptime ping、共通 ProviderAdapter インターフェース | _shared/types | 2 | ✅ |
| docs/_shared/auth/ | Clerk 単一ユーザーゲート | 全ルート保護・seiji のみ許可 | (なし) | 2 | ✅ |

#### 1.3.3 依存・優先度・基盤の定義
- 依存は「先に必要とする他フォルダ」。循環依存なし。
- 優先度は topological sort（小さいほど先）。優先度 1 = 依存なし、優先度 N = 優先度 N-1 までに依存。
- 基盤 ✅ = 他の多くから参照される。横断は全て基盤、機能では registry / collection が基盤扱い。

#### 1.3.4 優先度算出
1 (types, db) → 2 (providers, auth, registry) → 3 (collection) → 4 (dashboard, service-detail, alerts)。循環なし。

#### 1.3.5 命名規約
- 機能フォルダ: ケバブケース（`service-detail` 等）
- 横断フォルダ: `_shared/<技術領域>/`

### 1.4 実装コードフォルダ構成（たたき台）

> Q10/Q11 で確定した Vite + React + TS（フロント）+ Vercel Functions（サーバー）スタックに整合。あくまでたたき台。

```
src/
  features/              # 機能単位（§1.3.1 と命名統一）
    dashboard/
    service-detail/
    alerts/
  registry/              # 宣言ファイルローダ + スキーマ (services.toml パース)
  providers/             # PaaS API アダプタ (vercel.ts / neon.ts / clerk.ts / cloudflare.ts / sentry.ts / ping.ts)
  db/                    # Drizzle スキーマ + クライアント (Neon)
  lib/                   # ユーティリティ (cost 計算 / 日付 / フォーマット)
  components/            # 共通 UI 部品 (shadcn/ui ベース)
  types/                 # 共通型
api/                     # Vercel Functions
  cron/collect.ts        # 定期 pull (Vercel Cron トリガー)
  services/[slug]/timeseries.ts
services.toml            # サービスレジストリ SoT (Git 管理)
```

#### 1.4.2 §1.3 ドキュメントフォルダとの対応
- 機能は名前を揃える（`docs/dashboard/` ↔ `src/features/dashboard/`）。
- 横断 `_shared/providers/` ↔ `src/providers/`、`_shared/db/` ↔ `src/db/`、`_shared/types/` ↔ `src/types/`。

#### 1.4.3 命名規約
- TS 慣習に従う（ケバブ or キャメル）。§1.3 機能名と意味を揃える。

## 2. 前提条件・制約
- **業務前提**: 単一ユーザー（seiji）の内部ツール。管理対象サービスは現状 1 件（hana-memo）、今後週1ペースで増える。
- **技術制約**: 連発標準スタック（preferences.md §3.1 / perspectives O32 案 1）を踏襲。無料枠厳守。
- **体制・予算・納期**: 個人開発（AI 駆動）。予算 = 無料枠。納期なし（maker ペース）。

## 3. 非機能要件

> 内部観測ツールのため「性能・可用性」は低優先、「セキュリティ（複数プロバイダ API トークン管理）」が最重要。

| 項目 | 目標値 | 根拠 |
|---|---|---|
| セキュリティ | 各 PaaS API トークンは**読み取り専用スコープ**で発行。`.env`（Vercel Secrets）のみで管理、リポジトリに秘匿情報を置かない（O25）。HUB 自体は Clerk で seiji のみアクセス可 | 複数プロバイダのトークンを集約するため漏洩リスクが集中する |
| 可用性 | ベストエフォート（内部ツール、SLA なし）。HUB ダウン中も各サービス自体には影響なし | 観測ツールであり本番経路ではない |
| 性能 | pull 結果は DB スナップショットにキャッシュし、ダッシュボードは DB のみ読む（プロバイダ API を画面表示ごとに叩かない）。プロバイダ API の**レート制限を厳守** | API レート制限・課金回避・表示速度 |
| 運用・監視 | collection_runs テーブルで pull の成否を記録。pull 失敗・無料枠超過は seiji に通知 | 「観測ツール自体が黙って壊れる」を防ぐ |
| データ規模 | サービス数 〜数十、スナップショットは日次/時次 × プロバイダ × メトリクスで低volume。Neon 無料枠で十分 | 単一ユーザー・低頻度 pull |

## 4. 全体アーキテクチャ

```
                ┌─────────────────────────── service-hub (Vercel) ───────────────────────────┐
                │                                                                              │
  seiji ──Clerk─┤  React SPA (dashboard / service-detail / alerts)                            │
   (閲覧)        │        │ reads                                                               │
                │        ▼                                                                     │
                │   Neon (Postgres): usage_snapshots / alert_events / collection_runs          │
                │        ▲ upsert                                                              │
                │        │                                                                     │
                │   Vercel Cron ──▶ /api/cron/collect ──▶ collection runner                    │
                │                                              │ reads services.toml (Git SoT) │
                │                                              ▼                               │
                │                                   providers/* adapters (read-only API)       │
                └──────────────────────────────────────────────┬───────────────────────────────┘
                                                                │ pull (read-only)
                  ┌──────────────┬──────────────┬───────────────┼───────────────┬──────────────┐
                  ▼              ▼              ▼               ▼               ▼              ▼
               Vercel API     Neon API      Clerk API      Cloudflare API   Sentry API   各サービス URL
              (帯域/デプロイ) (DB 使用量)   (MAU)          (R2 使用量)      (エラー)      (uptime ping)
```

### 4.1 主要コンポーネント
| 名前 | 責務 | 技術領域（例示） |
|---|---|---|
| React SPA | 一覧 / 個別 / アラート画面の描画 | Vite + React + TS + shadcn/ui + Recharts |
| collection runner | 宣言ファイルを読み各プロバイダ adapter を呼び DB に upsert | Vercel Function + Vercel Cron |
| providers adapters | プロバイダごとの read-only API クライアント + uptime ping | TypeScript モジュール群 |
| Neon DB | 時系列スナップショット・アラート履歴・収集ログ | Postgres + Drizzle |
| Clerk gate | seiji 単一ユーザーのアクセス制御 | Clerk |

### 4.2 技術スタック（方向性）
- フロント: SPA（例: Vite + React + TypeScript）+ UI ライブラリ（例: shadcn/ui + Tailwind）+ チャート（例: Recharts）+ データ取得/キャッシュ（例: TanStack Query）
- バック: サーバーレス関数（例: Vercel Functions）+ スケジューラ（例: Vercel Cron）
- データ層: マネージド Postgres（例: Neon）+ ORM（例: Drizzle）
- 認証: マネージド Auth（例: Clerk、単一ユーザー）
- インフラ: PaaS ホスティング（例: Vercel Hobby）
- 監視・ログ: エラー監視（例: Sentry。HUB 自身の監視 + サービスのエラー pull 源を兼ねる）

### 4.3 リソース選定たたき台

| カテゴリ | 推奨具体名 | 代替候補 | 選定根拠 | 想定単価 (USD/月、桁感) |
|---|---|---|---|---|
| フロント FW | Vite + React + TypeScript | Next.js | preferences §2.1（hana-memo で採用）/ SPA で十分 | $0 ※ 2026-05 時点想定、最新 pricing 要確認 |
| UI | shadcn/ui + Tailwind | MUI / Mantine | preferences（hana-memo で shadcn/ui）/ データ密ダッシュボードに好適 | $0 ※ 同上 |
| チャート | Recharts | visx / Chart.js | 時系列描画が簡潔、React 親和性 | $0 ※ 同上 |
| データ取得 | TanStack Query | SWR | pull/キャッシュ/再取得モデルに適合 | $0 ※ 同上 |
| サーバーレス | Vercel Functions | Cloudflare Workers | ホスティングと一体、adapter 実行に十分 | $0 (Hobby) ※ 同上 |
| スケジューラ | Vercel Cron | GitHub Actions cron | Vercel 統合。頻度制限あれば GH Actions に逃がす | $0 ※ Hobby Cron 制限要確認 |
| DB | Neon (Postgres) | Cloudflare D1 / Supabase | perspectives O32 案 1 / 時系列に Postgres | $0 (Free) ※ 同上 |
| ORM | Drizzle | Prisma | preferences §3.1 / Neon 親和性 / 型安全 | $0 ※ 同上 |
| 認証 | Clerk（単一ユーザー） | Auth.js / Lucia / Basic 認証 | preferences §3.1 / 設定が容易 / seiji のみ許可 | $0 (Free 10k MAU) ※ 同上 |
| ホスティング | Vercel Hobby | Cloudflare Pages | preferences §2.5 / Vite 統合 | $0 ※ 同上 |
| 監視 | Sentry (Free) | — | preferences §2.6 / HUB 自身 + サービス pull 源 | $0 (5k events/月) ※ 同上 |

### 4.4 想定コストサマリ

| 区分 | 月額目安 (USD) | 内訳の例 |
|---|---|---|
| 個人・無料枠 | $0 | Neon Free + Vercel Hobby + Clerk Free + Sentry Free |

**本プロジェクトのレンジ**: 個人・無料枠（根拠: 単一ユーザー内部ツール、低頻度 pull、商用化想定なし）。
**無料枠厳守**。上限到達時は §4.3 の代替候補（例: スケジューラを Vercel Cron → GitHub Actions cron）に切替判断。

### 4.5 ローカル開発環境計画

#### 4.5.1 開発スタイル
**ハイブリッド**（アプリ本体はホストで Vite/Vercel dev、DB は Neon のブランチ or ローカル Postgres）。理由: §4.3 が BaaS 寄りでなくマネージド Postgres + サーバーレスのため、フルコンテナは過剰。

#### 4.5.2 必要サービス（ローカル起動対象）
| サービス | 役割 | ローカル起動方式 | ポート | 永続化 |
|---|---|---|---|---|
| Vite dev server | フロント + API（vercel dev） | `vercel dev` / `vite` | 3000 | (なし) |
| Postgres | DB | Neon ブランチ接続 or ローカル Docker Postgres | 5432 | volume / Neon 側 |
| プロバイダ API | pull 対象 | dev はモック応答 or 実 read-only トークン | — | — |

#### 4.5.3 環境変数・シークレット管理
- `.env.example`: 必須キー一覧（ダミー値）。`.env.local`: 実値（Git 禁止、`.gitignore` 必須、O25）。
- 平文コミット禁止: 各プロバイダ API トークン / Clerk Secret / Neon 接続文字列 / Sentry DSN。
- シークレット管理: ローカル = `.env.local`、デプロイ先 = Vercel Secrets。

#### 4.5.4 起動・停止・リセットコマンド（抽象 + 例）
| 操作 | 抽象表現 | 例 |
|---|---|---|
| 起動 | dev サーバー起動 | `./scripts/dev.sh` / `vercel dev` |
| 停止 | dev 停止 | `Ctrl+C` / `./scripts/stop.sh` |
| マイグレーション | DB スキーマ反映 | `npm run db:migrate`（Drizzle） |
| pull 手動実行 | collect を 1 回叩く | `curl localhost:3000/api/cron/collect`（dev） |

#### 4.5.5 開発フロー上の留意点
- 初回: `.env.local` 準備 → `db:migrate` → `dev.sh`。
- プロバイダ adapter は dev でモック応答にフォールバックできる設計にし、実トークンなしでも UI 開発可能にする。
- WSL2 環境: スマホ実機確認は不要（単一ユーザー PC ツール想定）。

#### 4.5.6 CI/CD との関係
- CI で lint / typecheck / unit を実行。collection runner はモック adapter でユニットテスト。
- 本番との差異: dev はモック adapter、本番は実 read-only トークン。

#### 4.5.7 dev 起動スクリプト計画（O36）
- `scripts/dev.sh`（bash launcher）: 環境変数チェック → DB マイグレーション確認 → `vercel dev` 起動。
- `scripts/stop.sh`: dev プロセス停止。
- smoke: `GET /api/health`、`GET /`（ダッシュボード 200）。

### 4.6 コスト・収益追跡と継続判断ループ

> 本 PJ の該当レベル: **個人ツール / 無料枠**（§4.6.1）。収益指標・BEP は不要。

#### 4.6.2 コスト集計メカニズム（最小構成）
service-hub 自身のコストはほぼ $0（read-only API 呼び出し + 無料枠）。ただし以下を最小実装する:
- collection runner が叩いたプロバイダ API 呼び出し回数を `collection_runs` に記録（自身のレート消費把握）。
- 単価は不要（read-only 集約 API は基本無料枠内）。万一課金 API（例: Sentry の上位）に触れる場合のみ `.env` に単価を置く。

> 注: service-hub の**プロダクト価値そのもの**が「他サービスのコスト可視化」だが、それは pull した各プロバイダの使用量メトリクスを表示することで実現する（HUB 自身の §4.6 とは別レイヤ）。

#### 4.6.7 継続 / 撤退判断基準（個人ツール）
| 判断 | 基準 | 対応 |
|---|---|---|
| 継続 | 無料枠内 + 運用に役立っている | 通常運用 |
| 撤退 | 無料枠超過の代替もなく、かつ使わなくなった | Vercel/Neon プロジェクト削除（単一ユーザーのためユーザー通知不要） |

#### 4.6.8 判断主体
本人（seiji）。

### 4.7 公開戦略・ドメイン

> **本ツールはエンドユーザー非公開（内部ツール）**。一般公開しないため §4.8 マーケティングは不要。デプロイはするが Clerk でアクセスを seiji のみに制限する。

- **公開構成**: (A) PaaS 完結（Vercel）。
- **URL**: `<project>.vercel.app`（検証段階）。既存ドメインがあれば `hub.<domain>` のサブドメ運用も可（撤退は DNS 1 行削除、O29）。
- **アクセス制御**: Clerk で seiji の単一アカウントのみ許可。未認証は全ルートブロック。
- **SSL**: Vercel 自動。
- **撤退時**: Vercel/Neon プロジェクト削除のみ（単一ユーザー、データエクスポート/ユーザー通知不要）。

### 4.8 サービス公開周知 / マーケティング戦略
**§4.8 不要**（エンドユーザー非公開の内部ツールのため周知対象なし、2026-05-26 判断）。

## 5. データ設計（高レベル）

### 5.1 主要エンティティ

**ServiceDescriptor（Git 宣言ファイル `services.toml` が SoT、DB には持たない）**
- `slug`（一意キー）/ `name` / `url` / `subdomain` / `status`（active / paused / retired）
- `providers`: 各プロバイダの識別子（例: `vercel_project_id` / `neon_project_id` / `clerk_app_id` / `cloudflare_account_id` + `r2_bucket` / `sentry_project`）
- `thresholds`: 無料枠アラート閾値（任意、プロバイダ別 or グローバル）

**usage_snapshots（DB / 時系列）**
- `id` / `service_slug` / `provider`（vercel/neon/clerk/cloudflare/sentry/ping）/ `metric_key`（例: `mau` / `db_storage_bytes` / `bandwidth_bytes` / `error_count` / `up`）/ `metric_value`（numeric）/ `unit` / `captured_at` / `raw_json`（生レスポンス保全）

**alert_events（DB）**
- `id` / `service_slug` / `provider` / `rule`（例: `free_tier_80pct`）/ `triggered_at` / `value` / `notified_at` / `resolved_at`

**collection_runs（DB / 収集ログ）**
- `id` / `started_at` / `finished_at` / `status`（ok / partial / failed）/ `services_count` / `errors_json`（プロバイダ別失敗詳細・レート消費）

### 5.2 データフロー
1. Vercel Cron → `/api/cron/collect` 起動。
2. runner が `services.toml`（status=active）を読み、各サービス × 各プロバイダで adapter を呼ぶ（+ URL ping）。
3. 取得値を `usage_snapshots` に upsert、生レスポンスを `raw_json` に保全。
4. 閾値を評価し超過なら `alert_events` 追加 + seiji へ通知。
5. 実行結果を `collection_runs` に記録。
6. ダッシュボード/個別画面は DB のみを読んで描画（プロバイダ API を直接叩かない）。

## 6. 外部連携

| 連携先 | 用途 | 方式 | 認証 |
|---|---|---|---|
| Vercel API | デプロイ状態 / 帯域使用量 | REST（read-only） | API Token（read scope）、Vercel Secrets / `.env.local` |
| Neon API | DB ストレージ / コンピュート使用量 | REST（read-only） | API Key（read scope） |
| Clerk API | サービスごとの MAU / ユーザー数 | REST（read-only） | Secret Key（read scope） |
| Cloudflare API | R2 ストレージ使用量 | REST（read-only） | API Token（R2 read scope） |
| Sentry API | サービスごとのエラー件数 | REST（read-only） | Auth Token（read scope） |
| 各サービス URL | uptime ping | HTTP GET（ヘルスチェック） | なし（公開エンドポイント） |
| Clerk（HUB 自身） | seiji 単一ユーザーのアクセス制御 | SDK | Publishable / Secret Key |

**外部 AI サービス利用: なし**（Q12.5 で明示確認。根拠: 観測ダッシュボードであり AI 推論を必要としない。ユーザー直接叩きとの差別化観点も該当なし）。
**アナリティクス・計測ツール利用: なし（外部向け）**（Q12.6。根拠: 単一ユーザー内部ツールで行動分析不要。エラー監視は Sentry を §4.3 監視カテゴリで採用。コスト追跡は §4.6 最小構成）。

## 7. 決定事項ログ

| 日付 | 決定内容 | 根拠 | 影響セクション | decision_id |
|---|---|---|---|---|
| 2026-05-26 | HUB の本質的役割 = 開発者向け内部運用ダッシュボード | AskUserQuestion | §1, §1.2, §4.7 | [D20260526-001](./AI_LOG/D20260526_001_concept_initial.md#decisions) |
| 2026-05-26 | 利用状況の収集方式 = HUB が各 PaaS API を pull | Q4-Q7 アーキ核 | §1.1, §4, §6, §1.3 | [D20260526-002](./AI_LOG/D20260526_001_concept_initial.md#decisions) |
| 2026-05-26 | 管理スコープ = 閲覧のみ（observability、PaaS 書き込みなし） | Q 管理スコープ | §1.2, §3, §4 | [D20260526-003](./AI_LOG/D20260526_001_concept_initial.md#decisions) |
| 2026-05-26 | レジストリ SoT = Git 管理の宣言ファイル（services.toml） | Q レジストリ SoT | §1.1, §1.4, §5.1 | [D20260526-004](./AI_LOG/D20260526_001_concept_initial.md#decisions) |
| 2026-05-26 | MVP pull 対象 = uptime ping + Vercel + Neon + Clerk（Sentry/R2 は Phase 2） | auto-pick | §1.2, §6 | [D20260526-005](./AI_LOG/D20260526_001_concept_initial.md#decisions) |

## 8. 未決事項（論点リスト）

### [論点-001] 無料枠使用量を pull する API の実在性・粒度
- **影響範囲**: §6 外部連携, docs/_shared/providers/, docs/alerts/
- **詰めるべき問い**:
  1. Neon / Vercel / Clerk / Cloudflare の各 API で「無料枠に対する現使用量」を read-only で取得できるか（請求 API の有無・粒度・遅延）。
  2. 取得できないメトリクスは ping や間接指標で代替するか、表示対象から外すか。
- **候補案**:
  - 案 A: 各 API の使用量/請求エンドポイントを使う ／ 利点: 正確 ／ 欠点: API 提供状況がプロバイダ依存・要実地検証
  - 案 B: 取得可能なものから段階導入（Phase 2 で adapter 拡充）／ 利点: MVP を止めない ／ 欠点: 初期は表示が部分的
- **推奨**: 案 B。MVP は確実に取れる指標（ping / Clerk MAU / Vercel deploy）から始め、使用量 API は adapter 実装時に各プロバイダのドキュメントで実在性を検証して順次追加。
- **判断期限**: docs/_shared/providers/ の機能設計時（/flow:feature）
- **担当**: seiji

### [論点-002] スケジューラの頻度と Vercel Hobby Cron 制限
- **影響範囲**: docs/collection/, §4.3 スケジューラ
- **詰めるべき問い**: Vercel Hobby の Cron 実行頻度制限で必要な pull 間隔（例: 1 時間ごと）を賄えるか。賄えなければ GitHub Actions cron に逃がすか。
- **候補案**:
  - 案 A: Vercel Cron（統合が楽）／ 欠点: Hobby は頻度制限あり（要確認）
  - 案 B: GitHub Actions cron が `/api/cron/collect` を叩く ／ 利点: 頻度自由・無料 ／ 欠点: 別系統の管理
- **推奨**: まず Vercel Cron で日次〜数時間ごとを試し、頻度が足りなければ案 B に切替。内部観測ツールでありリアルタイム性は不要。
- **判断期限**: docs/collection/ の機能設計時
- **担当**: seiji

## 9. 法務・コンプライアンス書類
**個人・内部ツール / 非公開のため法務書類不要（2026-05-26 判断）**。エンドユーザーの個人情報を扱わない（seiji 自身のインフラ運用データと read-only プロバイダトークンのみ）。

## 10. Git リポジトリ・運用

### 10.1 リポジトリ情報
| 項目 | 値 |
|---|---|
| リポジトリ URL | （未設定。GitHub private を想定） |
| 可視性 | private |
| ホスティング | GitHub |
| デフォルトブランチ | main |

### 10.2 ブランチ戦略
- Trunk-based + Protected main（推奨デフォルト）。
- protected_branches: `[main]` / auto_branch_prefix: `flow/`。

### 10.3 コミット規約
- Conventional Commits。flow コマンド自動コミットは `docs(flow:<command>): ...`。

### 10.4 リリースタグ規約
- なし（内部ツール、継続デプロイ）。

### 10.5 CI / CD ワークフロー
- `.github/workflows/`: lint / typecheck / unit（PR ごと）、Vercel preview/production（main マージ時）。
- 依存監視（Dependabot、O28）。

### 10.6 flow コマンド自動コミット方針
```yaml
auto_commit: true
branch_strategy: trunk-based
commit_message_lang: ja
protected_branches: [main]
auto_branch_prefix: "flow/"
staging_extra_paths: []
staging_exclude_paths: []
```

### 10.7 セキュリティ
- `.env*.local` / 秘密情報を `.gitignore` で除外（O25）。
- 秘密情報の誤コミット検知（pre-commit hook で gitleaks / detect-secrets 推奨）。**特に各 PaaS のトークンが集中するため重要**。

## 11. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成（役割/収集方式/スコープ/レジストリ SoT 確定、機能・横断フォルダ設計） | /flow:concept |
