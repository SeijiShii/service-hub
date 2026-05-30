# E2E テストレポート: dashboard (biz-charts — 上部チャートのビジネス指標化)

- **状態**: E2E green
- **FW**: Playwright (chromium headless、route-mock fixture、Class A no-key)
- **実行コマンド**: `npx playwright test`（webServer: `VITE_CLERK_PUBLISHABLE_KEY= npm run build && npm run preview --port 4173`）
- **対象 URL**: ローカル preview (http://localhost:4173)
- **last_updated**: 2026-05-31T06:20:00+09:00
- **dispatch 元**: /flow:auto P4.5 E2E gate (D20260531_001 反復1、前 loop D20260530_011 反復3 の継続)

## サマリ

全 9 spec green。biz-charts の機能アサーション (上部チャート 4 ビジネス指標化 + 旧チャート不在) を `dashboard.spec.ts` UC1-S1 に追加し、視覚 baseline `dashboard-happy.png` をビジネス4枚構成へ再生成 (ユーザー承認、Class C snapshot 判断)。

## journey 別結果 (004 由来)

| journey (004 由来) | spec | 結果 | 備考 |
|---|---|---|---|
| BC-E2E-01 上部 chart 4 枚 + 日本語見出し + 旧 chart 不在 | dashboard.spec.ts UC1-S1 | pass | `dashboard-charts` に「ユーザー数/課金額/コスト/採算」、`chart-profit` visible、`chart-up`/`chart-db_storage_bytes` count=0 |
| BC-E2E-02 採算(profit) chart に revenue−cost 折れ線 | dashboard.spec.ts UC1-S1 (fixture profit 派生) | pass | fixture で profit=revenue−cost 派生済み (32/40) を `chart-profit` で描画 |
| BC-E2E-03 revenue 未申告のみ → 課金/コスト/採算「データなし」 | UC1-S2 EmptyState | pass | 空 series fallback「データなし」機能 |
| BC-E2E-R1 一覧 status 列不変 (up を chart から外しても StatusDot 不変) | UC1-S1 / S5 | pass | status 列・down 前景化・AlertBanner 不変 |
| BC-E2E-R2 last-deploy-col 含む既存列不変 | UC1-S1 | pass | `[data-deploy-at]` 既存アサーション継続 green |
| BC-E2E-R3 空データ fallback「データなし」4 枚 | UC1-S2 | pass | |
| BC-E2E-R4 service-detail chart 従来通り (MetricChart label 未指定 fallback) | service-detail.spec.ts UC2-S1 | pass | label 未指定で `metricKey (unit)` 見出し fallback、崩れない |

## test 側 reconcile (Step 4、実装バグではない既存 drift)

- **dashboard-happy.png baseline 再生成** (ユーザー承認): biz-charts のチャート構成変更 (up/mau/db_storage → mau/revenue/cost/profit + 日本語ラベル) を反映。本改修の意図通りの視覚変更。
- **detail-happy.png baseline 再生成** (pre-existing drift reconcile): 当該 baseline は d5d1fa8 (2026-05-27) が最終で、その後 **shipped 済の MetricChart 改善** (ed65319 ResponsiveContainer 幅100% / cab1b76 dark tooltip / 802899b NaN ガード、いずれも timeseries-topchart=8th deploy で本番反映済) を未反映だった。full suite 実行で表面化。axis/line 位置のズレのみで service-detail 機能 (data-points=3) は green、本 biz-charts 起因ではない既存 stale を flow:e2e Step 4 として reconcile。

## flaky / quarantine

なし。

## 検出した実装バグ (fix seed)

なし。

## metrics

metrics: { wall_clock_min: 14, active_minutes: 14, e2e_specs: 9, pass: 9, fail: 0, flaky: 0, snapshots_regenerated: 2 }
