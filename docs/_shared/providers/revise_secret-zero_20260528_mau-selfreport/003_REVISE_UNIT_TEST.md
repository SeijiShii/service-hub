# _shared/providers 単体テスト計画（秘密ゼロ化）

> **入力**: 001_REVISE_SPEC / 002_REVISE_PLAN / 既存 src/providers/adapters.test.ts, src/types/types.test.ts
> **最終更新**: 2026-05-28

---

## 1. 追加テストケース
| ID | 対象 | 入力 | 期待 |
|---|---|---|---|
| PV-N1 | service-info adapter（共通鍵あり） | `env.HUB_SERVICE_INFO_SECRET` 設定 + metrics に mau | Authorization: Bearer 付与、`mau` を provider="service-info" で emit |
| PV-N2 | service-info adapter（共通鍵なし） | env 未設定 | Authorization ヘッダなしで叩く（[D20260528-011]）、200 ならメトリクス emit |
| PV-N3 | service-info の auth エラー | サービスが 401 | error 計上で graceful（metrics 空 + error="auth"） |
| PV-N4 | mau の出所 | service-info metrics に mau=1234 | `{provider:"service-info", key:"mau", value:1234}` を含む |

## 2. 修正テストケース
| ID | 対象 | 修正前 | 修正後 |
|---|---|---|---|
| M-01 | adapters.test.ts service-info | per-service `ref.secretEnv` → env を Bearer | 共通 `HUB_SERVICE_INFO_SECRET` → Bearer |
| M-02 | types.test.ts | ServiceDescriptor に clerk.secretEnv / serviceInfo.secretEnv を含む例 | secretEnv なしの例に更新（env-only 秘密の趣旨は維持: providers に値を持たない） |

## 3. 削除テストケース
| ID | 対象 | 理由 |
|---|---|---|
| D-01 | createClerkAdapter のテスト | adapter 撤去（MAU は service-info 自己申告へ） |

## 4. リグレッション強化
- collection runner が service-info の mau を usage_snapshots に保存できる（既存 runner テストで provider 横断の集約が壊れない）。
- registry schema が secretEnv なしの descriptor を受理し、秘密直書き検出（SECRET_LITERAL）は他フィールドで引き続き発火。

## 5. Mock 方針差分
| 対象 | 前回 | 今回 |
|---|---|---|
| service-info adapter | env に per-service secret 名を渡す | env に HUB_SERVICE_INFO_SECRET |

## 6. カバレッジ目標
行 80% / 分岐 70%（既存継承）。

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 | /flow:revise |
