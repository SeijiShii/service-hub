# AI_LOG セッション D20260528_014 — /flow:revise (dashboard nav-and-pull)

**実行日時**: 2026-05-28 13:00 (+09:00)
**コマンド**: /flow:revise --auto
**対象**: dashboard (revise_nav-and-pull_20260528_back-link-and-relocation)
**実行者**: seiji (要望) + Claude (Opus 4.7) (設計)
**状態**: 設計完了
**含まれる decision**: D20260528-022〜025 (4 件、Q1 Props 除去 + Q2 配置 + Q3 スタイル + Phase 軽重)
**ファイル**: `D20260528_014_revise_dashboard_nav-and-pull.md`

---

## 主要決定サマリ
| ID | テーマ | 採用 | type |
|---|---|---|---|
| D20260528-022 | ServicesAdminView Props onForcePull/forcePullState | A. 除去 (dead code 化、Page を同時更新) | auto-recommended |
| D20260528-023 | DashboardView 内の force-pull 配置 | B. summary 直下別ブロック (alert-banner と並列、視覚的に独立) | auto-recommended |
| D20260528-024 | force-pull section スタイル | C. dashboard 側で薄い section (admin より控えめ、border なし or 細枠、CSS 変数流用) | auto-recommended |
| D20260528-025 | Phase 軽重 + 共通型配置 | 両 Phase 軽 (メイン直接)、`ForcePullState` 型は `src/features/dashboard/forcePull.ts` 新設に集約 | auto-recommended |

## 依存関係
- depends_on: D20260528-015 (admin-ux revise、順方向 link)、D20260528-019 (force-pull revise、配置元)、D20260528-021 (post-deploy)。

## 実装サマリ
- 4 文書生成 (001/002/003/004) + INDEX 3 階層更新。
- Phase 1: force-pull を /admin から dashboard へ移管 (DashboardView Props 拡張 + DashboardPage で state 管理、ServicesAdminView/Page から除去)。
- Phase 2: ServicesAdminView ヘッダに back-link 追加。
- 共通型 `ForcePullState` を `src/features/dashboard/forcePull.ts` に新設 (循環依存回避)。
- 後方互換: 機能的に完全互換 (UI 発火点の relocation のみ)、`POST /api/admin/collect` は無変更。

## 後続
- 次は `/flow:tdd dashboard nav-and-pull` で TDD 実装 (Phase 1 → Phase 2)。
- 完了後 audit (鮮度) → Release gate (再デプロイ)。

## 学習・改善
- force-pull の配置先について「全サービス pull は dashboard の鮮度更新アクション」という UX 洞察を SPEC §1 概要に明記 → 将来の同種判断 (action の置き場所) で参考に。
- admin-ux で順方向 link を張った後の**逆方向欠落**は O55 の典型的見落としパターン。perspectives O55 に「**双方向 navigation 必須**」を追記する観点候補 (本 revise では PJ 内対応のみ、flow-suite 反映は別 [flow] 機会で検討)。

---

## Decisions

```yaml
- id: D20260528-022
  timestamp: 2026-05-28T13:00:00+09:00
  command: /flow:revise
  phase: Q1 / ServicesAdminView Props 後方互換
  question: onForcePull/forcePullState を除去するか optional 維持するか
  options:
    - A. 除去 (推奨、dead code 化、Page を同時更新で typecheck 維持)
    - B. 非推奨 optional 維持 (中間、View 側は受け取るが使わない)
  recommended: A
  chosen: A
  chosen_type: auto-recommended
  depends_on: [D20260528-019]
  context: |
    Props は内部 component の interface であり外部利用なし。除去で dead code を消す
    方が後保守の負荷が減る。Page を同時更新するため typecheck red 区間はゼロ。
    optional 維持は「将来戻す可能性」のための保険だが、本 revise は relocation
    確定の意思決定なので保険は不要。

- id: D20260528-023
  timestamp: 2026-05-28T13:00:00+09:00
  command: /flow:revise
  phase: Q2 / DashboardView 内の force-pull 配置
  question: 配置位置をどうするか
  options:
    - A. ヘッダ右上 admin-link 隣 (横並び密)
    - B. summary 直下別ブロック (alert-banner と並列、視覚的に独立、推奨)
    - C. alert-banner と並列セクション (status alert との視覚的混同リスク)
  recommended: B
  chosen: B
  chosen_type: auto-recommended
  depends_on: [D20260528-017]
  context: |
    A はヘッダ要素が増えすぎ視認性低下。C は alert-banner と視覚的に混同する
    リスク (warning 色との競合)。B は「最終更新」表示の直下に置くことで
    「鮮度確認 → 即 pull」の動線が UI 上でも自然に並ぶ。SPEC §7.1 UC-LU1+FP1
    合流の設計意図と一致。

- id: D20260528-024
  timestamp: 2026-05-28T13:00:00+09:00
  command: /flow:revise
  phase: Q3 / force-pull section スタイル
  question: スタイル方針
  options:
    - A. admin の inline style 流用 (border + surface bg、強めの存在感)
    - B. dashboard CSS 変数で再構成 (header 統合、控えめ、推奨)
  recommended: B
  chosen: B
  chosen_type: auto-recommended
  depends_on: [D20260528-019]
  context: |
    admin の force-pull section は登録フォーム上部に独立配置で「強め」だったが、
    dashboard ヘッダ内では「最終更新表示」と並ぶ補助的要素のため控えめにすべき。
    既存 dashboard ヘッダの CSS 変数 (`--surface` / `--border` 薄め / 小ぶり padding)
    で再構成し、視覚的に header の一部として溶け込ませる。

- id: D20260528-025
  timestamp: 2026-05-28T13:00:00+09:00
  command: /flow:revise
  phase: Phase 軽重 + 共通型配置
  question: 共通 ForcePullState 型をどこに置くか + Phase 軽重判定
  options:
    - A. src/features/dashboard/forcePull.ts 新設 (推奨、dashboard 配下に集約、admin 側から依存ゼロ)
    - B. src/types/index.ts に統合 (グローバル化、過剰)
    - C. ServicesAdminView から re-export (除去予定 component から export は不健全)
  recommended: A
  chosen: A
  chosen_type: auto-recommended
  depends_on: [D20260528-022]
  context: |
    型は dashboard 領域の責務になる (force-pull が dashboard 機能になるため)。
    `src/features/dashboard/forcePull.ts` に新設すれば admin 側は完全依存解除可能。
    両 Phase とも ≤ 6 ファイル変更で軽い → メイン直接実装で OK、サブスキル委託不要。
```
