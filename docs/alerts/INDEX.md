# alerts ドキュメントインデックス

**最終更新**: 2026-05-26 07:58
**生成元**: /flow:concept → /flow:feature
**状態**: 実装済 (unit GREEN)

<!-- auto-generated-start -->

## 機能概要 (短縮、詳細は README.md)
無料枠超過等の閾値判定 + seiji への通知

## ファイル一覧（番号順）
| 番号 | ファイル | 種別 | 状態 | 最終更新 | 短い説明 |
|---|---|---|---|---|---|
| 001 | [001_alerts_SPEC.md](./001_alerts_SPEC.md) | SPEC | 確定 | 2026-05-26 | 閾値判定 + 通知 |
| 002 | [002_alerts_PLAN.md](./002_alerts_PLAN.md) | PLAN | 確定 | 2026-05-26 | evaluate + notify(channel注入) |
| 003 | [003_alerts_UNIT_TEST.md](./003_alerts_UNIT_TEST.md) | UNIT_TEST | 確定 | 2026-05-26 | 発火/抑制/回復/送信 |
| 004 | (E2E: dashboard AlertBanner でカバー) | — | N/A | — | — |
| 101 | [101_alerts_IMPL_REPORT.md](./101_alerts_IMPL_REPORT.md) | IMPL_REPORT | 完了 | 2026-05-26 | evaluate+notify 実装 |
| 102 | [102_alerts_UNIT_TEST_REPORT.md](./102_alerts_UNIT_TEST_REPORT.md) | UNIT_TEST_REPORT | 完了 | 2026-05-26 | 9 passed |

## サブフォルダ（改修・バグ修正・クレーム判定履歴）
| パス | 種別 | issue/slug | 状態 | 概要 | INDEX |
|---|---|---|---|---|---|
| (なし。`/flow:revise` / `/flow:fix` / `/flow:claim` で生成) |

## 関連
- 親 concept: `../concept.md` §1.3.1 alerts 行
- **依存**: _shared/db, collection
- 実装コード: `src/`（§1.4 参照）

## 機能性質タグ
- feature, stateful (alert ライフサイクル)
- Open 論点: [論点-AL1] 通知チャネル

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
