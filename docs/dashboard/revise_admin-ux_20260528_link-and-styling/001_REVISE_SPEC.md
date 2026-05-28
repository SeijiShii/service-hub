# dashboard 変更仕様書（admin への導線追加 + admin フォームのスタイリング）

> **改修種別**: UI 改善（orphan 解消 + スタイル不在の解消）
> **issue / slug**: admin-ux / link-and-styling
> **基準 SPEC**: `../001_dashboard_SPEC.md`
> **最終更新**: 2026-05-28
> **タグ**: ui, auth-required（admin 導線・Clerk ゲート内）
> **関連観点**: perspectives O55（新規 UI ページは導線とセットで作る、orphaned page 禁止）/ design-system（ボイス&コピー含むトークン適用）

---

## 1. 変更概要

(1) ダッシュボード（`/`）から **`/admin` への導線リンク**を追加し、orphaned page を解消する（O55 / CF-20260527-007）。
(2) `/admin` のサービス登録フォームに**プロジェクトのデザインシステム（Tailwind ユーティリティ + 既存ダーク/コックピット theme）に揃ったスタイル**を当てて、入力欄が縦に整列し、ラベル・余白・グループ化（基本情報 / Providers / Service-info）・ボタン目立たせを行い、操作可能な UI にする。機能変更なし、見た目だけ。

## 2. 変更前 vs 変更後

### 2.1 UI 変更
| 対象 | 変更前 | 変更後 |
|---|---|---|
| ダッシュボード `/` ヘッダ | サービス一覧のみ、admin 導線なし（直 URL でしか到達不能） | ヘッダ右側等に **「管理」リンク**（`/admin` へ）+ 既存 Clerk UserButton と整列 |
| `/admin` フォーム | input/select/button が横に折り返しなく並び、ラベル inline・スペースなし・スタイル不在で操作困難（スクショ確認済） | 縦並びフォーム + ラベル上配置 + 適切な余白/枠/フォーカス状態 + セクション分け（**基本情報** / **Providers** / **Service-info**）+ 主ボタンを accent カラーで目立たせる |
| `/admin` 一覧テーブル | 素の `<table>` | スタイル付き（行罫線・hover・status バッジ）|

### 2.2 入出力変更
なし（API・data・props・onSubmit ロジックは無変更、見た目のみ）。

### 2.3 データモデル変更
なし。

### 2.4 バリデーション・エラー変更
なし（既存の Zod 検証・401/409 ハンドリングは無変更）。

## 3. 影響範囲
| 対象 | 影響度 | 説明 |
|---|---|---|
| `src/features/dashboard/DashboardView.tsx`（or DashboardPage） | 中 | ヘッダに `/admin` リンク追加 |
| `src/features/admin/ServicesAdminView.tsx` | 高 | スタイリング適用（要素間隔・ラベル位置・セクション・テーブル装飾） |
| `src/main.tsx` ナビ | 低 | 必要なら共通ヘッダコンポーネント化（任意・最小は DashboardView 内で完結可） |
| design-system.md / globalCSS / Tailwind 設定 | 低 | 既存 token を使うのみ、新規追加なし |

## 4. 後方互換性
- ✅ **完全互換**。機能・データ・API 不変、見た目のみ。

## 5. ロールバック方針
- ✅ コード revert で戻せる（UI 変更のみ）。

## 6. リリース戦略
- 一括。デプロイで完了。

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC
- **UC-AL1 dashboard → admin 導線**: 認証済 seiji がダッシュボード `/` を開く → ヘッダ右側に「管理」リンクが見える → クリックで `/admin` に遷移。Clerk gated route のため未認証では到達不可（既存の Clerk gate がそのまま保護）。
- **UC-AS1 admin フォーム視認**: `/admin` で入力欄が縦に整列・ラベル上配置・適切な余白・セクション境界が見える → 入力しやすい・登録ボタンが目立つ。

### 7.2 入出力
- DashboardView ヘッダ部に anchor: `<a href="/admin" data-testid="admin-link">管理</a>`（簡素、design-system のリンク token に揃える）。
- ServicesAdminView の HTML 構造を**保持しつつクラスを付与**（form を `flex flex-col gap-4`、各 label を `flex flex-col gap-1`、input を `border rounded px-3 py-2 bg-…` 等）。`<fieldset>` でセクション分け（基本情報 / Providers / Service-info）。

### 7.3 データモデル
変更なし。

### 7.4 バリデーション・エラー
変更なし（onChange/onSubmit ロジック・error 表示はそのまま、見た目だけ改善）。

### 7.5 機能固有 NFR + 既存連携
- design-system.md（concept §1.2 → docs/design/design-system.md）のダーク/コックピット theme に揃える（既存 DashboardView と統一）。
- a11y: label と input の紐付け（`<label>` で囲う既存構造を維持）、フォーカス可視。

## 8. タグ別追加項目
- **auth-required**: admin リンクは Clerk gate 内ルート前提。未認証ユーザーはダッシュボードに到達できないので導線が露出することはない（既存 main.tsx の `SignedIn` 内）。

## 9. 未決事項
現時点で論点なし（2026-05-28）。共通ヘッダコンポーネント化は最小実装後に検討（任意）。

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成（dashboard→admin 導線 + admin フォーム styling） | /flow:revise |
