# feedback-inbox 機能仕様書

> **役割**: 各サービスがユーザーから収集したフィードバック/問い合わせを ServiceHUB が pull し、運営者 (seiji) が横断閲覧する consumer 側インボックス。
> **タグ**: feature, auth-required
> **最終更新**: 2026-06-18
> **入力アーティファクト**: `../concept.md` (§1.3.1 / §6.2), `./README.md`, perspectives O66/O67, [論点-007]

---

## 1. 詳細 UC（画面別フロー）

### UC 1: 運営者がフィードバック/問い合わせを横断閲覧する（concept §1.1 運用 UC 由来）
- **トリガー**: 運営者 (seiji) が `/feedback` を開く
- **前提**: Clerk ログイン済 (seiji 単一ユーザー)。`feedback_items` に pull 済みデータがある
- **入力**: フィルタ (サービス slug / kind / 期間) — クエリパラメータ
- **処理ステップ**:
  1. `GET /api/feedback/inbox?service=&kind=&since=` を呼ぶ
  2. ハンドラが `requireSeiji` で認証
  3. `feedback_items` から条件に合致する行を `createdAt` 降順で取得 (上限 N=200)
  4. サービス slug → 表示名を `services` テーブルで解決
- **出力**: 横断一覧 (サービス名 / kind バッジ / 本文 / rating / 受信日時)、サービス別・kind 別フィルタ UI
- **代替フロー / 例外**: データ 0 件 → 空状態メッセージ。認証失敗 → 401

### UC 2: 定期 pull でフィードバックを収集する（バックグラウンド、concept §4.3 スケジューラ由来）
- **トリガー**: 既存 collection cron (日次) の実行内、各サービス処理パスに feedback pull を追加
- **前提**: `HUB_SERVICE_INFO_SECRET` が env に設定済。サービスに `serviceInfo.endpoint` (or `url`) ベースがある
- **入力**: なし (registry の active サービス一覧)
- **処理ステップ**:
  1. collection runner が各 active サービスを処理
  2. feedback pull adapter が `GET {base}/api/hub/feedback` を `HUB_SERVICE_INFO_SECRET` (Bearer) で呼ぶ (`safeFetch`、SSRF/timeout/redirect 抑止を再利用)
  3. `FeedbackResponse` をパース・検証 (schemaVersion / items 配列 / 各 item の必須フィールド / 本文長 cap)
  4. 各 item を `feedback_items` に idempotent upsert (キー = `serviceSlug + externalId`)
- **出力**: `feedback_items` への書き込み。`collection_runs` に件数/エラー記録
- **代替フロー / 例外**: 404 / 未実装 / タイムアウト → そのサービスは空扱いでスキップ (他サービス処理は継続、graceful degradation)。不正スキーマ → reject + stderr 警告、 rawJson は保存しない

### UC 3: 運営者がトリアージする（concept §1.1 運用 UC 由来）
- **トリガー**: 一覧の 1 item で「トリアージ」操作
- **前提**: UC1 で表示済
- **入力**: 対象 item
- **処理ステップ**: item の body/context から `/flow:claim` 用のクレーム文テンプレートを生成し、クリップボードコピー or 表示 (どのサービス・どの kind・本文を 1 ブロックで)
- **出力**: 運営者が手元の対象サービス repo で `/flow:claim` に貼り付けられるテキスト
- **代替フロー / 例外**: なし (HUB 側はステータス writeback しない = pull only)

## 2. 入出力

### 2.1 API
| メソッド | パス | 入力 | 出力 | 認証 |
|---|---|---|---|---|
| GET | `/api/feedback/inbox` | `?service=<slug>&kind=<feedback\|bug\|inquiry>&since=<iso>&limit=<n≤200>` (すべて任意) | `{ items: FeedbackItem[], services: {slug,name}[] }` | `requireSeiji` (Clerk) |
| GET | `/api/hub/feedback` (★ producer 側契約、本フォルダは consumer。各サービスが実装) | `Authorization: Bearer <HUB_SERVICE_INFO_SECRET>` | `FeedbackResponse` | 共有シークレット |

