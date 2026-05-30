# D20260530_012 — /flow:spec-review dashboard (biz-charts)

**実行日時**: 2026-05-30 (+09:00)
**コマンド**: /flow:spec-review
**対象**: dashboard 改修 biz-charts (revenue-cost-profit)
**実行者**: SeijiShii (via Claude Code) — flow:auto P3.7 Spec-review gate dispatch
**状態**: 完了
**モード**: auto-pick

## 含まれる decision 範囲
D20260530-043 〜 D20260530-049

## レビューサマリ
- **指摘**: Critical 0 / High 0 / Medium 2 (R1 採算共通化・R2 label 後方互換) / Low 3 (R3/R4/R5) / Info 1 (R6)
- **設計判断**: 6 件すべて auto-recommended
- **反映文書**: 001_SPEC (§7.5/§9 論点-001 確定) / 002_PLAN (§1 profitAt 確定) / 003_UNIT_TEST (§4.1 採算一致テスト)
- **追加 P 原則**: 1 件 (P87 — 同一派生値の複数ビュー共通化)
- **生成**: 905_REVISE_SPEC_REVIEW.md

## 主要決定サマリ
| id | 指摘 | 結論 | severity | type |
|---|---|---|---|---|
| D20260530-043 | 入力 + コード調査 | 9 ファイル Read、P2/P19/P47/P57/P59/P82/P86 適用 | — | auto-recommended |
| D20260530-044 | R1 採算共通化 | profitAt 純関数共通化 = チャート採算 = 一覧採算列の一致保証 | Medium | auto-recommended |
| D20260530-045 | R2 MetricChart label | optional + metricKey fallback (service-detail:38 互換) | Medium | auto-recommended |
| D20260530-046 | R3 profit capturedAt 整合 | revenue 起点 + cost map lookup (無→0)、同一 run で同 capturedAt | Low | auto-recommended |
| D20260530-047 | R4 fetch/chart 分離 (P86) | SOURCE_METRICS / CHARTS 分離、up/db は latestPerService で一覧用に維持 | Low | auto-recommended |
| D20260530-048 | R5 up/db_storage 収集維持 | chart 除外 ≠ 収集削除 (up=status列/alerts、db=収集継続) | Low | auto-recommended |
| D20260530-049 | R6 + P87 自己学習 | service-info adapter が metrics[] 全 emit 確認 + P87 追加 | Info | auto-recommended |

## 依存関係
- depends_on: D20260530-035〜041 (biz-charts revise)、business-observability revise (revenue/cost/profitability)、D20260530-014 (P86 = last-deploy-col spec-review で追加)

## 生成・更新アーティファクト
- 905_REVISE_SPEC_REVIEW.md (新規)
- 001/002/003 (R1 反映)
- review-perspectives.md P87 (repo 外)
- AI_LOG/INDEX.md + dashboard INDEX

## 学習・改善
- P87 新設: 同一の派生/集計値を複数ビュー (テーブル列の最新値 + チャートの時系列) で見せる設計は派生ロジックを単一純関数に共通化し view 間乖離を防ぐ。本件「採算 = 一覧列 + チャート」が導出元。P86 (データソース系統) の派生値版。

## metrics
```yaml
metrics:
  command: /flow:spec-review
  target: dashboard/biz-charts
  findings: { critical: 0, high: 0, medium: 2, low: 3, info: 1 }
  design_decisions: { total: 6, auto_recommended: 6 }
  docs_updated: [001_REVISE_SPEC, 002_REVISE_PLAN, 003_REVISE_UNIT_TEST]
  new_principles: 1   # P87
  files_read: 9
```

## Decisions

```yaml
- id: D20260530-043
  timestamp: 2026-05-30T19:20:00+09:00
  command: /flow:spec-review
  phase: Step 0-1 入力 + コード調査
  chosen: 9 実コード + 001-004 + review-perspectives (P2/P19/P47/P57/P59/P82/P86) + business-observability SPEC
  chosen_type: auto-recommended
  depends_on: [D20260530-035]
  context: profit 派生・label 後方互換・revenue/cost データ源を実コードで確認。

- id: D20260530-044
  timestamp: 2026-05-30T19:22:00+09:00
  command: /flow:spec-review
  phase: Step 4 R1
  question: 採算の派生ロジックをどう持つか (チャート vs 一覧列の一致)
  options: [profitAt 共通化, buildCharts インライン]
  recommended: profitAt 共通化
  chosen: profitAt(revenue,cost)=revenue−(cost??0) を profitability.ts に export、computeProfitability と buildCharts 両用
  chosen_type: auto-recommended
  depends_on: []
  context: |
    採算は一覧「採算」列(computeProfitability)とチャートの2表現。定義分散は view 間乖離回帰を招く。
    business-observability SPEC §7.4 の按分無料枠は実装未搭載 → 一覧列に合わせ本改修でも加えない。
    論点-001 を (a) 共通化で確定。

- id: D20260530-045
  timestamp: 2026-05-30T19:23:00+09:00
  command: /flow:spec-review
  phase: Step 4 R2
  question: MetricChart label を required にするか optional にするか
  chosen: optional + metricKey fallback (service-detail/ServiceDetailView.tsx:38 が label 未指定で呼ぶ)
  chosen_type: auto-recommended
  depends_on: []
  context: 影響範囲 grep で MetricChart consumer = DashboardCharts + service-detail。後者は label 無し → optional 必須 (P59/P82)。設計どおり確認。

- id: D20260530-046
  timestamp: 2026-05-30T19:24:00+09:00
  command: /flow:spec-review
  phase: Step 4 R3
  question: profit 派生の revenue/cost capturedAt 整合
  chosen: revenue の capturedAt 起点 + cost を capturedAt キー map で lookup (無→0)。同一 service-info run で同 capturedAt
  chosen_type: auto-recommended
  depends_on: [D20260530-044]
  context: revenue/cost は同一 adapter 呼び出しで emit = 同 capturedAt。ずれても revenue 起点で破綻しない。

- id: D20260530-047
  timestamp: 2026-05-30T19:25:00+09:00
  command: /flow:spec-review
  phase: Step 4 R4 (P86)
  question: fetch keys と chart defs の分離 + 一覧への影響
  chosen: SOURCE_METRICS=[mau,revenue,cost] (recentSnapshots) / CHARTS=4定義(profit派生)。up/db は latestPerService(一覧 status/採算列)で維持 = chart 除外と独立
  chosen_type: auto-recommended
  depends_on: [D20260530-014]
  context: P86(last-deploy-col で追加)に合致。chart 取得から外す ≠ 一覧データ消失。

- id: D20260530-048
  timestamp: 2026-05-30T19:26:00+09:00
  command: /flow:spec-review
  phase: Step 4 R5
  question: up/db_storage_bytes を収集削除するか
  chosen: 収集維持 (chart 定義から外すのみ)。up=rowStatusKind+alerts/evaluate、db=adapters 収集継続
  chosen_type: auto-recommended
  depends_on: []
  context: up は status 列・down 検知に必須。db_storage は collected-but-unshown だが削除しない(将来余地)。

- id: D20260530-049
  timestamp: 2026-05-30T19:27:00+09:00
  command: /flow:spec-review
  phase: Step 4 R6 + Step 6 自己学習
  question: revenue/cost データ源確認 + 一般原則
  chosen: service-info adapter が metrics[] 全キー emit = revenue/cost chart 化可能。P87 追加
  chosen_type: auto-recommended
  depends_on: [D20260530-044]
  context: createServiceInfoAdapter の for ループで全 metrics emit。P87=同一派生値の複数ビュー共通化(P86 の派生値版)。
```
