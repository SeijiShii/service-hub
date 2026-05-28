# dashboard 変更計画書（admin 導線 + admin スタイリング）

> **入力**: `./001_REVISE_SPEC.md`, 既存 `src/features/dashboard/*` / `src/features/admin/*` / design-system.md
> **最終更新**: 2026-05-28

---

## 1. 既存ファイル変更一覧
| ファイル | 変更内容 | リスク |
|---|---|---|
| `src/features/dashboard/DashboardView.tsx` | ヘッダ右側に `/admin` リンク（anchor）追加。a11y 属性 + data-testid="admin-link" | 低 |
| `src/features/admin/ServicesAdminView.tsx` | HTML 構造はほぼ保持しクラスを付与: form `flex flex-col gap-4` + 各 label の縦並び + input 共通スタイル (`border rounded px-3 py-2 …`) + `<fieldset>` で セクション分け（基本情報 / Providers / Service-info）+ 一覧テーブル装飾（行 hover / status バッジ） + 主ボタン accent カラー | 中（テスト selector が `label`/`role` ベースで書かれているか要確認、書き換えれば既存テスト破壊なし） |
| `src/features/dashboard/DashboardView.test.tsx` | 「管理」リンクが見える + href=`/admin` のテスト追加 | 低 |
| `src/features/admin/ServicesAdminView.test.tsx` | 既存テスト（フォーム送信 / 退役 / 編集）が引き続き green（getByLabelText / getByRole で取れるので破壊しないはず） | 低 |

## 2. 新規ファイル一覧
なし（共通ヘッダコンポーネント化は本 revise では行わない、最小で完了）。

## 3. 削除ファイル一覧
なし。

## 4. マイグレーション要否
- DB / データ / 設定 すべて変更なし → 005_MIGRATION 不要。

## 5. 実装 Phase 分割
### Phase 1: dashboard → admin 導線リンク追加
- `DashboardView` ヘッダに「管理」anchor 追加。
- DashboardView.test.tsx に「admin-link が見える + href=/admin」テスト追加。
- RED→GREEN→IMPROVE。

### Phase 2: admin フォーム styling
- `ServicesAdminView` にクラス付与 + `<fieldset>` セクション分け + テーブル装飾。
- 既存テストが破壊されないことを確認（getByLabelText / getByRole が動く）。
- 視覚確認: dev server + `http://localhost:3000/admin` で操作してみる（手動）。

## 6. 依存関係順序
Phase 1 → Phase 2 が自然（dashboard → admin 遷移して見た目を確認）が、並列実装も可。

## 7. ロールアウト計画
| ステップ | 内容 | 検証 |
|---|---|---|
| 1 | Phase 1-2 実装 + テスト green | typecheck / vitest pass |
| 2 | `! bash scripts/deploy-prod.sh` で本番デプロイ | ダッシュボードに「管理」リンク表示 / `/admin` がスタイル付きで使える |

## 8. リスク・注意点
- **既存テストの selector**: `getByLabelText("slug")` / `getByRole("button", { name: "登録" })` を使っているので、HTML 要素・テキストを変えなければ破壊しない。`<fieldset>` 追加は要素ツリーに挟まるが getByLabelText は親子横断するので OK。
- **design-system 整合**: 既存 DashboardView の theme tokens に揃える（独自配色を作らない）。design-system.md がトークン定義なら参照。

## 9. 完了の定義 (DoD)
- [ ] Phase 1-2 完了、テスト green、typecheck clean
- [ ] ダッシュボードに「管理」リンクが表示され `/admin` に遷移
- [ ] `/admin` フォームが縦並び + ラベル上 + セクション分け + ボタン強調で操作可能
- [ ] 既存 admin 機能テスト（登録/編集/退役）が引き続き green

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 | /flow:revise |
