# AI_LOG セッション D20260528_029 — /flow:spec-review (dashboard timeseries-topchart)

**実行日時**: 2026-05-28 (JST) / 開始 ~18:58 / 完了 ~19:05
**コマンド**: /flow:spec-review
**dispatch 元**: /flow:auto continuous loop reiteration 6 (P3.7 spec-review gate auto-pick、D-027 revise 設計直後)
**実行者**: Claude Opus 4.7 (1M context)
**状態**: 完了 — auto-pick R1-R6 全件解決、905 生成、001/002/003 反映、P 原則新規追加なし (既存 P3/P19/P51/P59/P78/P79 適用で十分)

## 主要決定サマリ
| decision_id | 概要 | chosen_type |
|---|---|---|
| D20260528-097 | R1 (High): api/dashboard/summary で recentSnapshots を既存 Promise.all に 4 件目並列追加 | auto-recommended |
| D20260528-098 | R2 (Medium): DashboardVM.charts は **required** (buildDashboard が常に 4 件返す、内部矛盾解消、shipyard public API 不変) | auto-recommended |
| D20260528-099 | R3 (Medium): last_deploy_at Y 軸 tickFormatter = `Intl.DateTimeFormat('ja-JP') M/D` 形式 | auto-recommended |
| D20260528-100 | R4 (Low): chart section header = `<h2>直近 30 日の推移</h2>` + force-pull section と同 border-bottom パターン | auto-recommended |
| D20260528-101 | R5 (Low): MetricChart signature を multi-series 統一、ServiceDetailView 側で 1 series wrap | auto-recommended |
| D20260528-102 | R6 (Info): per-service sparkline (論点-TS5) は次 revise 候補として 001 §9 に追加 | auto-recommended |
| D20260528-103 | review-perspectives.md 新規 P 追加なし (既存 P3/P19/P51/P59/P78/P79 で十分カバー、重複追加禁止) | auto-recommended |

## 依存関係
- 主要 depends_on: `D20260528_027_revise_dashboard_timeseries-topchart.md` (本 spec-review の対象設計)
- 副次 depends_on: `D20260528_020_spec-review__shared_types_favicon-projection.md` (前回 spec-review の P78-P80 学習を継承)
- 上流 CF: CF-20260528-020 (新フィールド追加時の表示先逆引き)

## 生成・更新したアーティファクト
- `docs/dashboard/revise_timeseries-topchart_20260528/905_REVISE_SPEC_REVIEW.md` ✅ (新規)
- `001_REVISE_SPEC.md` ✅ R2/R6 反映 (spec-review コメント 2 箇所 + 論点-TS5 追加)
- `002_REVISE_PLAN.md` ✅ R1/R3/R4/R5 反映 (api 並列 + tickFormatter + section header + signature 統一、コメント 4 箇所)
- `003_REVISE_UNIT_TEST.md` ✅ R2/R3/R4 反映 (TS-M-03 required、TS-U-23 tickFormatter、TS-U-31 section header)
- subfolder INDEX + dashboard INDEX 更新

---

## Decisions

```yaml
- id: D20260528-097
  timestamp: 2026-05-28T19:00:00+09:00
  command: /flow:spec-review
  phase: R1 (High) recentSnapshots 並列実行
  recommended: "既存 Promise.all に 4 件目並列追加"
  chosen: "並列追加"
  chosen_type: auto-recommended
  depends_on: []
  context: |
    既存 api/dashboard/summary は [latest, alerts, runs] Promise.all 並列。
    recentSnapshots 逐次追加だと cold start で +1 RTT、並列で 0。既存パターン一貫性 + perf。

- id: D20260528-098
  timestamp: 2026-05-28T19:01:00+09:00
  command: /flow:spec-review
  phase: R2 (Medium) DashboardVM.charts required vs optional
  recommended: "required (buildDashboard が常に 4 件返す)"
  chosen: "required"
  chosen_type: auto-recommended
  depends_on: []
  context: |
    SPEC §2.3 と §7.3 で optional/required 内部矛盾あり。required 確定:
    (a) 内部矛盾解消 (b) 既存 admin UI consumer は charts プロパティ参照なし = 破壊なし
    (c) クライアント側で optional 分岐の手間省ける (d) shipyard public API (PublicServiceStatus)
    は本回不変 = 公開契約と内部 contract を別物として扱える。

- id: D20260528-099
  timestamp: 2026-05-28T19:02:00+09:00
  command: /flow:spec-review
  phase: R3 (Medium) last_deploy_at tickFormatter
  recommended: "Intl.DateTimeFormat('ja-JP') M/D 形式 (例: 5/28)"
  chosen: "M/D 形式"
  chosen_type: auto-recommended
  depends_on: []
  context: |
    日本語 PJ で M/D 直感的、Intl.DateTimeFormat 標準 API 軽量、library 依存なし。
    epoch_ms 値 (1779958293585) のまま Y 軸に出ると読めない = 必須変換。

- id: D20260528-100
  timestamp: 2026-05-28T19:03:00+09:00
  command: /flow:spec-review
  phase: R4 (Low) chart section header + 境界
  recommended: "<h2>直近 30 日の推移</h2> + border-bottom (force-pull section と同パターン)"
  chosen: "推奨どおり"
  chosen_type: auto-recommended
  depends_on: []
  context: |
    DashboardView.tsx:74 force-pull section の borderBottom: "1px solid var(--border, #2a2f3a)"
    と同パターンで一貫性。section header 文言は SPEC §7.5「直近 30 日」と整合。

- id: D20260528-101
  timestamp: 2026-05-28T19:04:00+09:00
  command: /flow:spec-review
  phase: R5 (Low) MetricChart signature 統一
  recommended: "multi-series 統一、ServiceDetailView 側で 1 series wrap"
  chosen: "統一"
  chosen_type: auto-recommended
  depends_on: []
  context: |
    MetricChart 内部 logic 一本化 (single/multi 分岐持たない)、テストも一本化、caller 責務で wrap、
    将来 service-detail でも複数 metric 重ね描き対応の拡張余地。

- id: D20260528-102
  timestamp: 2026-05-28T19:04:30+09:00
  command: /flow:spec-review
  phase: R6 (Info) sparkline 次 revise 候補化
  recommended: "001 §9 に [論点-TS5] per-service sparkline を次 revise 候補として追加"
  chosen: "追加"
  chosen_type: auto-recommended
  depends_on: []
  context: |
    本 revise は「上部 4 chart × 全 service 重ね描き」に scope 絞り視認性確保。
    per-service sparkline は別 UC (各 service 個別 trends 確認)、scope 拡張で混乱しないよう別 revise 候補化。

- id: D20260528-103
  timestamp: 2026-05-28T19:05:00+09:00
  command: /flow:spec-review
  phase: Step 6 自己学習
  question: review-perspectives.md 新規 P 原則追加
  recommended: "追加なし (既存で十分カバー)"
  chosen: "追加なし"
  chosen_type: auto-recommended
  depends_on: []
  context: |
    本 revise の指摘 R1-R6 は全て既存 P 原則でカバー: 
    R1 既存パターン継承 = P (組み込み observation)、R2 internal matrix = P78 型 vs schema、
    R3/R4 仕様明示化 = P (組み込み)、R5 共通化責務 = P19/P3、R6 scope 明示 = P57 scope 明示。
    新規一般原則の抽出なし、無理に生成しない (gard 条件)。
```
