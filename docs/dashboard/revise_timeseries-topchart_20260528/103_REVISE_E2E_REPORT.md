# E2E テストレポート: dashboard (timeseries-topchart)

- **状態**: E2E green (004 は後続 revise に superseded、現状を現行 spec で検証)
- **FW**: Playwright (chromium headless、route-mock、Class A)
- **実行コマンド**: `npx playwright test`
- **last_updated**: 2026-05-31 (flow:auto loop D20260531_001 反復8、E2E gate 取り崩し)

## サマリ
本 004 (上部 chart = up/mau/db_storage_bytes/last_deploy_at の 4 枚 時系列) は **後続 revise に superseded**:
- last-deploy-col (2026-05-30) で last_deploy_at を chart から除外 → 一覧「最終デプロイ」列へ
- biz-charts (2026-05-31) で上部 chart を ビジネス 4 指標 (ユーザー数/課金額/コスト/採算) に置換
よって 004 の「up/mau/db_storage chart」期待は現行と矛盾 (stale)。**現行 dashboard の状態は dashboard.spec.ts で green に検証済**。本 103 は E2E gate を閉じるための reconcile レポート。

## journey 別結果
| 004 journey | 現行での扱い | spec | 結果 |
|---|---|---|---|
| TS-E2E-01 上部 4 chart (up/mau/db/last_deploy) | superseded (biz-charts/last-deploy-col) | dashboard.spec.ts UC1-S1 (現行 = biz 4 chart) | pass (現状) |
| TS-RG-02 admin link 維持 | 有効 | dashboard.spec.ts DA-NAV | pass |
| 下部 ServiceRow テーブル維持 | 有効 | dashboard.spec.ts UC1-S1 | pass |

## flaky / fix seed
なし。

## 備考
004 の chart 構成期待は last-deploy-col + biz-charts の 004/103 が現契約 SoT。本 target の E2E gate は現行 dashboard.spec.ts green で充足。