<!-- spec-review R2: feedback endpoint 解決法を明示 (origin 派生、registry field 追加なし) -->
> **feedback endpoint の解決 (R2)**: pull 先 URL は `s.serviceInfo.endpoint` が設定済ならその **origin** + 固定パス `/api/hub/feedback`、未設定なら `s.url` の origin + 同パスで派生する。service-info endpoint (`/api/hub/service-info`) とは別パスだが **registry に専用 field は追加しない** (concept §6.1「各サービスが 5 分で足せる軽い契約」維持、O66 が固定パスを規定)。
>
> pull は既存 collection cron (日次) の実行時に **`runCollection` とは別の orchestration `runFeedbackCollection`** で実行する ([論点-FI-1]、R1)。専用 cron は設けない (`api/cron/collect.ts` で両者を invoke)。

### 2.2 画面入力（`/feedback` 運営者画面）
| フィールド | 型 | 必須 | バリデーション | 説明 |
|---|---|---|---|---|
| サービスフィルタ | select | 任意 | registry の slug | 特定サービスに絞る |
| kind フィルタ | select | 任意 | feedback / bug / inquiry | 種別で絞る |
| 期間フィルタ | select | 任意 | all / 30d / 7d (既定 30d) | dashboard の `parsePeriod` と同方式 |

### 2.3 副作用
- DB 書き込み: `feedback_items` upsert (pull 時)
- 外部呼び出し: 各サービスの `GET /api/hub/feedback` (read-only pull)
- 通知 / イベント発火: なし (MVP。将来 alerts と連携で新着通知も考えられるが本スコープ外)

## 3. データモデル

### 3.1 新規エンティティ
| エンティティ | フィールド | 型 | 制約 | 備考 |
|---|---|---|---|---|
| `feedback_items` (DB table) | `id` | text | PK | `${serviceSlug}:${externalId}` 合成キー |
| | `serviceSlug` | text | NOT NULL | registry 参照 (FK 制約は張らない、既存方針に合わせ論理参照) |
| | `externalId` | text | NOT NULL | producer 側 item id (サービス内一意) |
| | `kind` | text | NOT NULL | "feedback" / "bug" / "inquiry" |
| | `body` | text | NOT NULL | 本文 (producer 側 PII scrub 済、HUB 側で length cap) |
| | `rating` | doublePrecision | NULL | 好き嫌い等の数値評価 (任意) |
| | `contextJson` | jsonb | NULL | producer 申告の付帯情報 (画面/バージョン等、任意) |
| | `status` | text | NULL | producer 自己申告ステータス (任意、HUB は表示のみ) |
| | `createdAt` | timestamptz | NOT NULL | producer 側の発生時刻 |
| | `pulledAt` | timestamptz | NOT NULL defaultNow | HUB が取り込んだ時刻 |
| | (index) | | | `idx_feedback_svc_created` on (serviceSlug, createdAt) / unique `uniq_feedback_svc_external` on (serviceSlug, externalId) |

### 3.2 既存エンティティへの追加 / 変更
| エンティティ | 変更 | 影響 |
|---|---|---|
| `_shared/types` | `FeedbackItem` / `FeedbackResponse` / `FeedbackKind` 型を新規追加 | 既存型に影響なし (新規追加のみ) |
| `collection_runs` | 既存 `errorsJson` に feedback pull エラーも記録 (スキーマ変更なし) | 後方互換 |

### 3.3 契約型 (FeedbackResponse — producer ↔ consumer、concept §6.2 / O66)
```ts
type FeedbackKind = "feedback" | "bug" | "inquiry";
interface FeedbackItem {            // consumer 保存・表示単位
  id: string;                       // externalId (producer 内一意)
  kind: FeedbackKind;
  body: string;
  rating?: number;
  context?: Record<string, unknown>;
  createdAt: string;                // ISO 8601
  status?: string;
}
interface FeedbackResponse {        // GET /api/hub/feedback の戻り
  schemaVersion: number;
  service: string;
  items: FeedbackItem[];
  nextCursor?: string;              // MVP は未使用 ([論点-FI-3])
  extra?: Record<string, unknown>;
}
```

