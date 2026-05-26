# _shared/auth ドキュメントインデックス

**最終更新**: 2026-05-26 07:58
**生成元**: /flow:concept → /flow:feature
**状態**: コア実装済 (guard GREEN、glue は bootstrap)

<!-- auto-generated-start -->

## 機能概要 (短縮、詳細は README.md)
Clerk 単一ユーザーゲート (全ルート保護・seiji のみ許可)

## ファイル一覧（番号順）
| 番号 | ファイル | 種別 | 状態 | 最終更新 | 短い説明 |
|---|---|---|---|---|---|
| 001 | [001_auth_SPEC.md](./001_auth_SPEC.md) | SPEC | 確定 | 2026-05-26 | Clerk 単一ユーザーゲート |
| 002 | [002_auth_PLAN.md](./002_auth_PLAN.md) | PLAN | 確定 | 2026-05-26 | src/auth/ 実装計画 |
| 003 | [003_auth_UNIT_TEST.md](./003_auth_UNIT_TEST.md) | UNIT_TEST | 確定 | 2026-05-26 | ガード(401/403/フェイルクローズ) |
| 004 | (E2E スキップ: cross-cutting) | — | N/A | — | — |
| 101 | [101_auth_IMPL_REPORT.md](./101_auth_IMPL_REPORT.md) | IMPL_REPORT | 完了 | 2026-05-26 | guard 実装(glue 保留) |
| 102 | [102_auth_UNIT_TEST_REPORT.md](./102_auth_UNIT_TEST_REPORT.md) | UNIT_TEST_REPORT | 完了 | 2026-05-26 | 7 passed |

## サブフォルダ（改修・バグ修正・クレーム判定履歴）
| パス | 種別 | issue/slug | 状態 | 概要 | INDEX |
|---|---|---|---|---|---|
| (なし。`/flow:revise` / `/flow:fix` / `/flow:claim` で生成) |

## 関連
- 親 concept: `../concept.md` §1.3.2 _shared/auth 行
- **依存**: (なし)
- 実装コード: `src/`（§1.4 参照）

## 機能性質タグ
- cross-cutting, auth-required (単一ユーザー、RBAC 不要)

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
