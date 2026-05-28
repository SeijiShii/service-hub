# リグレッションテスト計画: admin-form 編集保存 + UX 3 件

> **入力**: `./001_ROOT_CAUSE.md`、`./002_FIX_PLAN.md`
> **最終更新**: 2026-05-28

---

## 1. 再発防止テストケース

### 1.1 直接原因を捉えるテスト (async UX 4 状態)
| ID | 対象 | 入力 | 期待 (修正前: fail / 修正後: pass) |
|---|---|---|---|
| SAVE-N1 | ServicesAdminView saveState=saving | `saveState={ kind: "saving" }` を Props で渡す | submit button disabled + 「保存中…」表記 |
| SAVE-N2 | ServicesAdminView saveState=success | `saveState={ kind: "success" }` を渡す | `[data-testid="save-status"]` に「保存しました」表示 + 緑系色 |
| SAVE-E1 | ServicesAdminView saveState=error | `saveState={ kind: "error", message: "http_500" }` を渡す | `[data-testid="save-status"]` に「保存に失敗しました (http_500)」表示 + 警告色、form は保持される (clear されない) |
| SAVE-N3 | ServicesAdminView submit 成功 → form clear | onSave が Promise<true> を返す mock | submit 後 form が空 + editing=false |
| SAVE-N4 | ServicesAdminView submit 失敗 → form 保持 | onSave が Promise<false> を返す mock | submit 後 form 値が保持される + editing 状態維持 |

### 1.2 修正後に必ず通るテスト (UX 3 件)
| ID | 対象 | 期待 |
|---|---|---|
| FORM-N1 | endpoint input | `placeholder="https://example.com/api/hub/service-info"` + 直下に help text「フル URL で入力」が表示 |
| FORM-N2 | subdomain input | `placeholder="(任意・現状未使用)"` + help text「現状ビジネス logic 未参照、将来予約」表示 |
| WORD-N1 | actions 列 button | label が「削除」(「退役」が消えていることも確認) |

## 2. 類似境界条件テスト

| ID | 境界条件 | 期待振る舞い |
|---|---|---|
| SAVE-B1 | onSave が Promise<boolean> でなく Promise<void> を返す (旧 API) | typecheck error → 型シグネチャ強制で API 契約を守る |
| SAVE-B2 | saveState.kind="success" が 500ms 後に idle に fadeout | (Page 側 setTimeout で実装) ユニットでは固定 SaveState で表示のみ検証、fadeout タイミングは別 (検証不要) |
| SAVE-B3 | 連打 (saving 中に再 submit) | submit button disabled で onSave 呼び出し抑止 (既存の force-pull TFP-E4 パターン踏襲) |

## 3. 既存テスト維持確認
| ID | 既存テスト | 維持理由 |
|---|---|---|
| AF-1 | サービス一覧表示 | 変更なし |
| AF-2 | POST 登録 → onSave 呼び出し | 引き続き onSave 呼び出しを検証 (戻り値 Promise<boolean> へ型強化、AF-2 は値検証ではなく呼び出し検証なので壊れない) |
| AF-3 | 「退役」→ onRetire(slug) | **「削除」に修正**、onRetire の動作は不変 |
| AF-4 | 編集モードで slug readonly | 変更なし |
| UX-N3 | 3 fieldset 存在 | 変更なし |
| UX-N4 | back-link 表示 | 変更なし |
| api/admin/services.test.ts 全 9 件 | PATCH/DELETE/POST 全 handler | 変更なし (stderr ログ追加のみ、handler logic は不変) |

## 4. E2E シナリオ追加 (実機 prod 担当、自動化は本 fix 外)

| シナリオ ID | バグ再現 → 修正後の確認 |
|---|---|
| E-SAVE-1 | 既存サービス編集 → 「更新」 → 「保存しました」表示 → reload で値反映確認 |
| E-DEL-1 | 「削除」ボタン押下 → table から行が消える |
| E-ENDPOINT-1 | endpoint 入力時 placeholder が full URL を示唆 |

## 5. Mock 方針

| 対象 | 固定値 | 理由 |
|---|---|---|
| onSave / onRetire | vi.fn() で Promise<boolean> や (slug) => void | View Props の単純呼び出し検証 |
| 時刻 | 不要 (saveState の表示は時刻に依存しない、success fadeout は Page 側、本 fix は表示のみ検証) | — |
| fetch | 不要 (Page-level の fetch テストは scope 外、handler 側 test (services.test.ts) で代替) | — |

## 6. カバレッジ目標

- 修正コード行: 100% (新規 saveState.ts + View submit + Props 連携)
- 関連境界条件: 90%+ (idle/saving/success/error の 4 状態網羅)

## 7. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版 | /flow:fix |
