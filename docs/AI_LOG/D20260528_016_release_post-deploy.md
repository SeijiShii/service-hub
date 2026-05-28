# AI_LOG セッション D20260528_016 — /flow:release (post-deploy 3rd, nav-and-pull 反映)

**実行日時**: 2026-05-28 13:20 (+09:00)
**コマンド**: `! bash scripts/deploy-prod.sh` (ユーザー手動実行) + post-deploy smoke + favicon 追加
**dispatch 元**: /flow:auto P4.7 Release gate (nav-and-pull revise 反映)
**実行者**: seiji (manual deploy + favicon 要望) + Claude (Opus 4.7) (post-deploy smoke + favicon 実装 + bookkeeping)
**状態**: 完了
**含まれる decision**: D20260528-027 (3rd deploy + smoke + 後続 favicon 反映用 4th deploy 計画)
**ファイル**: `D20260528_016_release_post-deploy.md`
**前 release セッション**: D20260528_013 (2nd deploy) を継承

---

## 主要決定サマリ
| ID | テーマ | 採用 | type |
|---|---|---|---|
| D20260528-027 | 3rd deploy + smoke + favicon 後続 deploy | A. nav-and-pull 反映 deploy 完了 + smoke green、favicon は別 commit (c0818c9) で次回 deploy に乗せる | auto-recommended |

## 依存関係
- depends_on: D20260528-026 (nav-and-pull TDD 実装)、D20260528-021 (2nd deploy)、CF-20260528-011 (live 判定 SoT 順序)。

## 実装サマリ
- **deploy-prod.sh 実行** (seiji 手動): 8 env sync (DATABASE_URL/CLERK_SECRET_KEY/VITE_CLERK_PUBLISHABLE_KEY/ALLOWED_USER_ID/CRON_SECRET/VERCEL_API_TOKEN/NEON_API_KEY/HUB_SERVICE_INFO_SECRET) + 空値 3 件削除 (SENTRY_DSN/CLOUDFLARE_API_TOKEN/SENTRY_AUTH_TOKEN) + vite build 31s。
- **deploy_id**: `dpl_25it7fuh7rjzaREy1xH3vRDvKGSp` (Production READY)
- **Aliased**: `https://service-hub.givers.work`
- **post-deploy smoke** (curl、release-pre 監査として inline):
  - `/` → 200 (SPA shell)
  - `/admin` → 200 (SPA route)
  - `/api/admin/collect` POST no-auth → 401 unauthorized ✅ (force-pull endpoint 維持)
  - `/api/cron/collect` no-Bearer → 401 forbidden ✅ (CRON_SECRET gate 維持)
  - `/favicon.svg` → 200 だが内容は SPA shell の HTML fallback (= favicon 未配置) → **後続作業で対応**
- **favicon 追加** (commit c0818c9): `public/favicon.svg` (hub + 4 service status dots + spokes、design-system 整合) + `index.html` link + meta theme-color。次回 deploy で本番反映。

## 後続
- **次の手動 deploy** (4th): favicon (c0818c9) を本番反映するため `! bash scripts/deploy-prod.sh` を再実行。Class B、seiji 手動。
- /flow:auto 次反復: 4th deploy 後の P4.7 Release gate 通過 → P5 完了判定 (P4.45 Wording defer + 論点-005 Class C 確認の handoff)。

## 学習・改善
- nav-and-pull revise は scope 小 (UI relocation) で deploy-pre 監査も Critical/High 0 だった → 高速 deploy が機能。
- favicon の有無は audit category #1 (構造的整合) で検査対象外だが、UI 完成度の観点で「public/favicon があるか」を将来 audit に組み込む候補。
- service-hub の design-system カラー (`--accent #4f9cf9` + 状態色) を favicon でも再利用 = ブランド一貫性。

---

## Decisions

```yaml
- id: D20260528-027
  timestamp: 2026-05-28T13:20:00+09:00
  command: /flow:release (post-deploy via ! bash deploy-prod.sh)
  phase: Phase 3 デプロイ + post-deploy smoke + favicon 後続化
  question: 3rd deploy 結果 + favicon を同 deploy に乗せるか別 deploy にするか
  options:
    - A. 3rd deploy 結果は record、favicon は別 commit + 次回 deploy で反映 (recommended)
    - B. favicon を含めて再度 deploy し直す
  recommended: A
  chosen: A
  chosen_type: auto-recommended
  depends_on: [D20260528-026, D20260528-021]
  context: |
    3rd deploy はユーザーが既に手動実行済で nav-and-pull が live 反映されている。
    favicon は別途ユーザーから後追い要望で発生したので、別 commit にして次回
    deploy で反映する方が責務分離が綺麗 (1 deploy = 1 まとまった変更)。
    favicon は静的アセットのみで low risk、4th deploy は軽い。
```
