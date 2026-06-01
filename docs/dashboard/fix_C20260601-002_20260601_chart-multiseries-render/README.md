# fix: dashboard 直近30日チャートの multi-series 描画バグ (3症状)

- **id**: C20260601-002
- **severity**: high
- **実施日**: 2026-06-01
- **対象機能**: dashboard（共通 `src/components/MetricChart.tsx` + `src/features/collection/runner.ts` 横断）
- **起点クレーム**: `../claim_C20260601-002_20260601_chart-multiseries-render/001_TRIAGE.md`
  （判定: バグ fix、期待=SPEC(timeseries-topchart §16/30/31 重ね描き) ≠ 現実）
- **状態**: 調査待ち（/flow:fix で 000_調査〜003_REGRESSION を生成）

## 症状（3点、単一根本領域＝時系列 x 軸とデータ整列）
1. 2 サービス（2 値）で線が途切れる。
2. 同一時刻が x 軸でずれる。
3. x 軸ラベルがミリ秒 ISO で見づらい（分単位希望）。

## 想定修正範囲（fix で確定）
- `runner.ts:57`: 1 collection run 内の全 SnapshotRow に単一 capturedAt（run の startedAt 等）or 分バケット丸め。
- `MetricChart.tsx` XAxis: 時間軸化（type="number"+scale 相当）or 最低限 tickFormatter で分単位整形（ミリ秒除去）。
- `mergeSeries`: timestamp 正規化（丸め）後マージで series 整列。
- `<Line connectNulls>`: 整列修正後に要否再評価。
- service-detail 単一 series 表示の後方互換（リグレッション）。

## 関連
- 起点クレーム: `../claim_C20260601-002_20260601_chart-multiseries-render/`
- 基準 SPEC: `../revise_timeseries-topchart_20260528/001_REVISE_SPEC.md`
- 発生源: `src/components/MetricChart.tsx`, `src/features/collection/runner.ts:57`
