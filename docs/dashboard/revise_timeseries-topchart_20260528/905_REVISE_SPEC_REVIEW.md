<!-- auto-generated-start -->
# 設計レビューレポート — dashboard timeseries-topchart

**レビュー日**: 2026-05-28
**レビュー実施者**: Claude (Opus 4.7 1M) + seiji
**対象**: `dashboard` revise_timeseries-topchart_20260528 (001-004 設計 4 文書)
**入力**: `docs/dashboard/revise_timeseries-topchart_20260528/{001-004}.md` + concept.md §1.3/§3 + 関連実装 (DashboardView/ServiceRow/summary.ts/MetricChart/api/dashboard/queries.ts、本セッションで既 Read)
**観点ソース**: 組み込みチェックリスト + `~/.claude/review-perspectives.md` P1-P80
**モード**: **auto-pick** (Class A、可逆)
**severity-threshold**: low
**dispatch 元**: /flow:auto continuous loop reiteration 6 (revise 設計直後の P3.7 spec-review gate)

## 1. レビューサマリー

| 観点 | 評価 | 備考 |
|---|---|---|
| 仕様の明確性 | 要確認 | `recentSnapshots` 並列実行、`last_deploy_at` 軸表示の詳細明示要 (R1, R3) |
| 既存パターンとの一貫性 | OK | api/dashboard/summary の Promise.all パターン + tokens.ts CSS var パターン継承 |
| API 設計 | OK | DashboardVM.charts additive、shipyard public API 不変 (CF-020 補完) |
| エラーハンドリング | OK | recentSnapshots 失敗で 500 (既存 try-catch 継承)、空 chart で「データなし」fallback |
| テストカバレッジ | OK | TS-U-01〜61 + TS-M-01〜03 で recentSnapshots/buildDashboard/MetricChart multi-series/DashboardCharts 100%/100%/90% カバレッジ |
| 影響範囲・副作用 | OK | MetricChart 利用元 = ServiceDetailView 1 ファイル (2 行修正)、DashboardVM consumer = 5 箇所 (optional 追加で安全) |
| API 流用・責務逸脱 | OK | 既存 recharts (`MetricChart`) を共通化 = 責務拡張 (multi-series 対応) は許容範囲 |
| 既存実装の再利用 | OK | recharts/MetricChart/serviceSnapshots 流用、P19/P3 違反なし |
| データ移行・互換性 | OK | DB schema 不変、既存 usage_snapshots 流用、Phase 5 MIGRATION 不要 |
| 権限・認可 | OK | dashboard 既存 Clerk auth gate 継承、新規 endpoint なし |
| UX・操作性 | 要確認 | 上部 chart section と下部テーブルの境界明示・section header の wording (R4) |
| 学習済み観点 (P 系) | 適用済 | P3/P19 (R5 既存利用)、P51/P59 (CF-020 表示先逆引き = revise scope 内で対応済)、P78 (型 vs schema 整合)、P79 (optional optional + デフォルト値) 確認 |

## 2. 指摘事項 (severity 降順)

### [R1] `recentSnapshots` の並列実行仕様が PLAN 未明示 — severity=**High**

- **対象**: `api/dashboard/summary.ts` 配線 + 002_REVISE_PLAN.md §1
- **現状**: 既存 api/dashboard/summary.ts は `latest/alerts/runs` を `Promise.all([])` で**並列実行**。本 revise で `recentSnapshots` 呼び出しを追加するが、**並列/逐次のどちらか PLAN 未明示**
- **問題**: 既存パターンと不整合だと cold start で 4 query 逐次 = 200ms+ 増、Promise.all 並列 = ほぼ既存維持
- **chosen**: **既存 `Promise.all([latest, alerts, runs])` に `recentSnapshots` を追加して 4 件並列実行**
- **chosen 根拠**: 既存パターン継承 (一貫性) + perf (cold start で逐次より 1 RTT 削減)。recentSnapshots は service 数 × 30 日で軽量 (現状 < 1KB)
- **種別**: 指摘事項 (auto-recommended)
- **反映先**: 002_REVISE_PLAN §1 api/dashboard/summary 行に「`Promise.all([latest, alerts, runs, recentSnapshots(db, 30d)])` で 4 件並列」明示

