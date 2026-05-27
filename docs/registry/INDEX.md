# registry ドキュメントインデックス

**最終更新**: 2026-05-26 07:58
**生成元**: /flow:concept → /flow:feature
**状態**: 実装済 (unit GREEN)

<!-- auto-generated-start -->

## 機能概要 (短縮、詳細は README.md)
管理対象サービスの宣言ファイル定義・ローダ・バリデーション (services.toml スキーマ / サービス一覧取得)

## ファイル一覧（番号順）
| 番号 | ファイル | 種別 | 状態 | 最終更新 | 短い説明 |
|---|---|---|---|---|---|
| 001 | [001_registry_SPEC.md](./001_registry_SPEC.md) | SPEC | 確定 | 2026-05-26 | services.toml ローダ/検証 |
| 002 | [002_registry_PLAN.md](./002_registry_PLAN.md) | PLAN | 確定 | 2026-05-26 | Zod+TOML パーサ |
| 003 | [003_registry_UNIT_TEST.md](./003_registry_UNIT_TEST.md) | UNIT_TEST | 確定 | 2026-05-26 | 検証(SSRF/秘密直書き) |
| 004 | (E2E: dashboard でカバー) | — | N/A | — | — |
| 101 | [101_registry_IMPL_REPORT.md](./101_registry_IMPL_REPORT.md) | IMPL_REPORT | 完了 | 2026-05-26 | Zod 検証+ローダ+services.toml |
| 102 | [102_registry_UNIT_TEST_REPORT.md](./102_registry_UNIT_TEST_REPORT.md) | UNIT_TEST_REPORT | 完了 | 2026-05-26 | 8 passed |

## サブフォルダ（改修・バグ修正・クレーム判定履歴）
| パス | 種別 | issue/slug | 状態 | 概要 | INDEX |
|---|---|---|---|---|---|
| [revise_db-sot_20260528_db-admin-write/](./revise_db-sot_20260528_db-admin-write/) | revise | db-sot | 設計完了（実装前） | レジストリ SoT を Git services.toml → Neon services テーブル + Clerk ゲート内 admin write。未運用ゆえ移行なし・toml 削除（[D20260528-001/002]） | [INDEX](./revise_db-sot_20260528_db-admin-write/INDEX.md) |

## 関連
- 親 concept: `../concept.md` §1.3.1 registry 行
- **依存**: _shared/types
- 実装コード: `src/`（§1.4 参照）

## 機能性質タグ
- feature (UI なし=一覧描画は dashboard)、基盤

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
