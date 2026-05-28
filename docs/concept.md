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
4. **サービスの追加（運用フロー）**: 新サービスを公開したら、HUB の管理画面（Clerk ゲート内）からサービス座標を 1 件登録するだけで管理対象に入る。**Git 編集も再デプロイも不要**（レジストリは DB が SoT、[D20260528-001]）。サービス座標は秘密を含まない（[D20260528-002] 秘密ゼロ化）ため、`.env` への追記も発生しない。
5. **死活確認**: 各サービス URL を定期 ping し、ダウンしているサービスを即座に把握する。

### 1.2 スコープ
**含むもの**:
- 各 PaaS API からの pull 集約（稼働 ping / 利用数 / インフラ使用量 / コスト概算 / エラー件数）
- **各サービスが公開する標準「service-info エンドポイント」からの pull**（アプリ層の利用指標・§4.6 内部コストログ・カスタムヘルス。PaaS API では取れない値。HUB が呼ぶので push ではなく pull、D002 と整合）
- 時系列スナップショットの保存と可視化（一覧 + 個別グラフ）
- 無料枠閾値アラート（seiji への通知）
- **DB レジストリ + Clerk ゲート内 admin write**（Neon の `services` テーブルが SoT、[D20260528-001]）。新サービス追加は再デプロイ不要。書き込み経路でも SSRF/秘密直書き検証を実施
- **service-info エンドポイントの標準契約（スキーマ）の定義**（service-hub が SoT。各マイクロサービスが実装する。[論点-003]）。MAU 等アプリ層指標は各サービスが service-info で自己申告し HUB が pull（[D20260528-002]）

**含まないもの（明示除外）**:
- 外部 PaaS への**書き込み操作**（デプロイ再実行 / サービス停止 / 環境変数更新）→ 将来フェーズ
- エンドユーザー向け公開機能・マルチテナント
- 各サービスのアプリ層イベントの push 受信（ハイブリッド化は将来の拡張余地）
- サービス自体の APM / 分散トレーシング（Sentry 等の既存ツールに委ねる）

### 1.3 ドキュメントフォルダ分割設計

#### 1.3.1 機能フォルダ（業務ドメイン別）

| フォルダ (docs/ 配下) | 含む機能 | 担当する画面 / API | 依存 | 優先度 | 基盤 |
|---|---|---|---|---|---|
| docs/registry/ | 管理対象サービスの DB レジストリ定義・ローダ・バリデーション・admin write | services テーブルスキーマ / サービス一覧取得 / 登録編集 API | _shared/types, _shared/db, _shared/auth | 2 | ✅ |
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
  registry/              # DB レジストリローダ + スキーマ (services テーブル read/write, Zod 検証)
  providers/             # PaaS API アダプタ (vercel.ts / neon.ts / clerk.ts / cloudflare.ts / sentry.ts / ping.ts)
  db/                    # Drizzle スキーマ + クライアント (Neon, services テーブルを含む)
  lib/                   # ユーティリティ (cost 計算 / 日付 / フォーマット)
  components/            # 共通 UI 部品 (shadcn/ui ベース)
  types/                 # 共通型
api/                     # Vercel Functions
  cron/collect.ts        # 定期 pull (Vercel Cron トリガー)
  admin/services.ts      # サービス登録/編集 (Clerk ゲート内 admin write, [D20260528-001])
  services/[slug]/timeseries.ts
# レジストリ SoT = Neon の services テーブル (旧 services.toml は移行後退役)
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

<!-- auto-generated-start -->
### 3.X セキュリティ要件（/flow:secure L1 由来、2026-05-26）

> `docs/SECURITY_REVIEW_20260526.md` のレビュー結果を要件として明文化。本 PJ の最重要脅威は**複数 PaaS トークンの集中**（O25）。

