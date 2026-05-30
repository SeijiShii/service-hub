# D20260530_010 — /flow:revise dashboard biz-charts

**実行日時**: 2026-05-30 (+09:00)
**コマンド**: /flow:revise
**対象**: dashboard / biz-charts (revenue-cost-profit)
**実行者**: SeijiShii (via Claude Code)
**状態**: 完了 (設計、tdd 待ち)

## 含まれる decision 範囲
D20260530-035 〜 D20260530-041

## 改修概要
dashboard 上部チャートを**インフラ指標からビジネス指標へ転換**。`up`(死活) と `db_storage_bytes` を chart から外し（死活は一覧 status 列 StatusDot が担う、last-deploy-col と同じ「単一値/冗長表示は chart 不要」方針）、**ユーザー数 / 課金額 / コスト / 採算** の 4 枚に差し替える（上から順）。採算(profit)は保存メトリクスでなく revenue−cost の派生系列を buildCharts で合成。チャート見出しを raw metricKey → 日本語ラベルに。

## チャート構成 (上から、ユーザー確定)
| 順 | label | metricKey | 種別 |
|---|---|---|---|
| 1 | ユーザー数 | mau | snapshot |
| 2 | 課金額 | revenue_month_usd | snapshot |
| 3 | コスト | ai_cost_month_usd | snapshot |
| 4 | 採算 | profit | **派生** (revenue − cost) |

## 主要決定サマリ
| id | 質問 | chosen | type |
|---|---|---|---|
| D20260530-035 | 改修要望 | up を chart から外し課金/コスト/利益/ユーザー数の business chart へ | explicit-choice |
| D20260530-036 | Read スコープ | dashboard 機能 + MetricChart + profitability + biz-observability revise (auto-recommended) | auto-recommended |
| D20260530-037 | 最終チャート構成 (Class C) | ユーザー数/課金額/コスト/採算 の 4 枚 (上から)、db_storage_bytes も除外 | explicit-choice |
| D20260530-038 | 採算の実現方法 | profit は保存メトリクスでなく buildCharts で revenue−cost の派生系列を合成 | auto-recommended |
| D20260530-039 | fetch keys と chart defs の分離 | recentSnapshots は [mau, revenue_month_usd, ai_cost_month_usd] を取得、chart は 4 定義 (profit 派生) に分離 | auto-recommended |
| D20260530-040 | 日本語ラベル | MetricChart に label prop 追加、見出しを raw metricKey → label (ユーザー数/課金額/コスト/採算) | auto-recommended |
| D20260530-041 | 後方互換/リリース/ロールバック | 互換維持 (内部 dashboard のみ、charts consumer は DashboardView のみ、公開 API 不変) / 一括 / コード revert | auto-recommended |

## 依存関係
- **depends_on**: D20260530-005 (last-deploy-col 後の DASHBOARD_CHART_METRICS=[up,mau,db_storage_bytes])、business-observability revise (_shared/providers revise_001、revenue_month_usd/ai_cost_month_usd/profitability 導入)、D20260528-097 (timeseries-topchart 4 metric 設計)
- 元 feature: dashboard 001_SPEC (DA-UC4 chart)

## 生成・更新したアーティファクト
- docs/dashboard/revise_biz-charts_20260530_revenue-cost-profit/ (README + INDEX + 001-004)
- docs/dashboard/INDEX.md + docs/INDEX.md + AI_LOG/INDEX.md

## 学習・改善
- last-deploy-col に続き「chart 対象 metric は時系列推移に意味があるか + 冗長表示でないか」を判定軸に。死活(現在状態)は status 列、単一値(deploy 時刻)は一覧カラム、推移に意味があるビジネス指標(課金/コスト/採算/ユーザー数)が chart に適する、という整理が確立。

## Decisions

