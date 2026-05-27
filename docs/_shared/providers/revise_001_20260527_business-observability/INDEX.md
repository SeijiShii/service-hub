# 改修 #001 ドキュメントインデックス — business-observability

**issue / slug**: 001 / business-observability
**実施日**: 2026-05-27
**状態**: 実装完了（Phase A/B/C/D unit GREEN, 137 tests）

<!-- auto-generated-start -->

## ファイル一覧
| 番号 | ファイル | 種別 | 状態 |
|---|---|---|---|
| 001 | [001_REVISE_SPEC.md](./001_REVISE_SPEC.md) | 変更仕様 | ✅ 完成 |
| 002 | 002_REVISE_PLAN.md | 変更計画 | ⏳ 次段 |
| 003 | 003_REVISE_UNIT_TEST.md | 単体テスト計画 | ⏳ 次段 |
| 004 | 004_REVISE_E2E_TEST.md | E2E テスト計画 | ⏳ 次段 |

## 改修サマリ（3次元）
1. 収益性: revenue/ai_cost (service-info 自己申告) + 1/2/3ヶ月見込み (trend) + 採算ビュー。
2. 決済ファネル/離脱率: started/completed/card_failed → 全体離脱率 + カード失敗率。
3. コストシミュレーション: provider アカウント単位の無料枠合算 → 上限到達予測 + 格上げコスト vs 合算収益で keep/upgrade/consolidate/sunset 提案。料金=pricing SoT + WebSearch 更新。

## 主要設計判断（AI_LOG D20260527 参照）
- データ源 = service-info 自己申告 (O25 秘密集中回避)
- 離脱率 = 両方別指標
- 料金 = pricing.toml SoT + WebSearch 更新
- スキーマ変更なし (usage_snapshots generic) / 完全後方互換 (additive)
- concept §4.6「収益不要」を監視対象サービスについて解除済

## 関連
- 親機能 INDEX: `../INDEX.md`
- 基準 SPEC: `../001_providers_SPEC.md`（service-info 契約 §1.3）
- AI_LOG: `../../../AI_LOG/D20260527_001_revise__shared_providers_business-observability.md`
- 撤退実行: `/flow:sunset`

<!-- auto-generated-end -->
