# _shared/db ドキュメントインデックス

**最終更新**: 2026-05-26 07:58
**生成元**: /flow:concept → /flow:feature
**状態**: 設計済 (実装待ち)

<!-- auto-generated-start -->

## 機能概要 (短縮、詳細は README.md)
Neon スキーマ・マイグレーション (usage_snapshots / alert_events / collection_runs + Drizzle)

## ファイル一覧（番号順）
| 番号 | ファイル | 種別 | 状態 | 最終更新 | 短い説明 |
|---|---|---|---|---|---|
| 001 | [001_db_SPEC.md](./001_db_SPEC.md) | SPEC | 確定 | 2026-05-26 | Neon スキーマ3表 + クエリ関数 |
| 002 | [002_db_PLAN.md](./002_db_PLAN.md) | PLAN | 確定 | 2026-05-26 | src/db/ 実装計画 |
| 003 | [003_db_UNIT_TEST.md](./003_db_UNIT_TEST.md) | UNIT_TEST | 確定 | 2026-05-26 | 結合テスト(実DB) |
| 004 | (E2E スキップ: cross-cutting) | — | N/A | — | — |

## サブフォルダ（改修・バグ修正・クレーム判定履歴）
| パス | 種別 | issue/slug | 状態 | 概要 | INDEX |
|---|---|---|---|---|---|
| (なし。`/flow:revise` / `/flow:fix` / `/flow:claim` で生成) |

## 関連
- 親 concept: `../concept.md` §1.3.2 _shared/db 行
- **依存**: _shared/types
- 実装コード: `src/`（§1.4 参照）

## 機能性質タグ
- cross-cutting (永続化基盤、被依存=collection/dashboard/service-detail/alerts)
- Open 論点: [論点-DB1] スナップショット保持期間

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
