# _shared/types 仕様書（横断基盤）

> **役割**: service-hub 全体で共有する型定義（ServiceDescriptor / UsageMetric / SnapshotRow 等）の単一情報源。
> **タグ**: cross-cutting（UI なし、提供インターフェース型）
> **最終更新**: 2026-05-26
> **入力アーティファクト**: `../../concept.md`（§5.1 データ設計 / §6 外部連携）, `./README.md`
> **target_type**: cross-cutting → 「詳細 UC」は「提供インターフェース（型定義）」に置換、E2E スキップ

---

## 1. 提供インターフェース（型定義）

> 全て TypeScript の `type`/`interface`。実装は `src/types/`（§1.4）。**ランタイム検証は registry/providers が担い、本フォルダは型 + 型ガード + 定数のみ**を提供。

### 1.1 列挙・定数型

```ts
// プロバイダ種別（pull 対象）。MVP=ping/vercel/neon/clerk、Phase2=cloudflare/sentry
type ProviderKind = 'ping' | 'vercel' | 'neon' | 'clerk' | 'cloudflare' | 'sentry';

// サービスの運用状態（services.toml の status）
type ServiceStatus = 'active' | 'paused' | 'retired';

// 収集ランの結果
type CollectionStatus = 'ok' | 'partial' | 'failed';

// メトリクスキー（拡張可能なので string 互換のリテラル union + (string & {}) で開く）
type KnownMetricKey =
  | 'up'                 // ping 死活 (1/0)
  | 'mau'                // Clerk 月間アクティブ
  | 'db_storage_bytes'   // Neon
  | 'db_compute_seconds' // Neon
  | 'bandwidth_bytes'    // Vercel
  | 'r2_storage_bytes'   // Cloudflare R2 (Phase2)
  | 'error_count'        // Sentry (Phase2)
  | 'last_deploy_at';    // Vercel
type MetricKey = KnownMetricKey | (string & {});
```

### 1.2 ServiceDescriptor（services.toml の記述子型、レジストリ SoT）

```ts
// 各プロバイダの非機密識別子。シークレット(トークン/共有secret)は env 参照名のみ持ち、値は持たない。
interface ProviderRefs {
  vercel?:     { projectId: string };
  neon?:       { projectId: string };
  clerk?:      { appId: string; secretEnv?: string };   // secretEnv = env キー名
  cloudflare?: { accountId: string; r2Bucket?: string };
  sentry?:     { org: string; project: string };
}

// service-info エンドポイント契約（[論点-003] 確定後に詳細化、現状は枠のみ）
interface ServiceInfoRef {
  endpoint?: string;   // 例: https://<service>/api/hub/service-info
  secretEnv?: string;  // HUB↔サービス共有シークレットの env キー名（services.toml には値を書かない）
}

// 無料枠アラート閾値（任意、プロバイダ/メトリクス別）
type Thresholds = Partial<Record<MetricKey, { warnPct?: number; limit?: number }>>;

interface ServiceDescriptor {
  slug: string;          // 一意キー（ファイル名安全）
  name: string;          // 表示名
  url: string;           // 公開 URL（ping 対象）
  subdomain?: string;
  status: ServiceStatus;
  providers: ProviderRefs;
  serviceInfo?: ServiceInfoRef;
  thresholds?: Thresholds;
}
```

### 1.3 メトリクス・スナップショット型

```ts
// 1 回の収集で得た正規化済みメトリクス（DB 保存前）
interface UsageMetric {
  provider: ProviderKind;
  key: MetricKey;
  value: number;
  unit: string;          // 'bytes' | 'count' | 'bool' | 'seconds' | 'epoch_ms' 等
}

// usage_snapshots テーブル 1 行（§5.1）
interface SnapshotRow {
  id: string;
  serviceSlug: string;
  provider: ProviderKind;
  metricKey: MetricKey;
  metricValue: number;
  unit: string;
  capturedAt: string;    // ISO 8601
  rawJson?: unknown;     // 生レスポンス保全（[論点-004]: 秘密フィールドはスクラブ済のもののみ）
}
```