### [R2] DashboardVM.charts required vs optional の方針明示 — severity=**Medium**

- **対象**: 001_REVISE_SPEC §7.3 + summary.ts 型定義
- **現状**: SPEC §2.3 で「`charts?: DashboardChart[]` (optional 追加)」と書いたが、§7.3 では `charts: DashboardChart[]` (required) と書いた = **内部矛盾**
- **問題**: buildDashboard が常に charts (4 件、空 series で fallback) を返す設計 vs optional で省略可能とする設計
- **chosen**: **required (non-optional) + buildDashboard が常に 4 件返す**
- **chosen 根拠**: (a) 内部矛盾解消 (b) 既存 consumer (admin UI) は charts プロパティを参照しないため required でも破壊なし (c) 「optional で undefined 時の分岐」をクライアント側に書かせる手間が省ける = UX 一貫性 (d) shipyard 公開 API (PublicServiceStatus) は本回不変 = 公開契約と内部 contract を別物として扱える
- **種別**: 設計判断項目 (auto-recommended)
- **反映先**: 001_REVISE_SPEC §2.3 / §7.3 / 003_REVISE_UNIT_TEST TS-M-03 (「optional から required へ」)

### [R3] `last_deploy_at` chart の Y 軸 tickFormatter 仕様明示 — severity=**Medium**

- **対象**: 001_REVISE_SPEC §7.1 DA-UC4 + 002_REVISE_PLAN §1 (新規 component) + 003 TS-U-23
- **現状**: 001 §7.1 で「epoch_ms 値そのままだと巨大数値、Y 軸表示で読みにくい可能性 → recharts `tickFormatter` で「Mon DD」表示推奨」とあり、TS-U-23 で test 想定済。ただし**具体的な tickFormatter 関数とフォーマット文字列が PLAN 未明示**
- **問題**: 実装者が「Mon DD」を `MMM dd` (例: `Jan 15`) と解釈する余地 vs 日本語環境では `1/15` 形式が好まれる可能性
- **chosen**: **`tickFormatter` で epoch_ms → `Intl.DateTimeFormat('ja-JP', {month: 'numeric', day: 'numeric'}).format(new Date(value))` (例: `5/28`)** をデフォルトとし、PLAN/UNIT_TEST に明示
- **chosen 根拠**: (a) 日本語 PJ (service-hub UI は日本語) で `5/28` が直感的 (b) `Intl.DateTimeFormat` は標準 API で軽量 (c) library 依存なし
- **種別**: 設計判断項目 (auto-recommended)
- **反映先**: 002_REVISE_PLAN §1 MetricChart 行 + 003 TS-U-23 期待値具体化

### [R4] 上部 chart section と下部テーブルの境界 UI 明示 — severity=**Low**

- **対象**: 001_REVISE_SPEC §7.1 + 002_REVISE_PLAN §1 DashboardView 変更
- **現状**: 「テーブルの直前に DashboardCharts 挿入 + section style (border-bottom 等) で chart と table の境界明示」と PLAN にあるが、**section header 文言や visual hierarchy 未明示**
- **問題**: 実装者が「直近 30 日」のタイトル文言 / アイコン / 区切り線色を独自判断
- **chosen**: section header = **`<h2>直近 30 日の推移</h2>`** (UI 文言、design-system 整合) + border-bottom `1px solid var(--border, #2a2f3a)` (既存 force-pull section と同パターン)
- **chosen 根拠**: design-system 既存 token 活用 + 既存 force-pull section (DashboardView.tsx:74) の border パターンと一貫 + 「直近 30 日」は SPEC §7.5 と整合
- **種別**: 指摘事項 (auto-recommended)
- **反映先**: 002_REVISE_PLAN §1 DashboardView 行 + 003 TS-U-31 期待値具体化 (「直近 30 日」section header)

### [R5] MetricChart 既存 single-series → multi-series 拡張の backward 互換明示 — severity=**Low**

