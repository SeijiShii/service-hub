# _shared/providers 仕様書（横断基盤・pull の核）

> **役割**: 各 PaaS API + uptime ping + service-info エンドポイントから利用状況を pull し、UsageMetric[] に正規化する adapter 群。共通 `ProviderAdapter` 契約を実装。
> **タグ**: cross-cutting（UI なし）
> **最終更新**: 2026-05-26
> **入力**: `../../concept.md`（§6 / §4.6）, `../types/001_types_SPEC.md`, `./README.md`
> **依存**: `_shared/types`
> **本 SPEC で [論点-001] / [論点-003] / [論点-T1] を解決**（auto-pick、根拠は §1.3 / §1.4）

---

## 1. 提供インターフェース（adapter 群）

全 adapter は `ProviderAdapter`（types）を実装。`collect(service)` は **throw せず `{ metrics, error? }`** を返す（部分成功のため）。**read-only スコープのトークンのみ使用**（O25）。外向き fetch は**タイムアウト + リダイレクト制限 + 内部アドレス抑止**（[論点-004]）、レスポンスは安全パースし **raw_json は秘密フィールドをスクラブ**してから返す。

### 1.1 各 adapter と取得メトリクス

| adapter | エンドポイント（例） | 取得メトリクス | MVP |
|---|---|---|---|
| **ping** | `GET <service.url>`（HEAD/GET、2xx-3xx=up） | `up`(1/0), 応答時間 | ✅ |
| **vercel** | `GET /v6/deployments?projectId=` | `last_deploy_at`, 直近デプロイ状態 | ✅ |
| **neon** | `GET /api/v2/projects/{id}` | `db_storage_bytes`, `db_compute_seconds`（project オブジェクト由来） | ✅ |
| **clerk** | `GET /v1/users?limit=1`（total_count） | `mau`（暫定=総ユーザー数、後述） | ✅ |
| **cloudflare** | R2 GraphQL analytics / S3 ListObjects | `r2_storage_bytes` | Phase2 |
| **sentry** | `GET /api/0/projects/{org}/{proj}/stats/` | `error_count` | Phase2 |
| **service-info** | `GET <serviceInfo.endpoint>`（共有シークレット） | サービス申告のアプリ層メトリクス（§1.3） | ✅（実装サービスのみ） |

### 1.2 [論点-001 解決] 各 PaaS の使用量取得可否（実地方針）

> 各 provider の「無料枠使用量」取得可否はプロバイダ依存。**確実に取れる指標から MVP 投入し、不確実なものは best-effort/Phase2**（案 B 段階導入）。free-tier % は **services.toml の thresholds（既知の無料枠上限）と取得値から HUB 側で算出**（API が % を返さなくてよい）。

| 指標 | 取得確度 | 方針 |
|---|---|---|
| ping `up` | 確実 | MVP |
| Neon storage/compute | 確実（project API に含まれる） | MVP、thresholds と突合で free-tier % 算出 |
| Vercel last_deploy/状態 | 確実 | MVP。帯域使用量は account 単位で粒度が粗く best-effort（Phase2 で精緻化） |
| Clerk MAU | **暫定**（厳密 MAU は dashboard analytics、API は総ユーザー数が確実） | MVP は総ユーザー数を `mau` 代理値として表示、注記。厳密 MAU は Phase2 |
| R2 storage | 取得可だが GraphQL/集計が必要 | Phase2 |
| Sentry error_count | stats API で取得可 | Phase2 |

→ **MVP = ping + Vercel(deploy) + Neon(storage/compute) + Clerk(user count) + service-info**。これで [論点-001] を解決（status=resolved、段階導入方針確定）。

### 1.3 [論点-003 解決] service-info エンドポイント標準契約（最小固定 + extra）

各マイクロサービスが公開する標準エンドポイントの契約。**最小固定スキーマ + `extra` 自由フィールド**（連発前提で各サービスが軽く実装できる、案 A 採用）。

```
GET <serviceInfo.endpoint>   例: https://<service>/api/hub/service-info
Header: Authorization: Bearer <共有シークレット>   (env 保持、services.toml 非記載)

200 レスポンス (ServiceInfoResponse):
{
  "schemaVersion": 1,                 // 必須・バージョニング
  "service": "hana-memo",             // 必須・slug（services.toml と一致確認）
  "status": "ok",                     // 必須: 'ok' | 'degraded' | 'down'
  "metrics": [                        // 任意: アプリ層メトリクス配列
    { "key": "active_users_7d", "value": 38, "unit": "count" },
    { "key": "ai_cost_month_usd", "value": 0.42, "unit": "usd" }
  ],
  "version": "1.4.0",                 // 任意: アプリ version
  "extra": { }                        // 任意: サービス固有の自由データ
}
```

