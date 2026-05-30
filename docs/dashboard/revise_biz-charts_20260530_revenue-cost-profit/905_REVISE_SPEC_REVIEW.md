<!-- auto-generated-start -->
# 設計レビューレポート — dashboard / biz-charts (revenue-cost-profit)

**レビュー日**: 2026-05-30
**レビュー実施者**: Claude (Opus 4.8 1M) + SeijiShii
**対象**: dashboard 改修 `revise_biz-charts_20260530_revenue-cost-profit` (001-004 REVISE)
**入力**: 当該 001-004 + 実コード (summary.ts / DashboardCharts.tsx / MetricChart.tsx / profitability.ts / api/dashboard/summary.ts / providers/adapters.ts / service-detail/ServiceDetailView.tsx / types/metric.ts / rowStatus.ts / alerts/evaluate.ts) + business-observability revise SPEC
**観点ソース**: 組み込みチェックリスト + review-perspectives.md (P2 / P19 / P47 / P57 / P59 / P82 / P86)
**モード**: auto-pick (flow:auto P3.7 Spec-review gate dispatch)
**severity-threshold**: low

## 1. レビューサマリー

| 観点 | 評価 | 備考 |
|------|------|------|
| 仕様の明確性 | OK | チャート構成・採算派生・ラベルが明示 |
| 既存パターンとの一貫性 | OK | MetricChart 委譲・空 fallback・recentSnapshots filter 踏襲 |
| 影響範囲・副作用 | 要確認→解消 | R2 MetricChart label 後方互換 (service-detail)、R5 db_storage_bytes 収集維持 |
| API 流用・責務逸脱 | OK | 表示+集約のみ、profit は chart 内部合成キー |
| 既存実装の再利用 | 要確認→解消 | R1 profitAt 共通化で採算定義 SoT 一本化 |
| データ移行・互換性 | OK | DB 不変、charts consumer は DashboardView のみ、公開 API 不変 |
| 採算チャート ↔ 一覧採算列の一致 | 要確認→解消 | R1: 同じ profitAt 経由で構造的一致を保証 |
| データ源 (revenue/cost 収集) | OK | R6: service-info adapter が metrics[] 全キー emit |
| テストカバレッジ | OK | profit 派生・label fallback・採算一致を 003 でカバー |

## 2. 指摘事項 (severity 降順)

### [R1] 採算の派生を profitAt 純関数に共通化し、チャート採算=一覧採算列を保証 (severity=Medium)
- **対象**: 001 §7.5/§9、002 §1、profitability.ts、summary.ts buildCharts
- **現状**: profit = revenue − (cost ?? 0) の定義が computeProfitability(最新値=一覧採算列) と buildCharts(時系列チャート) の 2 箇所に分散する設計。
- **問題**: 採算は「一覧テーブルの採算列」と「チャート」で**同じ値の最新/推移**であるべき。定義が分散すると列とチャートで採算が食い違う回帰を招く。business-observability SPEC §7.4 は「按分無料枠超過コスト」込みの採算を定義するが実装(computeProfitability)は未搭載 = チャートが独自定義を持つと一覧列とズレる。
- **chosen**: **(a) `profitAt(revenue, cost) = revenue − (cost ?? 0)` を profitability.ts に export**し、computeProfitability と buildCharts 両方が使う。按分無料枠は本改修で加えない(一覧列と一致優先、別 issue)。論点-001 を (a) で確定。
- **chosen_type**: auto-recommended
- **反映先**: 001 §7.5/§9 [論点-001] + 002 §1 + 003 §4.1 (BC-U-30 一致テスト + profitAt 単体)

### [R2] MetricChart label は optional 必須 — service-detail が label 未指定で呼ぶ (severity=Medium、P59/P82)
- **対象**: 001 §3/§2.2、002 §1、MetricChart.tsx、service-detail/ServiceDetailView.tsx:38
- **現状**: 影響範囲 grep で MetricChart の consumer = DashboardCharts(label 渡す) **と service-detail/ServiceDetailView.tsx:38 (label 未指定)** の 2 箇所。
- **問題**: label を required にすると service-detail が型エラー/見出し空。
- **chosen**: 設計どおり **`label?: string` optional + `{label ?? metricKey} ({unit})` fallback**。service-detail は従来の metricKey 見出しを維持。test BC-U-12 で fallback を担保。
- **chosen_type**: auto-recommended
- **反映先**: 001 §4 (既記載) + 003 BC-U-12 (既記載) — 設計どおりで確認、追加変更なし

### [R3] profit 派生の capturedAt 整合 (severity=Low、正確性)
- **対象**: 001 §7.2、buildCharts
- **現状**: profit(t) = revenue(t) − cost(t)。revenue と cost は別 snapshot。
- **評価**: revenue/cost は同一 service-info adapter 呼び出し(同一 collection run)で emit されるため**同 capturedAt で揃う**。実装は revenue の capturedAt を基準に、同 service の cost を capturedAt キーの map で lookup(無ければ 0)。ずれても revenue 起点で破綻しない。設計どおりで OK。
- **chosen_type**: auto-recommended
- **反映先**: 001 §7.2 (既記載、cost map lookup 明示) — 確認のみ

