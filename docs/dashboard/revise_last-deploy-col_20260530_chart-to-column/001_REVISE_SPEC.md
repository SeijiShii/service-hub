# dashboard 変更仕様書（last_deploy_at をチャートから外し一覧に日時カラム追加）

> **改修種別**: 機能変更（表示方式の差し替え）
> **issue / slug**: last-deploy-col (chart-to-column)
> **基準 SPEC**: `../../001_dashboard_SPEC.md`
> **元改修**: `../revise_timeseries-topchart_20260528/001_REVISE_SPEC.md`（本改修が一部差し戻す）
> **最終更新**: 2026-05-30
> **タグ**: feature, auth-required（UI、変更なし）
> **AI_LOG**: `../../../AI_LOG/D20260530_001_revise_dashboard_last-deploy-col.md`

---

## 1. 変更概要

dashboard 上部の時系列 chart section から `last_deploy_at` を除外し（chart 4 枚 → 3 枚）、その情報を下部の一覧テーブルに「最終デプロイ日時」カラムとして追加する。デプロイ時刻は単一スナップショット値で折れ線の推移表現が直感的でないため、最新値を一覧で示す形に差し替える。表示層のみの変更で DB・公開 API・データパイプラインは不変。

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC ID | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| DA-UC4 (時系列 chart 表示) | 主要 4 metric (up / mau / db_storage_bytes / **last_deploy_at**) の折れ線 | 主要 **3 metric** (up / mau / db_storage_bytes) の折れ線。last_deploy_at は除外 | デプロイ時刻は単一値で「推移」の意味が薄い |
| DA-UC1 (dashboard 一覧) | テーブル列: status / service / MAU / 採算 / 離脱率 / errors / alerts | 上記に **「最終デプロイ日時」列を追加** | サービスごとの最終デプロイ時刻を一目で確認 |

### 2.2 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| `GET /api/dashboard/summary` の `charts` | `DashboardChart[]` 4 件（up/mau/db_storage_bytes/last_deploy_at） | **3 件**（last_deploy_at 除外） | 内部 consumer (DashboardView) のみ。shipyard 公開 status API は不変 = 互換維持 |
| `DashboardView` テーブル | 7 列 | **8 列**（最終デプロイ日時を additive 追加） | 互換維持（additive） |
| `ServiceRowVM` 型 | `metrics` に last_deploy_at を含む（既存） | **変更なし**（データは既に存在、表示先のみ変更） | 互換維持 |

### 2.3 データモデル変更
| エンティティ | 変更内容 | マイグレーション要否 |
|---|---|---|
| `usage_snapshots` テーブル | **変更なし** | 不要 |
| `DASHBOARD_CHART_METRICS` 定数 | `["up","mau","db_storage_bytes","last_deploy_at"]` → `["up","mau","db_storage_bytes"]` | 不要（定数変更のみ） |
| `ServiceRowVM` 型 | **変更なし**（`metrics.last_deploy_at` 既存を流用） | 不要 |

### 2.4 バリデーション・エラー変更
| 対象 | 変更前 | 変更後 |
|---|---|---|
| デプロイ日時カラム | （なし） | `metrics.last_deploy_at` 未収集（undefined）時は `—` 表示（他カラムの未収集表現と統一） |

## 3. 影響範囲

| 対象 | 影響度 | 説明 |
|---|---|---|
| 機能 dashboard | 高 | 直接対象（chart 定数 + View thead + ServiceRow td + 日時フォーマッタ） |
| `src/components/MetricChart` | 低 | 共通コンポーネント自体は不変。last_deploy_at 専用 tickFormatter は dead path 化するが残置可（service-detail 側で last_deploy_at chart を使う場合に備える） |
| service-detail | 低 | MetricChart の last_deploy_at 表示ロジックは触らない（dashboard chart からの除外のみ） |
| shipyard 公開 status API | なし | charts は内部のみ。公開 API 不変 |

> 注: MetricChart 内の `tickFormatterForMetric` の `last_deploy_at` 分岐は service-detail で参照され得るため**削除しない**。dashboard chart から外すのは `DASHBOARD_CHART_METRICS` の編集のみで達成する。

## 4. 後方互換性

- **互換維持**: ✅
- 内部 dashboard 表示のみの変更。`charts` 配列が 4→3 件になるのは内部 consumer (DashboardView) のみが参照するため影響なし。shipyard 公開 status API は charts を含まず不変。
- テーブル列は additive 追加（既存列の意味・順序は不変、末尾近くに 1 列追加）。
- DB スキーマ・収集パイプライン・型契約への破壊的変更なし。

## 5. ロールバック方針

- **コード revert で戻せる**: ✅
- **DB マイグレーションのロールバック**: 無（DB 変更なし）
- **手順**: 本改修のコミットを `git revert` するのみ。データ復旧不要。

## 6. リリース戦略

- **方式**: 一括
- **フィーチャーフラグ名**: なし（低リスクな内部 UI 表示変更のためフラグ不要）
- **ロールアウト計画**: 既存 dashboard デプロイフローに同梱（次回デプロイで全展開）

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC（新仕様）

- **DA-UC4（時系列 chart 表示、変更）**: 上部 chart section は 3 枚（up / mau / db_storage_bytes）。`DASHBOARD_CHART_METRICS` から `last_deploy_at` を除外。空データ時の「データなし」fallback は既存通り。
- **DA-UC1（dashboard 一覧、変更）**: テーブルに「最終デプロイ日時」列を追加。各行は `row.metrics.last_deploy_at?.value`（epoch_ms）を JST 日時に整形して表示。未収集時は `—`。

### 7.2 入出力（新仕様）

- 入力: `ServiceRowVM.metrics.last_deploy_at`（`{ value: number /* epoch_ms */, unit: "epoch_ms" }` または undefined）
- 出力: テーブルセル文字列。
  - 値あり → `YYYY-MM-DD HH:MM`（JST, UTC+9、サマータイムなし）。`lastUpdatedFormat.ts` の `formatJst` と同方式。
  - 値なし（undefined / null）→ `—`

### 7.3 データモデル（新仕様）
変更なし。`ServiceRowVM.metrics.last_deploy_at` は既存。新規フォーマッタのみ追加（後述 PLAN）。

### 7.4 バリデーション・エラー（新仕様）
- `last_deploy_at` 値が NaN / 不正 epoch のとき: フォーマッタは `—` を返す（防御的）。
- 0 や負値: 防御的に `—` 扱い（未デプロイ相当）。

### 7.5 機能固有 NFR + 既存連携（新仕様）
- 決定的フォーマット: `lastUpdatedFormat` と同様、内部で時刻計算は引数 epoch_ms から純粋に導出（`new Date(epochMs)`、`now` 非依存）。テストで `vi.setSystemTime` 不要。
- concept §3 NFR との矛盾なし（表示変更のみ）。

## 8. タグ別追加項目
- **auth-required**: 管理画面内 UI のため認可は既存 dashboard 経路を継承。新規認可面なし。

## 9. 未決事項

> 現時点で論点なし (2026-05-30)。

（補足: カラム見出し文言は「最終デプロイ」または「デプロイ日時」。PLAN で `最終デプロイ` を採用。i18n catalog は本 PJ 未導入のため日本語直書きで既存テーブル見出しと統一。）

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-30 | 初版作成 | /flow:revise |
