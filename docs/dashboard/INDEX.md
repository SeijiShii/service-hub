# dashboard ドキュメントインデックス

**最終更新**: 2026-05-26 07:58
**生成元**: /flow:concept → /flow:feature
**状態**: 実装+E2E GREEN + 視覚レビュー green

<!-- auto-generated-start -->

## 機能概要 (短縮、詳細は README.md)
全サービス横断サマリ一覧画面 (/ ダッシュボード)

## ファイル一覧（番号順）
| 番号 | ファイル | 種別 | 状態 | 最終更新 | 短い説明 |
|---|---|---|---|---|---|
| 001 | [001_dashboard_SPEC.md](./001_dashboard_SPEC.md) | SPEC | 確定 | 2026-05-26 | 横断サマリ一覧画面(/) |
| 002 | [002_dashboard_PLAN.md](./002_dashboard_PLAN.md) | PLAN | 確定 | 2026-05-26 | UI+データ取得+共通components |
| 003 | [003_dashboard_UNIT_TEST.md](./003_dashboard_UNIT_TEST.md) | UNIT_TEST | 確定 | 2026-05-26 | summary/行/empty/failed |
| 004 | [004_dashboard_E2E_TEST.md](./004_dashboard_E2E_TEST.md) | E2E_TEST | 確定 | 2026-05-26 | Playwright + 視覚L1/L2 |
| 101 | [101_dashboard_IMPL_REPORT.md](./101_dashboard_IMPL_REPORT.md) | IMPL_REPORT | 完了 | 2026-05-26 | summary+UI コンポーネント |
| 102 | [102_dashboard_UNIT_TEST_REPORT.md](./102_dashboard_UNIT_TEST_REPORT.md) | UNIT_TEST_REPORT | 完了 | 2026-05-26 | 9 passed |

## サブフォルダ（改修・バグ修正・クレーム判定履歴）
| パス | 種別 | issue/slug | 状態 | 概要 | INDEX |
|---|---|---|---|---|---|
| [revise_admin-ux_20260528_link-and-styling/](./revise_admin-ux_20260528_link-and-styling/) | revise | admin-ux | 実装完了 (unit 179 passed) | ダッシュボードヘッダに /admin リンク追加（O55 orphan 解消）+ admin フォームに styling 適用（縦並び・ラベル上・セクション分け） | [INDEX](./revise_admin-ux_20260528_link-and-styling/INDEX.md) |
| [revise_nav-and-pull_20260528_back-link-and-relocation/](./revise_nav-and-pull_20260528_back-link-and-relocation/) | revise | nav-and-pull | 実装完了 (unit 196 passed) | (1) /admin に「← ダッシュボード」back-link 追加（O55 逆方向）+ (2) 「今すぐ pull」を /admin から **dashboard top に relocation**（鮮度確認→即pull の動線） | [INDEX](./revise_nav-and-pull_20260528_back-link-and-relocation/INDEX.md) |
| [revise_timeseries-topchart_20260528/](./revise_timeseries-topchart_20260528/) | revise | timeseries-topchart | 実装完了 (2026-05-28、Phase 1-4 unit 287 green、8th deploy 待ち) | 画面**上部に時系列グラフ section** (主要 4 metric: up/mau/db_storage_bytes/last_deploy_at、過去 30 日、全 service 重ね描き) + **下部に既存テーブル**維持。`MetricChart` を `src/components/` に共通化、新クエリ `recentSnapshots`、`/api/dashboard/summary` に `charts` additive 追加 (shipyard 公開 API 不変) | [INDEX](./revise_timeseries-topchart_20260528/INDEX.md) |
| [revise_last-deploy-col_20260530_chart-to-column/](./revise_last-deploy-col_20260530_chart-to-column/) | revise | last-deploy-col | **実装完了 + 9th deploy 済 (2026-05-30、unit 全 297 / dashboard E2E 4/4、本番反映)** + spec-review (905) | `last_deploy_at` を上部 chart から除外し下部一覧に**「最終デプロイ」日時カラム**を additive 追加。spec-review: 列データソース別系統 (R2)/api 漏れ補完 (R3)/formatJst 再利用 (R4)/service-detail chart 維持 (R1)。E2E で既存 fixtures charts 欠落 drift も reconcile | [INDEX](./revise_last-deploy-col_20260530_chart-to-column/INDEX.md) |
| [revise_biz-charts_20260530_revenue-cost-profit/](./revise_biz-charts_20260530_revenue-cost-profit/) | revise | biz-charts | 設計完了 + spec-review 通過 (905、2026-05-30、tdd 待ち) | 上部 chart を**ビジネス指標化**: `up`(死活、status 列が担う)/`db_storage_bytes` を外し **ユーザー数(mau)/課金額(revenue)/コスト(ai_cost)/採算(profit 派生)** の4枚に。採算は revenue−cost の派生系列を buildCharts で合成、見出しを日本語ラベル化。MetricChart に label prop (optional、service-detail 互換)。spec-review: profitAt 共通化で採算=一覧採算列一致 (R1)、P87 学習 | [INDEX](./revise_biz-charts_20260530_revenue-cost-profit/INDEX.md) |

## 関連
- 親 concept: `../concept.md` §1.3.1 dashboard 行
- **依存**: _shared/db, _shared/auth, registry
- 実装コード: `src/`（§1.4 参照）

## 機能性質タグ
- feature, auth-required (UI、コックピット/dark)

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
