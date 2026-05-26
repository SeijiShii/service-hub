# _shared/providers ドキュメントインデックス

**最終更新**: 2026-05-26 07:58
**生成元**: /flow:concept → /flow:feature
**状態**: 設計済 (実装待ち)

<!-- auto-generated-start -->

## 機能概要 (短縮、詳細は README.md)
各 PaaS API アダプタ (Vercel/Neon/Clerk/Cloudflare/Sentry + uptime ping、共通 ProviderAdapter)

## ファイル一覧（番号順）
| 番号 | ファイル | 種別 | 状態 | 最終更新 | 短い説明 |
|---|---|---|---|---|---|
| 001 | [001_providers_SPEC.md](./001_providers_SPEC.md) | SPEC | 確定 | 2026-05-26 | adapter群+service-info契約([論点001/003/T1]解決) |
| 002 | [002_providers_PLAN.md](./002_providers_PLAN.md) | PLAN | 確定 | 2026-05-26 | src/providers/ 実装計画(O35 injectable) |
| 003 | [003_providers_UNIT_TEST.md](./003_providers_UNIT_TEST.md) | UNIT_TEST | 確定 | 2026-05-26 | mock fetch/fixture + SSRF/スクラブ |
| 004 | (E2E スキップ: cross-cutting) | — | N/A | — | — |

## サブフォルダ（改修・バグ修正・クレーム判定履歴）
| パス | 種別 | issue/slug | 状態 | 概要 | INDEX |
|---|---|---|---|---|---|
| (なし。`/flow:revise` / `/flow:fix` / `/flow:claim` で生成) |

## 関連
- 親 concept: `../concept.md` §1.3.2 _shared/providers 行
- **依存**: _shared/types
- 実装コード: `src/`（§1.4 参照）

## 機能性質タグ
- cross-cutting (pull の核、被依存=collection)
- Open 論点: [論点-PR1] Clerk 厳密MAU(Phase2)

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
