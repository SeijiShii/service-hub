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
| [revise_biz-charts_20260530_revenue-cost-profit/](./revise_biz-charts_20260530_revenue-cost-profit/) | revise | biz-charts | **実装完了 (2026-05-30、unit 63 / 全 307 green、E2E 待ち)** + spec-review (905) | 上部 chart を**ビジネス指標化**: `up`(死活、status 列が担う)/`db_storage_bytes` を外し **ユーザー数(mau)/課金額(revenue)/コスト(ai_cost)/採算(profit 派生)** の4枚に。採算は revenue−cost の派生系列を buildCharts で合成、見出しを日本語ラベル化。MetricChart に label prop (optional、service-detail 互換)。spec-review: profitAt 共通化で採算=一覧採算列一致 (R1)、P87 学習 | [INDEX](./revise_biz-charts_20260530_revenue-cost-profit/INDEX.md) |
| [claim_C20260601-002_20260601_chart-multiseries-render/](./claim_C20260601-002_20260601_chart-multiseries-render/) | claim | C20260601-002 | 判定完了 → fix 分岐 | チャート 3 症状(2値で線途切れ/同時刻 x ずれ/ミリ秒表示) → 判定=バグ(fix)/high。根本=時系列 x 軸とデータ整列の実装欠陥 | — |
| [fix_C20260601-002_20260601_chart-multiseries-render/](./fix_C20260601-002_20260601_chart-multiseries-render/) | fix | C20260601-002 | 調査待ち (severity=high) | multi-series 重ね描き修正: runner 単一 capturedAt / MetricChart 時間軸化+分整形 / mergeSeries 量子化整列 / connectNulls 再評価 / service-detail 後方互換 | — |
| [claim_C20260607-001_20260607_tip-metrics-display/](./claim_C20260607-001_20260607_tip-metrics-display/) | claim | C20260607-001 | 判定完了 → revise 分岐 | 投げ銭(tip_count/tip_total_yen)が dashboard に出ない。三項照合=収集/VM は汎用で保持済・表示層 ServiceRow が選択描画で tip 列なし → 判定=仕様検討漏れ(revise)/medium。表示追加のみで完結 (収集/保存変更不要、PII なし O48) | — |
| [revise_C20260607-001_20260607_tip-metrics-display/](./revise_C20260607-001_20260607_tip-metrics-display/) | revise | C20260607-001 | **実装完了 (2026-06-07、unit 323 green)** | dashboard 各サービス行に収益(件)/収益(¥)列を additive 追加。契約 canonical を汎用 revenue_count/revenue_total_yen に統一、旧 tip_* は adapter で後方互換正規化。互換維持・マイグレーション不要。E2E は /flow:e2e 待ち。producer 移行は任意(cross-repo follow-up)。起点=claim C20260607-001 | [INDEX](./revise_C20260607-001_20260607_tip-metrics-display/INDEX.md) |
| [revise_chart-ux_20260608_axis-period-usd-cleanup/](./revise_chart-ux_20260608_axis-period-usd-cleanup/) | revise | chart-ux | **実装完了 (2026-06-08、unit 331 green / E2E 待ち)** | 上部 chart 3 改善: (1) 縦並び複数 chart の **X 時間軸を共有 domain で統一**、(2) **期間セレクタ**(全期間/30日/7日、既定30日、`?period` で since 切替)、(3) データ未取得の **usd 系 3 chart (課金額/コスト/採算) を削除** → ユーザー数(mau)+収益(¥) の2枚に集約。DB/公開API/metric保存は不変・migration 不要・互換維持。一覧採算列は据置 ([論点-001]) | [INDEX](./revise_chart-ux_20260608_axis-period-usd-cleanup/INDEX.md) |

## 関連
- 親 concept: `../concept.md` §1.3.1 dashboard 行
- **依存**: _shared/db, _shared/auth, registry
- 実装コード: `src/`（§1.4 参照）

## 機能性質タグ
- feature, auth-required (UI、コックピット/dark)

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