### 1.4 アラート・収集ラン型

```ts
// alert_events テーブル 1 行（§5.1）
interface AlertEvent {
  id: string;
  serviceSlug: string;
  provider: ProviderKind;
  rule: string;          // 例: 'free_tier_80pct' | 'down'
  triggeredAt: string;
  value: number;
  notifiedAt?: string;
  resolvedAt?: string;
}

// collection_runs テーブル 1 行（§5.1、収集自体の可観測性）
interface CollectionRun {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: CollectionStatus;
  servicesCount: number;
  errors?: Array<{ serviceSlug: string; provider: ProviderKind; message: string }>;
}
```

### 1.5 ProviderAdapter インターフェース（_shared/providers が実装、ここで契約のみ宣言）

```ts
// pull の共通契約。各 provider adapter / ping / service-info adapter が実装。
interface ProviderAdapter {
  kind: ProviderKind;
  // 1 サービス分を収集。失敗は throw せず errors として返す設計を推奨（部分成功のため）
  collect(service: ServiceDescriptor): Promise<{ metrics: UsageMetric[]; error?: string }>;
}
```

## 2. 入出力
- **提供**: 上記型 + 型ガード（`isServiceStatus` / `isProviderKind` 等）+ 定数配列（`PROVIDER_KINDS` / `MVP_PROVIDERS`）。
- **副作用**: なし（純粋な型 + ガード関数）。DB アクセス/外部呼び出しは持たない。

## 3. データモデル
本フォルダは §5.1 のエンティティを**型として表現**する層。物理スキーマ（テーブル DDL / Drizzle）は `_shared/db` が担う（型は本フォルダを import）。

## 4. バリデーション + エラーケース
- 本フォルダは**型ガード**（実行時 narrowing）のみ提供: `isProviderKind(x): x is ProviderKind` 等。
- 完全なスキーマ検証（services.toml パース）は `registry`、API レスポンス検証は `providers` の責務（型は本フォルダ）。
- エラーケースは型レベルでは扱わない（呼び出し側）。

## 5. 機能固有 NFR + 既存機能連携
### 5.1 機能固有 NFR
| 項目 | 目標値 | 根拠 |
|---|---|---|
| �ライアントゼロ依存 | 外部ランタイム依存なし | 型 + ガードのみ、全フォルダが import するため軽量必須 |
| 後方互換 | MetricKey は open union で拡張可 | Phase2 でメトリクス追加時に破壊変更を避ける |

### 5.2 既存機能連携（被依存）
| 連携先 | 種別 | 依存内容 |
|---|---|---|
| _shared/db | 型参照 | SnapshotRow/AlertEvent/CollectionRun を Drizzle スキーマに対応 |
| _shared/providers | 型参照 | ProviderAdapter/UsageMetric/ServiceDescriptor を実装 |
| registry | 型参照 | ServiceDescriptor をパース結果の型に |
| collection/dashboard/service-detail/alerts | 型参照 | 全型を利用 |

## 6. タグ別追加項目
cross-cutting のため UI/状態遷移/オフライン/i18n/realtime タグなし。

## 7. スコープ外（含まないもの）
- ランタイムのスキーマ検証ライブラリ選定（Zod 等）→ registry/providers の PLAN で決定（型は本フォルダ、検証は利用側）。
- DB マイグレーション・DDL → `_shared/db`。

## 8. 未決事項（論点リスト）
### [論点-T1] service-info 契約型の詳細（[論点-003] 連動）
- **影響範囲**: `ServiceInfoRef`、将来の `ServiceInfoResponse` 型
- **詰めるべき問い**: service-info レスポンスのスキーマ（最小固定 + extra）が確定したら `ServiceInfoResponse` 型を本フォルダに追加。
- **推奨**: [論点-003] 確定後に追加（最小スキーマ + `extra: Record<string, unknown>`）。現状は `ServiceInfoRef`（接続情報）の枠のみ。
- **判断期限**: providers 設計時
- **担当**: seiji

## 9. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成（/flow:auto P4 dispatch、Phase 2 最初の基盤） | /flow:feature |
