# 実装レポート: dashboard last-deploy-col (chart-to-column)

## 実装日時
2026-05-30 12:55 (JST)

## モード
revise

## 関連ドキュメント
- [001_REVISE_SPEC.md](./001_REVISE_SPEC.md) — 変更仕様書
- [002_REVISE_PLAN.md](./002_REVISE_PLAN.md) — 変更計画書
- [003_REVISE_UNIT_TEST.md](./003_REVISE_UNIT_TEST.md) — 単体テスト計画
- [905_REVISE_SPEC_REVIEW.md](./905_REVISE_SPEC_REVIEW.md) — 設計レビュー (R1-R6)
- [AI_LOG セッション](../../AI_LOG/D20260530_004_tdd_dashboard_revise_last-deploy-col.md)

## 注意事項
本レポートのファイルパス・行番号は実装日時時点のもの。

## 変更一覧

### Phase 1: chart から last_deploy_at 除外
- `src/features/dashboard/summary.ts`: `DASHBOARD_CHART_METRICS` を 4→3 (`up`/`mau`/`db_storage_bytes`) に縮小、JSDoc 整合 (4→3、移設理由追記)。
- `src/features/dashboard/DashboardCharts.tsx`: JSDoc「主要 4 metric」→「3 metric」+ last_deploy_at 移設注記。
- `api/dashboard/summary.ts`: コメント「主要 4 metric」→「3 metric」(コード L35 `recentSnapshots(..., [...DASHBOARD_CHART_METRICS])` は定数 spread で自動 3 metric query 化、機能変更なし)。
- テスト修正: `DashboardCharts.test`(TS-U-30/32 を 3 chart 化 + last_deploy_at chart 不在 assert)、`summary.test`(全 `toHaveLength(4)`→3、TS-U-12 順序配列から last_deploy_at 除外 + not.toContain)、`DashboardView.test`(charts helper 4→3、TS-U-40/41 コメント)。
- commit: `77105ae`

### Phase 2: 一覧に最終デプロイ日時カラム追加
- `src/features/dashboard/deployAtFormat.ts` (新規): `formatDeployAt(epochMs)` — 有効値→JST `YYYY-MM-DD HH:MM`、未収集/NaN/Infinity/0/負値→`—`。JST 整形は `formatJst` 再利用 (spec-review R4)。決定的 (now 非依存)。
- `src/features/dashboard/lastUpdatedFormat.ts`: `formatJst` を `export` 化 (1 語、既存挙動不変、R4)。
- `src/features/dashboard/DashboardView.tsx`: thead 末尾に `<th>最終デプロイ</th>` 追加 (additive、既存列順不変)。
- `src/features/dashboard/ServiceRow.tsx`: 末尾に `<td data-deploy-at>` 追加、`formatDeployAt(row.metrics.last_deploy_at?.value)`。データは `latestPerService` 由来で chart 除外と独立 (spec-review R2)。
- テスト追加: `deployAtFormat.test`(5)、`ServiceRow.test`(新規、4: 表示/未収集→—/0→—/既存セル regression)、`DashboardView.test`(LDC-U-03 thead 列見出し)。
- commit: `a264d66`

## 実装計画からの差分

| 項目 | 内容 |
|------|------|
| 計画にない追加変更 | なし (spec-review R1-R5 反映済みの計画通り) |
| 計画から省略した変更 | なし。`METRIC_UNIT_FALLBACK.last_deploy_at` は残置 (buildCharts が非対象 metric を無視するため無害、PLAN §1 で残置可と明記済) |
| 想定外の問題と対処 | **既存の typecheck エラー検出 (本改修と無関係)**: `src/db/queries.test.ts(223,7) TS2578 Unused '@ts-expect-error' directive`。pre-session commit `802899b` 時点で既に存在することを worktree/checkout 検証で確認。last-deploy-col の変更 (MetricKey 型・queries 非変更) とは無関係なため本改修では修正せず、別途対応として surface。本改修による新規 tsc エラーは 0 件 |

## PR Description

### タイトル
dashboard: last_deploy_at を chart から外し一覧に「最終デプロイ」日時カラム追加

### 概要
デプロイ時刻 (last_deploy_at) は単一スナップショット値で時系列折れ線に不向きなため、dashboard 上部 chart (4→3 枚) から除外し、下部一覧テーブルに「最終デプロイ」日時カラムとして移設する。timeseries-topchart の一部差し戻し。表示層のみで DB・収集パイプライン・shipyard 公開 API は不変。

### 変更内容
- `DASHBOARD_CHART_METRICS` 4→3 (last_deploy_at 除外)
- 新規 `deployAtFormat`(epoch_ms→JST、未収集/0→`—`、formatJst 再利用)
- DashboardView/ServiceRow に「最終デプロイ」列を additive 追加 (データは latestPerService 由来、chart と独立)

### テスト
- 全テスト: 297/297 パス (100%)
- dashboard 機能: 52 パス (新規 deployAtFormat 5 + ServiceRow 4 + DashboardView LDC-U-03 1 含む)
- 新規 tsc エラー 0 (queries.test.ts の TS2578 は本改修前から存在する既存問題)