- **O25 秘密情報（最優先）**: 全 PaaS トークンは **read-only スコープ**で発行。秘密は `.env` / Vercel Secrets のみ、リポジトリに置かない。`.gitignore` で `.env*.local` 除外、pre-commit で gitleaks/detect-secrets を推奨。
- **O23/authn**: HUB 全ルートを Clerk で **seiji 単一アカウントに限定**（未認証は全ブロック）。単一ユーザーのためリソース別 RBAC/RLS は不要。
- **O24 入力検証（実装時）**: 外向き fetch（サービス URL ping / プロバイダ API）に **タイムアウト + リダイレクト/内部アドレス抑止**。プロバイダ JSON は安全パース。**`usage_snapshots.raw_json` にトークン/シークレットを保存しない**（スクラブ必須）。→ [論点-004]
- **O27 外向きレート遵守**: プロバイダ API の**レート制限を厳守**し、結果は DB スナップショットにキャッシュ（画面から直叩きしない）。
- **service-info 共有シークレット（O48/[論点-003]/[D20260528-002]）**: HUB↔サービス間の共有シークレットは**全サービス共通の 1 本**（`HUB_SERVICE_INFO_SECRET` 等）を HUB env に保持。サービス固有の per-service シークレット（旧 `HANAMEMO_HUB_SECRET` / `HANAMEMO_CLERK_SECRET`）は撤廃し、新サービス追加で `.env` が増えない。レジストリ（`services` テーブル）には**シークレットを一切持たせない**（非機密記述子のみ。秘密直書きは write 経路で検証拒否）。
- **レジストリ admin write（[D20260528-001]）**: サービス登録/編集は HUB の Clerk ゲート内 admin 操作のみ（公開 POST エンドポイント・全サービス共通登録鍵の配布は**不採用**＝公開 write 穴/鍵漏洩の爆発半径を作らない）。write 時に Zod で SSRF（内部アドレス禁止）・秘密直書き・slug 一意性を検証。
- **O28 依存 CVE**: 実装後に `/flow:secure --phase=deps` + Dependabot を CI に組み込み（§10.5）。
<!-- auto-generated-end -->

## 4. 全体アーキテクチャ

