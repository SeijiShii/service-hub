# 改修: dashboard 画面上部に時系列グラフ追加 (timeseries-topchart)

- **issue / slug**: timeseries-topchart
- **実施日**: 2026-05-28
- **対象機能**: ../README.md (dashboard)
- **基準 SPEC**: ../001_dashboard_SPEC.md
- **改修要望**: dashboard 画面に**二部構成**を導入する。
  - **上部**: 各 service の主要 metric の時系列グラフ (recharts、過去 30 日 / 任意期間)。1 次元 (最新値のみ) から 2 次元 (時系列) へ拡張。
  - **下部**: 現状と同じ最新値の一覧テーブル (既存 ServiceRow テーブル、変更なし維持)。
  ユーザー指摘「現状ではサービスごとのメトリクスを 1 次元で取得しているが、グラフ描画するような 2 次元データにすることは可能か」+ 「画面上部にグラフ表示 / 下部に現状と同じ最新値の一覧」より。
- **既存資産**: `usage_snapshots` 時系列保存済 + `serviceSnapshots/timeseries` クエリ関数 + `MetricChart.tsx` (recharts、service-detail で既存実装) + recharts 3.8.1 導入済 → **新基盤実装ほぼ不要、既存資産を dashboard に持ち込む**。
- **状態**: 設計中

## このフォルダに置くドキュメント

- `001_REVISE_SPEC.md` — 変更仕様書 (二部構成 + 主要 metric 選定 + 時間レンジ)
- `002_REVISE_PLAN.md` — 変更計画書 (DashboardView レイアウト + summary.ts 時系列追加 + 新規 chart component)
- `003_REVISE_UNIT_TEST.md` — 単体テスト計画
- `004_REVISE_E2E_TEST.md` — E2E テスト計画 (二部構成表示 / 時間レンジ切替)
- (任意) `005_REVISE_MIGRATION.md` — 不要見込 (DB schema 変更なし、既存 usage_snapshots 流用)
- `101_REVISE_IMPL_REPORT.md` — 実装レポート (後続 `/flow:tdd`)

## 関連

- 過去の改修: `../revise_admin-ux_20260528_*/` (admin 導線) / `../revise_nav-and-pull_20260528_*/` (back-link + force-pull relocation)
- 既存実装参考: `src/features/service-detail/MetricChart.tsx` (recharts、本回 dashboard 用にも再利用検討)
- 既存資産: `usage_snapshots` テーブル + `src/db/queries.ts::timeseries/serviceSnapshots`
- 高度モデルレビュー: `/flow:spec-review` 推奨 (UI レイアウト改修 + データパイプライン拡張)
