# dashboard 変更仕様書 (timeseries-topchart: 画面上部に時系列グラフ追加)

> **改修種別**: 拡張 (UI レイアウト二部構成化 + データパイプライン拡張 = 最新値のみ → 時系列も同梱)
> **issue / slug**: timeseries-topchart
> **基準 SPEC**: `../../001_dashboard_SPEC.md`
> **アンカー**: `dashboard` (主担当)。波及: `_shared/db` (新クエリ `recentSnapshots`、既存 `serviceSnapshots` 流用も可) + `api/dashboard/summary` (response に時系列追加) + `src/components/` (`MetricChart` を service-detail から共通化検討)
> **最終更新**: 2026-05-28
> **タグ**: UI (二部構成レイアウト変更) + analytics (時系列可視化)
> **AI_LOG**: `../../../AI_LOG/D20260528_027_revise_dashboard_timeseries-topchart.md`

---

## 1. 変更概要

dashboard 画面を**二部構成**に再編する:
- **上部 (新規)**: 主要 metrics (up / mau / db_storage_bytes / last_deploy_at) の時系列折れ線グラフを 4 枚並べ、全 active service を 1 枚の chart に重ね描き (service 別色)。デフォルト過去 30 日。
- **下部 (既存維持)**: `ServiceRow` テーブル (最新値一覧、本回 scope 外、変更なし)。

既存資産活用で**新基盤実装は最小**:
- DB layer: `usage_snapshots` 既存テーブル + `serviceSnapshots` 既存クエリで時系列取得済 (1 service 単位)。本回は **全 service 横断クエリ `recentSnapshots(db, sinceIso, metricKeys?)` を新設** (1 API call で全データ取得)。
- VM layer: `DashboardVM` に `charts: DashboardChart[]` 追加、`buildDashboard` で snapshots を chart 単位に集約。
- UI layer: `MetricChart` を `src/components/` に**共通化** (service-detail 既存利用も維持)、新 `DashboardCharts.tsx` で複数 chart を縦並び。
- API: `/api/dashboard/summary` で `recentSnapshots` も読み response に含める (snapshots fetch 量 +30x、ただし service 数 × metric 数 × 30 日 = 現状 1 × 5 × 30 = 150 row、軽量)。

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC ID | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| DA-UC1 (dashboard 一覧) | 各 service の**最新値のみ**テーブル表示 | **上部 = 主要 metric 時系列 chart (30d、全 service 重ね) + 下部 = 既存テーブル** | ユーザー要望「画面上部にグラフ表示 / 下部に現状と同じ最新値の一覧」、サービスごとの**推移**を一目で見せる |
| (新規) DA-UC4 (時系列 chart 表示) | (なし) | 主要 metrics 4 枚 (up / mau / db_storage_bytes / last_deploy_at) の折れ線、空データなら「データなし」表示 | 1 次元 (snapshot) → 2 次元 (時系列) で trends 把握 |

### 2.2 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| `GET /api/dashboard/summary` レスポンス | `DashboardVM = {rows, upCount, downCount, lastRunStatus, lastUpdatedAt}` | 同じ shape に **`charts: DashboardChart[]`** を additive 追加 (4 件、各 chart に全 service × 30 日 points 含む) | additive 後方互換、既存 consumer (admin UI) は無視可能 |
| `DashboardView` props | `vm: DashboardVM` | 同じ、内部で `vm.charts` を `<DashboardCharts>` に渡す | 互換維持 |

### 2.3 データモデル変更
| エンティティ | 変更内容 | マイグレーション要否 |
|---|---|---|
| `usage_snapshots` テーブル | **変更なし** (既存時系列を流用) | 不要 |
| `DashboardVM` 型 | `charts?: DashboardChart[]` (optional 追加) | 型変更のみ |
| 新規 `DashboardChart` 型 | `{metricKey, unit, series: Array<{slug, name, points: [{capturedAt, value}]}>}` | 型新規 |

### 2.4 バリデーション・エラー変更
| 対象 | 変更前 | 変更後 |
|---|---|---|
| `/api/dashboard/summary` 応答 | snapshots 取得失敗時は空配列 | 同左 + charts も空配列 fallback (UI で「データなし」表示) |
| chart 描画 | (なし) | 各 chart 内 `series.points.length === 0` で「データなし」(既存 MetricChart パターン継承) |

## 3. 影響範囲