```
                ┌─────────────────────────── service-hub (Vercel) ───────────────────────────┐
                │                                                                              │
  seiji ──Clerk─┤  React SPA (dashboard / service-detail / alerts)                            │
   (閲覧)        │        │ reads                                                               │
                │        ▼                                                                     │
  seiji ─admin─┤  (Clerk ゲート内で services テーブルに登録/編集 = サービス追加)               │
                │   Neon (Postgres): services / usage_snapshots / alert_events / collection_runs│
                │        ▲ upsert                                                              │
                │        │                                                                     │
                │   Vercel Cron ──▶ /api/cron/collect ──▶ collection runner                    │
                │                                              │ reads services テーブル (SoT) │
                │                                              ▼                               │
                │                                   providers/* adapters (read-only API)       │
                └──────────────────────────────────────────────┬───────────────────────────────┘
                                                                │ pull (read-only)
                  ┌──────────────┬──────────────┬───────────────┼───────────────┬──────────────┐
                  ▼              ▼              ▼               ▼               ▼              ▼
               Vercel API     Neon API   各サービス          Cloudflare API   Sentry API   各サービス URL
              (帯域/デプロイ) (DB 使用量) service-info        (R2 使用量)      (エラー)      (uptime ping)
                                         (MAU/指標 自己申告)
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

> 本 PJ の該当レベル: **個人ツール / 無料枠**（§4.6.1）。
> **【2026-05-27 スコープ拡張】** service-hub 自身は無料枠運用だが、**監視対象サービスのビジネス/収益観測を第一級スコープに追加**（`_shared/providers/revise_001_20260527_business-observability/`）。各サービスの収益・AI コスト・採算・決済離脱率を service-info 自己申告で集約し、無料枠（provider アカウント単位で共有）の食い潰しに対する**格上げコストシミュレーション**で keep / upgrade / consolidate / sunset を提案する。よって「収益指標・BEP 不要」は**監視対象サービスについては解除**（HUB 自身のコストは引き続き ~$0）。撤退の実行は `/flow:sunset`。

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

**services（DB テーブルが SoT。[D20260528-001]、旧 `services.toml` から移行）**
- `slug`（一意キー）/ `name` / `url` / `subdomain` / `status`（active / paused / retired）
- `providers`: 各プロバイダの**非機密識別子**（例: `vercel_project_id` / `neon_project_id` / `cloudflare_account_id` + `r2_bucket` / `sentry_project`。`clerk_app_id` は MAU を service-info 自己申告に移したため任意）
- `thresholds`: 無料枠アラート閾値（任意、プロバイダ別 or グローバル）
- **シークレットは保持しない**（[D20260528-002] 秘密ゼロ化。provider トークンはアカウント単位の HUB env、service-info 鍵は共通 1 本）。編集は Clerk ゲート内 admin write のみ、書き込み時に SSRF/秘密直書き検証

**usage_snapshots（DB / 時系列）**
- `id` / `service_slug` / `provider`（vercel/neon/clerk/cloudflare/sentry/ping）/ `metric_key`（例: `mau` / `db_storage_bytes` / `bandwidth_bytes` / `error_count` / `up`）/ `metric_value`（numeric）/ `unit` / `captured_at` / `raw_json`（生レスポンス保全）

**alert_events（DB）**
- `id` / `service_slug` / `provider` / `rule`（例: `free_tier_80pct`）/ `triggered_at` / `value` / `notified_at` / `resolved_at`

**collection_runs（DB / 収集ログ）**
- `id` / `started_at` / `finished_at` / `status`（ok / partial / failed）/ `services_count` / `errors_json`（プロバイダ別失敗詳細・レート消費）

### 5.2 データフロー
1. Vercel Cron → `/api/cron/collect` 起動。
2. runner が `services` テーブル（status=active）を読み、各サービス × 各プロバイダで adapter を呼ぶ（+ URL ping + service-info pull）。MAU 等アプリ層指標は service-info の自己申告値を採用。
3. 取得値を `usage_snapshots` に upsert、生レスポンスを `raw_json` に保全。
4. 閾値を評価し超過なら `alert_events` 追加 + seiji へ通知。
5. 実行結果を `collection_runs` に記録。
6. ダッシュボード/個別画面は DB のみを読んで描画（プロバイダ API を直接叩かない）。

## 6. 外部連携

| 連携先 | 用途 | 方式 | 認証 |
|---|---|---|---|
| Vercel API | デプロイ状態 / 帯域使用量 | REST（read-only） | API Token（read scope）、Vercel Secrets / `.env.local` |
| Neon API | DB ストレージ / コンピュート使用量 | REST（read-only） | API Key（read scope） |
| Cloudflare API | R2 ストレージ使用量 | REST（read-only） | API Token（R2 read scope、アカウント単位） |
| Sentry API | サービスごとのエラー件数 | REST（read-only） | Auth Token（read scope、org 単位） |
| 各サービス URL | uptime ping | HTTP GET（ヘルスチェック） | なし（公開エンドポイント） |
| 各サービスの service-info エンドポイント | アプリ層利用指標 / **MAU（自己申告、[D20260528-002]）** / 内部コストログ / カスタムヘルスを pull | HTTP GET（標準契約スキーマ、[論点-003]） | **全サービス共通シークレット 1 本**（HUB↔サービス間）。読み取り専用 |
| Clerk（HUB 自身） | seiji 単一ユーザーのアクセス制御 | SDK | Publishable / Secret Key |

**外部 AI サービス利用: なし**（Q12.5 で明示確認。根拠: 観測ダッシュボードであり AI 推論を必要としない。ユーザー直接叩きとの差別化観点も該当なし）。
**アナリティクス・計測ツール利用: なし（外部向け）**（Q12.6。根拠: 単一ユーザー内部ツールで行動分析不要。エラー監視は Sentry を §4.3 監視カテゴリで採用。コスト追跡は §4.6 最小構成）。

### 6.1 service-info 契約のクロスサービス波及（標準化）

service-hub が定義する service-info エンドポイント契約（[論点-003]）は、HUB 単体で完結せず**各マイクロサービス側の実装を要求する**。そのため契約は service-hub を SoT としつつ、以下の経路で全サービスに展開する:

1. **契約確定**: service-hub の `_shared/types`（スキーマ型）+ `_shared/providers`（service-info adapter）の設計時に確定（[論点-003]）。
2. **MAU 自己申告への移行（[D20260528-002]）**: HUB が各サービスの Clerk API を per-service secret で直接叩くのをやめ、**各サービスが自分の MAU を service-info で申告**する（サービスは自分の Clerk secret を既に持つ）。これにより HUB から per-service Clerk secret が消え、`.env` がサービス追加で増えない。service-info 認証は**全サービス共通シークレット 1 本**に統一。
3. **第一弾サービスへの retrofit**: 確定後、**hana-memo** に service-info エンドポイント（MAU 自己申告を含む）を追加実装し、共通シークレットに合わせる（hana-memo 側で `/flow:revise`）。登録は HUB の admin write で seiji が行うため、hana-memo 側に HUB への登録呼び出しは不要。
4. **flow 系コマンドへの標準組み込み**: 以後 flow で作る全マイクロサービスが新規時点でこのエンドポイント（MAU 自己申告 + 共通シークレット）を備えるよう、**共有 SoT（perspectives.md O48）を本契約に合わせて更新**する。これにより `/flow:concept` `/flow:feature` `/flow:onboard` が各サービス設計時に自動で考慮する。
5. **後方互換**: 契約はバージョニングし、未実装サービスは PaaS API pull のみにフォールバック（[論点-003] 案 A）。

> **登録（descriptor）とメトリクス収集は別物**: 登録は HUB の DB に admin write（[D20260528-001]、サービス起点 push ではない）、メトリクス収集は引き続き HUB→各 PaaS / service-info の **pull**（D20260526-002 維持）。この方向性が service-hub の運用上の肝。**契約は「連発前提で各サービスが軽く実装できる最小スキーマ」を維持する**こと。

## 7. 決定事項ログ

| 日付 | 決定内容 | 根拠 | 影響セクション | decision_id |
|---|---|---|---|---|
| 2026-05-26 | HUB の本質的役割 = 開発者向け内部運用ダッシュボード | AskUserQuestion | §1, §1.2, §4.7 | [D20260526-001](./AI_LOG/D20260526_001_concept_initial.md#decisions) |
| 2026-05-26 | 利用状況の収集方式 = HUB が各 PaaS API を pull | Q4-Q7 アーキ核 | §1.1, §4, §6, §1.3 | [D20260526-002](./AI_LOG/D20260526_001_concept_initial.md#decisions) |
| 2026-05-26 | 管理スコープ = 閲覧のみ（observability、PaaS 書き込みなし） | Q 管理スコープ | §1.2, §3, §4 | [D20260526-003](./AI_LOG/D20260526_001_concept_initial.md#decisions) |
| 2026-05-26 | ~~レジストリ SoT = Git 管理の宣言ファイル（services.toml）~~ → **[D20260528-001] で superseded** | Q レジストリ SoT | §1.1, §1.4, §5.1 | [D20260526-004](./AI_LOG/D20260526_001_concept_initial.md#decisions) |
| 2026-05-28 | **レジストリ SoT = Neon の `services` テーブル + Clerk ゲート内 admin write**（D20260526-004 を反転）。新サービス追加は再デプロイ不要。公開 POST / 共通登録鍵の配布は不採用（公開 write 穴・鍵漏洩の爆発半径を回避）。write 経路で SSRF/秘密直書き/slug 一意性を検証。services.toml は DB へ移行し退役。メトリクス収集は pull 維持（D20260526-002 不変） | seiji（再デプロイ手間の解消） | §1.1, §1.2, §4, §5.1, §5.2, §3.X | [D20260528-001](./AI_LOG/D20260528_001_concept_update_20260528.md#decisions) |
| 2026-05-28 | **秘密ゼロ化**: HUB のサービス固有シークレット（per-service Clerk secret / service-info secret）を撤廃。Clerk MAU は各サービスが service-info で自己申告（D20260526-005 の Clerk API pull 部分を置換）、service-info 秘密は全サービス共通 1 本に統一。結果 HUB の `.env` は新サービス追加で不変（アカウント単位トークン + 共通 service-info 秘密 + HUB 自身の Clerk のみ） | seiji（.env 追記の解消） | §1.1, §1.2, §3.X, §5.1, §6, §6.1 | [D20260528-002](./AI_LOG/D20260528_001_concept_update_20260528.md#decisions) |
| 2026-05-26 | MVP pull 対象 = uptime ping + Vercel + Neon + Clerk（Sentry/R2 は Phase 2） | auto-pick | §1.2, §6 | [D20260526-005](./AI_LOG/D20260526_001_concept_initial.md#decisions) |
| 2026-05-26 | アプリ層は各サービスの標準 service-info エンドポイントを HUB が pull（service-hub が契約 SoT）。確定後 hana-memo に retrofit + flow 標準化 | seiji 追加指示 | §1.2, §6.1, §8 論点-003 | [D20260526-009](./AI_LOG/D20260526_001_concept_initial.md#decisions) |

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
- **status**: ✅ **解決 (2026-05-26)** — providers SPEC §1.2 で段階導入方針確定（MVP=ping/Vercel deploy/Neon storage・compute/Clerk user count、free-tier % は services.toml thresholds と取得値から HUB 側算出、R2/Sentry/帯域/厳密MAU は Phase2[論点-PR1]）。実 API 形状の最終確認は /flow:release Phase2。
- **判断期限**: docs/_shared/providers/ の機能設計時（/flow:feature）
- **担当**: seiji

### [論点-002] スケジューラの頻度と Vercel Hobby Cron 制限
- **影響範囲**: docs/collection/, §4.3 スケジューラ
- **詰めるべき問い**: Vercel Hobby の Cron 実行頻度制限で必要な pull 間隔（例: 1 時間ごと）を賄えるか。賄えなければ GitHub Actions cron に逃がすか。
- **候補案**:
  - 案 A: Vercel Cron（統合が楽）／ 欠点: Hobby は頻度制限あり（要確認）
  - 案 B: GitHub Actions cron が `/api/cron/collect` を叩く ／ 利点: 頻度自由・無料 ／ 欠点: 別系統の管理
- **推奨**: まず Vercel Cron で日次〜数時間ごとを試し、頻度が足りなければ案 B に切替。内部観測ツールでありリアルタイム性は不要。
- **status**: ✅ **解決 (2026-05-26, /flow:release)** — Vercel Hobby は cron 日次のみ許可（hourly はデプロイ拒否）。`vercel.json` の cron を `0 * * * *`→`0 0 * * *`（日次 00:00 UTC）に変更し案 A で確定。リアルタイム不要のため日次で十分。より高頻度が要るなら案 B（GitHub Actions cron が `/api/cron/collect` を `CRON_SECRET` 付きで叩く）へ将来移行。
- **判断期限**: docs/collection/ の機能設計時
- **担当**: seiji

### [論点-003] service-info エンドポイントの標準契約（スキーマ）定義 ★クロスサービス波及あり
- **影響範囲**: docs/_shared/providers/（service-info adapter）, docs/_shared/types/（契約スキーマ型）, **全マイクロサービス（実装側）**, flow 系コマンド（標準化）
- **詰めるべき問い**:
  1. エンドポイントのパス・メソッド・認証（例: `GET /api/hub/service-info`、HUB↔サービス共有シークレット）。
  2. レスポンススキーマ: 何を返すか（アプリ層 active 数 / 主要機能の利用カウント / §4.6 内部コストログ集計 / カスタムヘルス / バージョン / 最終デプロイ等）。バージョニング方針。
  3. 必須項目と任意項目の切り分け（最小契約で全サービスが軽く実装できるように）。
  4. 取得失敗・未実装サービスの扱い（PaaS API pull のみにフォールバック）。
- **候補案**:
  - 案 A: 最小固定スキーマ（必須数項目 + `extra` 自由フィールド）／ 利点: 全サービスが軽く実装、HUB 側の正規化が単純 ／ 欠点: サービス固有指標は `extra` で型が緩い
  - 案 B: リッチな型付きスキーマ（メトリクス配列 + メタ）／ 利点: 表現力 ／ 欠点: 各サービスの実装負担増、連発に逆行
- **推奨**: 案 A（最小固定 + extra）。連発前提では「各サービスが 5 分で足せる軽い契約」が最重要。
- **status**: ✅ **スキーマ確定 (2026-05-26)** — providers SPEC §1.3 で契約確定（`GET /api/hub/service-info` + 共有シークレット、`{schemaVersion, service, status, metrics?[], version?, extra?}`、案 A 最小固定+extra）。`_shared/types` に `ServiceInfoResponse` 追加済（[論点-T1] 解決）。
- **波及（重要・残作業）**: 本契約確定により以下が actionable に（**別 PJ/別セッションで実施**）: **(1) hana-memo に retrofit**（`/flow:revise`、第一弾サービス）、**(2) perspectives O48 の標準スキーマを本契約で具体化**。flow 標準化の枠組み（O48 + charter §0.2）は登録済。
- **判断期限**: docs/_shared/providers/ + docs/_shared/types/ の機能設計時（/flow:feature）→ 設計完了、波及は運用フェーズ
- **担当**: seiji

### [論点-004] [SEC-002] O24 入力検証（SSRF / 安全パース / raw_json スクラブ）
- **status**: `closed` ✅ **(2026-05-27 解決、実装充足を /flow:audit + /flow:secure で確認)**
- **status 履歴**: 2026-05-26 08:35 open（/flow:secure --phase=design 由来） → 2026-05-27 21:30 closed（実装で全推奨対策を充足）
- **解決根拠 (実装)**: `src/providers/fetch.ts` の `safeFetch()` が (1) `INTERNAL_HOST` 正規表現で内部アドレス (localhost/127./10./192.168./169.254./172.16-31./::1/fc00:/fe80:) を block (SSRF 抑止)、(2) `timeoutMs=10_000` + AbortController でタイムアウト、(3) `redirect:"manual"` でリダイレクト追従抑止。`scrubSecrets()` (同 fetch.ts:34-) が raw_json 保存前に秘密フィールドをスクラブ (O25 連動)。`src/registry/schema.ts` が Zod で services.toml を検証。→ §8 から §7 決定事項ログ相当へ移動済 (本エントリは closed として保全)。
- **観点 ID**: O24_input_validation
- **severity**: Medium
- **影響範囲**: docs/_shared/providers/, docs/collection/, §5.1 usage_snapshots.raw_json
- **検出根拠**: HUB が `services.toml` 由来のサービス URL を ping + プロバイダ API を叩く（外向き fetch）。攻撃面は単一ユーザー + Git 管理 config で小さいが、堅牢性のため実装時対応が望ましい。
- **詰めるべき問い**:
  1. 外向き fetch にタイムアウト・リダイレクト追従制限・内部アドレス fetch 抑止を入れるか。
  2. `raw_json` 保存時に秘密フィールドをスクラブする方式（O25 連動）。
- **推奨**: 採用。`registry` のスキーマ検証（Zod 等）+ `providers` の fetch 制限 + raw_json スクラブを実装時に組み込む。
- **判断期限**: docs/_shared/providers/ + docs/collection/ の機能設計/実装時
- **担当**: seiji
- **L1 レポート**: `./SECURITY_REVIEW_20260526.md#sec-002`

