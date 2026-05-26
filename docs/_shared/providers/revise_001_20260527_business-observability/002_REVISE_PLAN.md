# 変更計画書（business-observability）

> **入力**: `./001_REVISE_SPEC.md`, concept §1.4 / §5, 既存 src (providers/types/dashboard/service-detail/registry)
> **最終更新**: 2026-05-27

## 1. 既存ファイル変更一覧
| ファイル | 変更内容 | リスク | SPEC § |
|---|---|---|---|
| `src/types/` (service.ts/index) | 標準ビジネスメトリクスキーの定数 + `PricingTable` / `CostSimResult` / 採算・ファネル VM 型 | 低（追加のみ） | §7.1 |
| `src/registry/schema.ts` | ServiceDescriptor に任意 `account?`（無料枠共有グルーピング）, `revenueThresholds?` を追加 | 低（任意・後方互換） | §2.3 |
| `src/providers/adapters.ts` (service-info) | 標準キーの正規化を明示（既存 metrics[]→UsageMetric は不変、未知キーも通す） | 低 | §7.1 |
| `src/features/dashboard/summary.ts` | DashboardVM 行に採算（revenue−ai_cost）+ 離脱率バッジを算出して追加 | 中（既存 VM 拡張） | §7.2/§7.3 |
| `src/features/dashboard/DashboardView.tsx` | 採算列 + 離脱率バッジの表示 | 中 | §7.2 |
| `src/features/service-detail/detail.ts` | 収益/AIコスト/決済ファネルの時系列 + 離脱率を detail VM に追加 | 中 | §7.3 |
| `src/features/service-detail/ServiceDetailView.tsx` | ファネル/離脱率 + 収益・コスト時系列グラフ | 中 | §7.3 |

## 2. 新規ファイル一覧
| ファイル | 責務 | LOC 見積 |
|---|---|---|
| `docs/pricing.toml` | 料金 SoT: provider 別「無料枠上限（単位明記）+ 有料プラン価格」+ `updated` 日付 | ~60 |
| `src/features/cost-sim/pricing.ts` | pricing.toml の読込・検証（Zod）+ 鮮度判定 | ~50 |
| `src/features/cost-sim/simulate.ts` | provider アカウント単位の使用量合算 → 無料枠%・上限到達予測（trend）・格上げコスト vs 合算収益 → 提案(keep/upgrade/consolidate/sunset)。純関数（注入式） | ~120 |
| `src/features/cost-sim/index.ts` | re-export | ~3 |
| `src/lib/projection.ts` | 時系列スナップショットからの trend 外挿（直近窓の線形）。収益見込み + 上限到達予測で共用 | ~40 |
| `api/cost-sim/summary.ts` | 採算 + コストシミュレーション集約 API（requireSeiji ゲート、DB から snapshots 読んで simulate） | ~30 |
| `src/features/dashboard/profitability.ts` | 採算算出の純ロジック（revenue/ai_cost/閾値 → 黒字/薄利/赤字） | ~40 |
| `src/features/service-detail/funnel.ts` | 決済ファネル/離脱率算出の純ロジック（started/completed/card_failed → rates、ゼロ除算安全） | ~40 |

## 3. 削除ファイル一覧
なし（完全 additive）。

## 4. マイグレーション要否
- DB スキーマ変更: ❌（usage_snapshots は generic、新 metric_key が乗る）
- 既存データ変換: ❌
- 設定: pricing.toml 新規（マイグレーションではなく新規 SoT）
→ **005_REVISE_MIGRATION 不要**。

## 5. 実装 Phase 分割（/flow:tdd 連携、各 Phase 独立に価値）
- **Phase A（採算基盤）**: types 標準キー + profitability.ts 純ロジック + dashboard summary 採算列 + view。RED→GREEN→IMPROVE。
- **Phase B（決済ファネル）**: funnel.ts 純ロジック + service-detail 離脱率（全体 + カード失敗）表示。
- **Phase C（収益見込み）**: projection.ts trend 外挿 + dashboard/service-detail に 1/2/3ヶ月見込み。
- **Phase D（コストシミュレーション）**: pricing.ts + pricing.toml SoT + simulate.ts（アカウント合算 + 上限予測 + 格上げ提案）+ cost-sim ビュー + WebSearch 更新フロー（pricing 古い時に提案）。

## 6. 依存関係順序
types(標準キー/型) → profitability/funnel/projection(純ロジック) → dashboard/service-detail(表示) → cost-sim(pricing + simulate) → cost-sim API/ビュー。registry schema(account) は Phase D 前に。

## 7. ロールアウト計画
| ステップ | 内容 | 検証 |
|---|---|---|
| A | 採算列 | unit + dashboard render テスト |
| B | 離脱率 | unit + service-detail render |
| C | 見込み | projection unit（既知系列で期待値） |
| D | コストシミュレーション | simulate unit（合算/上限/提案）+ pricing parse + cost-sim view render |
> フィーチャーフラグ不要（additive、データ未申告サービスは「データなし」表示で既存挙動維持）。

## 8. リスク・注意点
- 時間窓の不統一（[論点-BO1]）: キーサフィックスで明示（`_month`/`_7d`）。
- アカウント・グルーピングの精度（[論点-BO2]）: 既定=provider ごと単一アカウント、`account` で上書き。
- pricing 鮮度（[論点-BO3]）: simulate 時に updated が N 日超なら WebSearch 更新を提案（Class A）。
- ゼロ除算（started=0）/ データ欠損 → 「データなし」表示で安全に。

## 9. 完了の定義 (DoD)
- [ ] Phase A-D 全 GREEN（純ロジック unit + view render）
- [ ] 採算 / 離脱率（全体+カード失敗）/ 見込み / コストシミュレーション提案 が算出・表示される
- [ ] 完全後方互換（未申告サービスは「データなし」、既存テスト不破壊）
- [ ] typecheck + build green
- [ ] pricing.toml SoT + 更新運用が機能（鮮度提案）

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-27 | 初版作成 | /flow:revise |
