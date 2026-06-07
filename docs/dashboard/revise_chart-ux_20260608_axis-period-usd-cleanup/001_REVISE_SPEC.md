# dashboard 変更仕様書（上部 chart 時間軸統一 + 期間選択 + usd 系 chart 削除）

> **改修種別**: 機能変更 + 削除（表示・取得層のみ）
> **issue / slug**: chart-ux / axis-period-usd-cleanup
> **基準 SPEC**: `../../001_dashboard_SPEC.md`
> **最終更新**: 2026-06-08
> **タグ**: auth-required（既存、/api/dashboard/summary は requireSeiji）, analytics（chart 表示）

---

## 1. 変更概要

dashboard 上部の時系列 chart section を 3 点で改善する。
(1) 縦並びした複数 chart の **X 時間軸を統一**して横位置を揃える、
(2) 表示期間を **全期間 / 30日 / 7日** から選べるようにする、
(3) 実データを取得していない **「課金額」(revenue_month_usd)** を収益と同義として削除。これに連動し、課金額を収益源とする派生 chart **「採算」**、および usd 建ての **「コスト」** も削除（ユーザー確定 2026-06-08、AI_LOG D20260608-003）。結果として chart は **ユーザー数(mau) + 収益(¥, revenue_total_yen)** の 2 枚に集約する。

DB スキーマ・保存データ・公開 API（shipyard）は不変。usage_snapshots への metric 収集も継続し、削除はあくまで「上部 chart の表示」と「summary が chart 用に取得する metric キー」のみ。

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC ID | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| 上部 chart 閲覧 | mau/収益¥/課金額$/コスト$/採算$ の 5 枚を縦並び。各 chart の x 軸範囲は自分の点だけから独立算出され不揃い。期間は固定で「直近 30 日」 | mau/収益¥ の 2 枚を縦並び。全 chart が**共有 X 時間軸**。ヘッダの**期間セレクタ**（全期間/30日/7日）で範囲切替 | 見やすさ + データのない usd 系 chart の整理 |

### 2.2 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| `GET /api/dashboard/summary` | クエリ無し、固定 30 日窓で chart 用 snapshot 取得 | 任意クエリ `?period=all\|30d\|7d`（既定 30d）で since を切替。**param 無し = 従来 30 日（後方互換）** | 互換維持（additive query） |
| `DASHBOARD_CHARTS`（chart 定義） | 5 件: mau/revenue_total_yen/revenue_month_usd/ai_cost_month_usd/profit(派生) | 2 件: mau/revenue_total_yen | 内部定数、UI 表示変更 |
| `DASHBOARD_CHART_SOURCE_METRICS`（取得キー） | `[mau, revenue_total_yen, revenue_month_usd, ai_cost_month_usd]` | `[mau, revenue_total_yen]` | 取得 metric 削減（DB の保存は継続） |
| `MetricChart` props | `metricKey,label,unit,series,height` | `+ domain?: [number, number]`（共有時間軸、optional・未指定は従来 dataMin/dataMax） | 互換維持（optional 追加、service-detail 単体利用は未指定で従来動作） |
| `DashboardChart` VM 件数 | 常に 5 件 | 常に 2 件 | 表示層 |
| chart section ヘッダ | 固定文言「直近 30 日の推移」 | 「収益・利用の推移」＋期間セレクタ（選択中の期間を反映） | 期間が可変になるため固定文言は不正確 |

### 2.3 データモデル変更
| エンティティ | 変更内容 | マイグレーション要否 |
|---|---|---|
| usage_snapshots | 変更なし（revenue_month_usd / ai_cost_month_usd も従来通り収集・保存） | 不要 |

### 2.4 バリデーション・エラー変更
| 対象 | 変更前 | 変更後 |
|---|---|---|
| summary API の period | （無し） | 不正値・未指定は `30d` に fallback（許可: `all` / `30d` / `7d`） |

## 3. 影響範囲

| 対象 | 影響度 | 説明 |
|---|---|---|
| 機能 dashboard（上部 chart） | 高 | 直接対象。chart 定義・取得キー・MetricChart・section UI・summary API |
| 共通 `src/components/MetricChart.tsx` | 中 | `domain` prop 追加。service-detail も利用するが optional のため非破壊 |
| 機能 service-detail | 低 | MetricChart を単体 series で利用。domain 未指定で従来動作（リグレッション確認のみ） |
| 一覧テーブル「採算」列（ServiceRow/computeProfitability） | 低（スコープ外） | 今回は**変更しない**。revenue_month_usd 依存のため uncollected なら データなし 表示のまま（§9 [論点-001]） |
| 公開 API（shipyard 連携） | なし | `/api/dashboard/summary` は内部用。公開契約・metric 保存は不変 |

