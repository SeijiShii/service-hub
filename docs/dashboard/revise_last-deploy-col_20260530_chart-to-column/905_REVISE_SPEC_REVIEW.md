<!-- auto-generated-start -->
# 設計レビューレポート — dashboard / last-deploy-col (chart-to-column)

**レビュー日**: 2026-05-30
**レビュー実施者**: Claude (Opus 4.8 1M) + SeijiShii
**対象**: dashboard 改修 `revise_last-deploy-col_20260530_chart-to-column` (001-004 REVISE)
**入力**: 当該サブフォルダ 001-004 + 元 SPEC dashboard/001 + timeseries-topchart revise + 実コード (summary.ts / DashboardView.tsx / ServiceRow.tsx / DashboardCharts.tsx / MetricChart.tsx / lastUpdatedFormat.ts / api/dashboard/summary.ts / db/queries.ts / providers/adapters.ts / service-detail/ServiceDetailView.tsx)
**観点ソース**: 組み込みチェックリスト + review-perspectives.md (P2 / P19 / P51 / P59 / P64 / P73 / P82 適用)
**モード**: auto-pick (flow:auto P3.7 Spec-review gate dispatch)
**severity-threshold**: low

## 1. レビューサマリー

| 観点 | 評価 | 備考 |
|------|------|------|
| 仕様の明確性 | OK | 変更前/後・影響範囲・互換・ロールバック明記 |
| 既存パターンとの一貫性 | OK | 列追加は ServiceRow の既存 `mono`/`—` パターン踏襲、formatter は lastUpdatedFormat 方式 |
| 影響範囲・副作用 | 要確認→解消 | R2/R3: 列データソースの別系統性を確定、api/dashboard/summary.ts 漏れを追加 |
| API 流用・責務逸脱 | OK | 表示層のみ、DASHBOARD_CHART_METRICS 定数編集に閉じる |
| 既存実装の再利用 | 要確認→解消 | R4: formatJst を export 再利用 (P19/DRY) |
| データ移行・互換性 | OK | DB 不変、charts 4→3 は内部 consumer のみ、shipyard 公開 API 不変 |
| 複数画面の同種データ表示 | 要確認→解消 | R1: service-detail は last_deploy_at chart 維持 (P59、out-of-scope 確定 + 論点化) |
| 部分巻き戻しの分離 | 要確認→解消 | R1: P73「巻き戻す/維持する」を §3.1 で明示 |
| テストカバレッジ | OK | chart 4→3 修正 + formatter/列 新規、列追加の既存破綻リスク低と実測確認 |
| 防御的バリデーション | OK | R5: 0 ガードが adapters の実挙動に対し必須と確認 |

## 2. 指摘事項 (severity 降順)

### [R1] service-detail の last_deploy_at chart 整合性 + 部分巻き戻しの分離 (severity=Medium)
- **対象**: 001_SPEC §3 / §9、service-detail/ServiceDetailView.tsx
- **現状**: 本改修は dashboard から last_deploy_at chart を除外するが、`ServiceDetailView` は `vm.series` の全 metricKey (last_deploy_at 含む) を MetricChart に渡すため service-detail では chart が残る (P59 同種データ複数画面)。また timeseries-topchart の部分巻き戻しだが「巻き戻す/維持する」境界が SPEC で未分離 (P73)。
- **問題**: 「last_deploy_at をチャート表示しない」が dashboard 限定か全画面かが曖昧。維持範囲 (recentSnapshots / MetricChart 共通化 / tickFormatter 分岐) が誤って削除されるリスク。
- **推奨/chosen**: **dashboard のみスコープ、service-detail は維持 (out-of-scope)**。ユーザー要望の「一覧に日時カラム」は dashboard テーブル専用で service-detail は一覧テーブルを持たない。§3.1 に「巻き戻す/維持する」表を追加、§9 [論点-001] に service-detail 方針を論点化 (現状維持推奨、要望時に別 issue)。
- **種別**: 設計判断項目 (auto-pick)
- **chosen_type**: auto-recommended
- **反映先**: 001_SPEC §3.1 (新設) + §9 [論点-001]

### [R2] 列データソースの確定 — chart 除外と独立 (severity=Low / 実装 linchpin)
- **対象**: 002_PLAN §1、api/dashboard/summary.ts、summary.ts buildDashboard
- **現状**: 列値は `row.metrics.last_deploy_at`。これは API `latestPerService(db)` (metric フィルタなし) → buildDashboard `snapshots` 引数由来。chart は `recentSnapshots(db, sinceIso, [...DASHBOARD_CHART_METRICS])` (フィルタあり) で別系統。
- **問題**: 明示しないと「chart から外したら列データも消える」と誤実装するリスク。
- **推奨/chosen**: PLAN に「カラムのデータソース」節を追加し、列=latestPerService (unfiltered)・chart=recentSnapshots (filtered) の別系統性と「DASHBOARD_CHART_METRICS 除外は列に無影響」を明記。SPEC §7.2 にもデータソース注記。
- **chosen_type**: auto-recommended
- **反映先**: 002_PLAN §1 (データソース節) + 001_SPEC §7.2 + 003 §4

### [R3] PLAN の変更ファイル漏れ — api/dashboard/summary.ts (severity=Low、P2)
- **対象**: 002_PLAN §1、api/dashboard/summary.ts L29
- **現状**: P2 で DASHBOARD_CHART_METRICS の全参照を grep。唯一の他参照 = api/dashboard/summary.ts。L35 のコード (定数 spread) は自動で 3 metric query に縮むが、L29 コメント「主要 4 metric」が stale 化。PLAN §1 に未掲載。
- **推奨/chosen**: PLAN §1 に api/dashboard/summary.ts (コメントのみ修正) を追加。
- **chosen_type**: auto-recommended
- **反映先**: 002_PLAN §1

