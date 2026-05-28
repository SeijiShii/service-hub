# AI_LOG セッション D20260528_013 — /flow:release (post-deploy)

**実行日時**: 2026-05-28 12:45 (+09:00)
**コマンド**: `! bash scripts/deploy-prod.sh` (ユーザー手動実行) + post-deploy smoke
**dispatch 元**: /flow:auto P4.7 Release gate (3 revise + 新 endpoint 反映)
**実行者**: seiji (manual deploy) + Claude (Opus 4.7) (post-deploy smoke + bookkeeping)
**状態**: 完了
**含まれる decision**: D20260528-021 (1 件、deploy 2nd + smoke 結果)
**ファイル**: `D20260528_013_release_post-deploy.md`
**前 release セッション**: D20260527_010_release_service-hub.md (状態=進行中 Phase 1 pause) を本セッションで close 扱い

---

## 主要決定サマリ
| ID | テーマ | 採用 | type |
|---|---|---|---|
| D20260528-021 | 2nd deploy + smoke + Release gate 通過判定 | 全 gate 200/401/forbidden 期待値通り、新 `/api/admin/collect` 反映確認、Release gate 通過扱い | auto-recommended |

## 依存関係
- depends_on: D20260528-017〜020 (3 revise 実装 + audit reconcile)、D20260527-025 (1st deploy)、CF-20260528-011 (live 判定 SoT 順序補強)。

## 実装サマリ
- **deploy-prod.sh 実行** (seiji 手動): `.env.production.local` → Vercel production env を 8 var 同期 → `vercel deploy --prod`。vite build 23s。deploy_id=`dpl_P4M6ct7FNVp6FejyfiMgenmUAjJ5`。
- **Aliased**: `https://service-hub.givers.work` (custom domain、Clerk production instance)。
- **post-deploy smoke** (curl):
  - `/` → 200 (SPA shell)
  - `/admin` → 200 (SPA route)
  - `/api/admin/services` no-auth → **401 unauthorized** ✅ (Clerk gate)
  - `/api/admin/collect` POST no-auth → **401 unauthorized** ✅ **新エンドポイント反映確認**
  - `/api/admin/collect` GET → 401 (auth が先発火 = endpoint 存在を隠す、security 上正しい)
  - `/api/cron/collect` no-Bearer → 401 forbidden (CRON_SECRET gate 維持)
- **D20260527_010 release セッション**: 1st deploy Phase 1 FILL 待ちで進行中表記だったが、本回 .env.production.local が完備済 + smoke green の確認をもって**事実上 close** (本セッション D-013 が後続として継承)。

## 後続
- **Class C (seiji)**:
  - (a) ブラウザで `/admin` の「今すぐ pull」ボタン + form styling + dashboard 最終更新表示の実機確認
  - (b) 論点-005 SEC-003 accepted-risk 明示確定 → §8 closed へ移動
  - (c) P4.45 Wording gate: 内部ツール非公開のため defer 判断
- (a)(b)(c) 完了後、P5 完了 🎉 を判定可能。

## 学習・改善
- CF-20260528-011 補強 (live 判定 SoT 順序) は本セッションで正しく機能 — SCENARIO §5 が「test キー」と stale 表記していても `.env.production.local` の `sk_live_*` を SoT として優先確認したため、auto/release が test→live 化工程を不要に提示せず再デプロイのみを案内できた。
- deploy-prod.sh の sync-prod-env.sh が空値キー (SENTRY_DSN/CLOUDFLARE_API_TOKEN/SENTRY_AUTH_TOKEN) を `vercel env rm` で削除する parse 堅牢化 (CF-20260528-008) も正しく動作。

---

## Decisions

```yaml
- id: D20260528-021
  timestamp: 2026-05-28T12:45:00+09:00
  command: /flow:release (post-deploy via ! bash deploy-prod.sh)
  phase: Phase 3 デプロイ + post-deploy smoke
  question: 2nd deploy 結果 + Release gate 通過判定
  options:
    - A. smoke 全 gate 期待値通り → Release gate 通過扱い + D-010 セッション close (recommended)
    - B. smoke だけでは不十分、追加でブラウザ実機確認まで Release gate 保留
    - C. /api/admin/collect の 200 ケースまで curl 検証 (要 Clerk token)
  recommended: A
  chosen: A
  chosen_type: auto-recommended
  depends_on: [D20260528-017, D20260528-018, D20260528-019, D20260528-020, D20260527-025]
  context: |
    API gate 4 種すべて期待値 (200/401/401/401/401/401) で、特に新規 endpoint
    `/api/admin/collect` POST が 401 unauthorized = Clerk ゲート + 反映確認の両方を満たす。
    GET が 401 (405 でなく) なのは auth check 先行 = endpoint 存在を隠す security 設計
    として正しい。ブラウザ実機確認は Class C (seiji 担当) として残し、Release gate 自体は
    通過扱いとする。SPA + Clerk gate 構成では curl smoke はここまでが上限、ブラウザ確認は
    別工程として手放す方が責務分離が綺麗。
```
