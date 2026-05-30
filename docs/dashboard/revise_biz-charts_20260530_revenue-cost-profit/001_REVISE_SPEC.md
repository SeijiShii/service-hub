# dashboard 変更仕様書（上部チャートをビジネス指標化）

> **改修種別**: 機能変更（チャート対象メトリクスの転換 + 派生系列追加 + 日本語ラベル）
> **issue / slug**: biz-charts (revenue-cost-profit)
> **基準 SPEC**: `../../001_dashboard_SPEC.md`
> **直前改修**: `../revise_last-deploy-col_20260530_chart-to-column/`（chart から単一値除外、本改修と同方針）
> **最終更新**: 2026-05-30
> **タグ**: feature, auth-required, analytics（時系列ビジネス可視化）
> **AI_LOG**: `../../../AI_LOG/D20260530_010_revise_dashboard_biz-charts.md`

---

## 1. 変更概要

dashboard 上部チャートを**インフラ指標からビジネス指標へ転換**する。現状 `up / mau / db_storage_bytes`（3 枚）から、`up`（死活）と `db_storage_bytes` を外し、**ユーザー数 / 課金額 / コスト / 採算**（4 枚、上から順）に差し替える。死活は一覧の `status` 列（StatusDot）が常時表示しており chart は冗長。採算(profit)は保存メトリクスでなく `revenue − cost` の派生系列を `buildCharts` で合成。チャート見出しを raw metricKey から日本語ラベルに変更。表示層 + 集約ロジックのみで DB・収集パイプライン・公開 API は不変。

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC ID | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| DA-UC4 (上部 chart) | `up` / `mau` / `db_storage_bytes` の 3 枚（raw metricKey 見出し） | **ユーザー数(mau) / 課金額(revenue_month_usd) / コスト(ai_cost_month_usd) / 採算(profit 派生)** の 4 枚（日本語見出し） | UP/DOWN は status 列で十分、見たいのはビジネス指標の推移 |

### 2.2 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| `GET /api/dashboard/summary` の `charts` | 3 件 (up/mau/db_storage_bytes) | **4 件** (mau/revenue_month_usd/ai_cost_month_usd/profit)、各 chart に `label` 追加 | 内部 consumer (DashboardView) のみ。shipyard 公開 status API は不変 = 互換維持 |
| `recentSnapshots` の取得 metric | `[up, mau, db_storage_bytes]` | `[mau, revenue_month_usd, ai_cost_month_usd]`（取得キー。profit は取得せず派生） | 内部のみ |
| `DashboardChart` 型 | `{metricKey, unit, series}` | `+ label: string`（additive） | 互換維持（additive） |
| `MetricChart` props | `{metricKey, unit, series, height?}` | `+ label: string`（見出しに使用） | additive |

### 2.3 データモデル変更
| エンティティ | 変更内容 | マイグレーション要否 |
|---|---|---|
| `usage_snapshots` テーブル | **変更なし**（revenue_month_usd / ai_cost_month_usd は business-observability で既収集） | 不要 |
| `profit` | **保存しない**（buildCharts で revenue−cost を派生合成） | 不要 |
| `MetricKey` 型 | **変更なし**（profit は chart 内部の合成キーで MetricKey union には追加しない、後述 §7.3） | 不要 |

### 2.4 バリデーション・エラー変更
| 対象 | 変更前 | 変更後 |
|---|---|---|
| 各 chart 空 series | 「データなし」fallback | 同左（4 枚それぞれ。revenue/cost 未申告サービスは points=[] で「データなし」） |
| profit 派生 | （なし） | revenue が無い時点は profit 点を作らない（cost のみは profit 不能）。cost 欠落は 0 扱い（computeProfitability セマンティクス踏襲） |

## 3. 影響範囲

| 対象 | 影響度 | 説明 |
|---|---|---|
| 機能 dashboard | 高 | 直接対象（chart 定義 + buildCharts 派生ロジック + MetricChart label + api 取得キー） |
| `src/components/MetricChart` | 中 | label prop 追加（共通コンポーネント、service-detail も使用 → 後方互換に注意、§後述） |
| service-detail | 低〜中 | MetricChart に label prop 追加。service-detail 側の呼び出しは label 未指定でも動くよう **label は optional + metricKey fallback** にする（P59 複数画面） |
| 一覧テーブル | なし | status 列（up 由来）/ 各列は不変。up は latestPerService で引き続き取得（chart 除外と独立） |
| shipyard 公開 status API | なし | charts 非搭載、不変 |

### 3.1 巻き戻す / 維持する（P73）
| 区分 | 対象 | 扱い |
|---|---|---|
| 変更（chart 入替） | DASHBOARD_CHART_METRICS（up/mau/db_storage_bytes）→ 取得キー[mau,revenue,cost] + chart 定義 4 枚 | 差し替え |
| 維持 | `up` の収集・latestPerService・一覧 status 列 / `db_storage_bytes` の収集（chart から外すだけ、データは残す） | 不変 |
| 維持 | `MetricChart` の既存描画・空 fallback・tickFormatter / service-detail の chart | 不変（label optional 追加のみ） |

## 4. 後方互換性

- **互換維持**: ✅
- charts 配列の中身（3→4、metric 入替 + label 追加）が変わるのは内部 consumer (DashboardView) のみ。shipyard 公開 status API は charts を含まず不変。
- `MetricChart` の `label` prop は **optional**（未指定時は従来通り metricKey 見出し）→ service-detail 等の既存呼び出しは壊れない。
- `DashboardChart.label` は additive。`up`/`db_storage_bytes` の収集・一覧 status 列は不変。
- DB スキーマ・収集パイプライン・型契約への破壊的変更なし。

