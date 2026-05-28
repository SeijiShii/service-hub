# 単体テストレポート: admin-form 編集保存 + UX 3 件

## 実施日時
2026-05-28 13:55 (JST)

## テスト実行環境
- vitest 2.1.9 (happy-dom + @testing-library/react)
- `waitFor` で async submit の microtask + state update flush

## テスト結果

| # | テストケース | ファイル | 結果 |
|---|---|---|---|
| SAVE-N1 | saveState=saving → submit button disabled + 「保存中…」 | ServicesAdminView.test.tsx | ✓ |
| SAVE-N2 | saveState=success → save-status に「保存しました」+ data-status="success" | ServicesAdminView.test.tsx | ✓ |
| SAVE-E1 | saveState=error → save-status に「保存に失敗」+ message + data-status="error" | ServicesAdminView.test.tsx | ✓ |
| SAVE-N3 | onSave が true を返す → form clear + editing=false (waitFor で flush) | ServicesAdminView.test.tsx | ✓ |
| SAVE-N4 | onSave が false を返す → form 値が保持される | ServicesAdminView.test.tsx | ✓ |
| FORM-N1 | endpoint input: placeholder + endpoint-help「フル URL」 | ServicesAdminView.test.tsx | ✓ |
| FORM-N2 | subdomain input: placeholder「未使用」+ subdomain-help「未参照」 | ServicesAdminView.test.tsx | ✓ |
| WORD-N1 (兼 AF-3) | 「退役」消失 + 「削除」button click → onRetire(slug) | ServicesAdminView.test.tsx | ✓ |
| 既存 UX-N3 | 3 fieldset (basic/providers/service-info) 存在 | ServicesAdminView.test.tsx | ✓ |
| 既存 AF-1 | サービス一覧 | ServicesAdminView.test.tsx | ✓ |
| 既存 AF-2 | フォーム入力 → 登録 → onSave に descriptor | ServicesAdminView.test.tsx | ✓ |
| 既存 AF-4 | 編集 → slug readonly + 「更新」 | ServicesAdminView.test.tsx | ✓ |
| 既存 UX-N4 | back-link 表示 | ServicesAdminView.test.tsx | ✓ |
| 既存 api/admin/services.test.ts 9 件 | POST/PATCH/DELETE/GET handler 全 9 件 | api/admin/services.test.ts | ✓ (handler logic 不変、stderr ログ追加のみ) |
| 既存 api/admin/collect.test.ts 5 件 | force-pull endpoint | api/admin/collect.test.ts | ✓ (無変更) |

## 追加テストケース (本 fix 由来 7 件)

| # | 対象 | テストケース | 追加理由 |
|---|---|---|---|
| 1 | View saving 状態 | SAVE-N1 | submit button disabled + label の検証、async UX 4 状態の 1 (root cause 直接対応) |
| 2 | View success 状態 | SAVE-N2 | 「保存しました」表示 + data-status 属性、UI feedback gap 解消 |
| 3 | View error 状態 | SAVE-E1 | 「保存に失敗」+ message 表示、エラー埋もれ問題解消 |
| 4 | submit 成功時 form clear | SAVE-N3 | await + 成功時のみ clear の振る舞い検証 (regression test) |
| 5 | submit 失敗時 form 保持 | SAVE-N4 | 失敗時は再試行可能であることの検証 (regression test) |
| 6 | endpoint UX help | FORM-N1 | 「フル URL」入力意図の明示確認 (#1) |
| 7 | subdomain UX help | FORM-N2 | 「現状未参照」dead field の明示確認 (#2) |

## サマリー

| 項目 | 値 |
|---|---|
| 本 fix 関連の新規テスト | 7 (SAVE 5 + FORM 2、WORD は AF-3 更新で count 不変) |
| 全スイート合計 | 203 |
| 成功 | 203 |
| 失敗 | 0 |
| 成功率 | 100% |
| typecheck | exit 0 |
| 修正コード行カバレッジ目標 | 100% (新規 saveState.ts + View submit 4 分岐 + Page onSave 4 分岐すべてテストでカバー) |
| 既存テスト破壊 | なし (onSave 型変更は callsite を一括更新で吸収) |

## 手動確認項目 (5th deploy 後、seiji 担当)

1. ✋ /admin で新規 POST → 「✓ 保存しました」表示 + table 反映 + 2.5 秒後消える
2. ✋ /admin で既存 PATCH → 「保存中…」 → 「✓ 保存しました」 → 再編集で新値表示
3. ✋ /admin で 「削除」 → table から消える
4. ✋ endpoint placeholder「https://example.com/api/hub/service-info」+ help「フル URL を指定」表示
5. ✋ subdomain placeholder「(任意・現状未使用)」+ help「将来の公開 URL 表記用予約 field」表示
6. ✋ 「退役」が消えて「削除」になっている
7. ✋ (debug log) Vercel function logs に `admin/services PATCH slug=...` エントリ出現
