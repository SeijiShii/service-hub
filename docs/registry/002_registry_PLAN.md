# registry 実装計画書

> **入力**: `./001_registry_SPEC.md`, `../_shared/types/`, `../concept.md` §1.4
> **最終更新**: 2026-05-26

---

## 1. 実装対象ファイル一覧（src/registry/）
| ファイル | 責務 | 依存 | LOC 見積 |
|---|---|---|---|
| `src/registry/schema.ts` | services.toml の Zod スキーマ（ServiceDescriptor 検証） | types | ~70 |
| `src/registry/load.ts` | TOML パース + 検証 + loadServices/validateServicesToml | schema, types | ~80 |
| `src/registry/index.ts` | バレル | 上記 | ~5 |
| `services.toml` | レジストリ SoT（リポ直下、初期は hana-memo 1 件） | — | ~20 |

- TOML パーサ: `@iarna/toml` 等（PLAN 確定）。検証: Zod。

## 2. 実装 Phase 分割（/flow:tdd）
### Phase 1: Zod スキーマ + 検証
- 対象: schema.ts。slug 一意/url スキーム・内部アドレス禁止/secretEnv 直書き検出/provider 必須 ID。
- テスト: 正常 TOML / 不正 slug / 内部 URL / 秘密直書き / provider 不足。
### Phase 2: ローダ
- 対象: load.ts（ファイル Read + パース + 検証集約）。
- テスト: fixture TOML から ServiceDescriptor[]、不正 service は除外 + errors 集約、onlyActive フィルタ。

## 3. 依存関係順序
types → schema.ts → load.ts → index.ts

## 4. 既存ファイルへの影響
- リポ直下に `services.toml` 新規（初期 hana-memo）。`.gitignore` で除外しない（SoT として版管理、秘密は含まない）。

## 5. 横断フォルダへの追加・変更
collection/dashboard/service-detail が loadServices を利用。

## 6. リスク・注意点
- **秘密直書き検出**（O25）: `pk_`/`sk_`/`Bearer ` 等のパターンを値に検出したらエラー（env キー名のみ許可）。
- **SSRF 予防**（[論点-004]）: url の内部アドレス（localhost/127/169.254/10./192.168）を検証で禁止。
- **TOML パースエラー**: ファイル全体が壊れている場合は明示エラー（起動失敗）。

## 7. 完了の定義（DoD）
- [ ] Phase 1-2 完了、検証・ロードの unit green
- [ ] 秘密直書き / 内部 URL がエラーになる（セキュリティ）
- [ ] services.toml 初期版（hana-memo）がロードできる
- [ ] E2E: 標準 UI なし → dashboard の E2E でロード結果の表示を間接カバー

## 8. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成 | /flow:feature |
