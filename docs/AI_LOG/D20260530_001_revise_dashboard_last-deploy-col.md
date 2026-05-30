# D20260530_001 — /flow:revise dashboard last-deploy-col

**実行日時**: 2026-05-30 (+09:00)
**コマンド**: /flow:revise
**対象**: dashboard / last-deploy-col (chart-to-column)
**実行者**: SeijiShii (via Claude Code)
**状態**: 完了

## 含まれる decision 範囲
D20260530-001 〜 D20260530-010

## 改修概要
`last_deploy_at` を dashboard 上部の時系列折れ線 chart 対象から外し、下部の一覧テーブルに「最終デプロイ日時」カラムとして表示する。timeseries-topchart revise (D20260528-087〜094, spec-review R2) が `last_deploy_at` を主要 4 chart metric の 1 つに確定したが、単一のデプロイ時刻 (epoch_ms) は時系列推移を持たず折れ線表現が直感的でない。一覧の日時カラムが適切表現。

## 主要決定サマリ
| id | 質問 | chosen | type |
|---|---|---|---|
| D20260530-001 | 改修要望の確定 | 引数本文「last_deploy_at はチャート表示しない。一覧に日時カラムを追加する」採用 | explicit-choice |
| D20260530-002 | 関連 AI_LOG セッション抽出 | D20260528_027 (timeseries-topchart revise) を depends 起点に確定 | auto-recommended |
| D20260530-003 | Read スコープ | dashboard 機能実装 + MetricChart + summary/View/Row + 既存 test (auto-recommended 範囲) | auto-recommended |
| D20260530-004 | A 改修動機 | デプロイ時刻は単一値で折れ線不向き → 一覧カラム化 | auto-recommended |
| D20260530-005 | B 後方互換 | 内部 dashboard のみ。charts 4→3 件 (除去)、shipyard 公開 API 不変、テーブルに td 追加 = 互換維持 | auto-recommended |
| D20260530-006 | C リリース戦略 | 一括 (内部 UI 変更、フラグ不要) | auto-recommended |
| D20260530-007 | D 既存テスト扱い | 一部修正 (chart 4→3 アサーション) + 一部追加 (デプロイ日時カラム) | auto-recommended |
| D20260530-008 | E ロールバック | コード revert のみ (DB 変更なし) | auto-recommended |
| D20260530-009 | タグ判定 | feature, auth-required (UI) — 既存継承、変更なし | auto-recommended |
| D20260530-010 | git commit | 1 セッション = 1 commit (docs のみ) | auto-recommended |

## 依存関係
- **depends_on**: D20260528-087〜094 (timeseries-topchart revise — `last_deploy_at` を 4 chart metric 化した元決定。本セッションはその一部を差し戻す)
- D20260528-097〜103 (timeseries-topchart spec-review R2 = 4 metric 固定順序確定)
- 元 feature: dashboard 001_SPEC (DA-UC1 一覧表示)

## 生成・更新したアーティファクト
- `docs/dashboard/revise_last-deploy-col_20260530_chart-to-column/` (README + INDEX + 001-004)
- `docs/dashboard/INDEX.md` (サブフォルダ行追加)
- `docs/INDEX.md` (dashboard 改修件数 2→3)
- `docs/AI_LOG/INDEX.md` (本セッション登録)

## 学習・改善
- timeseries-topchart で「主要 metric を一律 chart 化」した判断が、metric の性質 (時系列 vs 単一スナップショット) を区別していなかった。`last_deploy_at` / 累積カウンタ系は時系列より「最新値テーブル表示」が適する場合がある。今後 chart 対象 metric 選定時は「推移に意味があるか」を判定軸に加える (学習ログへ反映)。

## Decisions

