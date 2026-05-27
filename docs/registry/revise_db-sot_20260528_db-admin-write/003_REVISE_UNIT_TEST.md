# registry 単体テスト計画（DB SoT + admin write）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, 既存 `src/registry/load.test.ts` / `src/db/queries.test.ts`
> **最終更新**: 2026-05-28
> **テスト基盤**: vitest + pglite（既存 `src/db/testdb.ts` パターン）

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| U-01 | `upsertService` | 新 descriptor | services に 1 行、getService で取得可 |
| U-02 | `upsertService`（同 slug 再投入） | 既存 slug + 変更 name | 行は増えず name 更新（updated_at 更新） |
| U-03 | `listServices({onlyActive:true})` | active 2 + paused 1 + retired 1 | active 2 件のみ |
| U-04 | `listServices()`（全件） | 上記 | 4 件 |
| U-05 | `setServiceStatus(slug,'retired')` | active を retire | status=retired、onlyActive から除外 |
| U-06 | `loadServices(db,{onlyActive})` | DB に active あり | ServiceDescriptor[]（toml 非依存） |
| U-07 | admin 検証ヘルパ（正常） | 妥当な descriptor | ok、upsert 実行 |
| U-08 | providers jsonb 往復 | vercel/neon/sentry 識別子 | 保存→取得で同一（型保持） |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待振る舞い |
|---|---|---|---|
| U-10 | 検証ヘルパ | url が内部アドレス（`http://localhost`, `http://10.0.0.1`） | 拒否（SSRF）、errors に publicUrl メッセージ |
| U-11 | 検証ヘルパ | serviceInfo.endpoint が内部アドレス | 拒否 |
| U-12 | 検証ヘルパ | provider 識別子に秘密直書き（`sk_...` / `ey...`） | 拒否（SECRET_LITERAL） |
| U-13 | 検証ヘルパ | slug が不正（`Foo!`, 空） | 拒否（`^[a-z0-9-]+$`） |
| U-14 | `upsertService` 一意 | POST で既存 slug を新規作成扱い | 409 相当（write ヘルパが重複を検出） |
| U-15 | admin API | Clerk セッションなし | 401（検証ロジックは分離してユニットで） |

### 1.3 境界値
| ID | 対象 | 境界 | 期待振る舞い |
|---|---|---|---|
| U-20 | listServices | 0 件 | `[]`（例外なし） |
| U-21 | thresholds 省略 | serviceInfo/thresholds undefined | null 保存 → 取得で undefined |
| U-22 | status 既定 | status 未指定 | 'active' デフォルト |

## 2. 修正テストケース
| ID | 対象 | 修正前 | 修正後 | 理由 |
|---|---|---|---|---|
| M-01 | `src/registry/load.test.ts` | toml 文字列 → `validateServicesToml`/`loadServices(path)` | DB seed → `loadServices(db,opts)`（async）/ `validateServicesToml` テスト削除 | toml 廃止・DB 化 |
| M-02 | collection runner テスト | `loadServices: () => [...]`（同期 mock） | `loadServices: async () => [...]` | sync→async |

## 3. 削除テストケース
| ID | 対象 | 削除理由 |
|---|---|---|
| D-01 | `validateServicesToml` の toml パース系テスト | 関数廃止（toml 撤去） |

## 4. リグレッション強化
- 既存 Zod 検証（publicUrl / envName / slug）が **write 経路で確実に発火**することを U-10〜U-13 で担保（従来は load 時のみ）。
- `loadServices` の onlyActive フィルタ挙動が DB 版でも従来同等（U-03/U-06）。

## 5. Mock 方針差分
| 対象 | 前回 | 今回 | 理由 |
|---|---|---|---|
| DB | （registry は fs read で DB 非依存） | pglite を注入（`src/db/testdb.ts`） | DB 化 |
| Clerk | — | API ルートの認証検証は薄くし、検証ヘルパ（純関数）を中心にユニット。Clerk セッションは API レベルで最小モック | 認証導入 |

## 6. カバレッジ目標
| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | 既存継承 |
| 分岐 | 70% | 検証分岐（SSRF/秘密/slug/一意/認証）を網羅 |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 | /flow:revise |
