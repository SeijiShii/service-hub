# 単体テストレポート: dashboard admin-ux

## 実施日時
2026-05-28 12:06 (JST)

## テスト実行環境
- vitest 2.1.9 (happy-dom + @testing-library/react)

## テスト結果

| # | テストケース | ファイル | 結果 |
|---|---|---|---|
| UX-N1 | DashboardView ヘッダに `[data-testid="admin-link"]` が見え、href="/admin"、label="管理" | DashboardView.test.tsx | ✓ |
| DA-N4 既存 | ヘッダ up/down サマリ + 行表示 | DashboardView.test.tsx | ✓ |
| 他 既存 | DashboardView 他既存テスト | DashboardView.test.tsx | ✓ |
| UX-N3 | ServicesAdminView に 3 セクション (basic/providers/service-info) が存在 | ServicesAdminView.test.tsx | ✓ |
| AF-1 既存 | 既存サービスを行で一覧表示 (data-slug/data-status) | ServicesAdminView.test.tsx | ✓ |
| AF-2 既存 | フォーム入力 → 登録で onSave に descriptor (getByLabelText/getByRole で取れる = 構造保持) | ServicesAdminView.test.tsx | ✓ |
| AF-3 既存 | 退役ボタン → onRetire(slug) | ServicesAdminView.test.tsx | ✓ |
| AF-4 既存 | 編集モードで slug readonly + ボタン「更新」 | ServicesAdminView.test.tsx | ✓ |

## 追加テストケース
- UX-N1 (admin-link): SPEC §7.2 「DashboardView ヘッダに admin への anchor」検証
- UX-N3 (sections): SPEC §7.2 「`<fieldset>` で 3 セクション分け」検証

## サマリー
| 項目 | 値 |
|---|---|
| 本 revise 関連の新規テスト | 2 (UX-N1 + UX-N3) |
| 全スイート合計 | 179 |
| 成功 | 179 |
| 失敗 | 0 |
| 成功率 | 100% |
| typecheck | exit 0 |
| 既存テスト破壊 | なし (getByLabelText/getByRole resilient、構造保持) |
