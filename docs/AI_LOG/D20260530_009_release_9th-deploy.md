# D20260530_009 — /flow:release (9th deploy)

**実行日時**: 2026-05-30 (+09:00)
**コマンド**: /flow:release
**実行者**: SeijiShii (via Claude Code) — flow:auto P4.7 Release gate (ユーザー承認「今デプロイ」)
**状態**: 完了

## 含まれる decision 範囲
D20260530-034

## サマリ
- **§1.0 live 判定**: `.env.production.local CLERK_SECRET_KEY=sk_live_*` 検出 → **live 化済**。FILL/swap skip。
- **Phase 1 (FILL)**: skip (live 化済、11 prod vars セット済)
- **Phase 2 (動作確認)**: last-deploy-col は display-only で課金フロー非該当。E2E (D-005、4/4 green route-mock) で列レンダリング検証済。
- **Phase 3 (デプロイ)**: ✅ **9th deploy 成功** — `bash scripts/deploy-prod.sh` (sync-prod-env → vercel deploy --prod)。dpl_2JKZcinXnWiCsMRchTWzjpYtsoWs、build 24s、aliased https://service-hub.givers.work。
- **post-deploy smoke (§3.4)**: frontend / = 200 (`<title>service-hub</title>`) / /api/dashboard/summary = 401 (auth gate OK、O22) / /api/public/status = 200。全 green。
- api 関数 7 個 (< Hobby 12)、build=vite build (tsc TS2578 非ブロッカー)。

## 生成・更新アーティファクト
- 本番反映: last-deploy-col (last_deploy_at chart 除外 + 一覧「最終デプロイ」列)
- AI_LOG D20260530_009 + SCENARIO §5 (9th deploy 完了)

## Decisions

```yaml
- id: D20260530-034
  timestamp: 2026-05-30T18:50:00+09:00
  command: /flow:release
  phase: Phase 3 デプロイ (Class B)
  question: last-deploy-col の 9th production deploy
  options: [今デプロイ, 保留, tsc 先修正]
  recommended: 今デプロイ
  chosen: 9th deploy 実行 (ユーザー承認「今デプロイ」)
  chosen_type: explicit-choice
  depends_on: [D20260530-033]
  context: |
    live 化済 (sk_live_*)、release-pre 2 段クリア (audit D-006 + secure D-008)。
    bash scripts/deploy-prod.sh で sync-prod-env → vercel deploy --prod。
    dpl_2JKZcinXnWiCsMRchTWzjpYtsoWs、aliased https://service-hub.givers.work、
    post-deploy smoke 全 green (frontend 200 / api auth 401 / public 200)。
    last-deploy-col 本番反映完了。

## metrics
metrics: { command: /flow:release, deploy_target: production, deploy_id: dpl_2JKZcinXnWiCsMRchTWzjpYtsoWs, deployed_url: https://service-hub.givers.work, smoke: green, paid_confirmed: n/a }
```
