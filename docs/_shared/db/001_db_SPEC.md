# _shared/db 仕様書（横断基盤）

> **役割**: Neon (Postgres) のスキーマ・マイグレーション・クライアント・基本クエリ。time-series スナップショットの永続化層。
> **タグ**: cross-cutting（UI なし）
> **最終更新**: 2026-05-26
> **入力**: `../../concept.md`（§5.1 / §4.3）, `../types/001_types_SPEC.md`, `./README.md`
> **依存**: `_shared/types`（型を import）

---

## 1. 提供インターフェース

### 1.1 テーブル（Drizzle スキーマ、concept §5.1）

**usage_snapshots**（時系列）
| 列 | 型 | 制約 |
|---|---|---|
| id | text (uuid) | PK, default gen |
| service_slug | text | not null, idx |
| provider | text | not null（ProviderKind） |
| metric_key | text | not null |
| metric_value | double precision | not null |
| unit | text | not null |
| captured_at | timestamptz | not null, idx |
| raw_json | jsonb | nullable（[論点-004] 秘密スクラブ済のみ） |

- **複合インデックス**: `(service_slug, metric_key, captured_at desc)` — 個別サービスの時系列クエリ用。
- **インデックス**: `(captured_at desc)` — 全体最新取得用。

**alert_events**
| 列 | 型 | 制約 |
|---|---|---|
| id | text (uuid) | PK |
| service_slug | text | not null, idx |
| provider | text | not null |
| rule | text | not null |
| triggered_at | timestamptz | not null |
| value | double precision | not null |
| notified_at | timestamptz | nullable |
| resolved_at | timestamptz | nullable |

- 部分インデックス: `WHERE resolved_at IS NULL`（未解決アラート）。

**collection_runs**
| 列 | 型 | 制約 |
|---|---|---|
| id | text (uuid) | PK |
| started_at | timestamptz | not null |
| finished_at | timestamptz | nullable |
| status | text | not null（ok/partial/failed） |
| services_count | integer | not null |
| errors_json | jsonb | nullable |

### 1.2 提供する関数（型は _shared/types）
```ts
// 収集結果の保存（collection が使う）
upsertSnapshots(rows: SnapshotRow[]): Promise<void>;   // 同一(slug,key,captured_at)は冪等
recordRun(run: CollectionRun): Promise<void>;
recordAlert(ev: AlertEvent): Promise<void>;
// 読み取り（dashboard / service-detail が使う）
latestPerService(): Promise<SnapshotRow[]>;            // 各 service×metric の最新行
timeseries(slug: string, metricKey: MetricKey, sinceIso: string): Promise<SnapshotRow[]>;
openAlerts(): Promise<AlertEvent[]>;
recentRuns(limit: number): Promise<CollectionRun[]>;
```
- `id`/`captured_at` の生成（uuid / now）は本層の責務（types 905 R1）。

## 2. 入出力
- 提供: 上記関数 + Drizzle スキーマ定義 + Neon クライアント（`@neondatabase/serverless` + drizzle）+ マイグレーション。
- 副作用: DB 読み書き。外部 API は叩かない（pull は providers の責務）。

## 3. データモデル
§5.1 の 3 エンティティを物理スキーマ化。型は `_shared/types` の SnapshotRow/AlertEvent/CollectionRun に対応。

## 4. バリデーション + エラーケース
| ケース | 振る舞い |
|---|---|
| DB 接続失敗 | throw（呼び出し側 collection が CollectionRun.status=failed に記録） |
| upsert 競合 | `(service_slug, metric_key, captured_at)` で冪等 upsert（onConflict do update） |
| 不正 provider/metric 値 | 型層で担保（DB は text、検証は providers/registry） |

## 5. 機能固有 NFR + 連携
### 5.1 NFR
| 項目 | 目標 | 根拠 |
|---|---|---|
| 書き込み | 低頻度（pull 間隔ごと） | concept §3 低スループット |
| 読み取り | ダッシュボードは latestPerService 1 クエリ | 画面で provider API 直叩きしない |
| データ量 | Neon 無料枠（0.5GB）で数十サービス×時系列で十分 | concept §3 |
| 保持 | スナップショットの保持期間（古いデータ削除）は将来 | [論点-DB1] |

### 5.2 連携（被依存）
| 連携先 | 種別 | 内容 |
|---|---|---|
| collection | 書き込み | upsertSnapshots/recordRun/recordAlert |
| dashboard | 読み取り | latestPerService/openAlerts/recentRuns |
| service-detail | 読み取り | timeseries |
| alerts | 読み書き | openAlerts/recordAlert |

## 6. タグ別追加項目
cross-cutting のためなし。

## 7. スコープ外
- 各 provider の使用量取得（providers）。
- アラート閾値判定ロジック（alerts）。

## 8. 未決事項
### [論点-DB1] スナップショット保持期間・集約
- **影響範囲**: usage_snapshots の肥大化、retention
- **問い**: 生スナップショットを無期限保持か、N 日で古いものを削除 or 日次集約（rollup）するか。
- **候補**: A) 無期限（数十サービス×低頻度なら無料枠内、当面 OK）／ B) 90 日 retention + 日次 rollup テーブル。
- **推奨**: A（MVP は無期限、無料枠を圧迫し始めたら B）。
- **判断期限**: 運用で無料枠 50% 到達時
- **担当**: seiji

## 9. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成（/flow:auto 反復3） | /flow:feature |