- **対象**: 001_REVISE_SPEC §3 + 002_REVISE_PLAN §1 MetricChart props 変更
- **現状**: PLAN で「props 拡張 (multi-series 対応)」「現状 single-series 用 `MetricSeries` を `series: MetricSeriesMulti = {slug, name, points}[]` に変更」と書いたが、**ServiceDetailView (既存 1 service 用) からの呼び出し方が変わる**
- **問題**: ServiceDetailView は単一 series を渡している (`<MetricChart series={s} />`)。multi-series props に変えたら呼び出し側修正が必須 = PLAN §1 で「ServiceDetailView の import 変更のみ」と書いたが**実際は呼び出し側 props 変換も必要**
- **chosen**: **MetricChart の signature を `series: MetricSeriesMulti` に統一**、ServiceDetailView 側で `<MetricChart series={[{slug: vm.slug, name: vm.name, points: s.points, metricKey: s.metricKey, unit: s.unit}]} />` のように **1 series wrapping して渡す**
- **chosen 根拠**: (a) MetricChart 内部 logic を一本化 (single-series 対応分岐を持たない、テストも一本化) (b) ServiceDetailView 側で wrap = caller 責務 (c) 将来 service-detail でも複数 metric 重ね描きしたくなった場合の拡張余地
- **種別**: 指摘事項 (auto-recommended)
- **反映先**: 002_REVISE_PLAN §1 MetricChart 行 + ServiceDetailView 変更も明示

### [R6] (Info) 時間レンジ UI 切替 + per-service sparkline は本回 scope 外、次 revise 候補として明示 — severity=Info

- **対象**: 001_REVISE_SPEC §9 未決事項
- **内容**: 論点-TS2 (時間レンジ UI 切替) は本 SPEC §9 で「次 revise 候補」明示済、論点-TS5 として **per-service sparkline (各 ServiceRow 行に mini-chart)** も次 revise 候補として追加推奨
- **chosen**: 001 §9 に [論点-TS5] per-service sparkline (各 ServiceRow 行に mini-chart) を追加 (次 revise 候補、本回は scope 外と明示)
- **chosen 根拠**: ユーザーが当初推薦した「dashboard 一覧に sparkline 追加」もあり得る方向性、scope 拡張で混乱しないよう次 revise として独立

## 3. コードベース調査結果

### 3.1 既存パターン

- **api/dashboard/summary.ts `Promise.all`**: `latest/alerts/runs` を並列実行 (api/dashboard/summary.ts:26-30)。本 revise で `recentSnapshots` を追加するなら同 `Promise.all` に並列で入れるのが一貫 (R1)
- **tokens.ts CSS var パターン**: `var(--status-up, #34d399)` 形式 = CSS var + fallback 色 (src/components/tokens.ts:3-7)。`--chart-series-N` も同パターンで追加可能 ([論点-TS4] / R 番号外、PLAN で既に整合)
- **DashboardView section border-bottom**: 既存 force-pull section (DashboardView.tsx:74-80) が `borderBottom: "1px solid var(--border, #2a2f3a)"` で section 境界明示 = chart section も同パターンで一貫 (R4)
- **buildPublicStatus 明示構築パターン**: 公開 DTO 構築時にスプレッド使わず `const out: PublicServiceStatus = {slug, name, url, status}` で内部 VM 流入防止 (buildPublicStatus.ts:41)。本 revise の DashboardChart 集約も同パターン (明示構築) 推奨

### 3.2 影響範囲分析

