# プロジェクトドキュメントインデックス

**最終更新**: 2026-05-28
**生成元**: /flow:concept、/flow:feature 等が自動更新

<!-- auto-generated-start -->

## 中央書類
- [`./concept.md`](./concept.md) — 全体概念設計（最新更新: 2026-05-26）
- [`./SCENARIO.md`](./SCENARIO.md) — 開発シナリオ（next-step 判断用）
- [`./DOC_MAP.md`](./DOC_MAP.md) — AI 用エントリポイント（目的別アクセス）
- [`./PREREQUISITES.md`](./PREREQUISITES.md) — 実装前準備チェックリスト

## 機能フォルダ（優先度順）
| 優先度 | 基盤 | フォルダ | 状態 | 設計完了 | INDEX |
|---|---|---|---|---|---|
| 2 | ✅ | [registry](./registry/) | 実装済+デプロイ済 / 改修1件 実装完了 (db-sot) + バグ修正1件 実装完了 (admin-form, unit 203 passed、5th deploy 待ち) | 2026-05-28 | [INDEX](./registry/INDEX.md) |
| 3 | ✅ | [collection](./collection/) | 実装済+デプロイ済 / 改修2件 実装完了（refresh-cadence: 最終更新表示 + force-pull: admin ボタン, unit 194 green） | 2026-05-28 | [INDEX](./collection/INDEX.md) |
| 4 | ❌ | [dashboard](./dashboard/) | 実装済+デプロイ済 / 改修6件（admin-ux + nav-and-pull + last-deploy-col + biz-charts + tip-metrics(C20260607-001) 実装完了 / chart-ux(時間軸統一+期間選択+usd系chart削除) 設計完了・tdd 待ち） | 2026-06-08 | [INDEX](./dashboard/INDEX.md) |
| 4 | ❌ | [service-detail](./service-detail/) | 実装済+デプロイ済 (unit+E2E+視覚 green) | 2026-05-27 | [INDEX](./service-detail/INDEX.md) |
| 4 | ❌ | [alerts](./alerts/) | 実装済+デプロイ済 | 2026-05-26 | [INDEX](./alerts/INDEX.md) |

## 横断フォルダ（優先度順）
| 優先度 | フォルダ | 状態 | 設計完了 | INDEX |
|---|---|---|---|---|
| 1 | [_shared/types](./_shared/types/) | 実装済 (unit GREEN) + 改修1件 実装完了 (favicon-projection、unit 255 green、5th deploy 待ち) | 2026-05-28 | [INDEX](./_shared/types/INDEX.md) |
| 1 | [_shared/db](./_shared/db/) | 実装済 | 2026-05-26 | [INDEX](./_shared/db/INDEX.md) |
| 2 | [_shared/providers](./_shared/providers/) | 実装済 (+ business-observability revise) | 2026-05-27 | [INDEX](./_shared/providers/INDEX.md) |
| 2 | [_shared/auth](./_shared/auth/) | 実装済 (+ public-status-api revise) | 2026-05-27 | [INDEX](./_shared/auth/INDEX.md) |

## AI アクセスガイド
- プロジェクト全体 → `concept.md`
- 次に何をすべきか → `SCENARIO.md`
- 目的別アクセス → `DOC_MAP.md`
- 設計判断の経緯 → `AI_LOG/INDEX.md`

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
