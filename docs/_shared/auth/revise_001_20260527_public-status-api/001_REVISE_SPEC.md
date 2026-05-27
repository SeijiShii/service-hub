# _shared/auth 変更仕様書（public-status-api: 公開ステータス API の追加）

> **改修種別**: 拡張（認可モデルに「唯一の公開ルート例外」を追加 + 公開安全投影）
> **issue / slug**: 001 / public-status-api
> **基準 SPEC**: `../001_auth_SPEC.md`（全ルート Clerk gate / pull データ・トークン非公開）
> **アンカー**: `_shared/auth`（公開カーブアウト）。横断: types / dashboard(or 新 public モジュール) / api / db / registry
> **最終更新**: 2026-05-27
> **タグ**: cross-cutting, auth-required(例外), analytics(公開投影)
> **AI_LOG**: `../../../AI_LOG/D20260527_003_revise__shared_auth_public-status-api.md`

---

## 1. 変更概要
別サービスとして切り分けた**公開ショーケース**（別 repo、リアルタイム稼働一覧を表示）が消費する **公開 read-only API `GET /api/public/status`** を追加する。service-hub は本来「例外なく全ルート Clerk gate（pull データ・トークン非公開）」だが、**この 1 本だけ意図的に公開**する。漏洩防止のため**安全サブセットのみを投影**する純ロジックを新設し、内部指標（収益/コスト/採算/離脱率/利用数/トークン/閾値/provider 識別子）は構造的に出さない。

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| 公開稼働一覧の提供 | なし（全 API が seiji 限定） | `GET /api/public/status` で**公開安全サブセット**を提供 | 公開ショーケースがリアルタイム稼働を表示 |

### 2.2 入出力変更（新エンドポイント）
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| `GET /api/public/status` | （存在しない） | 認証なし・公開。`PublicServiceStatus[]` を返す（§7.2） | 新規（additive） |
| 認可モデル | 全ルート gate（cron のみ CRON_SECRET 例外） | + **`/api/public/*` をユーザーゲート対象外**（公開例外）として明示 | 既存ルートの gate は不変 |

### 2.3 データモデル変更
| エンティティ | 変更内容 | マイグレーション |
|---|---|---|
| （DB） | **変更なし**（既存 usage_snapshots の up/registry を読むだけ） | 不要 |
| `_shared/types` | `PublicServiceStatus` 型を追加（公開安全 DTO） | 不要 |

## 3. 影響範囲
| 対象 | 影響度 | 説明 |
|---|---|---|
| `_shared/auth` | 高 | 「唯一の公開ルート例外」を認可モデルに追加。`isPublicPath`（`/api/public/*`）を新設、SPEC に明記 |
| `api/public/status.ts`（新規） | 高 | 公開ハンドラ（requireSeiji 不使用、CORS、Cache-Control、安全投影を返す） |
| `_shared/types` | 中 | `PublicServiceStatus` 公開 DTO |
| 公開投影ロジック（新規 `src/features/public-status/` or dashboard 隣接） | 高 | `buildPublicStatus(services, latest)` 純ロジック（安全サブセットのみ、内部フィールド非含有をテスト） |
| `db` クエリ | 低 | 最新 up スナップショット抽出を再利用（latestPerService 等） |
| `registry` | 低 | active サービスを読む（既存 loadServices） |
| `vercel.json` | 低 | rewrite が `/api/` を除外済みか確認（公開ルートが SPA rewrite に飲まれない） |

## 4. 後方互換性
- **互換維持**: ✅ 完全（additive、新ルート1本のみ）。既存の gate 済ルートは一切変更しない。

## 5. ロールバック方針
- **コード revert で戻せる**: ✅（git tracked、DB 変更なし）。新ルート削除で即時撤去可。