## 4. バリデーション + エラーケース

### 4.1 バリデーション (pull 受信時、HUB 側防御)
| 対象 | ルール | エラーメッセージ / 挙動 |
|---|---|---|
| `schemaVersion` | number | 不正 → reject (そのサービス空扱い) + stderr 警告 |
| `items` | 配列 | 配列でない → reject |
| `items[].id` | 非空 string | 欠落 → その item skip |
| `items[].kind` | feedback/bug/inquiry | 未知値 → その item skip (将来 kind 拡張時は後方互換で許容検討) |
| `items[].body` | 非空 string、length ≤ 4000 (cap) | 超過 → 切り詰め保存 + stderr 警告 |
| `items[].createdAt` | ISO 8601 parse 可 | 不正 → その item skip |

### 4.2 エラーケース
| ID | 条件 | HTTP / 状態 | ユーザー表示 | ログ |
|---|---|---|---|---|
<!-- spec-review R3: feedback pull エラーは collection_runs/ProviderKind に混ぜず独自記録 (MVP=warn) -->
| E1 | producer 未実装 (404) | スキップ | (運営者画面に影響なし) | console.warn "feedback:404" + runFeedbackCollection 戻り値サマリ |
| E2 | pull タイムアウト | スキップ | 同上 | "feedback:timeout" |
| E3 | 認証失敗 (401 from producer) | スキップ | 同上 | "feedback:401" — シークレット不一致を示唆 |
| E4 | `/api/feedback/inbox` 未認証 | 401 | "unauthorized" | — |
| E5 | 不正スキーマ | reject (空扱い) | 同上 | "feedback:badschema" |

> **R3**: feedback pull は `runCollection` と別 orchestration (`runFeedbackCollection`) のため、エラーは `collection_runs.errorsJson` (型 `provider: ProviderKind`) に混ぜず**独自に記録**する (MVP は `console.warn` + 戻り値サマリ、将来必要なら `feedback_runs` テーブル)。`ProviderKind` union は変更しない。

## 5. 機能固有 NFR + 既存機能連携

### 5.1 機能固有 NFR
| 項目 | 目標値 | 根拠 |
|---|---|---|
| `/api/feedback/inbox` 応答時間 | < 500ms (200 件) | 内部ツール、index 済クエリ |
| pull の他サービス非ブロック | 1 サービスの失敗が他に波及しない | 既存 collection runner の per-service try/catch を踏襲 |
| 本文 length cap | 4000 字 | DB 肥大・PII 露出面の抑制 |

### 5.2 既存機能連携
| 連携先 | 種別 | 依存内容 |
|---|---|---|
| `docs/collection/` | pull オーケストレーション | runner の per-service パスに feedback pull adapter を追加 (service-info pull と同層) |
| `docs/registry/` | データ参照 | active サービス一覧 + slug→name 解決 |
| `docs/_shared/providers/` | adapter 層 | `safeFetch` (SSRF/timeout/redirect 抑止) を再利用 |
| `docs/_shared/auth/` | 横断基盤 | `requireSeiji` で `/feedback` + `/api/feedback/inbox` を保護 |
| `docs/_shared/db/` | 横断基盤 | `feedback_items` テーブル + queries |
| `docs/_shared/types/` | 横断基盤 | `FeedbackItem` / `FeedbackResponse` 型 |

## 6. タグ別追加項目

### 6.1 認可（auth-required）
- ロール: seiji 単一ユーザー (Clerk)。既存 `requireSeiji` をそのまま使用
- 所有者チェック: なし (単一運営者、全データ閲覧可)
- pull 認証: producer ↔ HUB 間は `HUB_SERVICE_INFO_SECRET` 共通 1 本 (service-info と同じ、per-service secret なし、[D20260528-002] 整合)