```yaml
- id: D20260530-001
  timestamp: 2026-05-30T10:00:00+09:00
  command: /flow:revise
  phase: Step 1.2 改修要望取得
  question: 改修要望の確定
  options: [引数本文採用, gh issue 取得, 1問確認]
  recommended: 引数本文採用
  chosen: "last_deploy_at はチャート表示しない。一覧に日時カラムを追加する"
  chosen_type: explicit-choice
  depends_on: []
  context: |
    引数末尾に要望本文あり。gh issue 番号指定なし。要望本文をそのまま採用。
    対象機能は last_deploy_at + MetricChart + 一覧テーブルの所在から dashboard と確定。

- id: D20260530-002
  timestamp: 2026-05-30T10:01:00+09:00
  command: /flow:revise
  phase: Step 2.1.5 関連 AI_LOG 抽出
  question: 関連セッション + depends_on 起点
  options: [timeseries-topchart 起点, 全 dashboard revise 起点]
  recommended: timeseries-topchart 起点
  chosen: D20260528_027 (timeseries-topchart revise) を depends 起点
  chosen_type: auto-recommended
  depends_on: [D20260528-087, D20260528-094]
  context: |
    last_deploy_at の chart 化は timeseries-topchart で確定 (4 metric 固定、spec-review R2)。
    本改修はその一部差し戻し = 直接の depends 元。

- id: D20260530-003
  timestamp: 2026-05-30T10:02:00+09:00
  command: /flow:revise
  phase: Step 2.2 Read スコープ確認
  question: Read スコープ
  options: [推奨範囲(dashboard 実装+MetricChart+test), 絞る, 広げる]
  recommended: 推奨範囲
  chosen: src/features/dashboard/{summary,DashboardView,DashboardCharts,ServiceRow,lastUpdatedFormat}.ts(x) + src/components/MetricChart.tsx + 対応 test + 既存 timeseries-topchart revise SPEC
  chosen_type: auto-recommended
  depends_on: [D20260530-002]
  context: |
    全 read-only Class A。表示変更のみで波及は dashboard 機能内に閉じる。
    last_deploy_at データは ServiceRowVM.metrics に既存 = summary.ts row 改変不要を確認。

- id: D20260530-004
  timestamp: 2026-05-30T10:03:00+09:00
  command: /flow:revise
  phase: Step 3.1-A 改修動機
  question: 改修の動機・背景
  options: []
  recommended: デプロイ時刻は単一スナップショット値で折れ線不向き → 一覧カラム化
  chosen: 単一値 metric の chart 表現是正、一覧テーブルへ日時カラム移設
  chosen_type: auto-recommended
  depends_on: [D20260528-097]
  context: |
    last_deploy_at は epoch_ms 単一値。時系列折れ線は recharts default で点列化されるが
    「推移」の意味が薄く、最新デプロイ日時を一覧で見せる方が運用上有用。

- id: D20260530-005
  timestamp: 2026-05-30T10:04:00+09:00
  command: /flow:revise
  phase: Step 3.1-B 後方互換
  question: 後方互換性方針
  options: [互換維持, 段階的非互換, 一括非互換]
  recommended: 互換維持
  chosen: 互換維持 (内部 dashboard のみ、charts 4→3 件除去、shipyard 公開 API 不変)
  chosen_type: auto-recommended
  depends_on: [D20260528-090]
  context: |
    DASHBOARD_CHART_METRICS から last_deploy_at 除外で charts は 3 件に。
    charts consumer は内部 DashboardView のみ (公開 status API 不変)。
    テーブルは td 1 列追加 = additive。DB/型契約への破壊変更なし。

- id: D20260530-006
  timestamp: 2026-05-30T10:05:00+09:00
  command: /flow:revise
  phase: Step 3.1-C リリース戦略
  question: リリース戦略
  options: [一括, 段階的, フィーチャーフラグ]
  recommended: 一括
  chosen: 一括 (内部 dashboard UI 変更、フラグ不要)
  chosen_type: auto-recommended
  depends_on: []
  context: 影響範囲が内部 dashboard 画面に限定、低リスク表示変更のため一括展開。

- id: D20260530-007
  timestamp: 2026-05-30T10:06:00+09:00
  command: /flow:revise
  phase: Step 3.1-D 既存テスト扱い
  question: 既存テストの扱い
  options: [全維持, 一部修正, 一部削除]
  recommended: 一部修正 + 一部追加
  chosen: chart 4→3 アサーション修正 + デプロイ日時カラム追加テスト
  chosen_type: auto-recommended
  depends_on: []
  context: |
    DashboardCharts.test TS-U-30/32 の last_deploy_at chart アサーション削除。
    summary.test DASHBOARD_CHART_METRICS 4→3。
    DashboardView.test の charts helper を 3 件化。
    新規: ServiceRow デプロイ日時カラム + thead カラム追加 + 未収集時 "—"。

- id: D20260530-008
  timestamp: 2026-05-30T10:07:00+09:00
  command: /flow:revise
  phase: Step 3.1-E ロールバック
  question: ロールバック方針
  options: [コード revert, フラグ OFF, DB rollback]
  recommended: コード revert
  chosen: コード revert のみ (DB スキーマ・データ変更なし)
  chosen_type: auto-recommended
  depends_on: [D20260530-006]
  context: 表示層のみの変更。usage_snapshots は不変。revert で完全復旧。

- id: D20260530-009
  timestamp: 2026-05-30T10:08:00+09:00
  command: /flow:revise
  phase: Step 3.2 タグ判定
  question: 機能性質タグ
  options: [feature+auth-required (既存継承), 変更あり]
  recommended: 既存継承
  chosen: feature, auth-required (UI) — 変更なし
  chosen_type: auto-recommended
  depends_on: []
  context: 既存 dashboard タグを継承。新タグ追加要因なし。

- id: D20260530-010
  timestamp: 2026-05-30T10:20:00+09:00
  command: /flow:revise
  phase: Step Z git commit
  question: セッション成果の commit
  options: [1 セッション=1 commit, skip]
  recommended: 1 セッション=1 commit
  chosen: docs(flow:revise) commit (docs サブフォルダ + INDEX + AI_LOG)
  chosen_type: auto-recommended
  depends_on: []
  context: .git 在、--no-commit 指定なし、concept auto_commit 既定。main protected 確認の上 commit。
```