### [R4] fetch keys と chart defs の分離 (severity=Low、P86)
- **対象**: 002 §1、api/dashboard/summary.ts
- **現状**: SOURCE_METRICS=[mau,revenue,cost] を recentSnapshots で取得、CHARTS=4定義(profit 派生)。
- **評価**: P86(表示移設時のデータソース系統確認、本セッション前段で追加した原則)に合致。profit は取得せず派生。`up`/`db_storage_bytes` は chart 取得から外れるが **latestPerService(一覧 status 列・採算列)では引き続き取得**(別系統)。chart 除外は一覧に無影響。
- **chosen_type**: auto-recommended
- **反映先**: 設計どおり確認

### [R5] db_storage_bytes / up は収集維持 (severity=Low、P57)
- **対象**: 001 §3.1、adapters.ts、rowStatus.ts、alerts/evaluate.ts
- **現状**: chart から up/db_storage_bytes を外す。
- **評価**: **up は収集維持必須** — rowStatusKind(一覧 status 列) + alerts/evaluate.ts(down 検知) が `up` を使う。**db_storage_bytes も収集維持** — adapters で収集、chart から外すだけ(一覧表示なし=collected-but-unshown だが将来の cost-sim 等で利用余地、削除しない)。「chart 定義から外す」≠「収集削除」を明確化。
- **chosen_type**: auto-recommended
- **反映先**: 001 §3.1 (既記載「維持する」表) — 確認、収集削除しないことを明示済

### [R6] revenue/cost のデータ源確認 (severity=Info)
- **対象**: providers/adapters.ts createServiceInfoAdapter
- **評価**: adapter は `for (const m of j.metrics ?? []) metrics.push(...)` で **metrics[] の全キーを emit** → サービスが revenue_month_usd/ai_cost_month_usd を自己申告すれば usage_snapshots に入り chart 化可能。未申告は points=[] で「データなし」。business-observability で標準キーとして定義済。
- **chosen_type**: auto-recommended
- **反映先**: 001 §7.5 (R6 注記追加)

## 3. コードベース調査結果

### 3.1 既存パターン
- chart: DashboardCharts が charts を map → MetricChart 委譲、空 series で「データなし」、testid=chart-{metricKey}。見出しは現状 `{metricKey} ({unit})` (raw) → label fallback 化。
- 集約: recentSnapshots(metricKeys filter) → buildCharts(metric|slug でグループ)。
- 採算: profitability.ts `computeProfitability(metrics) → profit = revenue_month_usd − (ai_cost_month_usd ?? 0)`。一覧「採算」列(ServiceRow)が表示。

### 3.2 影響範囲分析
| 変更対象 | 既存呼び出し箇所 | 契約 | 破壊リスク |
|---|---|---|---|
| MetricChart props | DashboardCharts(label 渡す) / service-detail:38(label 無) | label optional fallback 必須 | 低 (R2、optional で回避) |
| DASHBOARD_CHART_METRICS | summary.ts buildCharts / api/dashboard/summary.ts | SOURCE_METRICS + CHARTS に分離 | 低 (内部のみ、R4) |
| `up` snapshot | rowStatus(status 列) / alerts/evaluate(down 検知) / summary(row.up) / latestPerService | chart 外でも収集必須 | なし (収集維持、R5) |
| `db_storage_bytes` snapshot | adapters(収集) / (chart のみ表示だった) | 収集維持・表示なし | なし (R5) |
| charts(DashboardChart[]) | DashboardView → DashboardCharts | 内部 consumer のみ、label additive | なし |
| profit("profit" metricKey) | MetricChart tickFormatter(last_deploy_at のみ分岐) | default 数値表示 | なし (R3、exhaustive switch なし) |

### 3.3 API 責務の評価
責務逸脱なし。chart metric 集合の入替 + 既存 revenue/cost snapshot の chart 化 + profit 派生(profitAt 共通化) + label。新 API・新 collect・新 DTO なし。`up`/`db_storage_bytes` の収集契約は不変。

## 4. 設計判断ログ
| # | 判断項目 | 結論 | chosen_type | 反映先 |
|---|---|---|---|---|
| R1 | 採算派生の共通化 | profitAt 純関数共通化 (チャート=一覧列一致) | auto-recommended | 001 §7.5/§9 / 002 / 003 |
| R2 | MetricChart label | optional + metricKey fallback (service-detail 互換) | auto-recommended | 設計どおり確認 |
| R3 | profit capturedAt 整合 | revenue 起点 + cost map lookup(無→0) | auto-recommended | 001 §7.2 確認 |
| R4 | fetch/chart 分離 (P86) | SOURCE_METRICS / CHARTS 分離、一覧と独立 | auto-recommended | 002 §1 確認 |
| R5 | up/db_storage 収集維持 | chart 除外 ≠ 収集削除 | auto-recommended | 001 §3.1 確認 |
| R6 | revenue/cost データ源 | service-info adapter が metrics[] 全 emit | auto-recommended | 001 §7.5 |

## 5. 次のステップ
- 反映済み 001/002/003 を確認 (R1 中心、`<!-- spec-review R{N} -->`)
- `/flow:tdd dashboard` で実装着手 (Phase 1: chart 定義分離+label+取得キー / Phase 2: profitAt 共通化 + profit 派生)
- E2E: `/flow:e2e dashboard` (4 ビジネス chart + 採算折れ線 + 視覚 + snapshot 再生成)
<!-- auto-generated-end -->
