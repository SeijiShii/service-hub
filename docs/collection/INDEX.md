# collection ドキュメントインデックス

**最終更新**: 2026-05-26 07:58
**生成元**: /flow:concept → /flow:feature
**状態**: 設計済 (実装待ち)

<!-- auto-generated-start -->

## 機能概要 (短縮、詳細は README.md)
定期 pull オーケストレーション (対象選定・スケジューリング・スナップショット保存)

## ファイル一覧（番号順）
| 番号 | ファイル | 種別 | 状態 | 最終更新 | 短い説明 |
|---|---|---|---|---|---|
| 001 | [001_collection_SPEC.md](./001_collection_SPEC.md) | SPEC | 確定 | 2026-05-26 | cron + pull オーケストレーション |
| 002 | [002_collection_PLAN.md](./002_collection_PLAN.md) | PLAN | 確定 | 2026-05-26 | runner + cron handler |
| 003 | [003_collection_UNIT_TEST.md](./003_collection_UNIT_TEST.md) | UNIT_TEST | 確定 | 2026-05-26 | ok/partial/failed + 冪等 |
| 004 | (E2E: cron handler 統合テスト、UI なし) | — | 計画 | — | — |

## サブフォルダ（改修・バグ修正・クレーム判定履歴）
| パス | 種別 | issue/slug | 状態 | 概要 | INDEX |
|---|---|---|---|---|---|
| (なし。`/flow:revise` / `/flow:fix` / `/flow:claim` で生成) |

## 関連
- 親 concept: `../concept.md` §1.3.1 collection 行
- **依存**: _shared/providers, _shared/db, registry
- 実装コード: `src/`（§1.4 参照）

## 機能性質タグ
- feature, stateful (collection_run)、基盤
- Open 論点: [論点-CO1] 多重起動防止+実行時間

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