## 4. 後方互換性

- **互換維持**: ✅
  - `?period` 未指定で従来の 30 日窓 → 既存リンク・ブックマークそのまま動作。
  - `MetricChart.domain` は optional → service-detail 等の既存呼び出しは無改修で従来描画。
  - usage_snapshots への revenue_month_usd / ai_cost_month_usd 収集は**継続**（DB に残るため将来 usd 系 chart 復活が可能）。
- 非互換変更: なし（DB・公開 API・保存 metric いずれも不変）。

## 5. ロールバック方針

- **コード revert で戻せる**: ✅
- **DB マイグレーションのロールバック**: 無（DB 変更なし）
- **手順**: 本改修コミットを `git revert`。データ移行・スキーマ変更が無いためデータ面の巻き戻しは不要。

## 6. リリース戦略

- **方式**: 一括（フィーチャーフラグ不要）
- 表示・取得層のみの変更で破壊的影響が無いため、通常デプロイで全展開。
- ロールアウト: ローカル動作確認（期間切替で x 軸と件数が変わること、2 chart のみ表示）→ デプロイ。

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC（新仕様）
- **UC: 上部 chart 閲覧**
  - dashboard `/` 上部に chart section。ヘッダに期間セレクタ（全期間 / 30日 / 7日、既定 30日）。
  - chart は上から **ユーザー数（mau, count）**, **収益（revenue_total_yen, ¥）** の 2 枚（固定順）。
  - 2 枚は**同一の X 時間軸（共有 domain）**で描画され、横位置が揃う。
  - 期間セレクタ変更で summary を再取得し、両 chart の範囲が同期して切り替わる。
  - 全 series が空なら各 chart は「データなし」fallback（既存 MetricChart 挙動）。

### 7.2 入出力（新仕様）
- `GET /api/dashboard/summary?period=all|30d|7d`
  - `30d`（既定 / 未指定 / 不正値）: since = now − 30日
  - `7d`: since = now − 7日
  - `all`: since = `new Date(0)`（全期間。"データがあれば" 全件、無ければ空 → データなし）
  - レスポンス `charts` は 2 件（mau, revenue_total_yen）。
- `MetricChart` に `domain?: [number, number]`（epoch ms）。指定時は XAxis の `domain` をこれに固定、未指定は従来 `["dataMin","dataMax"]`。
- `DashboardCharts` は受け取った全 chart の series points から **共有 domain `[minMs, maxMs]`** を算出して各 `MetricChart` に渡す。点が 1 つも無ければ domain 未指定（従来 fallback）。

### 7.3 データモデル（新仕様）
- 変更なし。`DashboardChart` / `DashboardChartSeries` 型はそのまま、配列長が 2 になるだけ。

### 7.4 バリデーション・エラー（新仕様）
- period パース: allowlist (`all`/`30d`/`7d`) 外は `30d` に正規化（例外を投げない）。

### 7.5 機能固有 NFR + 既存連携（新仕様）
- 認可: `/api/dashboard/summary` は既存 `requireSeiji` 維持。period 追加は認可に影響しない。
- 軽量化: 取得 metric キーが 4→2 に減るため chart 用 snapshot 取得はむしろ軽くなる。`all` 選択時のみ窓が広がり件数増の可能性 → 既存 index（capturedAt）で許容。

## 8. タグ別追加項目
- **auth-required**: 変更なし（requireSeiji 維持、period は認可前段に影響なし）。
- **analytics**: chart 表示の集約のみ。計測イベント追加なし。

## 9. 未決事項

### [論点-001] 一覧テーブル「採算」列の扱い
- **影響範囲**: `ServiceRow.tsx` / `summary.ts buildDashboard`（computeProfitability）/ 一覧「採算」列
- **詰めるべき問い**: 採算 chart を削除したが、一覧テーブルの「採算」列も `revenue_month_usd` 依存で uncollected なら常に「データなし」。列も整理するか、収益(¥) ベースの新指標に置換するか。
- **候補案**: (a) 今回は据え置き（chart のみ整理、本改修スコープ） / (b) 後続改修で採算列も収益¥ベースに再設計（producer がコストを¥申告 or 換算が前提） / (c) 採算列も削除
- **推奨**: (a) 据え置き。本改修は「chart の見やすさ」が主題で、列再設計は単位整合（producer 側のコスト通貨）という別軸の検討を要するため分離する。
- **判断期限**: 次回 dashboard 改修時
- **担当**: seiji

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:revise |
