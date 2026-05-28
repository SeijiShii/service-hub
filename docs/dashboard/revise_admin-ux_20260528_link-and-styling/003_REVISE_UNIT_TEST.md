# dashboard 単体テスト計画（admin 導線 + admin スタイリング）

> **入力**: 001/002, 既存 `DashboardView.test.tsx` / `ServicesAdminView.test.tsx`
> **最終更新**: 2026-05-28

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待 |
|---|---|---|---|
| UX-N1 | `DashboardView` の admin 導線 | VM 渡し | DOM に `[data-testid="admin-link"]` が見える / `href="/admin"` |
| UX-N2 | `ServicesAdminView` 構造保持（リグレッション） | 既存テスト全件 | 全 green（label/role ベース selector が引き続き動く） |
| UX-N3 | `ServicesAdminView` セクション存在 | render | `<fieldset>` または `[data-section]` で「基本情報」「Providers」「Service-info」3 セクションが見える |

### 1.2 異常系
特になし（styling のみ、ロジック変更なし）。

### 1.3 境界値
特になし。

## 2. 修正テストケース
なし（既存テストは破壊しない設計）。

## 3. 削除テストケース
なし。

## 4. リグレッション強化
- 既存 `ServicesAdminView.test.tsx` の AF-1〜4（一覧/登録 onSave/退役 onRetire/編集 readonly）が引き続き green。
- 既存 `DashboardView.test.tsx` の表示テストが引き続き green。

## 5. Mock 方針差分
なし。

## 6. カバレッジ目標
| 種別 | 目標 |
|---|---|
| 行 | 80% / 分岐 70%（styling 中心なのでロジック変化なし、既存継承で十分） |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 | /flow:revise |
