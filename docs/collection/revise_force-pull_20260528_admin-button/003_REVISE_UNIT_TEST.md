# collection 単体テスト計画（強制プルボタン）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, 既存 `api/admin/services.test.ts` の vi.mock パターン
> **最終更新**: 2026-05-28

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| FP-N1 | `api/admin/collect.ts` POST 認証成功 | Clerk 認証済 POST | 200 + CollectionRun 形（id/startedAt/finishedAt/status/servicesCount/errors?） |
| FP-N2 | runCollection が呼ばれる | 認証済 POST | mock runCollection が 1 回呼ばれる |
| FP-N3 | View ボタン click | onForcePull プロップ + ボタン押下 | onForcePull が 1 回呼ばれる |
| FP-N4 | View 結果サマリ表示 | forcePullState に result を渡す | services_count / errors 件数が DOM に出る |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待振る舞い |
|---|---|---|---|
| FP-E1 | 未認証 POST | Clerk セッションなし | 401 + `{error:"unauthorized"}` / runCollection 呼ばれない |
| FP-E2 | GET メソッド | GET /api/admin/collect | 405 method_not_allowed |
| FP-E3 | runCollection が throw | 内部例外 | 500 + `{error:"internal"}`（client に詳細出さない） |
| FP-E4 | View 実行中の連打防止 | `running=true` の状態でボタン | disabled = true（onForcePull 呼ばれない） |

### 1.3 境界値
| ID | 対象 | 境界 | 期待振る舞い |
|---|---|---|---|
| FP-B1 | servicesCount=0（services テーブル空） | 認証済 POST、レジストリ空 | 200 + servicesCount=0 / errors=[] |

## 2. 修正テストケース
なし（既存テスト変更なし）。

## 3. 削除テストケース
なし。

## 4. リグレッション強化
- 既存 `api/admin/services.test.ts`（registry CRUD）が引き続き green。
- 既存 collection runner テスト（`src/features/collection/runner.test.ts`）に影響なし（runCollection は変更しない）。
- `api/cron/collect.ts` は変更なしのため既存挙動（CRON_SECRET 認証）維持。

## 5. Mock 方針差分
| 対象 | 前回 | 今回 | 理由 |
|---|---|---|---|
| auth | services.test と同パターン (`vi.hoisted` + `vi.mock("../../src/auth/index.js")` で `authed` フラグ切替) | 同パターン再利用 | 一貫性 |
| db / providers / collection.runner | services.test ではモック不要だった | `runCollection` を vi.mock し、呼ばれた回数 + 戻り値モックを検証 | エンドポイントの責務は orchestration のみ、本物の DB 操作はテスト不要 |

## 6. カバレッジ目標
| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | 既存継承 |
| 分岐 | 70% | 認証/メソッド/エラーの分岐を網羅 |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 | /flow:revise |
