# dashboard 単体テスト計画（last_deploy_at をチャートから外し一覧に日時カラム追加）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, Step 2 で読んだ既存テスト
> **最終更新**: 2026-05-30

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| LDC-U-01 | `deployAtFormat` | `1716960600000`（=2024-05-29 12:30 UTC 付近の epoch_ms、JST 換算） | `YYYY-MM-DD HH:MM`（JST, UTC+9）形式の文字列 |
| LDC-U-02 | `ServiceRow` | `row.metrics.last_deploy_at = {value: <epoch_ms>, unit:"epoch_ms"}` | 「最終デプロイ」td に整形済み JST 日時が表示される |
| LDC-U-03 | `DashboardView` thead | 任意 vm | `<th>最終デプロイ</th>` が thead に存在（列数 = 8） |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待振る舞い |
|---|---|---|---|
| LDC-U-10 | `deployAtFormat` | 入力 `undefined` / `null` | `—` を返す |
| LDC-U-11 | `deployAtFormat` | 入力 `NaN` / 不正 epoch | `—` を返す |
| LDC-U-12 | `ServiceRow` | `row.metrics.last_deploy_at` 未定義 | 「最終デプロイ」td が `—` |
| LDC-U-13 | `deployAtFormat` | 入力 `0` / 負値 | `—`（未デプロイ相当、防御的） |

### 1.3 境界値
| ID | 対象 | 境界 | 期待振る舞い |
|---|---|---|---|
| LDC-U-20 | `deployAtFormat` | JST 日付境界をまたぐ epoch（UTC 15:00 = JST 翌 00:00） | 日付が JST で繰り上がる（`formatJst` と一致） |

## 2. 修正テストケース

| ID | 対象 | 修正前 | 修正後 | 理由 |
|---|---|---|---|---|
| TS-U-30 | `DashboardCharts.test` | 4 chart render（up/mau/db_storage_bytes/**last_deploy_at**）+ `chart-last_deploy_at` アサーション | **3 chart render**、`chart-last_deploy_at` アサーション削除 | chart から last_deploy_at 除外 |
| TS-U-32 | `DashboardCharts.test` | 全 chart 空 series で 4 件 `chart-empty-*`（含 last_deploy_at） | **3 件**、`chart-empty-last_deploy_at` 削除 | 同上 |
| (summary) | `summary.test` | `DASHBOARD_CHART_METRICS` = 4 件 / `buildDashboard().charts.length === 4` | **3 件** / `=== 3`、last_deploy_at 不在を assert | 定数変更 |
| TS-U-40/41 | `DashboardView.test` | `charts` helper = 4 件（last_deploy_at 含む） | **3 件**化（helper から last_deploy_at エントリ削除）。テーブル列数アサーションがあれば 7→8 | charts 件数 + 列追加 |

## 3. 削除テストケース

| ID | 対象 | 削除理由 |
|---|---|---|
| （個別 it は削除せず、上記修正で last_deploy_at chart のアサーション行のみ除去） | — | 専用 it が無いため行レベル修正で対応 |

## 4. リグレッション強化

- 既存 chart（up / mau / db_storage_bytes）の render・空 fallback は維持確認。
- 既存テーブル列（status / service / MAU / 採算 / 離脱率 / errors / alerts）の表示・値整形が列追加で壊れないこと（特に `mono` セルや `data-*` 属性の参照）。
- `buildDashboard` の `rows`/`upCount`/`downCount` 等は不変であることを確認（charts のみ変更）。

## 5. Mock 方針差分

| 対象 | 前回 | 今回 | 理由 |
|---|---|---|---|
| 時刻 | `formatLastUpdated` は `now` 引数注入 | `deployAtFormat` は **now 非依存**（epoch_ms から純粋導出） | デプロイ日時は絶対時刻のみ表示、相対表記なし → `vi.setSystemTime` 不要 |

## 6. カバレッジ目標

| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | 既存継承 |
| 分岐 | 70% | 既存継承（`deployAtFormat` の `—` 分岐を網羅） |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-30 | 初版作成 | /flow:revise |