## 6. リリース戦略
通常（additive、フラグ不要）。公開ショーケース側 concept が本 SPEC の `PublicServiceStatus` 契約を参照して実装する → **本 API を先に出しても安全**（公開安全データのみ）。実装は後続 `/flow:tdd`。

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC
- **PS-UC1**: 公開クライアントが `GET /api/public/status`（無認証）→ 200 + active サービスの安全サブセット配列。
- **PS-UC2**: クロスオリジン fetch → CORS ヘッダで許可（preflight OPTIONS 対応）。

### 7.2 入出力（契約 = 公開ショーケースが参照）
```
GET /api/public/status   (認証なし)
200 OK
Cache-Control: public, max-age=60
Access-Control-Allow-Origin: *
[
  { "slug": "hana-memo", "name": "hana-memo", "url": "https://hana-memo.example.com",
    "status": "up", "lastCheckedAt": "2026-05-27T00:00:00.000Z" },
  ...
]
```
`PublicServiceStatus = { slug: string; name: string; url: string; status: "up"|"down"|"unknown"; lastCheckedAt?: string }`
- **active サービスのみ**（registry status=active）。paused/retired は出さない。
- `status`: 最新 `up` メトリクス 1→`up` / 0→`down` / 無→`unknown`。
- **絶対に含めない**: revenue / ai_cost / profit / funnel / mau / コスト / raw_json / thresholds / providers / secretEnv / token。

### 7.3 データモデル（新仕様）
DB 変更なし。`buildPublicStatus(services: ServiceDescriptor[], latest: SnapshotRow[]): PublicServiceStatus[]` 純ロジックが registry active + 最新 up から安全 DTO を組み立てる。**dashboard の `ServiceRowVM` や full VM を import・返却しない**（誤投影防止）。

### 7.4 バリデーション・エラー（新仕様）
| ケース | 振る舞い |
|---|---|
| DB エラー | 500（内部詳細を body に出さない、`{error:"unavailable"}`） |
| active 0 件 | 200 + `[]` |
| メソッド != GET | 405 / OPTIONS は CORS preflight で 204 |

### 7.5 機能固有 NFR + 連携
- **セキュリティ最優先**: 安全サブセット DTO を明示型で固定。テストで「内部キーが含まれない」ことを assert（`revenue_month_usd` 等が JSON に出ない）。
- 認可: `/api/public/*` は `isPublicPath` で gate 対象外（cron の `isPublicCronPath` と同列の唯一例外）。auth README/SPEC に「公開ルートは `/api/public/*` と cron のみ、それ以外は例外なく gate」と明記。
- キャッシュ: `Cache-Control: public, max-age=60`。CORS: `*`（公開安全データ）。

## 8. タグ別追加項目（auth-required 例外 / analytics）
- 公開例外は**明示的な allowlist**（`/api/public/`）でのみ通す。新ルート追加時に誤って公開しないよう、gate のデフォルトは fail-close 維持。

## 9. 未決事項

### [論点-PS1] CORS オリジンの制限
- **問い**: `Access-Control-Allow-Origin` を `*`（現状）にするか、公開ショーケースのドメイン確定後に env で制限するか。
- **候補**: `*`（公開安全データなので最簡）/ env `PUBLIC_STATUS_ALLOWED_ORIGIN` で showcase ドメインに制限。
- **推奨**: 当面 `*`（データは意図的に公開安全）。showcase ドメイン確定後、必要なら env 制限へ（実装は環境変数読み取り1行で切替可能にしておく）。
- **判断期限**: 公開ショーケースのドメイン確定時
- **担当**: seiji

### [論点-PS2] レート制限
- **問い**: 公開エンドポイントにレート制限を入れるか。
- **推奨**: MVP では入れない（service-hub は低トラフィック + Cache-Control 60s で吸収）。濫用が見えたら Upstash 等で追加。
- **担当**: seiji

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-27 | 初版作成（公開ステータス API、安全サブセット投影、認可カーブアウト、CORS/キャッシュ） | /flow:revise |
