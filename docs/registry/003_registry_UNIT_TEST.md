# registry 単体テスト計画

> **入力**: `./001_registry_SPEC.md`, `./002_registry_PLAN.md`
> **最終更新**: 2026-05-26

---

## 1. テストケース一覧（fixture TOML）
### 1.1 正常系
| ID | 対象 | 入力 | 期待 |
|---|---|---|---|
| RG-N1 | validateServicesToml | 正常 TOML(2 service) | 2 件の ServiceDescriptor、errors=[] |
| RG-N2 | loadServices(onlyActive) | active+paused 混在 | active のみ |
| RG-N3 | providers パース | vercel+neon+clerk | ProviderRefs 正しく構築 |
### 1.2 異常系（検証）
| ID | 対象 | 条件 | 期待 |
|---|---|---|---|
| RG-E1 | slug | 重複 slug | 当該除外 + errors |
| RG-E2 | slug | `Hana Memo`(不正文字) | errors |
| RG-E3 | url | `http://127.0.0.1`(内部) | errors（SSRF 予防 [論点-004]） |
| RG-E4 | secretEnv | 値に `sk_live_xxx`(秘密直書き) | **errors（O25）** |
| RG-E5 | TOML | 壊れた TOML | パースエラー throw |
### 1.3 境界値
| ID | 対象 | 境界 | 期待 |
|---|---|---|---|
| RG-B1 | loadServices | 空 services.toml | 空配列（エラーなし） |
| RG-B2 | providers | provider なしの service | ping のみ対象（providers 空でも可） |

## 2. Mock 方針
| 対象 | 方針 |
|---|---|
| ファイル読み取り | fixture 文字列を validateServicesToml に直接渡す（load は fs mock） |

## 3. カバレッジ目標
| 種別 | 目標 |
|---|---|
| 行 | 85% |
| 分岐 | 80%（検証分岐網羅、特に E3/E4 セキュリティ必須） |

## 4. 既存ユーティリティ依存
types, Zod, TOML パーサ。

## 5. テスト実行環境
Vitest。`npm run test`。

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成 | /flow:feature |
