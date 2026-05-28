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
| 2 | ✅ | [registry](./registry/) | 実装済+デプロイ済 / 改修1件 実装完了（DB SoT 化, db-sot, unit 176 green） | 2026-05-28 | [INDEX](./registry/INDEX.md) |
| 3 | ✅ | [collection](./collection/) | 実装済+デプロイ済 / 改修2件 実装完了（refresh-cadence: 最終更新表示 + force-pull: admin ボタン, unit 194 green） | 2026-05-28 | [INDEX](./collection/INDEX.md) |
| 4 | ❌ | [dashboard](./dashboard/) | 実装済+デプロイ済 / 改修2件 実装完了（admin-ux + nav-and-pull: 双方向 navigation + force-pull を dashboard へ relocation, unit 196 green、要再デプロイ） | 2026-05-28 | [INDEX](./dashboard/INDEX.md) |
| 4 | ❌ | [service-detail](./service-detail/) | 実装済+デプロイ済 (unit+E2E+視覚 green) | 2026-05-27 | [INDEX](./service-detail/INDEX.md) |
| 4 | ❌ | [alerts](./alerts/) | 実装済+デプロイ済 | 2026-05-26 | [INDEX](./alerts/INDEX.md) |

## 横断フォルダ（優先度順）
| 優先度 | フォルダ | 状態 | 設計完了 | INDEX |
|---|---|---|---|---|
| 1 | [_shared/types](./_shared/types/) | 設計済 | 2026-05-26 | [INDEX](./_shared/types/INDEX.md) |
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
