# D20260607_004 release: 13th deploy (収益指標表示 C20260607-001)

**実行日時**: 2026-06-07
**コマンド**: /flow:release (フル、live化済 → 再デプロイ経路)
**状態**: 完了
**結果**: 13th deploy = dpl_BLukFUJLpeZ1jCk6qyCGohb3hxN2、READY、aliased https://service-hub.givers.work、25s build、post-deploy smoke green (/ 200・/api/dashboard/summary 401 認証ゲート OK)

## 主要決定
- live化判定: service-hub は 12th deploy 済 = live化済、内部 observability ツール (Clerk ゲート・seiji のみ・課金パスなし)。test→live swap skip。
- Phase 1 (env FILL): 収益変更は新規 env var を追加しないため FILL 不要 (表示列 + adapter 正規化は純コード、新 secret/URL なし)。
- Phase 2: pre-deploy で本番ビルド green (823 modules) + unit 323 green を確認。課金パスなし + WSL2 のため実機スモークは post-deploy HTTPS に委ねる (§2.2.4)。
- Phase 3: bash scripts/deploy-prod.sh を agent 実行 (sync-prod-env マスク出力)。Class B 明示確認 (ユーザー yes) 後に実行。env は冪等同期のみ。
- 反映内容: 収益(件)/収益(¥)列 + 旧 tip_* → revenue_* 後方互換正規化。

## 残件 / 次アクション
- **収益表示は次の collect 後に反映**: dashboard は canonical revenue_* を読むが、既存 snapshot は旧 tip_* キー。adapter 正規化は次 collect で効くため、デプロイ直後は bousai-bag-checker 行の収益が `—`。即時確認は admin「今すぐ pull」で手動 collect (Clerk ゲート内・ユーザー操作)、または daily cron 00:00 UTC を待つ。
- producer (bousai-bag-checker) の tip_* → revenue_* 移行は後方互換 alias により任意 (cross-repo follow-up [論点-002])。

## Decisions
- id: D20260607-014
  command: /flow:release
  question: 13th deploy (Class B) 実行可否
  chosen: deploy 実行 (ユーザー yes) → dpl_BLukFUJLpeZ1jCk6qyCGohb3hxN2 READY、smoke green
  chosen_type: explicit-choice
  context: 収益指標表示 (C20260607-001) の本番反映。live化済・課金パスなし・新規 env なし。
  depends_on: [D20260607-013]

## 生成・更新ファイル
- docs/AI_LOG/D20260607_004_release_13th-deploy.md (本ファイル)
- docs/SCENARIO.md §5 (13th deploy 反映)

## metrics
- deploy_target: production
- deployed_url: https://service-hub.givers.work
- check_result: smoke green (frontend 200 / api 401)
- paid_confirmed: n/a (課金パスなし)
