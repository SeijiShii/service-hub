# D20260608_001 revise: dashboard chart-ux (時間軸揃え + 期間選択 + usd 系 chart 削除)

**実行日時**: 2026-06-08 (+09:00)
**コマンド**: /flow:revise
**対象機能+issue**: dashboard / chart-ux (slug=axis-period-usd-cleanup)
**実行者**: seiji + Claude
**状態**: 完了 (4 文書設計、tdd 待ち)

**含まれる decision 範囲**: D20260608-001〜006

## 主要決定サマリ
| id | テーマ | chosen | type |
|---|---|---|---|
| D20260608-001 | 改修要望の確定 | 3 件 (時間軸揃え / 期間選択 全期間・30日・7日 / 課金額 chart 削除) | explicit-choice |
| D20260608-002 | Read スコープ | dashboard feature + MetricChart + recentSnapshots query + summary API | auto-recommended |
| D20260608-003 | 採算 chart の扱い (Class C) | usd 系 3 chart (課金額/コスト/採算) すべて削除、mau+収益(¥) の 2 chart に集約 | explicit-choice |
| D20260608-004 | 時間軸揃え approach | 全 chart に共有 X domain (全 series points の min/max union) を渡し統一 | auto-recommended |
| D20260608-005 | 期間選択の配線 | server `?period=all|30d|7d`、default=30日、useFetch url 変化で自動 refetch | auto-recommended |
| D20260608-006 | 後方互換/リリース/ロールバック/テスト | 表示+取得層のみ・DB 不変・migration 不要・code revert で rollback・chart 関連 test 修正 | auto-recommended |

## 依存関係
- `D20260530_010_revise_dashboard_biz-charts` (D20260530-035〜041): 上部 chart のビジネス指標化 (ユーザー数/課金額/コスト/採算)。本改修はこの 4→5 構成のうち usd 系 3 枚を削除する差し戻し。
- `D20260607_005_revise_dashboard_revenue-chart` (D20260607-016): 収益(revenue_total_yen,¥) 推移 chart 追加。本改修で残す 2 枚の一方。
- biz-charts spec-review R1 (profitAt 共通化): 採算 chart は削除するが profitAt 関数自体は一覧「採算」列 (computeProfitability) が引き続き使用するため残置。

## 生成・更新したアーティファクト
- docs/dashboard/revise_chart-ux_20260608_axis-period-usd-cleanup/{README,INDEX,001_REVISE_SPEC,002_REVISE_PLAN,003_REVISE_UNIT_TEST,004_REVISE_E2E_TEST}.md
- docs/dashboard/INDEX.md / docs/INDEX.md (auto-generated 範囲)
- 本 AI_LOG セッションファイル + AI_LOG/INDEX.md

## 学習・改善
- 派生メトリクス (採算=課金額−コスト) を持つ chart の source metric を削除する場合、派生 chart が「常に空」になる連鎖を必ず確認し Class C として人間判断を仰ぐ。今回は単位不整合 (収益¥ vs コスト$) で再ベース不能のため usd 系一括削除を選択。
- 「時間軸が揃わない」根因は MetricChart が chart ごとに `domain=["dataMin","dataMax"]` を独立計算していたこと。複数 chart を縦並びする UI では共有 domain を上位で計算して配るのが定石。

## Decisions
- id: D20260608-001
  timestamp: 2026-06-08T10:30:00+09:00
  command: /flow:revise
  phase: Step 1.2 改修要望取得
  question: 今回の dashboard chart 改修要望の確定
  options: [時間軸揃え, 期間選択(全期間/30日/7日), 課金額 chart 削除]
  recommended: 3 件すべて対応
  chosen: 3 件 (時間軸を揃える / 全期間・30日・7日 で期間選択 / データ未取得の課金額 chart を収益と同義として削除)
  chosen_type: explicit-choice
  context: ユーザー入力。「チャートの時間軸が揃っていないので見づらい」「全期間(データがあれば)/30日/7日で選べる」「データを取っていない課金額は収益と同義なので削除」。

