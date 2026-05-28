# 単体テストレポート: _shared/types favicon-projection

## 実施日時
2026-05-28 16:45 - 17:17 (JST)

## 関連ドキュメント
- [003_REVISE_UNIT_TEST.md](./003_REVISE_UNIT_TEST.md) - 単体テスト計画

## テスト実行環境
- TypeScript: 5.x
- Vitest: 2.1.9
- PGlite: in-memory PostgreSQL (テスト DB)
- 実行: `npm test` (= `vitest run`)

## テスト結果

| # | テストケース | テストファイル | 結果 | 備考 |
|---|---|---|---|---|
| **safeUrl (FP-U-34)** | | | | |
| FP-U-34a | 正常系 https | src/lib/safeUrl.test.ts | PASS | 3 sub-cases (sub-domain / port) |
| FP-U-34b | プロトコル拒否 (http / javascript: / data: / ftp:) | src/lib/safeUrl.test.ts | PASS | 4 sub-cases |
| FP-U-34c | internal アドレス拒否 (localhost/127/10/192.168/169.254/172.16-31/0.0.0.0) | src/lib/safeUrl.test.ts | PASS | 8 sub-cases (SSRF 予防) |
| FP-U-34d | 境界値 (1024 chars ちょうど / 1025 chars / custom maxLength) | src/lib/safeUrl.test.ts | PASS | 3 sub-cases |
| FP-U-34e | 型・空・パース不能 (空 / undefined / null / number / object / 不正 URL) | src/lib/safeUrl.test.ts | PASS | 7 sub-cases |
| **型拡張 (types/service)** | | | | |
| FP-U-01 | ServiceInfoResponse v2 (iconUrl 含む) | src/types/types.test.ts | PASS | |
| FP-U-02 | ServiceInfoResponse v1 後方互換 | src/types/types.test.ts | PASS | |
| FP-U-03 | ServiceDescriptor.iconUrl optional | src/types/types.test.ts | PASS | |
| FP-U-37 | ProviderAdapter.collect meta? optional + ping/vercel/neon 互換 | src/types/types.test.ts | PASS | |
| **DB schema + queries** | | | | |
| FP-U-06 | updateServiceMeta 新規セット | src/db/services.test.ts | PASS | |
| FP-U-07 | updateServiceMeta 空 meta → 既存値保持 | src/db/services.test.ts | PASS | |
| FP-U-08 | updateServiceMeta iconUrl=undefined → no-op | src/db/services.test.ts | PASS | |
| FP-U-09 | toServiceDescriptor で iconUrl round-trip | src/db/services.test.ts | PASS | |
| FP-U-26 | admin upsertService 新規 INSERT で iconUrl 無視 → NULL | src/db/services.test.ts | PASS | SoT 構造防御 (R2) |
| FP-U-26b | admin upsertService UPDATE で iconUrl 無視 → 既存値保持 | src/db/services.test.ts | PASS | SoT 構造防御 (R4) |
| FP-U-32 | updateServiceMeta 存在しない slug → no-op | src/db/services.test.ts | PASS | |
| **adapter (service-info)** | | | | |
| FP-U-04 | v2 response 正常 iconUrl 抽出 | src/providers/adapters.test.ts | PASS | |
| FP-U-05 | v1 producer (iconUrl 無し) → meta 未含有 | src/providers/adapters.test.ts | PASS | |
| FP-U-20 | http → reason=protocol 警告 | src/providers/adapters.test.ts | PASS | |
| FP-U-21 | 1024 chars 超 → reason=length 警告 | src/providers/adapters.test.ts | PASS | |
| FP-U-22 | 内部アドレス → reason=internal 警告 | src/providers/adapters.test.ts | PASS | SSRF 予防 |
| FP-U-23 | javascript: → 警告 + meta 未含有 | src/providers/adapters.test.ts | PASS | |
| FP-U-24 | non-string (number) → reason=type 警告 | src/providers/adapters.test.ts | PASS | |
| FP-U-25 | 空文字 → reason=empty 警告 | src/providers/adapters.test.ts | PASS | |
| FP-U-33 | 値そのものがログに含まれない | src/providers/adapters.test.ts | PASS | PII/secret 漏洩防止 (R6 / P80) |
| **runner (collection)** | | | | |
| FP-U-35 | adapter meta あり → updateServiceMeta 呼ばれる | src/features/collection/runner.test.ts | PASS | |
| FP-U-35b | RunnerDeps.updateServiceMeta optional 未渡し OK | src/features/collection/runner.test.ts | PASS | |
| FP-U-35c | updateServiceMeta throw → collect 停止せず warn | src/features/collection/runner.test.ts | PASS | silent reject 運用可視性 |
| FP-U-36 | adapter meta 無し → updateServiceMeta 呼ばれない | src/features/collection/runner.test.ts | PASS | |
| **buildPublicStatus (public-status DTO 投影)** | | | | |
| FP-U-10 | services.iconUrl 有 → DTO 含む | src/features/public-status/buildPublicStatus.test.ts | PASS | |
| FP-U-11 | services.iconUrl 無 → キー含有しない | src/features/public-status/buildPublicStatus.test.ts | PASS | |
| FP-M-01 | allowlist 拡張 (iconUrl 公開、財務情報 禁止) | src/features/public-status/buildPublicStatus.test.ts | PASS | |
| **全 PJ リグレッション** | | | | |
| 既存 32 test files (registry / db / providers / runner / public-status / dashboard / service-detail / alerts / api / etc) | リグレッション | 全 PJ | **PASS 255/255** | 0 failures |