| 対象 | 影響度 | 説明 |
|---|---|---|
| 機能 dashboard | **高** | 主担当、レイアウト変更 + chart 追加 |
| `_shared/db` (queries.ts) | 中 | 新クエリ `recentSnapshots(db, sinceIso, metricKeys?)` 追加 (既存 `serviceSnapshots` の全 service 版) |
| `_shared/types` (service.ts or dashboard 内) | 低 | `DashboardChart` 型追加 (dashboard 内に閉じる、`_shared/types` には影響なし) |
| `api/dashboard/summary.ts` | 中 | recentSnapshots 取得 + buildDashboard 引数追加 |
| `src/features/service-detail/MetricChart.tsx` | 低 | `src/components/MetricChart.tsx` に**共通化 move** (service-detail からも import path 変更、機能差分なし) |
| 新規 `src/features/dashboard/DashboardCharts.tsx` | **高** | 複数 chart 縦並び + chart 単位重ね描き + 空データ fallback |
| 既存 `src/features/dashboard/{DashboardView,ServiceRow,summary}.tsx` | 中 | DashboardView レイアウト + summary.ts charts build + ServiceRow 不変 |
| 連動 PJ shipyard | 無 | 本改修は内部 dashboard のみ、公開 API 不変 (`/api/public/status` は最新値のまま、shipyard 影響なし) |

## 4. 後方互換性

- **互換維持**: ✅ **完全 additive 後方互換**
- `DashboardVM` への `charts?` optional 追加のみ、既存 consumer (admin UI) は無視可能
- DB schema 変更なし、既存 `usage_snapshots` 流用
- 既存テーブル表示 (下部) は完全不変、unit/E2E リグレッション 0 想定

## 5. ロールバック方針

- **コード revert で戻せる**: ✅ (型追加 + 新クエリ + 新 component のみ、DB 変更なし)
- **DB マイグレーションのロールバック**: 該当なし (DB schema 変更なし)
- **手順**: git revert で本 revise の commits を戻すだけ、再デプロイで上部 chart 消失、下部テーブルは不変

## 6. リリース戦略

- **方式**: **一括** (フィーチャーフラグ不要、後方互換完全、admin UI のみで public 影響なし)
- **ロールアウト**:
  1. 実装 (Phase 1-4)
  2. unit + E2E green
  3. 5th deploy 後の通常 deploy (X-th deploy として既存サイクルに乗せる)
  4. 本番で動作確認 (admin dashboard で chart 表示確認)
- **フィーチャーフラグ**: 不要

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC (新仕様)

- **DA-UC1 (一覧表示、変更あり)**: admin が `/` (dashboard) を開く → 上部 = 主要 metrics 4 枚の時系列 chart (30d、全 active service 重ね描き) / 下部 = 既存 `ServiceRow` テーブル (最新値、変更なし)
- **DA-UC4 (新規、時系列 chart 表示)**: 上部 chart section は以下 4 chart を縦並び:
  1. **up** (死活、0/1) — line 色 = `--status-up/down`、line type=step
  2. **mau** (月間アクティブ) — line 色 = service 別 palette、line type=monotone
  3. **db_storage_bytes** (Neon 無料枠視覚化) — 同上
  4. **last_deploy_at** (Vercel 最新 deploy timestamp) — 同上 (epoch_ms を ISO 表示)
- 各 chart は recharts `LineChart` (既存 `MetricChart` パターン継承)
- chart 内に全 active service の line を重ね、`Legend` で slug 表示 + service 別固定色 palette
- 空データ (snapshots 0 件) は chart ごとに「データなし」placeholder
- ファースト reload で全 4 chart 表示、scroll で下部テーブル

### 7.2 入出力 (新仕様)

**`GET /api/dashboard/summary` レスポンス (v2、additive)**:
```json
{
  "rows": [...],                  // 既存、変更なし
  "upCount": 1, "downCount": 0,
  "lastRunStatus": "ok",
  "lastUpdatedAt": "...",
  "charts": [                     // 新規
    {
      "metricKey": "up",
      "unit": "bool",
      "series": [
        {
          "slug": "hana-memo",
          "name": "花メモ",
          "points": [
            {"capturedAt": "2026-04-29T00:00:00Z", "value": 1},
            {"capturedAt": "2026-04-30T00:00:00Z", "value": 1},
            ...
          ]
        }
      ]
    },
    {"metricKey": "mau", ...},
    {"metricKey": "db_storage_bytes", ...},
    {"metricKey": "last_deploy_at", ...}
  ]
}
```

### 7.3 データモデル (新仕様)

- `usage_snapshots` テーブル: 変更なし (既存時系列を流用)
- 新規型 (`src/features/dashboard/summary.ts` 内で定義):
  ```ts
  export interface DashboardChartSeries {
    slug: string;
    name: string;
    points: Array<{ capturedAt: string; value: number }>;
  }
  export interface DashboardChart {
    metricKey: MetricKey;
    unit: string;
    series: DashboardChartSeries[];
  }
  export interface DashboardVM {
    // ...既存
    charts: DashboardChart[];  // additive、optional でも可だが summary.ts でデフォルト [] を返すため non-optional
  }
  ```
- 新規クエリ (`src/db/queries.ts`):
  ```ts
  export async function recentSnapshots(
    db: AnyDb,
    sinceIso: string,
    metricKeys?: MetricKey[],
  ): Promise<SnapshotRow[]>;
  ```
  全 service 横断、optional metric filter (主要 4 件に絞れる、効率化)