- id: D20260608-002
  timestamp: 2026-06-08T10:35:00+09:00
  command: /flow:revise
  phase: Step 2.2 Read スコープ確定
  question: 改修分析のための Read 範囲
  chosen: src/features/dashboard/{DashboardCharts,DashboardView,DashboardPage,summary,profitability}.* + src/components/MetricChart.tsx + src/lib/useFetch.ts + src/db/queries.ts(recentSnapshots) + api/dashboard/summary.ts
  chosen_type: auto-recommended
  context: dashboard feature 内 + chart 共通コンポーネント + chart データ取得経路 (query/API)。他 feature 実装には波及しない表示+取得層スコープ。

- id: D20260608-003
  timestamp: 2026-06-08T10:50:00+09:00
  command: /flow:revise
  phase: Step 3.1-A/B 改修固有 (動機/後方互換) + 採算依存連鎖
  question: 課金額(revenue_month_usd) chart 削除に伴う採算(profit=課金額−コスト) chart の扱い
  options: [採算も削除, 採算は残す(課金額のみ非表示でsource継続), usd系すべて削除(課金額/コスト/採算)]
  recommended: 採算も削除 (収益源が消えるため常に空)
  chosen: usd 系すべて削除 (課金額/コスト/採算) → mau(ユーザー数)+収益(¥) の 2 chart に集約
  chosen_type: explicit-choice
  depends_on: [D20260530-035, D20260530-041, D20260607-016]
  context: 採算は revenue_month_usd を収益源にしており、課金額削除で実データが消え常に空。収益(¥) は jpy、コストは usd で単位不整合のため採算を収益ベースに再ベース不能。ユーザーは usd 系 3 枚一括削除を選択。一覧テーブルの「採算」列 (computeProfitability) は今回スコープ外として残置 (論点として記録)。

- id: D20260608-004
  timestamp: 2026-06-08T10:55:00+09:00
  command: /flow:revise
  phase: Step 3.1 中核 (入出力 before/after) — 時間軸揃え
  question: 複数 chart の X 時間軸を揃える方式
  options: [各 chart 独立 domain(現状), 共有 domain を上位計算して配布, 固定窓(now-Nd〜now)]
  recommended: 共有 domain (全 chart series points の min/max union) を MetricChart に渡す
  chosen: DashboardCharts が全 chart の points から共有 [xMin,xMax] を算出し各 MetricChart に domain prop で配布。MetricChart は domain 指定時それを XAxis domain に使う (未指定は従来 dataMin/dataMax で後方互換)
  chosen_type: auto-recommended
  context: 根因 = MetricChart が chart ごとに domain=["dataMin","dataMax"] を独立計算。共有 domain 配布で縦並び chart の x 軸が一致。データ駆動 union なので clock 非依存・空データにも頑健。

- id: D20260608-005
  timestamp: 2026-06-08T11:00:00+09:00
  command: /flow:revise
  phase: Step 3.1 中核 (入出力 before/after) — 期間選択
  question: 期間選択 (全期間/30日/7日) のデータ配線
  options: [client 側全取得して filter, server query param で since 切替]
  recommended: server `?period` で sinceIso 切替 (payload 軽量)
  chosen: api/dashboard/summary が req.query.period を読み 7d=now-7d / 30d=now-30d(default) / all=epoch0 に map。DashboardPage が period state を持ち `/api/dashboard/summary?period=${period}` を useFetch、url 変化で自動 refetch。selector UI は chart section header に配置 (全期間/30日/7日)
  chosen_type: auto-recommended
  context: useFetch は url 依存で run を再生成するため url に period を載せれば追加配線なしで refetch。default=30日 で現行挙動維持。全期間=epoch0 since (recentSnapshots は sinceIso 必須のため new Date(0))。

- id: D20260608-006
  timestamp: 2026-06-08T11:05:00+09:00
  command: /flow:revise
  phase: Step 3.1-B/C/D/E 改修固有 (後方互換/リリース/テスト/ロールバック)
  question: 後方互換性方針・リリース戦略・既存テスト扱い・ロールバック方針
  chosen: 互換維持(表示+取得層のみ、DB schema/保存データ不変、公開 API 不変) / 一括リリース(フラグ不要) / chart 関連 unit を修正(chart 数 5→2・profit 派生 test 削除・domain prop test 追加・period query test 追加) / code revert でロールバック(migration なし)
  chosen_type: auto-recommended
  context: usage_snapshots へは引き続き全 metric 収集(削除は表示と取得キーのみ)。revenue_month_usd/ai_cost_month_usd の保存は継続するため将来復活可能。DB 変更なしのため migration 不要・rollback は revert のみ。
