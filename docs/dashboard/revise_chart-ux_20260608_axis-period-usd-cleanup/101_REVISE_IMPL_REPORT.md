# 実装レポート: dashboard chart-ux (時間軸統一 + 期間選択 + usd 系 chart 削除)

## 実装日時
2026-06-08 (JST)

## モード
revise

## 関連ドキュメント
- [001_REVISE_SPEC.md](./001_REVISE_SPEC.md) — 変更仕様書
- [002_REVISE_PLAN.md](./002_REVISE_PLAN.md) — 変更計画書
- [003_REVISE_UNIT_TEST.md](./003_REVISE_UNIT_TEST.md) — 単体テスト計画
- [AI_LOG セッション](../../AI_LOG/D20260608_003_tdd_dashboard_chart-ux.md) — 設計判断ログ

## 注意事項
本レポートのファイルパスと行番号は実装日時時点のものです。

## 変更一覧

### Phase 1: chart 集約 (usd 系 3 chart 削除)
- `src/features/dashboard/summary.ts`
  - `DASHBOARD_CHART_SOURCE_METRICS` を `["mau", "revenue_total_yen"]` に削減 (usd 系 2 metric を取得対象から除外、収集自体は継続)。
  - `DASHBOARD_CHARTS` を 2 件 (ユーザー数/mau, 収益/revenue_total_yen) に削減。
  - `buildCharts` の profit 派生分岐を削除 → 全 chart 共通の series 構築に一本化。
  - `profitAt` の import を除去 (一覧採算列の `computeProfitability` は `profitability.ts` 内で引き続き使用)。
  - VM `charts` の doc コメントを「常に 2 件」に更新。
- `src/features/dashboard/summary.test.ts`
  - BC-U-01 を「charts=2件 [mau, revenue_total_yen]」に書き換え + usd 系/profit chart の不在 assert。
  - BC-U-02 を「SOURCE_METRICS=[mau, revenue_total_yen]」検証に置換。
  - profit 派生テスト (旧 BC-U-02/03/10/20/21/30) を廃止 (profitAt SoT は profitability.test.ts に残る)。
  - chart 件数 5→2 の修正 (BC-U-11/51/61, TS-M-03)。

### Phase 2: 共有時間軸
- `src/components/MetricChart.tsx`
  - `MetricChartProps` に optional `domain?: [number, number]` 追加。XAxis を `domain={domain ?? ["dataMin","dataMax"]}` に。
  - `bucketEpoch` を export (上位の共有 domain 算出と x 正規化を一致させるため)。
  - figure に `data-domain` 属性 (testability)。
- `src/features/dashboard/DashboardCharts.tsx`
  - `sharedXDomain(charts)`: 全 chart の全 series points を bucketEpoch で min/max 集約し共有 domain を返す (点ゼロは undefined)。
  - 各 MetricChart に `domain` を配布 → 縦並び chart の X 軸が一致。
- `src/components/MetricChart.test.tsx`: CX-U-01/02 (domain prop 反映 / 未指定 fallback)。

### Phase 3: 期間セレクタ + API period
- `src/features/dashboard/chartPeriod.ts` (新規): `ChartPeriod` 型, `CHART_PERIODS`, `DEFAULT_PERIOD="30d"`, `parsePeriod`(allowlist 正規化), `periodToSinceIso`(all=epoch0 / 7d / 30d)。
- `src/features/dashboard/DashboardCharts.tsx`: header を「収益・利用の推移」+ 期間セレクタ (全期間/30日/7日) に変更。`period`/`onPeriodChange` props (onPeriodChange 指定時のみセレクタ表示、aria-pressed で選択状態)。
- `src/features/dashboard/DashboardView.tsx`: `chartPeriod`/`onChartPeriodChange` を中継。
- `src/features/dashboard/DashboardPage.tsx`: `chartPeriod` state (既定 30d) を `/api/dashboard/summary?period=${chartPeriod}` に載せ、useFetch の url 変化で自動 refetch。
- `api/dashboard/summary.ts`: `req.query.period` を parsePeriod → periodToSinceIso で since 算出 (既定/不正=30d)。
- テスト: `chartPeriod.test.ts` (parsePeriod/periodToSinceIso/CHART_PERIODS), `DashboardCharts.test.tsx` の CX-U-20/21 (セレクタ render + click→onPeriodChange)。

## 実装計画からの差分

| 項目 | 内容 |
|------|------|
| 計画にない追加変更 | なし |
| 計画から省略した変更 | API handler の period→recentSnapshots spy テスト (計画 U-A-08/U-E-02)。period 算出は純関数 `chartPeriod.ts` に切り出して全分岐を直接 unit テスト (CX-U-40〜44) でカバーし、api は薄い委譲。DB mock を要する handler テストは費用対効果から省略 (既存 auth 結合テストは `query:{}`→既定30d で引き続き green)。 |
| 想定外の問題と対処 | なし。pre-existing tsc TS2578 (queries.test.ts:249) は本改修と無関係 (別コミット由来、surface のみ)。 |

## PR Description

### タイトル
dashboard chart-ux: 上部 chart の時間軸統一 + 期間選択(全期間/30日/7日) + usd系chart削除

### 概要
上部時系列 chart の見やすさを 3 点改善。縦並び chart の X 時間軸を共有 domain で揃え、期間セレクタ(全期間/30日/7日)を追加し、データ未取得で収益と同義の usd 系 3 chart(課金額/コスト/採算)を削除して ユーザー数 + 収益(¥) の 2 枚に集約した。

### 変更内容
- 時間軸統一: `sharedXDomain` で全 chart 共通の `[min,max]` を算出し MetricChart の新 `domain` prop で配布
- 期間選択: `?period=all|30d|7d`(既定30d) で since 切替、useFetch の url 変化で自動 refetch
- usd 系 chart 削除: DASHBOARD_CHARTS/SOURCE_METRICS を 2 件に削減、profit 派生分岐を除去
- DB スキーマ/公開 API/metric 保存は不変・互換維持・migration 不要

### テスト
- 単体: 全 331 件 green (chart-ux 追加分含む)。tsc 新規エラー 0。
- 採算ロジック (profitAt) の SoT は一覧採算列用に profitability.test.ts に残置。
