# 単体テストレポート: registry (DB SoT + admin write)

## 実施日時
2026-05-28 (JST)

## 関連ドキュメント
- [003_REVISE_UNIT_TEST.md](./003_REVISE_UNIT_TEST.md)（計画）

## テスト実行環境
- ランタイム: Node.js / TypeScript（ESM）
- フレームワーク: vitest 2.1.9（DB は @electric-sql/pglite in-memory、UI は happy-dom + @testing-library/react）

## テスト結果

| # | テストケース | テストファイル | 結果 |
|---|------------|-------------|------|
| U-01 | 新規 descriptor を upsert/get | src/db/services.test.ts | ✓ |
| U-02 | 同 slug 再 upsert で更新（重複なし） | src/db/services.test.ts | ✓ |
| U-08 | providers jsonb 往復 | src/db/services.test.ts | ✓ |
| U-21 | serviceInfo/thresholds 省略 → undefined | src/db/services.test.ts | ✓ |
| U-03/04 | onlyActive フィルタ / 全件 | src/db/services.test.ts | ✓ |
| U-20 | 空レジストリ → [] | src/db/services.test.ts | ✓ |
| U-05 | retire で onlyActive から除外 | src/db/services.test.ts | ✓ |
| (hard) | 物理削除で行が消える | src/db/services.test.ts | ✓ |
| RG-N1 | loadServices(db) 全件 | src/registry/load.test.ts | ✓ |
| RG-N2 | loadServices onlyActive | src/registry/load.test.ts | ✓ |
| RG-B1 | 空レジストリ → [] | src/registry/load.test.ts | ✓ |
| U-07 | validate 妥当入力 → ok | src/registry/validate.test.ts | ✓ |
| U-10/10b | url 内部アドレス/localhost → 拒否(SSRF) | src/registry/validate.test.ts | ✓ |
| U-11 | serviceInfo.endpoint 内部 → 拒否 | src/registry/validate.test.ts | ✓ |
| U-12 | provider 秘密直書き → 拒否 | src/registry/validate.test.ts | ✓ |
| U-13/13b | 不正 slug / 必須欠落 → 拒否 | src/registry/validate.test.ts | ✓ |
| U-15 | admin 未認証 → 401、未登録 | api/admin/services.test.ts | ✓ |
| (POST) | 正常 → 201 + 登録 | api/admin/services.test.ts | ✓ |
| U-10w | 内部アドレス → 400、未登録 | api/admin/services.test.ts | ✓ |
| U-14 | 既存 slug POST → 409 | api/admin/services.test.ts | ✓ |
| (PATCH) | 未知 404 / 既存 200 更新 | api/admin/services.test.ts | ✓ |
| (DELETE) | 既定 retire / ?hard=1 物理 | api/admin/services.test.ts | ✓ |
| (405) | PUT → 405 | api/admin/services.test.ts | ✓ |
| AF-1〜4 | 一覧表示/登録 onSave/退役 onRetire/編集 readonly | src/features/admin/ServicesAdminView.test.tsx | ✓ |

## 修正テストケース
- M-01: `src/registry/load.test.ts` を toml ベース（validateServicesToml）→ DB ベース（loadServices(db)）に書き換え。validateServicesToml の toml パーステストは削除（D-01）。
- M-02: `src/features/collection/runner.test.ts` の `loadServices` mock を sync → `async` に（RunnerDeps の Promise 化対応）。

## 追加テストケース
- admin handler の 405（PUT）/ DELETE ?hard=1 物理削除 / validate の必須欠落（U-13b）を計画外で追加（網羅補強）。

## サマリー

| 項目 | 値 |
|------|-----|
| 本 revise 関連の新規/改修テスト | services 8 + load 3 + validate 7 + admin handler 9 + admin view 4 = 31 |
| 全スイート合計 | 176 |
| 成功 | 176 |
| 失敗 | 0 |
| 成功率 | 100% |
| typecheck | tsc --noEmit exit 0 |
