# dashboard 単体テスト計画 (timeseries-topchart)

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, Step 2 で読んだ既存テスト
> **最終更新**: 2026-05-28

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| TS-U-01 | `src/db/queries.ts::recentSnapshots` | 30 日分の snapshots 多 service 多 metric を DB に保存後、`recentSnapshots(db, '30daysAgo')` 実行 | 期間内全 snapshots を昇順返却 |
| TS-U-02 | recentSnapshots metric filter | metricKeys=['up','mau'] 指定で `recentSnapshots(db, since, ['up','mau'])` | up + mau のみ返却、他 metric 除外 |
| TS-U-03 | recentSnapshots 期間外除外 | since より古い snapshot 混在 | 期間外は除外 |
| TS-U-04 | recentSnapshots 0 件 | 全 snapshots 空 | [] 返却、throw しない |
| TS-U-10 | `summary.ts::buildDashboard` charts 集約 | services 2 件 + chartSnapshots に 2 service × 4 metric × 30 日分 | DashboardVM.charts = 4 件、各 chart.series = 2 service 分、points = 30 個 |
| TS-U-11 | buildDashboard chartSnapshots 未渡し (optional) | 第 5 引数省略 | charts = 4 件、各 series = 空 (`{slug,name,points:[]}` for each service) → UI で「データなし」 fallback |
| TS-U-12 | buildDashboard chart metric 順序固定 | chartSnapshots ランダム順で渡す | charts[0].metricKey='up'、charts[1]='mau'、charts[2]='db_storage_bytes'、charts[3]='last_deploy_at' (固定順序) |
| TS-U-13 | buildDashboard 1 service のみ snapshots | 2 services のうち 1 service のみ chartSnapshots あり | chart.series に 2 service 含む (snapshots なし側は points=[]) |
| TS-U-20 | `MetricChart` multi-series 描画 | `series=[{slug:'a',points:[...]},{slug:'b',points:[...]}]` | 2 Line 要素 (data-slug 属性で識別)、Legend 表示、line stroke = `--chart-series-0/1` |
| TS-U-21 | MetricChart series 空 | `series=[]` | 「データなし」表示、Line 非描画 |
| TS-U-22 | MetricChart 全 series.points 空 | `series=[{slug:'a',points:[]},{slug:'b',points:[]}]` | 「データなし」表示 (どの series も points 持たない場合) |
| TS-U-23 | `last_deploy_at` chart の Y 軸表示 | metricKey='last_deploy_at'、points = epoch_ms 値 | tickFormatter で「Mon DD」表示 (生 epoch_ms 値が Y 軸に出ない) |
| TS-U-30 | `DashboardCharts` 4 chart render | charts=4 件 | 各 chart の data-testid 4 つ確認 (`chart-up` / `chart-mau` / `chart-db_storage_bytes` / `chart-last_deploy_at`) |
| TS-U-31 | DashboardCharts section header | charts.length > 0 | 「直近 30 日」section header 表示 |
| TS-U-32 | DashboardCharts 全 chart 空 | 全 chart.series.points=[] | 4 chart 全てに「データなし」表示、section 自体は表示 |
| TS-U-40 | `DashboardView` 上部 chart + 下部テーブル両表示 | vm = {rows: [a,b], charts: [4 chart]} | `<DashboardCharts>` section + `<table>` 両方 render |
| TS-U-41 | DashboardView リグレッション: rows 空 + charts も空 | vm = {rows:[], charts:[空 4 件]} | 既存「empty-state」+ DashboardCharts 「データなし」両方表示 |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待振る舞い |
|---|---|---|---|
| TS-U-50 | recentSnapshots SQL error | DB 接続失敗 | throw (api 層で 500 fallback) |
| TS-U-51 | buildDashboard chartSnapshots に非対象 metric 混入 | chartSnapshots に `revenue_month_usd` 等含む | charts に含まれない (固定 4 metric のみ集約) |
| TS-U-52 | recentSnapshots metricKeys に存在しない metric | `recentSnapshots(db, since, ['nonexistent_metric'])` | [] 返却、throw しない |

