# 修正計画: admin-form 編集保存 + UX 3 件

> **入力**: `./000_調査レポート.md`、`./001_ROOT_CAUSE.md`、Step 2 実装
> **最終更新**: 2026-05-28

---

## 1. 修正対象ファイル

| ファイル | 修正内容 | before 抜粋 | after 抜粋 |
|---|---|---|---|
| `src/features/admin/ServicesAdminView.tsx` | (#3) submit を async + await onSave + saving 状態 props 連携。成功時のみ form clear、失敗時は form 保持。saving spinner / success / error の UI 反映 | `submit = (e) => { e.preventDefault(); onSave(d); setF({...empty}); setEditing(false); }` | `submit = async (e) => { e.preventDefault(); const ok = await onSave(d); if (ok) { setF({...empty}); setEditing(false); } }` + Props `saveState?: SaveState` で saving/success/error 表示 |
| `src/features/admin/ServicesAdminView.tsx` | (#1) endpoint input に placeholder + help text | `<input value={f.endpoint} ...>` | `<input value={f.endpoint} placeholder="https://example.com/api/hub/service-info (フル URL)" ...>` + 「フル URL を指定」help span |
| `src/features/admin/ServicesAdminView.tsx` | (#2) subdomain input に placeholder + help text。dead field と明示 | `<input value={f.subdomain} ...>` | `<input value={f.subdomain} placeholder="(任意・現状未使用)" ...>` + 「現状ビジネス logic 未参照、将来公開 URL 表記の予約 field」help span |
| `src/features/admin/ServicesAdminView.tsx` | (#4) 「退役」→「削除」、aria-label/confirm 文言も統一 | `<button onClick={() => onRetire(s.slug)}>退役</button>` | `<button onClick={() => onRetire(s.slug)}>削除</button>` |
| `src/features/admin/ServicesAdminPage.tsx` | (#3) `onSave` の戻り値を `Promise<boolean>` 化。`saveState: SaveState` を useState で管理し View に渡す | `onSave = async (d) => { ... if (!r.ok) setError(...); return; ... await reload(); }` | `onSave = async (d) => Promise<boolean>` + setSaveState(saving/success/error)。500ms 後に success を自然 fadeout |
| `src/features/admin/saveState.ts` (新規) | `SaveState` 型を定義 (`idle / saving / success / error`) | (新規) | `export type SaveState = { kind: "idle" } | { kind: "saving" } | { kind: "success" } | { kind: "error"; message: string }` |
| `api/admin/services.ts` | (#3 副、安全網) PATCH 失敗時 stderr に Method/slug/body keys/status をログ (Vercel function logs で実機調査可能化) | `catch (e) { console.error("admin/services error:", e); ... }` | 追加: PATCH 経路で `console.log("admin/services PATCH:", { slug, bodyKeys: Object.keys(req.body ?? {}) })` |
| `src/features/admin/ServicesAdminView.test.tsx` | (#3) saving state + success + error の UI テスト追加。「退役」→「削除」テスト修正 | AF-3 「退役」 | AF-3 「削除」 + 新規 SAVE-N1 (saving spinner) / SAVE-N2 (success 表示) / SAVE-E1 (error 保持) / FORM-N1 (endpoint placeholder) / FORM-N2 (subdomain help) |

## 2. 修正範囲の限定方針

- **根本原因にピンポイント** (UI 状態 4 化 + Props 連携) + **3 件併合 UX** (#1/#2/#4)
- 副作用 risk 最小化: api/admin/services.ts は **stderr ログ追加のみ** (handler logic 変更なし、回帰なし)
- subdomain は dead field だが**削除しない** (DB migration を避ける、help text で意図明示に留める。将来撤去は別 revise)

## 3. 副作用なき確認方法

- 既存テスト維持: AF-1 (一覧) / AF-2 (POST 登録) / AF-4 (slug readonly) / UX-N3 (3 fieldset) / UX-N4 (back-link) / api/admin/services.test.ts 9 件全て pass
- 追加テスト: 003_REGRESSION_TEST.md 参照
- 手動確認項目 (実機 prod、user 担当):
  1. /admin で新規 POST → 「保存しました」表示 + table 反映
  2. /admin で既存 PATCH → saving → 「保存しました」表示 + table 反映 + 再編集時に新値表示
  3. /admin で 「削除」 → table から消える
  4. endpoint placeholder / subdomain help が表示
  5. (debug log) Vercel function logs に PATCH エントリが出ること

## 4. リリース戦略

- **方式**: 即時 (High severity、即修正 → 5th deploy)
- **理由**: 単一ユーザー内部ツールで影響範囲が seiji 1 人だが、admin form は今後新サービス追加で必須経路。試料は本セッションで実機確認可能 (4th deploy 直後)
- **段階展開**: 不要 (single user)
- **フィーチャーフラグ**: 不要

## 5. ロールバック方針

- ✅ コード revert で戻せる (3 file 修正 + 1 file 新規 + 1 file テスト追加、commit 単位で revert 可能)
- DB ロールバック: 無 (schema 変更なし、subdomain は help text のみ)
- 手順: `git revert <fix commit hash>` → 再デプロイ

## 6. 関係者通知

- 通知先: seiji (single user) — 本 fix セッション完了 + 5th deploy 後の実機確認依頼
- 通知タイミング: 5th deploy 直後

## 7. DoD

- [ ] 該当バグが再現しない (saving feedback 表示で「保存されない」誤認解消)
- [ ] 003 REGRESSION_TEST 全成功
- [ ] 既存テスト破壊なし (admin form 既存 7 件 + admin/services 9 件 = 16 件継続)
- [ ] typecheck clean
- [ ] subdomain field の意図が UI から読める
- [ ] endpoint placeholder で full URL 入力が明確
- [ ] 「退役」→「削除」全箇所統一
- [ ] (Postmortem) async UX 観点を flow-suite に補強する CF entry を提案 (本 fix 内では PJ ドキュメント記録、flow-suite 反映は別 [flow] セッション)

## 8. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版 | /flow:fix |