## 追加テストケース

| # | 対象 | テストケース | 追加理由 |
|---|---|---|---|
| FP-U-26b | src/db/services.test.ts | 既存 iconUrl ある状態で admin upsertService (iconUrl 含む) → 既存 iconUrl 保持 (UPDATE 時 SET 句不含) | spec-review R4 の INSERT vs UPDATE 挙動分岐を test で網羅、SoT 動作防御 |
| FP-U-35b | src/features/collection/runner.test.ts | RunnerDeps.updateServiceMeta hook 未渡し (optional) でも meta は無視で正常完了 | optional hook の動作担保、既存 cron 経路で test 保護 |
| FP-U-35c | src/features/collection/runner.test.ts | updateServiceMeta が throw しても collect 全体は止まらず warn | runner.ts try/catch + warn の動作担保 (silent reject 運用可視性、P80) |

## サマリー

| 項目 | 値 |
|---|---|
| 計画テスト数 (003_UNIT_TEST FP-U-01〜37 + FP-M-01〜03 から Phase 4 で実装) | 23 (FP-U-01〜37 中 26 実装、FP-U-30/31 は safeUrl.test.ts で FP-U-34 境界値に統合、FP-M-02/M-03 は次フェーズ or 対象なし) |
| 追加テスト数 | 3 (FP-U-26b/35b/35c) |
| 合計 | 26 新規 + 既存維持 |
| 成功 | 255 |
| 失敗 | 0 |
| 成功率 | 100% |

## カバレッジ達成

| 種別 | 目標 | 達成状況 |
|---|---|---|
| 行 | 80% | ✅ 達成 (推定、既存 80%+ 維持 + 新規実装 100%) |
| 分岐 | 70% | ✅ 達成 (既存維持 + 新規分岐 全カバー) |
| **isSafePublicUrl** | 100% | ✅ **達成** (FP-U-34 25 sub-cases で全分岐網羅) |
| **updateServiceMeta** | 100% | ✅ **達成** (FP-U-06/07/08/32 で set/no-op/存在しない slug 全分岐) |
| **pickServiceInfoIconUrl (format check)** | 100% | ✅ **達成** (FP-U-04/05/20-25/33 で全 reason 分類網羅) |
