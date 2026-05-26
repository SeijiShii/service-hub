# alerts 単体テスト計画

> **入力**: `./001_alerts_SPEC.md`, `./002_alerts_PLAN.md`
> **最終更新**: 2026-05-26

---

## 1. テストケース一覧（db/registry/channel 注入 mock）
### 1.1 正常系
| ID | 対象 | 入力(mock) | 期待 |
|---|---|---|---|
| AL-N1 | evaluate | ping up=0 | down アラート発火 |
| AL-N2 | evaluate | 使用量=85%(threshold warnPct=80) | free_tier_80pct 発火 |
| AL-N3 | evaluate | 使用量 ≥ limit | free_tier_over 発火 |
| AL-N4 | notify | 未通知 1 件 | channel 送信 + notifiedAt 更新 |
### 1.2 異常系 / ライフサイクル
| ID | 対象 | 条件 | 期待 |
|---|---|---|---|
| AL-E1 | evaluate | 同一 rule の未解決あり | 重複発火しない（再通知なし） |
| AL-E2 | evaluate | 前ラン down → 今ラン up | resolvedAt 更新（回復） |
| AL-E3 | notify | channel 送信失敗 | notifiedAt 据え置き（次回再試行） |
### 1.3 境界値
| ID | 対象 | 境界 | 期待 |
|---|---|---|---|
| AL-B1 | evaluate | thresholds 未設定 | down のみ判定、使用量系スキップ |
| AL-B2 | evaluate | 使用量=80%ちょうど | warn 発火（境界含む） |

## 2. Mock 方針
| 対象 | 方針 |
|---|---|
| db（openAlerts/recordAlert/resolve） | mock 注入 |
| registry thresholds | fixture |
| 通知 channel | mock/no-op 注入（送信検証） |

## 3. カバレッジ目標
| 種別 | 目標 |
|---|---|
| 行 | 85% |
| 分岐 | 80%（down/warn/over/重複/回復/送信失敗） |

## 4. 既存ユーティリティ依存
db/registry/types。

## 5. テスト実行環境
Vitest（注入 mock）。`npm run test`。

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成 | /flow:feature |
