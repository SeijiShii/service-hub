# 実装レポート: dashboard 収益(revenue)指標表示 + 契約キー正規化 (REVISE)

## 実装日時
2026-06-07 20:10 (JST)

## モード
revise

## 関連ドキュメント
- [001_REVISE_SPEC.md](./001_REVISE_SPEC.md) - 変更仕様書
- [002_REVISE_PLAN.md](./002_REVISE_PLAN.md) - 変更計画書
- [003_REVISE_UNIT_TEST.md](./003_REVISE_UNIT_TEST.md) - 単体テスト計画
- [起点クレーム TRIAGE](../claim_C20260607-001_20260607_tip-metrics-display/001_TRIAGE.md)
- [AI_LOG セッション](../../AI_LOG/D20260607_003_tdd_dashboard_C20260607-001.md)

## 注意事項
本レポートのファイルパスと行番号は実装日時時点のもの。

## 変更一覧

### Phase 1 (軽・メイン直接): 収益列表示 + 契約正規化
- `src/types/metric.ts`: `KnownMetricKey` に canonical `revenue_count` / `revenue_total_yen` を追記（open union、後方互換）。
- `src/providers/adapters.ts`: `LEGACY_METRIC_KEY_ALIAS = { tip_count→revenue_count, tip_total_yen→revenue_total_yen }` を追加。`createServiceInfoAdapter` の key emit を `ALIAS[m.key] ?? m.key` で正規化。`MetricKey` を import に追加。
- `src/types/service.ts`: `ServiceInfoResponse.metrics[]` の doc に canonical=revenue_* + 旧 tip_* 受理（正規化）を明記。
- `src/features/dashboard/ServiceRow.tsx`: `yen()` ヘルパ追加。行末尾に収益 2 セル `<td data-revenue-count>{fmt(row.metrics.revenue_count)}</td>` / `<td data-revenue-yen>{yen(row.metrics.revenue_total_yen)}</td>`。未申告=`—`、申告ありの 0 は有効値。
- `src/features/dashboard/DashboardView.tsx`: thead に `<th>収益(件)</th><th>収益(¥)</th>`（8→10 列）。

### テスト
- `src/features/dashboard/ServiceRow.test.tsx`: REV-U-01/02/03/10/20。
- `src/features/dashboard/summary.test.ts`: REV-DA-01（revenue_* の generic VM 投影 回帰防止）。
- `src/providers/adapters.test.ts`: REV-AD-01（旧 tip_* → canonical 正規化）/ REV-AD-02（新 revenue_* native 受理）。

## 設計変遷（ユーザーフィードバック）

| 段階 | 内容 |
|---|---|
| 初版 (claim ハンドオフ) | 「投げ銭」表示のみ・契約変更不要の想定で着手 |
| feedback 1 | 「収益は投げ銭とは限らない」→ ラベル 投げ銭→収益（サービスにより寄付/売上/投げ銭） |
| feedback 2 | 「契約も修正が必要」→ canonical キーを tip_* から汎用 revenue_* へ改名（契約 SoT 修正） |
| feedback 3 | 「後方互換のため JSON キーは tip でも受け取れるように」→ adapter に LEGACY_METRIC_KEY_ALIAS を追加。producer の強制再デプロイ不要に |

## 実装計画からの差分

| 項目 | 内容 |
|------|------|
| 計画にない追加変更 | feedback により当初の「表示のみ」から adapter 正規化 + 契約キー改名へ scope 拡大。adapters.ts / service.ts を変更対象に追加 |
| 計画から省略した変更 | 上部 chart 追加（[論点-001] 案A スコープ外）/ producer 移行（[論点-002] 任意・cross-repo follow-up） |
| 想定外の問題と対処 | `src/db/queries.test.ts:249` の "Unused '@ts-expect-error'" tsc エラーは **pre-existing**（変更を stash しても再現）で本改修と無関係。スコープ外。 |

## cross-repo follow-up

- **producer (bousai-bag-checker) の tip_* → revenue_* 移行**: 後方互換 alias により**任意**（機能上不要）。契約クリーンアップとして cross-repo で起票推奨（[論点-002]）。

## PR Description

### タイトル
dashboard: 各サービス行に収益(revenue_count / revenue_total_yen)を表示 + 旧 tip_* を後方互換正規化

### 概要
producer が service-info で自己申告する累計収益を dashboard 一覧で可視化。収益源泉はサービスにより寄付/売上等さまざまなため汎用 revenue_* を契約 canonical とし、旧 tip_* 申告は adapter で正規化して後方互換を保つ。

### 変更内容
- service-info adapter に tip_*→revenue_* 正規化エイリアス（後方互換）
- ServiceRow に収益(件)/収益(¥)の 2 セル追加（未申告 —、0 は有効値）
- DashboardView thead に収益 2 列
- KnownMetricKey / ServiceInfoResponse doc を canonical revenue_* に更新

### テスト
- 単体: 全 323 パス（100%）。互換維持・マイグレーション不要。
