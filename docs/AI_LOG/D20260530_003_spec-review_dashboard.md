# D20260530_003 — /flow:spec-review dashboard (last-deploy-col)

**実行日時**: 2026-05-30 (+09:00)
**コマンド**: /flow:spec-review
**対象**: dashboard 改修 last-deploy-col (chart-to-column)
**実行者**: SeijiShii (via Claude Code) — flow:auto P3.7 Spec-review gate dispatch
**状態**: 完了
**モード**: auto-pick

## 含まれる decision 範囲
D20260530-012 〜 D20260530-019

## レビューサマリ
- **指摘**: Critical 0 / High 0 / Medium 1 (R1) / Low 3 (R2/R3/R4) / Info 2 (R5/R6)
- **設計判断**: 6 件すべて auto-recommended で確定 (Class C なし)
- **反映文書**: 001_SPEC (§3.1 新設 + §7.2/§7.4/§9) / 002_PLAN (§1 api 追加 + データソース節 + §2 formatJst 再利用) / 003_UNIT_TEST (§4 テスト面補正)
- **追加 P 原則**: 1 件 (P86 — 表示移設時のデータソース系統確認)
- **生成**: 905_REVISE_SPEC_REVIEW.md

## 主要決定サマリ
| id | 指摘 | 結論 | severity | type |
|---|---|---|---|---|
| D20260530-012 | 入力収集 + コード調査 | 9 ファイル Read、P2/P19/P51/P59/P64/P73/P82 適用、過去 spec-review (timeseries-topchart 029) 参照 | — | auto-recommended |
| D20260530-013 | R1 service-detail chart 整合性 (P59/P73) | dashboard のみスコープ、service-detail 維持 + 論点化 | Medium | auto-recommended |
| D20260530-014 | R2 列データソース確定 | latestPerService 由来、chart の recentSnapshots と別系統 → 除外無影響 | Low | auto-recommended |
| D20260530-015 | R3 PLAN 漏れ api/dashboard/summary.ts | PLAN §1 追加 (コメント修正) | Low | auto-recommended |
| D20260530-016 | R4 formatJst 再利用 (P19/DRY) | formatJst を export し deployAtFormat が再利用 | Low | auto-recommended |
| D20260530-017 | R5 0 ガード必要性 | adapters の 0 書込みに対し必須と確認 | Info | auto-recommended |
| D20260530-018 | R6 列粒度 (P64) | per-service 一致、対応不要 | Info | auto-recommended |
| D20260530-019 | P86 自己学習追記 | review-perspectives.md に P86 追加 | — | auto-recommended |

## 依存関係
- **depends_on**: D20260530-001〜010 (last-deploy-col revise 設計)、D20260528-097〜103 (timeseries-topchart spec-review R2 = 4 metric 確定、本改修が一部巻き戻し)、D20260528-087〜094 (timeseries-topchart revise)
- 元 feature: dashboard 001_SPEC

## 生成・更新したアーティファクト
- `docs/dashboard/revise_last-deploy-col_20260530_chart-to-column/905_REVISE_SPEC_REVIEW.md` (新規)
- 001_REVISE_SPEC.md / 002_REVISE_PLAN.md / 003_REVISE_UNIT_TEST.md (R1-R5 反映、`<!-- spec-review R{N} -->`)
- `~/.claude/flow-data/review-perspectives.md` (P86 追記、repo 外)
- `docs/AI_LOG/INDEX.md` + `docs/dashboard/INDEX.md` (本セッション登録 + 905 反映)

## 学習・改善
- P86 新設: 表示要素を別ビュー (chart→テーブル列) へ移設する改修で、移設元/先が別クエリ系統 (filtered chart query vs unfiltered latest query) のとき、片方のフィルタ変更が他方に波及しないことを両クエリ Read で確定する。本件の「列は latestPerService 由来で chart 除外と独立」が導出元。

## metrics
```yaml
metrics:
  command: /flow:spec-review
  target: dashboard/last-deploy-col
  findings: { critical: 0, high: 0, medium: 1, low: 3, info: 2 }
  design_decisions: { total: 6, auto_recommended: 6, explicit_choice: 0 }
  docs_updated: [001_REVISE_SPEC, 002_REVISE_PLAN, 003_REVISE_UNIT_TEST]
  new_principles: 1   # P86
  files_read: 9
```

## Decisions