| 変更対象 | 既存呼び出し箇所 | 呼び出し元の前提 (契約) | 破壊リスク |
|---|---|---|---|
| `DashboardVM` 型 | 5 箇所: `DashboardPage.tsx:13` (useFetch type) + `DashboardView.tsx:7` (props) + `api/dashboard/summary.ts:33` (build 呼び出し) + `summary.test.ts:33` (test) | 既存 rows/upCount/downCount/lastRunStatus/lastUpdatedAt | **低** (charts additive 追加、required にしても既存 consumer は charts プロパティを参照しないため type-check 通過 + 動作不変) |
| `MetricChart` component | 2 箇所: `ServiceDetailView.tsx:1` (import) + `ServiceDetailView.tsx:37` (render) | `series: MetricSeries` (single-series) | **低** (R5 対応で signature 変更 = multi-series、ServiceDetailView 側で 1 series wrapping、影響範囲 2 行) |
| `buildDashboard` 関数 | 2 箇所: `api/dashboard/summary.ts:33` (本番) + `summary.test.ts` (test) | 4 引数 (services, latest, alerts, runs) | **低** (5 番目引数 chartSnapshots optional 追加で既存呼び出し互換、test では未渡しケース TS-U-11 で検証) |
| `recentSnapshots` 関数 | 0 箇所 (新規) | - | **無** (新規追加) |
| `api/dashboard/summary` レスポンス | 1 箇所: `DashboardPage.tsx` で useFetch 経由消費 | DashboardVM 既存 shape | **低** (charts additive、admin UI が charts を参照しなくても既存表示不変) |
| `src/features/service-detail/MetricChart.tsx` 削除 | 上記 ServiceDetailView 経由のみ | - | **低** (R5 対応で src/components/MetricChart に move、import path 修正のみ) |

### 3.3 API 責務の評価

- **MetricChart 共通化 (service-detail → components)**: 単一 chart 描画責務、本来から共通 UI component 圏。共通化は責務的に妥当 (P19/P3)、multi-series 対応も「複数系列の chart 描画」という同一責務の拡張 = 責務逸脱なし
- **DashboardCharts 新規**: dashboard 専用の集約 component。MetricChart を 4 回 render する責務、dashboard 内に置くのが適切 (service-detail でも将来必要になれば対称で `ServiceDetailCharts` を作ればよい)
- **recentSnapshots クエリ**: 既存 `serviceSnapshots(db, slug, sinceIso)` の単一 service → 全 service 横断版。同じ usage_snapshots テーブルを期間 filter で読むという責務、責務拡張は妥当 (1 関数追加で済む)
- **shipyard public API 不変の根拠**: `buildPublicStatus` (公開 DTO 投影) と `buildDashboard` (内部 VM 投影) は別関数で別責務、charts は内部 dashboard のみで shipyard 公開向けには出さない = CF-020「新フィールド追加時の表示先逆引き」観点を本 revise scope で明確化済

## 4. 設計判断ログ

| # | 判断項目 | 結論 | chosen_type | 反映先 |
|---|---|---|---|---|
| D1 (R1) | recentSnapshots 並列実行 | 既存 Promise.all に 4 件目として並列追加 | auto-recommended | 002 §1 api 行 |
| D2 (R2) | DashboardVM.charts required vs optional | **required** (buildDashboard が常に 4 件返す、shipyard public API 不変) | auto-recommended | 001 §2.3 §7.3 + 003 TS-M-03 |
| D3 (R3) | last_deploy_at Y 軸 tickFormatter | `Intl.DateTimeFormat('ja-JP')` で `M/D` 形式 | auto-recommended | 002 §1 MetricChart 行 + 003 TS-U-23 |
| D4 (R4) | chart section header + 境界 UI | `<h2>直近 30 日の推移</h2>` + border-bottom (force-pull section と同パターン) | auto-recommended | 002 §1 DashboardView 行 + 003 TS-U-31 |
| D5 (R5) | MetricChart signature 統一 | multi-series (`MetricSeriesMulti[]`) に統一、ServiceDetailView 側で 1 series wrap | auto-recommended | 002 §1 MetricChart 行 + ServiceDetailView |
| D6 (R6) | sparkline 等 scope 外明示 | 001 §9 に [論点-TS5] per-service sparkline を次 revise 候補として追加 | auto-recommended | 001 §9 |

## 5. 次のステップ
- 反映済み `001-002 + 003` を確認 (R1-R6 反映、`<!-- spec-review R{N} -->` コメント付与)
- 準備ができたら `/flow:tdd dashboard timeseries-topchart` で Phase 1-4 実装着手 (auto loop reiteration 7 で auto-pick 予定)
<!-- auto-generated-end -->
