# E2E テストレポート: dashboard last-deploy-col

- **状態**: E2E green
- **FW**: Playwright 1.60 (chromium、headless)
- **実行コマンド**: `npx playwright test e2e/dashboard.spec.ts`
- **対象 URL**: ローカル `vite build → vite preview` (http://localhost:4173)、route-mock fixture (実キー不要、Class A no-key)
- **last_updated**: 2026-05-30T13:05:00+09:00

## journey 別結果
| journey (004 由来) | spec | 結果 | 備考 |
|---|---|---|---|
| UC1-S1 全サービス横断サマリ + 最終デプロイ列 | e2e/dashboard.spec.ts:4 | ✅ pass | 新規: 「最終デプロイ」列見出し + hana-memo=`2026-05-28 09:00` (JST) + sanpo-log=`—` を assert |
| UC1-S2 データなし → EmptyState | e2e/dashboard.spec.ts:34 | ✅ pass | fixture charts 補完で crash 解消 |
| UC1-S5 直近 run failed → AlertBanner | e2e/dashboard.spec.ts:42 | ✅ pass | 同上 |
| UC1-S4 行クリックで詳細遷移 | e2e/dashboard.spec.ts:50 | ✅ pass | リグレッション |
| ビジュアル回帰 dashboard-happy.png | UC1-S1 内 | ✅ pass | baseline 再生成 (ユーザー承認、3 chart + 最終デプロイ列) |

## flaky / quarantine
なし。

## 検出した実装バグ (fix seed)
**実装バグなし。ただし pre-existing なテスト側 drift を修正:**

- **dashboard E2E が timeseries-topchart (2026-05-28) 以降 stale/red だった** (本 P4.5 E2E gate で surface)。原因: `e2e/fixtures.ts` の `dashboardVM`/`emptyVM` が、timeseries-topchart で **required 化された `charts` フィールドを欠落**したまま放置され、`DashboardView` が `vm.charts.map` で crash → `/` ルートが全 fixture で描画不能。pre-session commit 802899b でも UC1-S2 が fail することを確認済 (= 本改修起因ではない既存 drift)。
  - **修正 (test 側、flow:e2e Step 4)**: `fixtureCharts` (3 件、last-deploy-col 反映) を追加し `dashboardVM.charts` / `emptyVM.charts: []` を補完。`dashboardVM` の hana-memo 行に `last_deploy_at` を追加し新カラムを実 render で検証。
  - ビジュアル baseline (5/27、timeseries-topchart 前) も stale だったため再生成 (ユーザー承認)。
  - これにより dashboard E2E の「green」ステータスが実態と一致 (drift reconcile)。

## metrics
```yaml
metrics:
  command: /flow:e2e
  target: dashboard (last-deploy-col)
  framework: playwright
  e2e_specs: 4
  pass: 4
  fail: 0
  flaky: 0
  fixed_preexisting_drift: 1  # fixtures charts 欠落 (timeseries-topchart 以降)
  snapshot_regenerated: 1     # dashboard-happy.png (ユーザー承認)
```
