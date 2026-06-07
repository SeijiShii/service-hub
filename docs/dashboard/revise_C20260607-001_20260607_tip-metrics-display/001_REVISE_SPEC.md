# dashboard 変更仕様書（投げ銭(tip)指標を一覧に表示）

> **改修種別**: 機能拡張（表示追加・additive）
> **issue / slug**: C20260607-001 / tip-metrics-display
> **基準 SPEC**: `../001_dashboard_SPEC.md`
> **起点クレーム**: `../claim_C20260607-001_20260607_tip-metrics-display/001_TRIAGE.md`（判定: 仕様検討漏れ、decision D20260607-003）
> **最終更新**: 2026-06-07
> **タグ**: analytics（集計表示、PII なし O48）

---

## 1. 変更概要

producer (bousai-bag-checker) が service-info v2 の `metrics[]` に追加した投げ銭指標
`tip_count` (件数) / `tip_total_yen` (累計金額・jpy) を、dashboard 一覧の各サービス行に表示する。
収集・保存・VM 投影は既に汎用で tip_* を保持済（変更不要）。本改修は **表示層への列追加のみ**。

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC ID | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| 一覧サマリ | 各行に status/service/MAU/採算/離脱率/errors/alerts/最終デプロイ を表示 | 上記に加え **投げ銭(件数) / 投げ銭(¥)** の 2 列を additive 表示 | producer 申告の tip 指標を可視化（cross-repo CF-20260607-002） |

### 2.2 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| dashboard テーブル (`DashboardView.tsx` thead) | 8 列（status〜最終デプロイ） | 10 列（末尾に 投げ銭件数 / 投げ銭¥ を追加） | 互換（additive、既存列の順序・内容不変） |
| サービス行 (`ServiceRow.tsx` tr) | 8 セル | 10 セル（`row.metrics.tip_count` / `row.metrics.tip_total_yen` を参照） | 互換 |
| 公開 API `/api/hub/service-info` / `/api/dashboard/summary` | — | **変更なし**（VM は既に tip_* を保持、API スキーマ不変） | 互換 |

### 2.3 データモデル変更
| エンティティ | 変更内容 | マイグレーション要否 |
|---|---|---|
| `usage_snapshots` | 変更なし（`metricKey: MetricKey` open union で tip_* を既に保存中） | 不要 |
| `KnownMetricKey` (`src/types/metric.ts`) | **任意**: `tip_count` / `tip_total_yen` を列挙に追記（typo 防止・自己文書化）。open union のため後方互換 | 不要 |

### 2.4 バリデーション・エラー変更
| 対象 | 変更前 | 変更後 |
|---|---|---|
| tip 値の表示 | （列なし） | 未申告/欠落は `—`、`tip_total_yen` は `¥{value}` 形式（jpy 固定、整数前提）、`tip_count` は数値そのまま |

## 3. 影響範囲

| 対象 | 影響度 | 説明 |
|---|---|---|
| `src/features/dashboard/ServiceRow.tsx` | 高 | tip 2 セルを追加 |
| `src/features/dashboard/DashboardView.tsx` | 中 | thead に 2 列見出しを追加 |
| `src/types/metric.ts` | 低 | KnownMetricKey に tip_* 追記（任意） |
| 収集 / DB / VM / 公開 API | なし | 既に汎用で tip_* を保持・投影済 |

## 4. 後方互換性

- **互換維持**: ✅
- additive 列追加のみ。既存列・既存 API・DB スキーマは不変。tip を申告しないサービスは全行 `—` 表示で従来同等。

## 5. ロールバック方針

- **コード revert で戻せる**: ✅（表示層のみの変更、DB 変更なし）
- **DB マイグレーションのロールバック**: 無（マイグレーションなし）
- **手順**: 該当コミットを revert するだけ。データ・収集に影響なし。

## 6. リリース戦略

- **方式**: 一括（小規模 additive、フィーチャーフラグ不要）
- **ロールアウト**: 通常デプロイ。producer は既に tip_* を本番申告済のため、デプロイ後ただちに bousai-bag-checker 行に `tip_count:1 / ¥100` が表示される。

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC（新仕様）
- 一覧画面 (`/`) の各サービス行末尾に「投げ銭(件数)」「投げ銭(¥)」の 2 列を表示。
- 値は `ServiceRowVM.metrics.tip_count` / `.tip_total_yen`（buildDashboard が generic に投影済）。
- 未申告（キーなし）または値 0/欠落の扱い:
  - `tip_count`: 未申告は `—`。0 は `0` 表示（投げ銭ゼロを明示）。※ last_deploy_at と異なり 0 は有効値。
  - `tip_total_yen`: 未申告は `—`。0 は `¥0`。

> 補足: 「未申告(`—`)」と「0(`¥0`/`0`)」を区別する。tip_count/tip_total_yen が VM に存在するか (`row.metrics.tip_count !== undefined`) で判定。

### 7.2 入出力（新仕様）
- 表示のみ。入力なし。`¥` 接頭は jpy 固定（producer の unit:jpy 前提）。整数表示（小数なし）。

### 7.3 データモデル（新仕様）
- 変更なし（§2.3）。

### 7.4 バリデーション・エラー（新仕様）
- tip_total_yen の unit が想定外（jpy 以外）でも値は表示する（HUB は producer 申告を信頼、collection 層で既に正規化済）。表示は ¥ 固定。

### 7.5 機能固有 NFR + 既存連携（新仕様）
- 一覧性（design-system「数十サービスを 1 画面」）維持: tip 2 列追加で横幅増。compact 行の右寄せ mono 表記を踏襲。
- PII なし（集計値のみ、O48）。

## 8. タグ別追加項目（analytics）
- 集計値のみ・PII なし。tip_total_yen/tip_count はサービス単位の累計で個人特定不可。

## 9. 未決事項

### [論点-001] 上部 chart への tip 系列追加
- **影響範囲**: `DASHBOARD_CHARTS` / `DASHBOARD_CHART_SOURCE_METRICS`
- **詰めるべき問い**: 投げ銭金額の時系列を上部 chart にも出すか
- **候補案**: 案A 今回スコープ外（一覧表示で close）/ 案B 同時に chart 系列追加
- **推奨**: **案A**。まず一覧で可視化し close。chart 化は需要を見て別 revise（スコープ最小化・早期 close 優先）
- **判断期限**: 本 revise 実装前（スコープ確定）

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-07 | 初版作成（claim C20260607-001 からハンドオフ） | /flow:revise |
