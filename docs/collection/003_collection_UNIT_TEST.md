# collection 単体テスト計画

> **入力**: `./001_collection_SPEC.md`, `./002_collection_PLAN.md`
> **最終更新**: 2026-05-26

---

## 1. テストケース一覧（registry/providers/db を注入 mock）
### 1.1 正常系
| ID | 対象 | 入力(mock) | 期待 |
|---|---|---|---|
| CO-N1 | runner | 2 service × 2 adapter 全成功 | upsertSnapshots 呼ばれ status=ok |
| CO-N2 | runner | active のみ収集 | paused/retired は対象外 |
| CO-N3 | cronSecret | 正しい secret | 通過 |
### 1.2 異常系
| ID | 対象 | 条件 | 期待 |
|---|---|---|---|
| CO-E1 | runner | 1 adapter が error | 継続、run.errors に1件、status=partial |
| CO-E2 | runner | 全 adapter error | status=partial/failed（全滅は failed） |
| CO-E3 | runner | db upsert 失敗 | status=failed、run 記録 |
| CO-E4 | cron handler | secret 不一致 | 401 |
### 1.3 境界値
| ID | 対象 | 境界 | 期待 |
|---|---|---|---|
| CO-B1 | runner | 0 active service | status=ok、servicesCount=0 |
| CO-B2 | runner | 同一収集の再実行 | db 冪等で重複なし |

## 2. Mock 方針
| 対象 | 方針 | 理由 |
|---|---|---|
| registry/providers/db | 注入 mock（O35） | runner ロジックを実 I/O なしで検証 |
| 統合（E2E 相当） | mock providers + 実/mock DB で 1 ラン（PLAN §7） | 配線確認 |

## 3. カバレッジ目標
| 種別 | 目標 |
|---|---|
| 行 | 80% |
| 分岐 | 80%（ok/partial/failed + secret 分岐） |

## 4. 既存ユーティリティ依存
registry/providers/db/types、p-limit（並列度）。

## 5. テスト実行環境
Vitest（runner は mock 注入）。`npm run test`。

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成 | /flow:feature |