- HUB 側 service-info adapter は `metrics[]` を `UsageMetric`（provider='service-info'）に正規化。
- 未実装サービス（`serviceInfo` 未設定）は本 adapter をスキップ → PaaS API pull のみ（フォールバック）。
- **後方互換**: `schemaVersion` で判定、未知バージョンは既知部分のみ解釈。
- **波及（service-hub 外、本 SPEC では実施しない）**: 本契約確定により (1) `_shared/types` に `ServiceInfoResponse` 型追加（[論点-T1] 解決、§1.4）、(2) **perspectives O48 の標準スキーマを本契約で具体化**、(3) **hana-memo に retrofit**（`/flow:revise`、別 PJ・別セッション）。

### 1.4 [論点-T1 解決] _shared/types への型追加
本 SPEC 確定に伴い `_shared/types` に以下を追加（providers 実装時に types も更新）:
```ts
type ServiceInfoStatus = 'ok' | 'degraded' | 'down';
interface ServiceInfoResponse {
  schemaVersion: number;
  service: string;
  status: ServiceInfoStatus;
  metrics?: Array<{ key: string; value: number; unit: string }>;
  version?: string;
  extra?: Record<string, unknown>;
}
```

### 1.5 レジストリ/オーケストレーションとの境界
- adapter は **1 サービス分の収集**のみ。複数サービス×provider のループ・スケジューリング・DB 保存は `collection` の責務。
- どの adapter を呼ぶかは `ServiceDescriptor.providers` の有無で決まる（registry がパース）。

## 2. 入出力
- 提供: `ProviderAdapter` 実装群 + `getAdapters(service): ProviderAdapter[]`（service の providers から有効 adapter を返す）+ fetch ユーティリティ（タイムアウト/リダイレクト制限/スクラブ）。
- 副作用: 外部 API への read-only GET（外向き fetch）。DB は触らない。

## 3. データモデル
新規 entity なし。`UsageMetric`（types）に正規化して返すのみ。`ServiceInfoResponse` 型を types に追加（§1.4）。

## 4. バリデーション + エラーケース
| ケース | 振る舞い |
|---|---|
| API タイムアウト/5xx | `{ metrics: [], error: 'timeout'/'5xx' }`（throw しない、collection が run.errors に集約） |
| 認証エラー(401/403) | `{ metrics: [], error: 'auth' }` + ログ（トークン失効の検知） |
| レート制限(429) | バックオフ + best-effort、`error: 'rate_limited'`（O27 外向きレート遵守） |
| 不正 JSON | 安全パース失敗 → `error: 'parse'`、raw 保存しない |
| service-info 共有シークレット不一致 | サービス側が 401 → adapter は `error: 'auth'` |
| raw_json | 既知の秘密キー（token/secret/key/authorization）を**スクラブ**してから格納（[論点-004]） |

## 5. 機能固有 NFR + 連携
### 5.1 NFR
| 項目 | 目標 | 根拠 |
|---|---|---|
| レート遵守 | 各 provider の制限内、サービス数×provider 数の同時実行を抑制 | O27 / 課金回避 |
| タイムアウト | 1 fetch あたり上限（例 10s）、全体は collection が管理 | ハング防止 |
| 秘密保持 | read-only トークンを env 参照、raw_json スクラブ | O25 / [論点-004] |

### 5.2 連携
| 連携先 | 種別 | 内容 |
|---|---|---|
| _shared/types | 型 import | ProviderAdapter/UsageMetric/ServiceDescriptor/ServiceInfoResponse |
| registry | 入力 | ServiceDescriptor を受け取る |
| collection | 被呼び出し | collect() を呼ばれる |

## 6. タグ別追加項目
cross-cutting のためなし。

## 7. スコープ外
- スケジューリング/DB 保存/閾値判定（collection/alerts）。
- PaaS への書き込み操作（concept スコープ外、observability のみ）。

## 8. 未決事項
### [論点-PR1] Clerk MAU の厳密取得（Phase2）
- **影響範囲**: clerk adapter
- **問い**: 厳密 MAU を Clerk analytics API から取れるか、総ユーザー数代理で十分か。
- **推奨**: MVP は総ユーザー数を代理表示（注記）、Phase2 で analytics 精緻化。
- **判断期限**: Phase2 / 実トークンでの API 検証時
- **担当**: seiji

## 9. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成（/flow:auto 反復4）。[論点-001]/[論点-003]/[論点-T1] を解決 | /flow:feature |
