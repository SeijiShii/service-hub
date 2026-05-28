# dashboard 変更計画書（戻る link + 「今すぐ pull」を dashboard へ relocation）

> **入力**: `./001_REVISE_SPEC.md`、既存 `src/features/dashboard/*` + `src/features/admin/*`
> **最終更新**: 2026-05-28

---

## 1. 既存ファイル変更一覧
| ファイル | 変更内容 | リスク | 関連 SPEC § |
|---|---|---|---|
| `src/features/dashboard/DashboardView.tsx` | Props 拡張 (`onForcePull?`, `forcePullState?`)。ヘッダ最終更新表示の**直下**に `<section data-section="force-pull">` を追加。スタイルは header 内に溶け込む控えめ inline (admin より小ぶり、border なし or 細枠) | 低 | §7.1/§7.2/§8 |
| `src/features/dashboard/DashboardPage.tsx` | force-pull state (`useState<ForcePullState>`) + `onForcePull` callback を**新設**。POST `/api/admin/collect` を `credentials: include` で呼び結果を state に格納 (ServicesAdminPage から移管) | 低 | §7.2 |
| `src/features/admin/ServicesAdminView.tsx` | force-pull section を**削除** (`<section data-section="force-pull">` ブロック)。Props から `onForcePull?` / `forcePullState?` を**除去**。ヘッダ (h1 直前 or 直後) に `<nav><a href="/" data-testid="back-link">← ダッシュボード</a></nav>` を追加、style は admin-link と対称 | 低 | §7.1/§7.2 |
| `src/features/admin/ServicesAdminPage.tsx` | force-pull state + `onForcePull` callback + ServicesAdminView 渡し から**除去** | 低 | §7.2 |
| `src/features/dashboard/DashboardView.test.tsx` | TFP-N3/N4/E4 (force-pull dashboard 版) + UX-N2 (back-link 検証は admin 側) を追加。`vm()` ヘルパに `forcePullState` 既定追加 | 低 | §7.1/§7.2 |
| `src/features/admin/ServicesAdminView.test.tsx` | FP-N3/N4/E4 を**削除** (dashboard で検証)。UX-N4 (back-link が表示・href="/"・label="← ダッシュボード") を追加 | 低 | §7.1/§7.2 |
| `src/features/admin/ServicesAdminPage.tsx` (再掲) | — | — | — |

## 2. 新規ファイル一覧
なし (既存型 `ForcePullState` を共通化する場合は `src/features/common/forcePull.ts` 等への抽出も検討可、ただし本 revise では DashboardView の Props 内 import で十分 = `ServicesAdminView` から型 re-export か `forcePullTypes.ts` を新設して両方が import の 2 択。共通化は **後者を採用**して循環依存を避ける)。
- (オプション) `src/features/common/forcePullState.ts` (新規) — `ForcePullState` 型のみ。Dashboard と (除去前の) Admin が依存していた型の共通化。LOC ~10。

> 判断: 型 1 つだけのため**共通ファイル新設は overkill**。`src/types/index.ts` に統合するか、DashboardView/Page 側で型再定義する方が軽い。**最終: `src/features/dashboard/forcePull.ts` (新規、~12 LOC)** に `ForcePullState` 型 + (将来) helper を置く。ServicesAdminView は本 revise で当該型を使わなくなるため依存ゼロに。

## 3. 削除ファイル一覧
なし (force-pull section の HTML/JSX は dashboard へ移動、admin 側ファイルは残る)。

## 4. マイグレーション要否
- DB スキーマ変更: ❌
- 既存データ変換: ❌
- 設定ファイル変更: ❌
- ストレージパス変更: ❌
- → 005_MIGRATION 不要。

## 5. 実装 Phase 分割

### Phase 1: 型集約 + force-pull を dashboard へ移管 (backend 無変更)
- `src/features/dashboard/forcePull.ts` 新規 (`ForcePullState` 型のみ)。
- `src/features/dashboard/DashboardView.tsx` 拡張 (Props + force-pull section、最終更新の直下に配置)。
- `src/features/dashboard/DashboardPage.tsx` で state + `onForcePull` callback を新設 (POST /api/admin/collect 配線)。
- `src/features/admin/ServicesAdminView.tsx` から force-pull section を除去 + Props 除去。
- `src/features/admin/ServicesAdminPage.tsx` から force-pull state + callback を除去。
- テスト: DashboardView.test.tsx に TFP-N3/N4/E4 追加、ServicesAdminView.test.tsx から FP-N3/N4/E4 削除。
- RED → GREEN → IMPROVE (1 Phase で完結、軽 Phase メイン直接実装で OK)。

### Phase 2: /admin に「戻る」link を追加
- `src/features/admin/ServicesAdminView.tsx` ヘッダに `<nav><a href="/" data-testid="back-link">← ダッシュボード</a></nav>` を追加 (style は admin-link 対称、CSS 変数 `--text` / `--border`)。
- テスト: ServicesAdminView.test.tsx に UX-N4 追加 (back-link 表示 + href + label)。
- RED → GREEN (1 Phase、~10 LOC、軽 Phase)。

**両 Phase 軽 (≤ 4 ファイル変更 / Phase)、メイン直接実装で OK。サブスキル委託不要**。

## 6. 依存関係順序
Phase 1 (force-pull 移管) → Phase 2 (back-link 追加)。両 Phase は独立に近いが、Phase 1 で admin 側 form の上下 layout が変わる (force-pull section が抜ける) ため、Phase 2 のヘッダ追加と一括で見るために順序実行が確実。

## 7. ロールアウト計画
| ステップ | 内容 | 検証 |
|---|---|---|
| 1 | Phase 1 + Phase 2 実装 | typecheck / vitest pass / build green |
| 2 | `! bash scripts/deploy-prod.sh` 再デプロイ | post-deploy: dashboard `/` で「今すぐ pull」表示確認 / `/admin` で「← ダッシュボード」link 表示確認 |

## 8. リスク・注意点
- DashboardView は最も触る頻度が高いコンポーネント。force-pull section の追加で既存 layout が崩れないよう、最終更新表示と並列 or 直下に配置 (Q2 推奨)。
- ServicesAdminView から Props を除去するため、本 revise の Phase 1 で **Page 側を同時更新**しないと typecheck red。両方を 1 commit にまとめる。

## 9. 完了の定義 (DoD)
- [ ] Phase 1 + 2 完了、typecheck clean、全テスト green
- [ ] dashboard `/` ヘッダに「最終更新」+「今すぐ pull」ボタンが並ぶ
- [ ] `/admin` ヘッダに「← ダッシュボード」back link が表示
- [ ] `/admin` から force-pull section が消える
- [ ] `api/admin/collect.ts` + `api/admin/collect.test.ts` 無変更を確認

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 | /flow:revise |