### [論点-005] [SEC-003] @vercel/node devDependency チェーンの High CVE 6 件 (ReDoS / undici): High (in-context Low)
- **status**: `closed` ✅ **(2026-05-28 解決、accepted-risk としてユーザー明示確定、4 回連続再提示の悪循環断ち)**
- **status 履歴**: 2026-05-27 21:30 open（/flow:secure --phase=deps、npm audit 由来） → 2026-05-28 20:14 closed (accepted-risk、ユーザー明示確定、release Phase 1 SEC-003 確認窓で承認、decision_id=D20260528-126)
- **観点 ID**: O28_dependency_vulnerability
- **severity**: High (npm audit CVSS ベース) / **in-context Low** (devDep build-tooling・本番ランタイム非搭載)
- **影響範囲**: `package.json` devDependencies (`@vercel/node@5.8.4`)、build/dev/test ツールチェーンのみ
- **検出根拠**: `npm audit` で 6 High (minimatch/path-to-regexp ReDoS, undici 複数, @vercel/build-utils, @vercel/python-analysis) + 11 Moderate (esbuild/vite/vitest/ajv/drizzle-kit 等)。**全て dev/build/test tooling の推移的依存**。本番ランタイム依存 (@clerk/backend / @neondatabase/serverless / drizzle-orm / react / zod) は脆弱性ゼロ。詳細: `./SECURITY_DEPS_20260527.md`
- **詰めるべき問い**:
  1. accepted-risk として受容するか (推奨)。理由: devDep build-tooling / 本番リクエスト処理経路に非搭載 / 内部単一ユーザー Clerk gate でビルド工程に外部入力なし / npm 提示の fix は major **downgrade** (4.0.0) で forward fix 不在 (5.8.4 は最新系、upstream Vercel ツール側に残存)。
  2. 代替として @vercel/node メジャー追従を試すか (forward fix が出るまで効果なし)。