### [R4] formatJst の再利用 — JST 整形の重複回避 (severity=Low、P19/DRY)
- **対象**: 002_PLAN §2、新規 deployAtFormat.ts、lastUpdatedFormat.ts
- **現状**: `lastUpdatedFormat.ts` の `formatJst(d)` (非 export) が JST オフセット演算を保持。新規 deployAtFormat で再実装すると JST ロジックが 2 箇所に分散。
- **推奨/chosen**: `formatJst` を export し deployAtFormat が再利用。入力契約差 (epoch_ms + 未収集/0/負値→`—`) は薄いガードで吸収。lastUpdatedFormat は `export` 1 語追加のみで既存挙動不変。
- **chosen_type**: auto-recommended
- **反映先**: 002_PLAN §2 (実装スニペット付き) + 001_SPEC §7.2

### [R5] 0 ガードの必要性確認 (severity=Info、防御確認)
- **対象**: 001_SPEC §7.4、providers/adapters.ts
- **現状**: vercel adapter は `value: Number(dep.createdAt ?? dep.created ?? 0)` で deploy timestamp 欠落時に **0** を snapshot 化し得る。
- **推奨/chosen**: SPEC §7.4 の「0/負値 → `—`」は投機的でなく実データ防御 (1970-01-01 誤表示回避) と確認。§7.4 に adapters 由来である旨を追記。
- **chosen_type**: auto-recommended
- **反映先**: 001_SPEC §7.4

### [R6] 列粒度の妥当性 (severity=Info、P64)
- **対象**: 「最終デプロイ」列
- **現状/評価**: last_deploy_at は per-service 単一値、列は per-row (per-service)。粒度一致、per-application 単一化のような粒度ミスマッチ (P64) なし。**対応不要**。

## 3. コードベース調査結果

### 3.1 既存パターン
- テーブルセル: `ServiceRow.tsx` は `mono` style + 欠損 `—` の統一パターン (`fmt`/`usd`/`pct`)。新列もこれに合わせる。
- 日時整形: `lastUpdatedFormat.ts` が JST (UTC+9 手動オフセット, サマータイムなし) + 決定的 (now 引数注入)。deployAtFormat は now 不要 (絶対時刻のみ) で formatJst を再利用。
- chart 定数: `DASHBOARD_CHART_METRICS` を summary.ts が def、buildCharts が filter、api/dashboard/summary.ts が recentSnapshots の metricKeys に spread。

### 3.2 影響範囲分析
| 変更対象 | 既存呼び出し箇所 | 呼び出し元の前提 (契約) | 破壊リスク |
|---|---|---|---|
| `DASHBOARD_CHART_METRICS` (4→3) | summary.ts buildCharts (L107/L120) / api/dashboard/summary.ts L35 (spread) | chart 用 metric 集合。table は参照しない | なし (内部のみ、列は別系統 R2) |
| `charts` (DashboardChart[] 4→3) | DashboardView → DashboardCharts (map) のみ。shipyard 公開 API は charts 非搭載 | 内部 consumer のみ | なし |
| DashboardView `<thead>` (列追加) | DashboardView.test (cell-index 依存なし) | — | 低 |
| ServiceRow `<td>` (列追加) | ServiceRow.test.tsx 不在 | — | 低 |
| `last_deploy_at` snapshot (列データ) | latestPerService → buildDashboard snapshots → metrics | 列は latestPerService (unfiltered) 由来 | なし (chart filter と独立、R2) |
| MetricChart tickFormatter last_deploy_at 分岐 | service-detail (vm.series 全 metricKey を MetricChart) | service-detail で last_deploy_at chart 描画 | **削除不可** (P59、R1) |

### 3.3 API 責務の評価
責務逸脱なし。変更は (1) chart metric 集合の縮小、(2) 既存 ServiceRowVM.metrics の表示先追加 のみ。新 API・新クエリ・新 DTO なし。`latestPerService` は既存契約のまま流用 (全 metric latest)。

## 4. 設計判断ログ

| # | 判断項目 | 結論 | chosen_type | 反映先 |
|---|---|---|---|---|
| R1 | service-detail の last_deploy_at chart を外すか | dashboard のみスコープ、service-detail 維持 (論点化) | auto-recommended | 001 §3.1/§9 |
| R2 | 列データソースの明示 | latestPerService 由来と確定、chart と独立 | auto-recommended | 002 §1 / 001 §7.2 / 003 §4 |
| R3 | api/dashboard/summary.ts 漏れ | PLAN §1 に追加 (コメント修正) | auto-recommended | 002 §1 |
| R4 | deployAtFormat の重複 | formatJst を export 再利用 | auto-recommended | 002 §2 / 001 §7.2 |
| R5 | 0 ガード必要性 | adapters の 0 書込みに対し必須と確認 | auto-recommended | 001 §7.4 |
| R6 | 列粒度 | per-service 一致、対応不要 | auto-recommended | — |

## 5. 次のステップ
- 反映済み 001/002/003 を確認 (R1-R5、`<!-- spec-review R{N} -->` 付与)
- `/flow:tdd dashboard` で実装着手 (Phase 1: chart 除外 / Phase 2: deployAtFormat (formatJst export 再利用) + thead + td)
- E2E は `/flow:e2e dashboard` (chart 3 枚化 + 列表示 + 視覚レイアウト確認)
<!-- auto-generated-end -->
