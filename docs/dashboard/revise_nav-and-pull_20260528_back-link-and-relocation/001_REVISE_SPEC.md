# dashboard 変更仕様書（戻る link + 「今すぐ pull」を dashboard へ relocation）

> **改修種別**: UX 改善 (双方向 navigation + 配置 relocation)
> **issue / slug**: nav-and-pull / back-link-and-relocation
> **基準 SPEC**: `../../001_dashboard_SPEC.md`、`../revise_admin-ux_20260528_link-and-styling/001_REVISE_SPEC.md`、`../../collection/revise_force-pull_20260528_admin-button/001_REVISE_SPEC.md`
> **最終更新**: 2026-05-28
> **タグ**: ui, auth-required

---

## 1. 変更概要

ユーザー指摘で発覚した 2 つの UX 不具合を 1 revise で対応:
1. **逆方向 orphan**: admin-ux revise で順方向 `/` → `/admin` link は張ったが、`/admin` 画面に戻る link が無い (O55 双方向 navigation の逆方向欠落)
2. **「今すぐ pull」の不適切な配置**: force-pull revise でボタンを `/admin` 登録画面に配置したが、本来は「全サービス pull = dashboard の鮮度更新アクション」のため **dashboard top (`/`)** に置くべき。「dashboard で最終更新を確認 → 即 pull」の動線が踏めない問題を解消。

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC ID | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| UC-LU1 (最終更新表示) | dashboard ヘッダに「最終更新」のみ | dashboard ヘッダに「最終更新」+ 「今すぐ pull」ボタン (force-pull section) | 鮮度確認と即時更新を 1 画面で完結 |
| UC-FP1 (強制プル) | `/admin` 画面の上部 force-pull section で実行 | **dashboard `/` 画面**の force-pull section で実行 (admin からは除去) | force-pull は全サービス対象、admin は個別サービス CRUD で責務が違う |
| UC (navigation) | dashboard → /admin: ヘッダ「管理」link / /admin → dashboard: **無し** | dashboard → /admin: 既存、/admin → dashboard: **追加** `<a href="/" data-testid="back-link">← ダッシュボード</a>` | 双方向 navigation で orphan 解消 (O55 逆方向ケース) |

### 2.2 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| DashboardView Props | `vm: DashboardVM` のみ | `vm` + `onForcePull?: () => void` + `forcePullState?: ForcePullState` (移行) | 後方互換 (オプショナル追加、既存呼び出し可) |
| ServicesAdminView Props | `services, onSave, onRetire, onForcePull?, forcePullState?` | `services, onSave, onRetire` (force-pull 関連 prop を**除去**) | 軽い非互換 (Page 側を同時更新するため局所影響、Q1 で除去採用) |
| `POST /api/admin/collect` | 無変更 | 無変更 (発火点が UI 上で移動するだけ) | ✅ |

### 2.3 データモデル変更
変更なし。

### 2.4 バリデーション・エラー変更
変更なし (force-pull のエラー処理は単に move 先で同じ振る舞い)。

## 3. 影響範囲

| 対象 | 影響度 | 説明 |
|---|---|---|
| `src/features/dashboard/DashboardView.tsx` | 高 | force-pull section を新規追加、Props 拡張 |
| `src/features/dashboard/DashboardPage.tsx` (or 同等の Page) | 高 | force-pull state + onForcePull callback を移管 (ServicesAdminPage から) |
| `src/features/admin/ServicesAdminView.tsx` | 中 | force-pull section + Props を除去 + ヘッダに back-link 追加 |
| `src/features/admin/ServicesAdminPage.tsx` | 中 | force-pull state + onForcePull callback を除去 (Dashboard 側へ移管) |
| `src/features/dashboard/DashboardView.test.tsx` | 中 | TFP-N3/N4/E4 (force-pull 移行版) + UX-N2 (back-link) 追加 |
| `src/features/admin/ServicesAdminView.test.tsx` | 中 | FP-N3/N4/E4 を**削除** (force-pull は dashboard で検証)、back-link 追加検証 (UX-N4) |
| `api/admin/collect.ts` | なし | 無変更 |
| `api/admin/collect.test.ts` | なし | 無変更 |

## 4. 後方互換性

- ✅ **機能的に完全互換**。POST /api/admin/collect は無変更、UI 発火点だけが /admin → / に移動。
- ServicesAdminView の Props 除去は**軽い非互換** (Page 側を同時更新するため局所影響のみ)。外部利用なし (内部 component) のため許容。
- 既存ユーザー視点では「今すぐ pull が /admin から消えて / に出現」の UX 変更だが、機能消失なし。

## 5. ロールバック方針

- ✅ コード revert で戻せる (file レベル変更のみ、DB/API 変更なし)。
- 即時 revert 可能 (3 file 編集を git revert)。

## 6. リリース戦略

- **方式**: 一括 (内部ツール・単一ユーザー、段階展開不要)。
- デプロイ → 即新動線で運用。

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC
- **UC-LU1 + UC-FP1 (合流)**: seiji が dashboard `/` を開く → ヘッダで「最終更新: YYYY-MM-DD HH:MM (xx 分前)」を確認 → 鮮度が古ければ同ヘッダの「今すぐ pull」ボタン押下 → 実行中 disabled + スピナー → 完了後に結果サマリ表示 (servicesCount / errors 件数) → 次回押下まで disabled 解除。
- **UC (admin → back)**: seiji が `/admin` でサービス登録/編集後、ヘッダの `← ダッシュボード` リンクで `/` に戻る。

### 7.2 入出力
```ts
// DashboardView Props (拡張)
interface Props {
  vm: DashboardVM;
  onForcePull?: () => void;       // 追加 (オプショナル、未渡しならボタン非表示)
  forcePullState?: ForcePullState; // 追加
}

// ForcePullState (既存型を移行、ServicesAdminView から re-export か共通化)
interface ForcePullState {
  running?: boolean;
  lastResult?: CollectionRun;
  error?: string;
}

// ServicesAdminView Props (除去)
interface Props {
  services: ServiceDescriptor[];
  onSave: (d: ServiceDescriptor) => void;
  onRetire: (slug: string) => void;
  // onForcePull?: () => void;         ← 除去
  // forcePullState?: ForcePullState;  ← 除去
}
```

UI 配線:
- DashboardView: 「最終更新」表示の**直下** or 並列で `<section data-section="force-pull">` を新設、admin より控えめスタイル (header 内に溶け込ませる)。
- ServicesAdminView: ヘッダに `<nav><a href="/" data-testid="back-link">← ダッシュボード</a></nav>` を追加 (style は admin の `<h1>` 近傍、admin-link と対称的)。

### 7.3 データモデル
変更なし。

### 7.4 バリデーション・エラー
変更なし (force-pull のエラー表示は dashboard 側でも同じ表示)。

### 7.5 機能固有 NFR + 既存連携
- 認証: 全ルート Clerk gate 維持 (dashboard も /admin も保護下)。
- 鮮度更新動線: 「最終更新表示 → 即 pull」を 1 画面で完結させ、admin 画面遷移を要らないようにする。

## 8. タグ別追加項目
- **ui**: 双方向 navigation (admin に back-link)、force-pull section の dashboard 配置 (薄い section、視覚的に header 内 or summary 直下、admin より控えめ)。
- **auth-required**: Clerk gate 内全 route (変更なし)。

## 9. 未決事項
現時点で論点なし (2026-05-28、設計判断 Q1/Q2/Q3 全て推奨採用で確定)。

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 (Q1=除去 / Q2=summary 直下別ブロック / Q3=控えめ section、すべて推奨採用) | /flow:revise |
