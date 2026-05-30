# SPEC レビュー: business-observability (retroactive reconcile)

- **状態**: 実装済みに対する遡及 reconcile (spec-review gate を閉じる bookkeeping)
- **生成**: 2026-05-31 (flow:auto loop D20260531_001 反復9、§4.5.1#0 で検出した未ファイル report の reconcile)

## 経緯
本 revise (2026-05-27 ビジネス/収益観測スコープ拡張) は **実装完了済** (INDEX「Phase A/B/C/D unit GREEN, 137 tests」、cost-sim モジュール + profitability.ts 実装 + デプロイ済) だが、当時のセッションが **歪曲停止 (CF-flow-auto-no-distortion-stop の起点事例: Phase A+B 完了後に context/対話を口実に停止)** したため `905`/`101`/`103` report が未ファイルだった。本 loop の §4.5.1#0 no-key 枯渇チェックが「004 あり 905/101 不在」を検出し reconcile。

## spec-review 観点 (as-built で確認)
- **影響範囲**: 001 §3 の通り dashboard (採算列) / service-detail (収益・ファネル時系列) / 新規 cost-sim モジュール + pricing SoT。すべて実装・デプロイ済で整合。
- **責務分離**: cost-sim は aggregate/orchestrate/pricing/simulate に分割 (単一責務)。profitability は dashboard 配下の派生計算。design 上の責務逸脱なし。
- **既存パターン整合**: provider adapter / VM projection / route-mock E2E の既存パターンに沿う。
- **後方互換**: services.toml の account/revenueThresholds は任意フィールド (001 §4)、既存サービスに非破壊。

→ 実装済みの設計は spec として妥当 (遡及確認)。新規 tdd 着手はないため本 gate は reconcile で充足。
