# 単体テストレポート: dashboard multi-series 描画崩れ (C20260601-002)

## 実施日時
2026-06-01 12:15 (JST)

## 関連ドキュメント
- [003_REGRESSION_TEST.md] - リグレッションテスト計画

## テスト実行環境
- ランタイム: Node (vitest 2.1.x, jsdom)
- テストフレームワーク: Vitest + @testing-library/react

## テスト結果

| # | テストケース | テストファイル | 結果 | 備考 |
|---|------------|-------------|------|------|
| FX-U-01 | 可変クロックでも 1 run 全 SnapshotRow が同一 capturedAt | runner.test.ts | ✅ | 修正前 RED (4 unique → 1) |
| FX-U-02 | ミリ秒差の同一論理時刻 2 series → 1 バケット集約 | MetricChart.test.tsx | ✅ | 修正前 RED (data-points 2→1) |
| FX-U-04 | 疎データ (片 series 欠落時刻) → 全時刻 x 行存在 | MetricChart.test.tsx | ✅ | connectNulls で線連続 |
| FX-U-05 | 2 service 同一時刻重ね描き → 1 行両 series 整列 | MetricChart.test.tsx | ✅ | 修正前 RED |
| FX-B-02 | 別 run (分単位離れ) → 別 x バケット保持 | MetricChart.test.tsx | ✅ | |
| FX-B-03 | 単一 service → 1 本描画 (後方互換) | MetricChart.test.tsx | ✅ | service-detail 経路 |

## 追加テストケース

| # | 対象 | テストケース | 追加理由 |
|---|------|------------|---------|
| (上表 FX-U/B 全 6 件) | runner / MetricChart | 003_REGRESSION_TEST の FX-U-01/02/04/05・FX-B-02/03 | 本番 per-row ドリフト + 整列マージ + 後方互換の検証 |

## 既存テスト維持確認 (RG)

| ID | 既存テスト | 結果 |
|---|---|---|
| RG-01 | runner.test.ts (ok/partial/failed, favicon meta) | ✅ 維持 |
| RG-02 | summary.test.ts (BC-U-* / capturedAt ずれ起点 BC-U-21) | ✅ 維持 |
| RG-03 | DashboardCharts.test.tsx (4 chart / 空 fallback) | ✅ 維持 |
| RG-04 | MetricChart.test.tsx (TS-U-20/23/37 等 data-points) | ✅ 維持 (TS-U-20 data-points=2 不変) |
| — | ServiceDetailView.test.tsx SD-N1 | ✅ fixture を ISO 化 (意図的、RG-04 範囲) |

## サマリー

| 項目 | 値 |
|------|-----|
| 計画テスト数 | 6件 (FX-U-01/02/04/05, FX-B-02/03) |
| 追加テスト数 | 0件 (計画通り) |
| 合計 | 6件 |
| 成功 | 313件 (全スイート) |
| 失敗 | 0件 |
| 成功率 | 100% |

> 既知 Low (本 fix 無関係・deploy 非ブロッカー): `queries.test.ts` tsc TS2578（unused @ts-expect-error）。SCENARIO §5 既知事項として継続。