### 7.4 バリデーション・エラー (新仕様)

| ケース | 振る舞い |
|---|---|
| snapshots 取得失敗 | api 層で 500 (既存挙動)、UI まで届かない |
| 特定 metric の points 空 | DashboardChart.series[].points = [] → MetricChart で「データなし」表示 |
| 全 metric 空 (cron 未実行 / 新規 service) | charts = 各 chart に空 series → 全 4 chart で「データなし」、下部テーブルは既存 "empty-state" 文言維持 |
| service 数増 (5-10件) | 線が重なって見にくくなる可能性 → Legend で識別、本 SPEC 範囲では fix 対象外 (次 revise で対応) |

### 7.5 機能固有 NFR + 連携

| 項目 | 目標値 | 根拠 |
|---|---|---|
| api response サイズ | < 100KB (現状 service 数 × 4 metrics × 30 日 = 120 points 程度) | 軽量、network 影響なし |
| chart 描画 | < 300ms (4 chart、recharts 既存実装の延長) | dashboard load 体感品質 |
| 公開 API への影響 | **なし** (`/api/public/status` は最新値のまま、shipyard 影響なし) | scope 限定 |
| 時間レンジ | デフォルト 30 日固定 (UI 切替は本 SPEC 範囲外、次 revise 候補) | 初版シンプル化 |

連携:
- `_shared/db`: `recentSnapshots` 新クエリ (1 関数追加)
- `src/components/MetricChart` (共通化 move): service-detail からの import 変更
- `src/features/dashboard/DashboardCharts` (新規 component): MetricChart の複数描画 + service 別重ね

## 8. タグ別追加項目

**UI + analytics**:
- design-system 整合: recharts の line 色は既存 `--accent` / `--status-*` token を使用 (design-system 原則 1: status-first)
- service 別色 palette: 既存 design-system に未定義の場合、CSS var として 5-10 色 palette を追加 (`--chart-series-{0..9}`)
- mobile レスポンシブ: chart width = 100% (`<ResponsiveContainer>`) / minWidth 320px、height = 160-200px

## 9. 未決事項

> 実装に進むために詰める論点。

### [論点-TS1] chart 化する metric の選定 (4 件で確定するか)
- **影響範囲**: 001_REVISE_SPEC §7.1 / summary.ts buildDashboard
- **問い**: 上部 chart に表示する metric を `up` / `mau` / `db_storage_bytes` / `last_deploy_at` の 4 件で確定するか、他 (`error_count` / `db_compute_seconds` / `revenue_month_usd` 等) も追加するか
- **候補案**:
  - (a) 4 件で確定 (推奨、現状の主要指標を網羅、視認性確保)
  - (b) 5-6 件に拡張 (`error_count` 追加、運用観点)
  - (c) 設定可能化 (admin 設定、複雑度増)
- **推奨**: **(a) 4 件で確定**。理由 = 初版シンプル化 + 視認性 (縦並び 4 個まではスクロール 1 回内)。`error_count` は次 revise で alerts と一緒に拡張検討。
- **判断期限**: 本 SPEC 確定時
- **担当**: seiji

### [論点-TS2] 時間レンジの UI 切替
- **影響範囲**: `/api/dashboard/summary` query param + DashboardView 上部に switcher 追加
- **問い**: デフォルト 30 日固定 vs 7d / 30d / 90d 切替 UI
- **推奨**: **デフォルト 30 日固定**。理由 = 初版シンプル化 + cron 1 日 1 回で 30 日 = 30 points で trends 把握十分。UI 切替は次 revise 候補 (フィーチャーフラグなしの additive 拡張で容易)。
- **判断期限**: 本 SPEC 確定時
- **担当**: seiji

### [論点-TS3] MetricChart の共通化 (service-detail から src/components へ移動)
- **影響範囲**: `src/features/service-detail/MetricChart.tsx` → `src/components/MetricChart.tsx`
- **問い**: service-detail と dashboard で同じ MetricChart を使うため共通化するか、別実装にするか
- **推奨**: **共通化 (`src/components/MetricChart.tsx` に move)**。理由 = DRY 原則 (P19/P3)、service-detail からの import path 変更 1 行で済む。差分が出てきたら component を split。
- **判断期限**: Phase 2 PLAN 確定時
- **担当**: seiji

### [論点-TS4] service 別色 palette (CSS var)
- **影響範囲**: design-system tokens.css + DashboardCharts の line stroke
- **問い**: 5-10 色 palette を新規定義するか、recharts デフォルト色を使うか
- **推奨**: **CSS var `--chart-series-0..9` を新規定義** (design-system 整合)、Phase 2 で色相環で均等に 8 色程度。`tokens.ts` に追加。
- **判断期限**: Phase 2 PLAN 確定時
- **担当**: seiji

## 10. 更新履歴

| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 (二部構成 + 主要 4 metric chart + 30d 固定 + recharts 共通化) | /flow:revise |
