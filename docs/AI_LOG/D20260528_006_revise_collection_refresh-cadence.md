# AI_LOG セッション D20260528_006 — /flow:revise (collection refresh-cadence)

**実行日時**: 2026-05-28 (+09:00)
**コマンド**: /flow:revise
**モード**: revise
**対象**: collection (revise_refresh-cadence_20260528_15min-and-last-updated)
**実行者**: Claude (Opus 4.7) + seiji
**状態**: 設計完了（実装は /flow:tdd で別途）
**含まれる decision**: D20260528-013, D20260528-014 (2 件、auto-pick + スコープ縮小)
**ファイル**: `D20260528_006_revise_collection_refresh-cadence.md`

---

## 主要決定サマリ
| ID | テーマ | 採用 | type |
|---|---|---|---|
| D20260528-013 | 15 分間隔 cron + 最終更新表示 の設計 | GitHub Actions cron `*/15 * * * *` で `/api/cron/collect` を CRON_SECRET 付き curl（Vercel Hobby は日次制限のため、[論点-002] 案 B 採用）+ Vercel Cron 撤去（重複防止）+ ダッシュボードに `recentRuns(1).finishedAt` を「最終更新」として表示。並行 issue（force-pull）と独立 | auto-recommended |

## 依存関係
- depends_on: [論点-002] 解決（Vercel Hobby cron 日次制約、GH Actions cron 案 B として登録済）。
- 関連: 既存 `api/cron/collect.ts` (CRON_SECRET 認証、不変) / `api/dashboard/summary.ts` (既に `recentRuns(db, 1)` を呼んでいる) / `src/features/dashboard/{summary, DashboardView}.ts(x)` (VM 拡張 + 表示)。
- 同時進行: `revise_force-pull_20260528_admin-button/` (独立、両方とも runCollection 起動経路の追加)。

## 設計の要点
- **Cron 移行**: `vercel.json` の `crons` 撤去 + `.github/workflows/cron-collect.yml` (15分間隔 + workflow_dispatch、`curl -fsS -X POST -H "Authorization: Bearer ${{secrets.CRON_SECRET}}" https://service-hub.givers.work/api/cron/collect`)。
- **GitHub Secrets 登録**: `CRON_SECRET` を GitHub repo Settings に追加（user 手動、Class C 値）。`.env.production.local` と同値。
- **Dashboard 表示**: VM に `lastUpdatedAt: string | null` / `lastRunStatus` 追加。View ヘッダに「最終更新: YYYY-MM-DD HH:MM (xx 分前)」(JST)。run なし → 「未収集」/ failed → 警告色。
- **エンドポイント不変**: `/api/cron/collect` 自体は変更なし（CRON_SECRET 経路を継続再利用、GH Actions も同じ経路）。

## 生成・更新したアーティファクト
- 新規: revise_refresh-cadence_20260528_15min-and-last-updated/{README, 001, 002, 003, 004, INDEX}.md
- 更新: docs/collection/INDEX.md (サブフォルダ行追加), docs/INDEX.md (改修件数注記), AI_LOG/INDEX.md

## 後続
- `/flow:tdd collection refresh-cadence` で実装 (Phase 1 dashboard 表示 → Phase 2 cron 移行)。
- デプロイ後: **GitHub Secrets に CRON_SECRET 登録** (user 手動、Class C) → workflow_dispatch で初回確認 → 次の `*/15` 自動 run 確認。

## 学習・改善
なし。

---

## Decisions

```yaml
- id: D20260528-013
  timestamp: 2026-05-28T00:00:00+09:00
  command: /flow:revise
  phase: Step 3 / 設計判断 auto-pick まとめ
  question: 自動 pull 15 分化 + 最終更新表示 の実装方針
  options:
    - A. GitHub Actions cron 15 分 + Vercel Cron 撤去 + ダッシュボード VM 拡張 (recommended)
    - B. Vercel Pro 課金で Vercel Cron 15 分化 ($20/月、課金発生)
    - C. force-pull revise に scope 統合 (revise scope が肥大、別関心)
  recommended: A
  chosen: A
  chosen_type: auto-recommended
  depends_on: []
  context: |
    Vercel Hobby は cron 日次制限 ([論点-002] で確認済、hourly すら deploy 拒否)。
    15 分間隔は Vercel 経由不可。[論点-002] 解決時に「より高頻度が要るなら案 B (GitHub Actions
    cron が /api/cron/collect を CRON_SECRET 付きで叩く) へ将来移行」と既に布石済み。
    無料運用方針 + 個人サービスなので A 採用 (Vercel Pro 不要)。force-pull とは別関心
    (UI ボタン vs 自動 cron) なので別 revise に分離。Resume Contract §0.1.1 に従い
    Class A は停止提示せず auto-pick。

- id: D20260528-014
  timestamp: 2026-05-28T00:00:00+09:00
  command: /flow:revise
  phase: scope amend / 方針変更
  question: refresh-cadence のスコープを縮小するか（Vercel 経由・日次維持・手動補完方針）
  options:
    - A. cron 移行のみ撤回、最終更新表示は残す (recommended)
    - B. revise 全体を撤回 (最終更新表示も無し)
  recommended: A
  chosen: A
  chosen_type: explicit-choice
  depends_on: [D20260528-013]
  context: |
    ユーザー方針「Vercel 経由にしたいので日次更新でよい / 手動更新で補完する」を受け、
    GH Actions cron 15 分移行を撤回。Vercel Cron 日次 (vercel.json `0 0 * * *`) は無変更、
    頻度補完は別 revise の force-pull ボタン (2cd6be7) に委ねる。最終更新表示は force-pull を
    押す判断材料 (鮮度の可視化) としてむしろ重要性が増すので残す。SPEC/PLAN/E2E/README から
    cron 関連を撤去 (Phase 2 削除、新規 .github/workflows/ 削除、E2E から E-RC-01/02 撤去)、
    UC-LU1-04 (force-pull と組み合わせた最終更新更新) を追加。
```