## 5. ロールバック方針
- **コード revert で戻せる**: ✅
- **DB マイグレーションのロールバック**: 無（DB 変更なし）
- **手順**: 本改修のコミットを `git revert`。データ復旧不要。

## 6. リリース戦略
- **方式**: 一括（内部 dashboard UI/集約の変更、フラグ不要）
- **ロールアウト計画**: 既存 dashboard デプロイフローに同梱（次回デプロイで全展開）

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC（新仕様）
- **DA-UC4（上部 chart、変更）**: 4 枚を上から「ユーザー数 / 課金額 / コスト / 採算」の固定順で表示。各 chart は全 active service の重ね描き。空 series は「データなし」。

### 7.2 入出力（新仕様）
- チャート定義（固定順、ラベル付き）:
  | # | label | metricKey | unit | source |
  |---|---|---|---|---|
  | 1 | ユーザー数 | `mau` | count | snapshot |
  | 2 | 課金額 | `revenue_month_usd` | usd | snapshot |
  | 3 | コスト | `ai_cost_month_usd` | usd | snapshot |
  | 4 | 採算 | `profit` | usd | 派生 (revenue − cost) |
- 取得キー（recentSnapshots filter）: `[mau, revenue_month_usd, ai_cost_month_usd]`（profit は取得しない）
- 派生 profit 系列の算出（per service）:
  - revenue 系列の各 `capturedAt` について、同 `capturedAt` の cost を引く: `profit(t) = revenue(t) − (cost(t) ?? 0)`
  - revenue が無い `capturedAt` は profit 点を作らない（cost のみでは採算不能）
  - cost が無い `capturedAt` は cost=0 扱い（computeProfitability と一致）

### 7.3 データモデル（新仕様）
- `DashboardChart` に `label: string` を追加。
- `profit` は **MetricKey union に追加しない**（収集対象でなく chart 内部の合成キー）。chart 定義側で `metricKey: "profit"` という文字列を使う（MetricKey は open union = `string & {}` を許容するため型は通る）。testid は `chart-profit` / `chart-empty-profit`。

### 7.4 バリデーション・エラー（新仕様）
- 4 枚すべて空 series（収集前）→ 各「データなし」。
- 採算: revenue 申告サービスのみ profit 系列を持つ。revenue=0 でも profit 点は作る（0 − cost）。

### 7.5 機能固有 NFR + 既存連携（新仕様）
- 決定的: buildCharts は入力 snapshots から純粋に派生（now 非依存）。
- <!-- spec-review R1: チャート採算 = 一覧採算列の定義一致 -->profitability.ts の `revenue_month_usd` / `ai_cost_month_usd` キー・cost 欠落 0 扱いと**整合させる**（採算定義の二重実装回避）。**重要**: チャートの採算は**一覧テーブルの「採算」列（`computeProfitability` の `profit`）と同じ値の推移**でなければならない（同じ採算が「列＝最新値 / チャート＝時系列」の 2 表現）。実装は `revenue − (cost ?? 0)`（= `computeProfitability` と同一）。**business-observability SPEC §7.4 の「按分無料枠超過コスト」は現行実装に未搭載のため本改修でも加えない**（一覧列と一致させるのが優先、按分対応は別 issue）。→ §9 [論点-001] で `profitAt` 純関数共通化に確定。
- <!-- spec-review R6 -->データ源確認: `revenue_month_usd` / `ai_cost_month_usd` は service-info adapter (`createServiceInfoAdapter`) が `metrics[]` の全キーを emit するため、サービス自己申告時に usage_snapshots へ入る = chart 化可能（未申告サービスは points=[] で「データなし」）。
- concept §3 NFR と矛盾なし（表示/集約変更）。

## 8. タグ別追加項目
- **analytics**: 時系列ビジネス可視化。採算は revenue/cost の派生で、月次自己申告値の推移を見る用途。
- **auth-required**: 管理画面内 UI、既存 dashboard 認可（requireSeiji）を継承。

## 9. 未決事項

### [論点-001] 採算の派生ロジックを profitability.ts と共通化するか → ✅ **spec-review R1 で (a) に確定**
- **影響範囲**: `buildCharts`（派生 profit 系列）と `profitability.ts`（最新値 profit = 一覧採算列）
- **詰めるべき問い**: profit = revenue − (cost ?? 0) の定義が 2 箇所になる。共通ヘルパに切り出すか、buildCharts 内にインラインで持つか。
- **候補案**: (a) `profitability.ts` に `profitAt(revenue, cost)` 純関数を export し buildCharts と computeProfitability 両方が使う（DRY） / (b) buildCharts にインライン（軽量、共通化は profit 定義変更時に同期漏れリスク）
- **chosen (spec-review R1)**: **(a) 純関数共通化**。理由: チャート採算と一覧テーブル「採算」列は**同じ採算**であり、定義が分散すると「列とチャートで値が食い違う」回帰を招く。`profitAt(revenue: number, cost: number | null | undefined): number = revenue − (cost ?? 0)` を `profitability.ts` に export し、`computeProfitability`（最新値）と `buildCharts`（時系列）両方が使う = 採算定義の単一 SoT（P19/P86）。
- **判断期限**: 実装時（tdd）— 確定済
- **担当**: -

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-30 | 初版作成 | /flow:revise |