### 1.3 境界値
| ID | 対象 | 境界 | 期待振る舞い |
|---|---|---|---|
| TS-U-60 | recentSnapshots 30 日ちょうど | since = today - 30 day exactly | 30 日前の snapshot 含む (gte 比較) |
| TS-U-61 | buildDashboard 0 service | services=[] | charts = 4 件、各 series=[]、UI で全 chart「データなし」 |

## 2. 修正テストケース

| ID | 対象 | 修正前 | 修正後 | 理由 |
|---|---|---|---|---|
| TS-M-01 | `src/features/service-detail/MetricChart.test.tsx` | service-detail 配下 | `src/components/MetricChart.test.tsx` に移動 (内容同等 + multi-series 拡張テスト追加) | MetricChart 共通化 [論点-TS3] |
| TS-M-02 | service-detail 関連 import path test (もしあれば) | `from "./MetricChart.js"` | `from "../../components/MetricChart.js"` | 共通化 move |
| TS-M-03 | DashboardVM 型を期待する既存テスト | charts プロパティ無し | charts プロパティ含む (空配列 でも OK) | additive 拡張、optional から required へ |

## 3. 削除テストケース

| ID | 対象 | 削除理由 |
|---|---|---|
| (なし) | 既存テストは追加・修正のみ、削除なし | additive 改修のため |

## 4. リグレッション強化

- **既存テスト維持**:
  - `DashboardView.test.tsx`: 既存「empty-state」「force-pull section」「summary 表示」「last-updated 表示」「alert banner」「admin link」「table render」全ての既存 case が green 維持
  - `summary.test.ts`: 既存 DA-N1〜DA-B1 (buildDashboard 各種 case) green 維持、chart 引数省略時 (第 5 引数 optional) で既存挙動不変
  - `ServiceRow.test.tsx`: 完全不変 (本 revise で ServiceRow 内部は変更なし、テーブル row のみ)
  - `service-detail/MetricChart.test.tsx` → `src/components/MetricChart.test.tsx` 移動後も既存 single-series テスト green 維持
- **追加チェック**:
  - **buildDashboard 第 5 引数 chartSnapshots optional 確認**: 既存呼び出し (5 引数渡さない) で TS-U-11 が green = 後方互換確認
  - **shipyard public API 不変確認**: `/api/public/status` response が iconUrl 含み charts 不含 (= 既存 PublicServiceStatus shape 維持)、shipyard 影響ゼロ
  - **MetricChart 既存 single-series 挙動不変**: TS-U-20 で multi-series 追加対応する一方、service-detail で 1 series 渡す既存挙動は変わらない (TS-M-01 内で確認)

## 5. Mock 方針差分

| 対象 | 前回 | 今回 | 理由 |
|---|---|---|---|
| chartSnapshots fixture | (なし) | summary.test で helper `chartSnap({slug,metric,daysAgo,value})` 追加 | 30 日分の snapshot 生成 helper |
| recharts mock | service-detail でもなし (実描画) | dashboard でも実描画 (recharts はテスト時 SVG 描画) | 既存方針継承 |
| testdb (pglite) | 既存 services + usage_snapshots | recentSnapshots 用に 2 service × 4 metric × 30 日分 seed helper 追加 | 効率化 |

## 6. カバレッジ目標

| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | 既存継承 (concept §3 NFR) |
| 分岐 | 70% | 既存継承 |
| **recentSnapshots** | 100% | DB query SoT、全分岐網羅 (with/without metric filter, 期間境界, 0件) |
| **buildDashboard chart 集約** | 100% | 新 logic、全分岐網羅 (chartSnapshots 有/無, 各 metric, 各 service) |
| **DashboardCharts component** | 90%+ | 主要分岐 (4 chart 表示, 空 chart 表示, section header) |

## 7. 更新履歴

| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 (TS-U-01〜61 + TS-M-01〜03、recentSnapshots/buildDashboard chart 集約/DashboardCharts を 100%/90% カバレッジ) | /flow:revise |
