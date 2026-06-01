# クレーム判定レポート

**claim id**: C20260601-002
**判定日**: 2026-06-01
**判定者**: Claude (opus-4-8) + seiji
**判定**: バグ (fix)

## 1. 三項照合

### 1.1 期待 (Expected)
2 サービス登録 → 折れ線 2 本の重ね描き / 同時刻データは同 x 位置 / 時間軸は分単位まで。

### 1.2 既存仕様 (Spec)
- `dashboard/revise_timeseries-topchart_20260528/001_REVISE_SPEC.md §16/30/31`:
  「全 active service を **1 枚の chart に重ね描き（service 別色）**、デフォルト過去 30 日」
  「サービスごとの**推移**を一目で」と明記。`DashboardChart = {metricKey, unit, series: [{slug, name,
  points:[{capturedAt, value}]}]}`（§44）で multi-series を構造化。
- 現行メトリクス（mau/revenue/cost/profit 4 枚）は `revise_biz-charts_20260530_revenue-cost-profit/`。
- `src/components/MetricChart.tsx` の doc: 「Multi-series 対応 metric chart…複数 series = Dashboard
  （全 service 重ね描き）」と実装意図も multi-series 前提。
- → 期待（2 本表示・時刻整列）は **SPEC 記載通り**。時間軸の可読性（分単位）は明文規定はないが、
  ミリ秒 ISO 生表示は「見やすいチャート」という SPEC 意図に反する表示バグ。

### 1.3 現実 (Actual)
- `src/components/MetricChart.tsx:103-109`: `XAxis dataKey="capturedAt"` がカテゴリ軸（`type="number"`
  ＋時間スケール未使用）＋ `tickFormatter` 無し → 等間隔配置で x ずれ＋ISO 生（ミリ秒）表示。
- `src/features/collection/runner.ts:57`: `capturedAt: now().toISOString()` を **行ごと**に生成
  → 同一 run でもサービス間でタイムスタンプ相違。
- `src/components/MetricChart.tsx:62-76` `mergeSeries`: capturedAt 完全一致でのみマージ
  → 2 サービスの点が別行化 → 各 series に null 交互混入。
- `src/components/MetricChart.tsx:151-161` `<Line>`: `connectNulls` 未指定（既定 false）→ 線が途切れる。
- = SPEC が要求する multi-series 重ね描きが、実装の (a) per-row timestamp (b) 完全一致マージ
  (c) カテゴリ軸 (d) connectNulls 既定 の組合せで成立していない。**実装 ≠ SPEC**。

### 1.4 照合結果
期待（multi-series 重ね描き・時刻整列・可読軸）= SPEC 記載 ≠ 現実（途切れ・x ずれ・ミリ秒）。
→ 実装バグ。三項のうち「期待 = SPEC、現実が乖離」の典型でバグ判定。

## 2. 判定根拠

1. 期待挙動（複数 service の 1 チャート重ね描き）は biz-charts REVISE_SPEC §2 に明記された確定仕様
   であり、SPEC 不在でも SPEC 外でもない → feature / revise ではない。
2. 現実は SPEC が要求する描画を満たさず、原因は実装上の 4 点（per-row timestamp / 完全一致マージ /
   カテゴリ軸 / connectNulls 既定）に特定済み → 実装バグ = fix。
3. 3 症状（①線途切れ ②x ずれ ③ミリ秒表示）は独立に見えるが、すべて「時系列 x 軸とデータ整列の
   実装欠陥」という単一の根本領域に収束し、1 fix で統合対応可能。
4. データ（snapshot）は正常で、表示層のみの不具合 → データ破損・移行を伴わない fix。

## 3. 推奨分岐先

- **コマンド**: `/flow:fix`
- **引数**: `dashboard C20260601-002 --severity=high --from-claim=C20260601-002`
- **想定修正範囲（fix 側で確定）**:
  1. `runner.ts`: 1 collection run 内の全 SnapshotRow に**単一の capturedAt**（run の `startedAt` 等）を
     使う、または分/時間バケットに丸める → 同一 run の点が同 x に整列。
  2. `MetricChart.tsx` XAxis: 時間軸化（`type="number"` + epoch 値 + `scale="time"` 相当 + domain）or
     最低限 `tickFormatter` で**分単位整形**（ミリ秒除去）。実時間間隔の比例配置で x ずれ解消。
  3. `mergeSeries`: timestamp 正規化（丸め）後にマージ、または時刻キーの量子化で series 整列。
  4. `<Line connectNulls>` の要否を整列修正後に再評価（整列できれば null 交互は解消、疎データ対策で
     connectNulls 検討）。
  5. 共通コンポーネントのため **service-detail 側の単一 series 表示の後方互換**を必ず確認（リグレッション）。
- **優先度**: high（中核 UC が 2 サービス以上で機能不全）。

## 4. 却下時の対応
（該当なし）

## 5. 判定保留時の論点
（該当なし）

## 6. 関連
- クレーム原文: `./000_CLAIM_REPORT.md`
- 基準 SPEC: `../revise_timeseries-topchart_20260528/001_REVISE_SPEC.md §16/30/31/44`
- 発生源: `src/components/MetricChart.tsx:62-76,103-109,151-161`, `src/features/collection/runner.ts:57`
- 分岐先サブフォルダ: `../fix_C20260601-002_20260601_chart-multiseries-render/`