```yaml
- id: D20260530-012
  timestamp: 2026-05-30T10:40:00+09:00
  command: /flow:spec-review
  phase: Step 0-1 入力収集 + コードベース調査
  question: Read スコープ + 適用観点
  chosen: 9 実コード + 001-004 + review-perspectives (P2/P19/P51/P59/P64/P73/P82) + 過去 spec-review 029
  chosen_type: auto-recommended
  depends_on: [D20260530-001]
  context: revise が調査済の dashboard 機能 + api/dashboard/summary.ts + db/queries.ts + service-detail を追加 Read で影響範囲確定。

- id: D20260530-013
  timestamp: 2026-05-30T10:42:00+09:00
  command: /flow:spec-review
  phase: Step 4 R1
  question: service-detail の last_deploy_at chart を本改修で外すか (P59/P73)
  options: [dashboard のみ (service-detail 維持), 全画面除去]
  recommended: dashboard のみ (service-detail 維持) + 論点化
  chosen: dashboard のみスコープ、service-detail 維持
  chosen_type: auto-recommended
  depends_on: [D20260528-090]
  context: |
    ServiceDetailView は vm.series 全 metricKey を MetricChart 描画 = service-detail で
    last_deploy_at chart が残る。ユーザー要望「一覧に日時カラム」は dashboard テーブル専用
    (service-detail は一覧テーブルなし)。out-of-scope 確定 + §9 [論点-001] 化。
    §3.1 に P73「巻き戻す/維持する」表を新設し維持範囲 (recentSnapshots/MetricChart/tickFormatter) 明示。

- id: D20260530-014
  timestamp: 2026-05-30T10:44:00+09:00
  command: /flow:spec-review
  phase: Step 4 R2
  question: 「最終デプロイ」列のデータソースは chart 除外の影響を受けるか
  chosen: 受けない — 列=latestPerService(unfiltered)、chart=recentSnapshots(filtered) で別系統
  chosen_type: auto-recommended
  depends_on: [D20260530-005]
  context: |
    api/dashboard/summary.ts: latest=latestPerService(db) (フィルタなし) が buildDashboard の
    snapshots 引数 = metrics 投影元。chartSnaps=recentSnapshots(db,since,CHART_METRICS) は別。
    DASHBOARD_CHART_METRICS から last_deploy_at 除外は chart query のみ縮小、列データ無影響。
    PLAN/SPEC に linchpin として明示 (実装誤解防止)。

- id: D20260530-015
  timestamp: 2026-05-30T10:45:00+09:00
  command: /flow:spec-review
  phase: Step 4 R3
  question: PLAN の変更ファイル漏れ (P2 grep)
  chosen: api/dashboard/summary.ts を PLAN §1 に追加 (L29 コメント「4 metric」→「3 metric」、コードは spread で自動縮小)
  chosen_type: auto-recommended
  depends_on: [D20260530-014]
  context: P2 で DASHBOARD_CHART_METRICS 全参照 grep → 唯一の他参照 api/dashboard/summary.ts が PLAN 未掲載。

- id: D20260530-016
  timestamp: 2026-05-30T10:46:00+09:00
  command: /flow:spec-review
  phase: Step 4 R4
  question: deployAtFormat の JST 整形を新規実装するか既存再利用するか (P19/DRY)
  options: [独立実装, formatJst を export 再利用]
  recommended: formatJst を export 再利用
  chosen: lastUpdatedFormat.formatJst を export 化し deployAtFormat が再利用
  chosen_type: auto-recommended
  depends_on: []
  context: |
    JST オフセット演算 (+9*3600*1000 + pad) の二重実装回避。入力契約差 (epoch_ms + 0/負値→—) は
    deployAtFormat 側の薄いガードで吸収、整形本体は formatJst に一元化。lastUpdatedFormat は export 1 語追加のみ。

- id: D20260530-017
  timestamp: 2026-05-30T10:47:00+09:00
  command: /flow:spec-review
  phase: Step 4 R5
  question: SPEC §7.4 の 0/負値→— ガードは投機的か
  chosen: 必須 — adapters が deploy timestamp 欠落時に value=0 を書込み得る (1970 誤表示防止)
  chosen_type: auto-recommended
  depends_on: []
  context: providers/adapters.ts vercel `value: Number(dep.createdAt ?? dep.created ?? 0)`。0 snapshot 実在し得る。

- id: D20260530-018
  timestamp: 2026-05-30T10:48:00+09:00
  command: /flow:spec-review
  phase: Step 4 R6
  question: 「最終デプロイ」列の粒度妥当性 (P64)
  chosen: per-service 単一値 × per-row 列で粒度一致、対応不要
  chosen_type: auto-recommended
  depends_on: []
  context: P64 の per-application 単一化ミスマッチに該当せず。

- id: D20260530-019
  timestamp: 2026-05-30T10:50:00+09:00
  command: /flow:spec-review
  phase: Step 6 自己学習
  question: 一般化可能な新 P 原則の有無
  chosen: P86 追加 (表示移設時のデータソース系統確認)
  chosen_type: auto-recommended
  depends_on: [D20260530-014]
  context: R2 の linchpin を抽象化。chart→列のような移設で別クエリ系統のフィルタ変更が他方に波及しないことを両クエリ Read で確定する原則。既存 P2/P7/P59 と非重複。
```