- **候補案**:
  - 案 A (推奨): **accepted-risk**。CI に `npm audit --omit=dev --audit-level=high` (本番依存のみ、現状 0 件) を入れて健全性を継続確認。upstream fix を定期再スキャンで追跡。
  - 案 B: @vercel/node を別ランタイム型に置換 (過剰、内部ツールに不要)。
- **推奨**: 案 A 採用 (accepted-risk)。ただし **High のため受容はユーザー明示判断が必要**。
- **判断期限**: 次回 release / ユーザー確認時
- **担当**: seiji
- **L4 レポート**: `./SECURITY_DEPS_20260527.md`

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
| 2026-05-26 | service-info 契約のクロスサービス波及を追加（§1.2/§6.1/§6/§8 論点-003）。各サービスが標準 service-info エンドポイントを公開し HUB が pull。契約 SoT=service-hub、確定後に hana-memo retrofit + flow 標準化（perspectives O48 / charter §0.2 登録済） | /flow:concept (seiji 追加指示) |
| 2026-05-26 | /flow:secure L1 設計レビュー反映。§3.X セキュリティ要件 auto-add（O25 トークン集中=最重要、対応済を明文化）+ §8 [論点-004]（O24 入力検証 Medium）。新規 Critical/High なし | /flow:secure --phase=design (auto P3) |
| 2026-05-28 | レジストリ方式の設計変更を反映（[D20260528-001] DB SoT + Clerk ゲート内 admin write へ反転、再デプロイ不要 / [D20260528-002] 秘密ゼロ化 = Clerk MAU を service-info 自己申告へ + service-info 秘密を共通 1 本へ）。§1.1/§1.2/§4/§5.1/§5.2/§3.X/§6/§6.1/§7 更新。メトリクス pull は維持。後続: registry/_shared 改修は /flow:revise、perspectives O48 更新、hana-memo retrofit | /flow:concept (seiji 指示) |
