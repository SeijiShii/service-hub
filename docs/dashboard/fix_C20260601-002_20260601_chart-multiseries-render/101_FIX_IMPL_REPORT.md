# 実装レポート: dashboard multi-series 描画崩れ (C20260601-002)

## 実装日時
2026-06-01 12:15 (JST)

## モード
fix

## 関連ドキュメント
- [000_調査レポート.md] / [001_ROOT_CAUSE.md] / [002_FIX_PLAN.md] / [003_REGRESSION_TEST.md] / [004_POSTMORTEM.md]
- [AI_LOG セッション](../../AI_LOG/D20260601_005_tdd_dashboard_fix_C20260601-002.md)

## 注意事項
本レポートのファイルパス・行番号は実装日時時点のもの。

## 変更一覧 (単一 Phase: 根本原因 + 表示の両輪)

### 1. `src/features/collection/runner.ts` — 1 run = 単一 capturedAt 不変条件
- `runCollection` の SnapshotRow 生成で `capturedAt: now().toISOString()`（行ごと評価）→ **`capturedAt: startedAt`**（run 開始時に 1 度だけ確定した `startedAt` を全行で共有）。
- これにより本番（`api/cron/collect.ts` が `now` 未注入で行ごとに `new Date()` 評価）の per-row ミリ秒ドリフトが解消。`api/cron/collect.ts` 側の変更は不要（runner が `startedAt` 共有するため now 注入有無に非依存）。

### 2. `src/components/MetricChart.tsx` — chart の連続時間軸化 + 整列マージ
- `mergeSeries`: `capturedAt` 文字列完全一致マージ → **分バケットの epoch ms (`bucketEpoch`) をキーに集約**。同一 run でミリ秒だけずれた service 間の点が同一 x 行へ整列。merged row は `{ x: epochMs, [slug]: value }`。
- `XAxis`: `dataKey="capturedAt"`（カテゴリ軸）→ **`dataKey="x"` + `type="number"` + `scale="time"` + `domain={["dataMin","dataMax"]}` + `tickFormatter=formatXAxis`**（M/D HH:mm、ミリ秒・秒除去）。実時間間隔比例配置。
- `Tooltip labelFormatter`: x が全 metric 共通で epoch number になったため、`last_deploy_at` 特例分岐を削除し epoch → M/D HH:mm に一本化（`last_deploy_at` の **値** 整形は Y 軸 `tickFormatterForMetric` が引き続き担当、非衝突）。
- `<Line>`: **`connectNulls`** 付与 → 疎データ（片 series のみの時刻）でも線が途切れない。

## 実装計画からの差分

| 項目 | 内容 |
|------|------|
| 計画にない追加変更 | `ServiceDetailView.test.tsx` の fixture `capturedAt: "t1"/"t2"`（非 ISO）→ ISO 日付に更新。非 ISO 文字列は epoch 化で NaN→0 に collapse し data-points が落ちるため。実 `capturedAt` は常に `.toISOString()`（003 RG-04「data-points 期待値の更新が必要なら本 fix 範囲で更新」に合致、意図的変更） |
| 計画から省略した変更 | `api/cron/collect.ts` への `now` 注入（runner の startedAt 共有で不要化） |
| 想定外の問題と対処 | 非 ISO テスト fixture の collapse（上記で対処）。`mergeSeries` は分バケットを採用（refresh cadence 15min のため安全、別 run は別 x に保持） |

## PR Description

### タイトル
fix(dashboard): チャート multi-series 描画崩れ — 1 run 単一 capturedAt + chart 連続時間軸化 (C20260601-002)

### 概要
複数サービスの折れ線が途切れ・x ずれ・ミリ秒表示する不具合を修正。原因は「1 collection run のスナップショットは単一論理時刻を持つ」不変条件の未定義（runner が行ごとに `new Date()`）と、chart x 軸がカテゴリ軸だったこと。producer 側で capturedAt を run 開始時刻に統一し、consumer 側で x を連続時間軸（分バケット epoch）化して両輪で解消。

### 変更内容
- runner: SnapshotRow の capturedAt を run 共有の startedAt に
- MetricChart: mergeSeries を epoch 分バケット集約に / XAxis を time scale 化 / connectNulls / tooltip ラベル整形を epoch 一本化

### テスト
- 追加: FX-U-01（可変クロックでも 1 run 単一 capturedAt）/ FX-U-02・05（ミリ秒差 series が 1 行整列）/ FX-U-04（疎データ）/ FX-B-02・03（別 run 分離・単一 series 後方互換）
- 全テスト: 成功 313 / 失敗 0 / 合計 313 (100%)
