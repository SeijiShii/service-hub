# E2E テストレポート: dashboard chart-ux

- 状態: **E2E green**
- FW: Playwright (chromium)  実行コマンド: `npx playwright test`  対象 URL: ローカル preview (route-mock, http://localhost:4173)
- last_updated: 2026-06-08 (JST)

## journey 別結果
| journey (004 由来) | spec | 結果 | 備考 |
|---|---|---|---|
| E-01 chart 2 枚集約 (usd 系不在) | dashboard.spec.ts UC1-S1 | ✅ pass | chart-mau / chart-revenue_total_yen 表示、課金額/コスト/採算/up/db_storage は count 0 |
| E-02 共有時間軸 | dashboard.spec.ts UC1-S1 | ✅ pass | 2 chart の data-domain が一致 (非 null) |
| E-03/E-05 期間セレクタ (全期間/30日/7日) | dashboard.spec.ts CX-E2E-01 | ✅ pass | 既定 30d active、7d/all クリックで `?period=` 切替 + 再取得 (URL 検証) |
| 視覚回帰 (chart section 2 枚 + セレクタ) | dashboard.spec.ts UC1-S1 | ✅ pass | baseline dashboard-happy.png をユーザー承認のうえ再生成 |
| R-01 一覧テーブル (採算/収益列) | dashboard.spec.ts UC1-S1 | ✅ pass | 最終デプロイ列含め従来表示 (chart 削除の波及なし) |
| R-02 service-detail chart | service-detail.spec.ts UC2-S1/S3/S4 | ✅ pass | MetricChart domain 未指定パス、回帰なし |
| R-03 force-pull → 再取得 | dashboard.spec.ts DA-FP | ✅ pass | period 維持で再取得 |
| 既存 UC (empty/failed/nav/multi-series) | dashboard.spec.ts UC1-S2/S5/DA-NAV/FX-E2E-01 | ✅ pass | route glob を `summary*` に更新 (?period 対応) |

## flaky / quarantine
- なし。

## 検出した実装バグ (fix seed)
- なし。

## 主な spec 変更
- route glob `**/api/dashboard/summary` → `**/api/dashboard/summary*` (page が `?period=30d` を付与するため、全 7 箇所)。
- fixtures.ts `fixtureCharts` を 2 件 (mau/revenue_total_yen) に更新 (usd 系 3 chart 削除)。
- UC1-S1 の chart assertion を新 UI に更新 + 共有 data-domain 検証追加。
- CX-E2E-01 (期間セレクタ) を新規追加。
- visual baseline dashboard-happy-chromium-linux.png 再生成 (ユーザー承認 2026-06-08)。

## metrics
metrics: { e2e_specs: 16, pass: 16, fail: 0, flaky: 0, suite: "full chromium" }
