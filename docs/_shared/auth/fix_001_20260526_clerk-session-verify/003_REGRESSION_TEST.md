# リグレッションテスト計画: Clerk セッション検証

> **入力**: `./001_ROOT_CAUSE.md`, `./002_FIX_PLAN.md`
> **最終更新**: 2026-05-26

## 1. 再発防止テストケース
### 1.1 直接原因を捉えるテスト（修正前 fail / 修正後 pass）
| ID | 対象 | 入力 | 期待 |
|---|---|---|---|
| AS-N1 | `getAuthFromRequest` | `__session` cookie あり + verify が `{sub: "user_x"}` | `{ userId: "user_x" }` |
| AS-E1 | `getAuthFromRequest` | cookie 無し | `{ userId: null }`（→ requireSeiji 401） |
| AS-E2 | `getAuthFromRequest` | verify が throw（期限切れ/改ざん） | `{ userId: null }`（フェイルクローズ） |
| **AS-S1（セキュリティ）** | `getAuthFromRequest` | `x-clerk-user-id: user_seiji` ヘッダのみ（cookie 無し） | `{ userId: null }`（**ヘッダ偽装を信頼しない**） |

### 1.2 修正後に必ず通るテスト
| ID | 対象 | 期待 |
|---|---|---|
| AS-N2 | `readSessionToken` | `cookie: "__session=JWT; other=x"` から `JWT` を抽出 |

## 2. 類似境界条件テスト
| ID | 境界 | 期待 |
|---|---|---|
| AS-B1 | cookie ヘッダが配列/undefined | null 安全 |
| AS-B2 | `__session=` 空値 | null |

## 3. 既存テスト維持確認
| ID | 既存テスト | 維持理由 |
|---|---|---|
| — | `guard.test.ts`（requireSeiji/isAllowedUser/isPublicCronPath） | 純ロジック未変更 |

## 4. Mock 方針
| 対象 | 固定値 | 理由 |
|---|---|---|
| `verify`（VerifyFn） | 注入で `{sub}` 返却 or throw | `@clerk/backend` のネットワーク JWKS を回避し決定的に |

## 5. カバレッジ目標
- `src/auth/server.ts` 修正行 100%。

## 6. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版 | /flow:fix |