```yaml
- id: D20260530-035
  timestamp: 2026-05-30T19:00:00+09:00
  command: /flow:revise
  phase: Step 1.2 改修要望取得
  question: 改修要望の確定
  chosen: "up(死活)を chart から外し、課金/コスト/採算/ユーザー数のビジネスチャートに差し替え"
  chosen_type: explicit-choice
  depends_on: [D20260530-005]
  context: ユーザー要望「UP/DOWN はチャート不要、課金/コストが見たい」+ 対話で「ユーザー数も」「採算も、上からユーザー数/課金額/コスト/採算」と確定。

- id: D20260530-036
  timestamp: 2026-05-30T19:01:00+09:00
  command: /flow:revise
  phase: Step 2.2 Read スコープ
  question: Read スコープ
  recommended: dashboard 機能 + MetricChart + profitability + biz-observability revise
  chosen: src/features/dashboard/{summary,DashboardCharts}.{ts,tsx} + src/components/MetricChart.tsx + src/features/dashboard/profitability.ts + src/types/metric.ts + api/dashboard/summary.ts + 対応 test
  chosen_type: auto-recommended
  depends_on: []
  context: 全 read-only Class A。chart 集約 + 表示の変更で dashboard 機能内に閉じる。

- id: D20260530-037
  timestamp: 2026-05-30T19:03:00+09:00
  command: /flow:revise
  phase: Step 3 最終チャート構成 (Class C、ユーザー対話)
  question: dashboard 上部チャートの最終構成
  options:
    - 課金/コスト/ユーザー数 3 枚
    - 課金/コスト/ユーザー数/DBストレージ 4 枚
    - 課金/コスト/利益/ユーザー数
  recommended: 課金/コスト/ユーザー数 3 枚
  chosen: ユーザー数/課金額/コスト/採算 の 4 枚 (上から)、db_storage_bytes も除外
  chosen_type: explicit-choice
  depends_on: [D20260530-035]
  context: |
    ユーザーが menu (課金/コスト/利益/ユーザー数) 選択 + 追加メッセージ「採算を見たい、上から
    ユーザー数/課金額/コスト/採算」で最終確定。利益=採算=profit。db_storage_bytes は言及なし
    = business フォーカスから除外。死活は status 列 (StatusDot、rowStatusKind が row.up から導出) が担う。

- id: D20260530-038
  timestamp: 2026-05-30T19:04:00+09:00
  command: /flow:revise
  phase: Step 3 採算の実現方法
  question: profit(採算) をどう chart 化するか (保存メトリクスでない)
  options: [profit を新メトリクスとして collect, buildCharts で派生合成]
  recommended: buildCharts で派生合成
  chosen: buildCharts で revenue−cost の派生系列を合成 (新 collect 不要)
  chosen_type: auto-recommended
  depends_on: [D20260530-037]
  context: |
    profitability.ts: profit = revenue_month_usd − (ai_cost_month_usd ?? 0)。これは最新値の算出だが、
    chart は時系列。各 service の各 capturedAt で revenue(t) − cost(t) を合成すれば派生 profit 系列が作れる
    (revenue snapshot のある時点のみ、cost 欠落は 0 = computeProfitability セマンティクス踏襲)。
    新メトリクス collect 不要 = 収集パイプライン不変、後方互換。

- id: D20260530-039
  timestamp: 2026-05-30T19:05:00+09:00
  command: /flow:revise
  phase: Step 3 fetch keys と chart defs の分離
  question: DASHBOARD_CHART_METRICS が「取得キー」と「チャート定義」を兼ねている問題
  chosen: DASHBOARD_CHART_SOURCE_METRICS (取得=[mau,revenue_month_usd,ai_cost_month_usd]) と DASHBOARD_CHARTS (4 定義、profit 派生含む) に分離
  chosen_type: auto-recommended
  depends_on: [D20260530-038]
  context: |
    profit は取得しない (派生) ため、取得キー集合とチャート定義集合が一致しなくなる。
    api/dashboard/summary.ts の recentSnapshots filter は SOURCE_METRICS、buildCharts は CHARTS 定義で生成。

- id: D20260530-040
  timestamp: 2026-05-30T19:06:00+09:00
  command: /flow:revise
  phase: Step 3 日本語ラベル
  question: チャート見出しを raw metricKey から日本語へ
  chosen: MetricChart に label prop 追加、見出し {metricKey}({unit}) → {label}。DashboardChart 型に label 追加
  chosen_type: auto-recommended
  depends_on: [D20260530-037]
  context: |
    現状 MetricChart 見出しは `{metricKey} ({unit})` = "mau (count)" 等 raw 表示。ユーザーは
    「ユーザー数/課金額/コスト/採算」の日本語ラベルを要求。label prop を additive 追加 (testid=metricKey は維持)。

- id: D20260530-041
  timestamp: 2026-05-30T19:07:00+09:00
  command: /flow:revise
  phase: Step 3.1 改修固有 (後方互換/リリース/ロールバック)
  question: 後方互換・リリース・ロールバック方針
  chosen: 互換維持 (内部 dashboard のみ、charts consumer=DashboardView のみ、公開 status API 不変、DB 不変) / 一括 / コード revert
  chosen_type: auto-recommended
  depends_on: [D20260530-039]
  context: charts 配列の中身が変わる (3→4、metric 入替) が内部 consumer のみ。DB/収集/公開 API 不変。表示層 + 集約ロジックのみ。
```
