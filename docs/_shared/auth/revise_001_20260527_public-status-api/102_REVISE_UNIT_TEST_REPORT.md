# 単体テストレポート: public-status-api (revise)

## 実施日時
2026-05-27 (JST)

## 関連
- 003_REVISE_UNIT_TEST.md（計画）

## テスト実行環境
- Node 22 / Vitest 2.x

## テスト結果

| # | テストケース | ファイル | 結果 |
|---|---|---|---|
| PS-N1 | active+up=1 → up + lastCheckedAt | buildPublicStatus.test.ts | ✅ |
| PS-N2 | up=0 → down | 〃 | ✅ |
| PS-N3 | up 無し → unknown | 〃 | ✅ |
| PS-N4 | paused/retired 除外（active のみ） | 〃 | ✅ |
| **PS-S1** | 内部指標含む snapshots でも内部キー非漏洩 | 〃 | ✅ |
| PS-B1 | active 0 件 → [] | 〃 | ✅ |
| PS-G1/G3 | `/api/public/*` は gate 対象外 | guard.test.ts | ✅ |
| PS-G2 | dashboard/cost-sim/cron は public でない | 〃 | ✅ |
| PS-H1 | 無認証 GET → 200 + DTO[] | api/public/status.test.ts | ✅ |
| **PS-H2** | レスポンスに内部指標キー非含有 | 〃 | ✅ |
| PS-H3 | OPTIONS → 204 + CORS | 〃 | ✅ |
| PS-H4 | GET に CORS + Cache-Control | 〃 | ✅ |
| PS-H5 | POST → 405 | 〃 | ✅ |

## 追加テストケース
- PS-H4/H5（CORS/Cache ヘッダ + メソッド gating）を結合で追加（計画の H レベルを補強）。

## サマリー
| 項目 | 値 |
|---|---|
| 計画テスト数 | 11 |
| 追加テスト数 | 2 |
| 合計（本 revise 新規） | 13 |
| 全 unit | 150 |
| 成功 | 150 |
| 失敗 | 0 |
| 成功率 | 100% |

> リグレッション: 既存 guard（requireSeiji 401/403）+ dashboard/cost-sim の無認証 401 維持（公開ルート追加で他は緩まない）。E2E（PS-E/PS-RE）は `/flow:e2e` で実行。