## 7. スコープ外（含まないもの）
- producer 側 `GET /api/hub/feedback` の実装 (各サービス、O66、`/flow:revise`)
- Shipyard 専用 adapter ([論点-FI-4]、follow-up)
- フィードバックへの返信・ステータス writeback (pull only)
- 新着通知 (alerts 連携は将来検討)
- nextCursor による全件追従 ([論点-FI-3]、MVP は直近 N pull)

## 8. 未決事項（論点リスト）

### [論点-FI-1] feedback pull の実行オーケストレーション
- **影響範囲**: `collection` runner, `api/cron/collect.ts`
- **詰めるべき問い**: feedback pull を既存 collection cron (日次) に統合するか、専用 cron を分けるか
- **候補案**:
  - 案 A: 既存 collection runner の per-service パスに統合 ／ 利点: インフラ再利用・1 回の pull で metrics+feedback 取得・cron 追加不要 (Vercel Hobby 日次制限とも整合) ／ 欠点: feedback の更新頻度を metrics と独立に上げられない
  - 案 B: 専用 cron (`/api/cron/feedback`) ／ 利点: 頻度独立 ／ 欠点: Hobby cron 制限・管理面増
- **推奨**: 案 A。内部ツールでリアルタイム性不要、日次で十分。頻度を上げたくなったら案 B に分離。
- **判断期限**: 実装時 (本 SPEC で案 A 前提で PLAN 作成)
- **担当**: seiji

### [論点-FI-2] feedback_items の保持期間 (retention)
- **影響範囲**: `_shared/db`, pull adapter
- **詰めるべき問い**: 古い feedback を剪定するか、無期限保持か。PII を含み得るため保持期間を設けるべきか
- **候補案**:
  - 案 A: MVP は全保持 + 表示は直近 N=200 ／ 利点: シンプル ／ 欠点: 長期で肥大
  - 案 B: 90 日で剪定 (cron) ／ 利点: PII 露出面・容量抑制 ／ 欠点: 実装追加
- **推奨**: 案 A (MVP)。件数が増えたら案 B の剪定 cron を追加。producer 側で PII scrub 済の前提。
- **判断期限**: 容量・件数が問題化した時点
- **担当**: seiji

### [論点-FI-3] 増分 pull (nextCursor 追従)
- **影響範囲**: pull adapter, producer 契約
- **詰めるべき問い**: producer の `nextCursor` を使い全件追従するか、直近 N 件 pull + idempotent upsert で済ますか
- **候補案**:
  - 案 A: 直近 N 件 pull + (serviceSlug, externalId) で idempotent upsert ／ 利点: シンプル・冪等・取りこぼしは次回 pull で回収 ／ 欠点: 大量 backlog の初回取り込みは N 件まで
  - 案 B: nextCursor でページング全取得 ／ 利点: 完全取り込み ／ 欠点: 実装複雑・per-service cursor 状態管理
- **推奨**: 案 A (MVP)。`FeedbackResponse.nextCursor` は型に残し未使用、必要時に案 B へ。
- **判断期限**: 実装時 (案 A 前提)
- **担当**: seiji

### [論点-FI-4] Shipyard 専用 adapter（follow-up、本 MVP スコープ外）
- **影響範囲**: 新規 shipyard-feedback adapter, shipyard 側 contact API (別 repo)
- **詰めるべき問い**: Shipyard (givers.work) の contact form 問い合わせ取り込みの API 契約形状
- **候補案**: shipyard 側 contact API 設計確定後にこちらの取り込み adapter を設計 (標準 `/api/hub/feedback` 契約に乗らないため専用)
- **推奨**: shipyard concept §2.5 で contact API を設計してから本 HUB 側 adapter を `/flow:feature` or `/flow:revise` で追加。本 feature では標準契約のみ実装 (ユーザー 2026-06-18 決定)。
- **判断期限**: shipyard 側 contact API 設計後
- **担当**: seiji

## 9. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-18 | 初版作成 ([論点-007] / O67 consumer) | /flow:feature |
