# AI_LOG セッション D20260526_012 — /flow:release (service-hub, 再試行)

**実行日時**: 2026-05-26 (進行中) (+09:00)
**コマンド**: /flow:release (retry, blocker 解消後)
**dispatch 元**: /flow:auto 反復2 (D20260526-059)
**状態**: 完了 (本番デプロイ確定 = D20260527-025 で service-hub-lake.vercel.app + post-deploy スモーク green。bookkeeping close 2026-05-27 by D20260527_006 §3.0c、AUDIT-ailog-001)

## Decisions
```yaml
- id: D20260526-060
  timestamp: 2026-05-26T00:00:00+09:00
  command: /flow:release
  phase: Step 0 + Phase 1 再評価
  question: 再試行時の Phase1 充足とコンテキスト
  chosen: Phase1 グループA 充足 (5/5 検証済) → Phase2 へ。vercel CLI authed (quadiishii-9506), 未 link
  chosen_type: auto-recommended
  depends_on: [D20260526-050, D20260526-057]
  context: |
    fix(011) 後の再 release。.env.local グループA 全 5 設定+検証済。
    GAP-1/2 解消で app 実機能化。deploy=Vercel。dev=vite (SPA のみ、/api/* は serverless)。
    vercel CLI 認証済・project 未 link。Phase2 smoke: ローカル vite は API 出さない、
    vercel dev は WSL2 port-forward + Clerk localhost origin が面倒、Clerk cookie は実ドメインが堅実。
    → smoke 方式 (local vs preview deploy) を 1問1答で決定。
```

- id: D20260526-061
  timestamp: 2026-05-26T00:00:00+09:00
  command: /flow:release
  phase: Phase 3 デプロイ — Hobby cron 制限 ([論点-002] 解決)
  question: preview デプロイが Hobby cron 制限で失敗
  chosen: vercel.json cron を hourly→daily (0 0 * * *) に変更し [論点-002] を案A daily で解決
  chosen_type: auto-recommended
  depends_on: [D20260526-060]
  context: |
    Vercel Hobby は cron 日次のみ許可。0 * * * * は拒否。concept [論点-002] が「日次先行、
    高頻度要なら GitHub Actions(案B)」と既決のため daily に変更 (mechanical default)。
    リアルタイム不要。concept §8 [論点-002] status=解決 を追記。

- id: D20260526-062
  timestamp: 2026-05-26T00:00:00+09:00
  command: /flow:release
  phase: Phase 3 デプロイ実行 + デプロイ後スモーク (Class B)
  question: Vercel デプロイ結果
  chosen: デプロイ成功 (https://service-hub-lake.vercel.app)。ただし target=production (preview 意図と差異)
  chosen_type: explicit-choice
  depends_on: [D20260526-061]
  context: |
    vercel deploy --yes (inline --env/--build-env, グループA test鍵) が fresh project/main で
    production にデプロイ (preview 意図だったが --yes が prod default)。Clerk gate で seiji 限定
    のため公開露出リスク低 (全 API 401, SPA は login wall)。
    デプロイ後スモーク: / =200, /api/* (no session/secret) =全401 → GAP-1 認可が本番で稼働確認
    (mocked E2E が見逃した経路を実デプロイで検証)。関数 deploy + TS/ESM import 解決 OK。
    残: (1) 認証済みパス(ログイン→200)は seiji の実 Clerk browser smoke、
        (2) inline env は当該デプロイ限定 → 恒久運用は Vercel prod env 永続化推奨 (特に CRON_SECRET),
        (3) 実 pull データは services.toml の hana-memo 実 ID (グループD) + グループB トークン要。

- id: D20260526-063
  timestamp: 2026-05-26T00:00:00+09:00
  command: /flow:release
  phase: Phase 2 smoke (seiji 実機) → GAP-3 検出 → fix → 再デプロイ
  question: ログイン後も /api/dashboard/summary が 401 (seiji コンソール報告)
  chosen: GAP-3 = フロントにサインインゲート不在 → main.tsx に SignedIn/SignedOut/SignIn 追加 → prod 再デプロイ
  chosen_type: explicit-choice
  depends_on: [D20260526-062]
  context: |
    seiji 実機: Clerk dev key warning + /api/dashboard/summary 401。原因=main.tsx が ClerkProvider で
    包むだけでサインイン UI/ゲート無し → 未ログインで DashboardPage が即 fetch→401、ログイン手段も画面に無い。
    GAP-1(backend)と同じ根本(auth glue 未完, E2E が route-mock で迂回)の第3。
    fix: <SignedIn>{app}+UserButton</SignedIn> / <SignedOut><SignIn routing=hash></SignedOut>。
    typecheck+build green。seiji 承認で prod 再デプロイ (--prod, service-hub-lake.vercel.app)。
    ログイン後は同一オリジン __session cookie → requireSeiji 通過の想定。seiji 再 smoke 待ち。
