# _shared/auth 単体テスト計画

> **入力**: `./001_auth_SPEC.md`, `./002_auth_PLAN.md`
> **最終更新**: 2026-05-26

---

## 1. テストケース一覧（mock Clerk 注入）
### 1.1 正常系
| ID | 対象 | 入力 | 期待 |
|---|---|---|---|
| AU-N1 | requireSeiji | seiji の認証済セッション | `{userId}` 通過 |
| AU-N2 | isAllowedUser | ALLOWED_USER_ID 一致 | true |
### 1.2 異常系
| ID | 対象 | 条件 | 期待 |
|---|---|---|---|
| AU-E1 | requireSeiji | 未認証 | 401 throw |
| AU-E2 | requireSeiji | 認証済・非 seiji | 403 throw |
| AU-E3 | requireSeiji | Clerk 検証エラー | フェイルクローズ（拒否） |
### 1.3 境界値
| ID | 対象 | 境界 | 期待 |
|---|---|---|---|
| AU-B1 | isAllowedUser | ALLOWED_USER_ID 未設定 | false（誰も通さない=安全側） |
| AU-B2 | middleware matcher | `/api/cron/collect` パス | ユーザーゲート対象外（別経路） |

## 2. Mock 方針
| 対象 | 方針 | 理由 |
|---|---|---|
| Clerk SDK | mock（注入） | 実 key 不要でガード分岐検証（O35） |
| 実 Clerk ログイン | feature E2E / release Phase2 | 実フロー確認 |

## 3. カバレッジ目標
| 種別 | 目標 |
|---|---|
| 行 | 85% |
| 分岐 | 80%（401/403/フェイルクローズ/cron除外を網羅） |

## 4. 既存ユーティリティ依存
Clerk SDK（mock）。

## 5. テスト実行環境
Vitest + Clerk mock。`npm run test`。

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成 | /flow:feature |
