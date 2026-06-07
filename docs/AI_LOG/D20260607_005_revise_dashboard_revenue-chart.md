# D20260607_005 revise(follow-up): dashboard 収益推移 chart 追加 + sales_* 方針 (C20260607-001)

**実行日時**: 2026-06-07
**コマンド**: /flow:release 中のユーザーフィードバック対応 (revise follow-up)
**状態**: 完了 (実装・unit 323 green、デプロイ待ち)
**結果**: 本番データ確認後のユーザー指摘 3 点に対応 — ① sales_* は HUB 非対応 (producer 修正) ② 収益推移 chart を上部に追加 ③ 一覧は合計額(収益¥)。

## 主要決定
- **sales_* の扱い**: hana-memo が売上を sales_count/sales_total_yen で申告 (収益列に出ない)。ユーザー判断「hana-memo 側で契約違反を修正しているのでこちらは対応しない」→ **HUB は sales_* を alias しない**。canonical=revenue_*、producer が conform する。
- **収益推移 chart 追加** ([論点-001] 案A→案B 翻し): ユーザー「大切なのは収益の推移」。DASHBOARD_CHARTS 2 番目に {revenue_total_yen,"収益",jpy}、DASHBOARD_CHART_SOURCE_METRICS に revenue_total_yen 追加、MetricChart y 軸 ¥ 表記。
- **一覧は合計額**: ユーザー「一覧にはこれまでの合計額」→ 収益(¥)=revenue_total_yen(累計) 表示済を維持、収益(件) は補助。
- 「画面に収益が表示されない」の主因 = ユーザーは上部 chart(推移)に収益を期待 → chart 未追加だったため。表示列はデプロイ済 (bundle 検証で確認)。

## Decisions
- id: D20260607-015
  command: /flow:revise (follow-up)
  question: hana-memo sales_* を HUB で revenue_* に正規化するか
  options: [HUB に sales_* alias 追加, hana-memo を revenue_* に修正, 両方]
  chosen: hana-memo 側修正 (HUB 非対応)
  chosen_type: explicit-choice
  context: ユーザー「hana-memo 側で契約違反を修正している」。canonical=revenue_* に producer を conform、HUB は source 名を無制限に alias しない。
- id: D20260607-016
  command: /flow:revise (follow-up)
  question: 収益を推移 chart に出すか
  chosen: 上部に収益推移 chart 追加 (案B、[論点-001] 翻し)
  chosen_type: explicit-choice
  context: ユーザー「大切なのは収益の推移」。一覧は合計額。
  depends_on: [D20260607-012]

## 生成・更新ファイル
- src/features/dashboard/summary.ts (DASHBOARD_CHARTS + SOURCE_METRICS に revenue_total_yen)
- src/components/MetricChart.tsx (revenue_total_yen y 軸 ¥ 表記)
- src/features/dashboard/summary.test.ts (BC-U-01 5 件 + chart count 群 4→5)
- docs/dashboard/revise_*/001_REVISE_SPEC.md ([論点-001] 解決 / [論点-002] 更新)

## 学習・改善
- 「収益が表示されない」= 表示列はあるが、ユーザーは推移 chart を期待していた。指標追加時は「一覧(合計/現在値)」と「chart(推移)」の両面を確認するとフィードバック往復が減る。
