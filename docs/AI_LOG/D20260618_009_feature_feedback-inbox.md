# D20260618_009_feature_feedback-inbox — /flow:feature feedback-inbox

**実行日時**: 2026-06-18
**コマンド**: /flow:feature
**対象**: feedback-inbox (新規機能フォルダ、[論点-007])
**実行者**: seiji (auto via /flow:auto D20260618_008)
**状態**: 完了

## サマリ

[論点-007] / perspectives O67 (consumer) の確定要件を設計。各サービスの `GET /api/hub/feedback`
(O66 producer) を `HUB_SERVICE_INFO_SECRET` で pull → `FeedbackItem` 型保存 → Clerk ゲート内の
運営者インボックス画面 (横断一覧 + サービス別フィルタ + /flow:claim トリアージ導線)。
service-info (§6.1、O48/O63) と完全同型の pull / 共有シークレットモデルを mirror。

| # | 決定 | 種別 |
|---|---|---|
| タグ | feature + auth-required | auto |
| MVP スコープ | 標準 per-service pull + 運営者インボックスのみ、Shipyard adapter は [論点-FI-4] へ defer | explicit |
| pull 統合 | 既存 collection cron に統合 ([論点-FI-1] 案 A) | auto |
| 増分 pull | 直近 N + (slug,externalId) idempotent upsert ([論点-FI-3] 案 A) | auto |
| 保持 | MVP 全保持 + 表示直近 N=200 ([論点-FI-2] 案 A) | auto |

**生成アーティファクト**: docs/feedback-inbox/{README, 001_SPEC, 002_PLAN, 003_UNIT_TEST, 004_E2E_TEST, INDEX}.md
+ docs/INDEX.md (feedback-inbox 行追加) + 本セッションファイル。

**整合性チェック**: ✅ (SPEC NFR ↔ concept §3 矛盾なし / PLAN ファイル ↔ §1.4 構造整合 / 依存 ↔ §1.3.2 整合 / UNIT・E2E が全 UC カバー)。

**Open 論点**: [論点-FI-1〜FI-4] (FI-1/2/3 は推奨案で実装前提、FI-4 = Shipyard follow-up)。

**次ステップ**: /flow:spec-review feedback-inbox (P3.7 gate) → /flow:tdd feedback-inbox → /flow:e2e。

## Decisions

- id: D20260618-009-00
  timestamp: 2026-06-18T19:35:00+09:00
  command: /flow:feature
  phase: Step 2 (機能性質タグ判定)
  question: feedback-inbox の機能性質タグ
  options:
    - "feature + auth-required (recommended)"
    - "feature + auth-required + stateful"
  recommended: "feature + auth-required"
  chosen: "feature + auth-required"
  chosen_type: auto-recommended
  context: |
    target_type=feature (画面 /feedback あり、UC ベース)。auth-required = Clerk 単一ユーザー
    (seiji) ゲート内の運営者画面 (concept §1.3.1 依存に _shared/auth)。status は producer 自己申告で
    HUB は状態遷移を管理しない (pull only、サービスは受け身) ため stateful は付けない。
    i18n/realtime/offline は非該当 (内部ツール・単一ユーザー・日次 pull)。

- id: D20260618-009-01
  timestamp: 2026-06-18T19:38:00+09:00
  command: /flow:feature
  phase: Step 3 Q (MVP スコープ = Class C)
  question: feedback-inbox の MVP に Shipyard 専用 adapter を含めるか
  options:
    - "標準のみ (Shipyard は follow-up 論点) (recommended)"
    - "Shipyard 専用 adapter も今回含める"
  recommended: "標準のみ"
  chosen: "標準のみ (Shipyard は follow-up 論点)"
  chosen_type: explicit-choice
  context: |
    ユーザー明示選択。標準 GET /api/hub/feedback pull adapter + FeedbackItem 型 + 運営者
    インボックス画面を本 feature で設計。Shipyard (givers.work) の contact form 取り込み専用
    adapter は shipyard 側 contact API が未設計 (別 repo、契約形状未確定) のため SPEC §8 [論点-FI-4]
    に登録して follow-up に回す。標準契約は concept §6.2 + O66/O67 で完全に固まっており即着手可、
    producer 順次対応で graceful degradation (未実装サービスは空 items/404 fallback)。

- id: D20260618-009-02
  timestamp: 2026-06-18T19:45:00+09:00
  command: /flow:feature
  phase: Step 3-6 (SPEC/PLAN/UNIT/E2E ドラフト = Class A auto-pick)
  question: feedback-inbox 設計ドラフトの主要選択 (pull 統合 / 増分 / 保持)
  options:
    - "既存cron統合 + 直近N upsert + 全保持 (recommended)"
    - "専用cron + nextCursor全件 + 90日剪定"
  recommended: "既存cron統合 + 直近N upsert + 全保持"
  chosen: "既存cron統合 + 直近N upsert + 全保持"
  chosen_type: auto-recommended
  context: |
    [論点-FI-1/2/3] を SPEC §8 に論点登録しつつ推奨案で PLAN を作成 (Class A、可逆)。
    既存 collection runner per-service パスに feedback pull を統合 (インフラ再利用・Vercel Hobby
    日次 cron と整合)、(slug,externalId) 冪等 upsert で取りこぼしは次回 pull 回収、保持は MVP 全保持
    + 表示直近 N=200。service-info pull (adapters.ts/safeFetch) と同層・同パターンを mirror。
