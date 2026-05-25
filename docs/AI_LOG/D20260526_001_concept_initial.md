# AI_LOG セッション D20260526_001 — /flow:concept (initial)

**実行日時**: 2026-05-26 07:52 〜 07:58 (+09:00)
**コマンド**: /flow:concept
**対象**: プロジェクト全体（service-hub 初版作成）
**実行者**: Claude (Opus 4.7) + seiji
**状態**: 完了
**含まれる decision**: D20260526-001 〜 D20260526-006 (6 件)
**ファイル**: `D20260526_001_concept_initial.md`

---

## 主要決定サマリ（人間向け要約）

| ID | テーマ | 採用 | type |
|---|---|---|---|
| D20260526-001 | HUB の本質的役割 | 開発者向け内部運用ダッシュボード | explicit-choice |
| D20260526-002 | 利用状況の収集方式 | HUB が各 PaaS API を pull | auto-recommended |
| D20260526-003 | 管理スコープ | 閲覧のみ / observability | explicit-choice |
| D20260526-004 | レジストリ SoT | Git 管理の宣言ファイル (services.toml) | explicit-choice |
| D20260526-005 | MVP pull 対象 | ping + Vercel + Neon + Clerk（Sentry/R2 は Phase2） | auto-recommended |
| D20260526-006 | AI/分析/法務/マーケ | すべて不要（単一ユーザー内部ツール） | auto-recommended |

## 依存関係

外部依存: なし（初版セッション）。同セッション内: 002←001, 003←001,002, 004←002, 005←002, 006←001。

## 生成・更新したアーティファクト

- 新規: `docs/concept.md`（§1〜§11）
- 新規: `docs/INDEX.md` / `docs/DOC_MAP.md` / `docs/PREREQUISITES.md` / `docs/SCENARIO.md`
- 新規: 機能フォルダ 5（registry/collection/dashboard/service-detail/alerts）+ 横断 4（_shared/{types,db,providers,auth}）の README + INDEX
- 新規: `README.md`（ルート）
- 更新: `docs/wants.md`（クリア）
- 新規: `docs/AI_LOG/INDEX.md`

## 学習・改善

- 既存テンプレートで充足。新規観点の追加なし（pull 型観測ダッシュボードという PJ 性質は perspectives O25/O29/O32 で十分カバー）。

---

## Decisions

```yaml
- id: D20260526-001
  timestamp: 2026-05-26T07:48:00+09:00
  command: /flow:concept
  phase: Step 0 / 起動前確認
  question: service-hub の本質的な役割はどちらか
  options:
    - 開発者向け内部運用ダッシュボード (recommended)
    - 利用者向けポータル
    - 両方を兼ねる
  recommended: 開発者向け内部運用ダッシュボード
  chosen: 開発者向け内部運用ダッシュボード
  chosen_type: explicit-choice
  depends_on: []
  context: |
    flow 系コマンドで週1ペースに連発するマイクロサービス群の利用状況を、
    開発者 seiji が一括把握・管理するための HUB。AskUserQuestion で本質的役割を確認し、
    エンドユーザー非公開の内部運用ダッシュボードと確定。スコープを観測中心に絞れる。

- id: D20260526-002
  timestamp: 2026-05-26T07:53:00+09:00
  command: /flow:concept
  phase: Step 2 / Q4-Q7 アーキ核 (利用状況の収集方式)
  question: 各マイクロサービスの利用状況を HUB はどう集めるか
  options:
    - HUB が各 PaaS API を pull (recommended)
    - 各サービスが push
    - ハイブリッド (インフラ=pull / アプリ層=push)
  recommended: HUB が各 PaaS API を pull
  chosen: HUB が各 PaaS API を pull
  chosen_type: auto-recommended
  depends_on: [D20260526-001]
  context: |
    連発前提 (週1) ではサービス側にコードを毎回仕込む push 方式は手間が大きい。
    pull は各 PaaS (Vercel/Neon/Clerk/Cloudflare/Sentry) の API 集約 + URL ping で
    サービス側無改修で稼働/利用/コストを取得でき、後付けの HUB に最適。
    将来アプリ層指標が必要になればハイブリッド (push 受け口追加) に拡張する余地を残す。

- id: D20260526-003
  timestamp: 2026-05-26T07:55:00+09:00
  command: /flow:concept
  phase: Step 2 / 管理スコープ
  question: HUB の「管理」はどこまでやるか（書き込み操作の有無）
  options:
    - 閲覧のみ / observability (recommended)
    - 閲覧 + HUB 内操作
    - 閲覧 + PaaS 操作
  recommended: 閲覧のみ / observability
  chosen: 閲覧のみ / observability
  chosen_type: explicit-choice
  depends_on: [D20260526-001, D20260526-002]
  context: |
    ダッシュボード = 観測が本質。外部 PaaS への書き込みは不可逆でトークンスコープも広がるため
    MVP では行わず将来フェーズに残す。pull した read-only データの可視化に徹する。

- id: D20260526-004
  timestamp: 2026-05-26T07:56:00+09:00
  command: /flow:concept
  phase: Step 2 / レジストリ SoT
  question: 管理対象サービス一覧（レジストリ）の SoT をどこに置くか
  options:
    - Git 管理の宣言ファイル (recommended)
    - HUB DB + 管理 UI
    - flow registry を同期
  recommended: Git 管理の宣言ファイル
  chosen: Git 管理の宣言ファイル
  chosen_type: explicit-choice
  depends_on: [D20260526-002]
  context: |
    services.toml をリポ内に置き Git 管理。API トークンは env に分離。
    週1でサービス作成→commit→redeploy の連発フローに最適、UI 不要で最小実装。
    Git 履歴で「いつどのサービスがあったか」も追える。DB は時系列スナップショットのみ持つ。

- id: D20260526-005
  timestamp: 2026-05-26T07:57:00+09:00
  command: /flow:concept
  phase: Step 2 / Q4 MVP pull 対象
  question: MVP でどのプロバイダまで pull するか
  options:
    - uptime ping + Vercel + Neon + Clerk (recommended)
    - 全プロバイダ一気に
  recommended: uptime ping + Vercel + Neon + Clerk
  chosen: uptime ping + Vercel + Neon + Clerk（Sentry/Cloudflare R2 は Phase 2）
  chosen_type: auto-recommended
  depends_on: [D20260526-002]
  context: |
    確実に取れる指標から開始。使用量 API の実在性はプロバイダ依存のため
    [論点-001] として providers 設計時に各プロバイダのドキュメントで検証して段階拡充する。

- id: D20260526-006
  timestamp: 2026-05-26T07:58:00+09:00
  command: /flow:concept
  phase: Step 2 / Q12.5,Q12.6,Q12.8,Q12.11 (内部ツール簡略)
  question: 外部AI / アナリティクス / 法務 / マーケの要否
  options:
    - すべて不要 (単一ユーザー内部ツール) (recommended)
  recommended: すべて不要
  chosen: 外部AI=なし / 外部向けアナリティクス=なし / 法務書類=不要 / マーケ=不要
  chosen_type: auto-recommended
  depends_on: [D20260526-001]
  context: |
    エンドユーザー非公開・単一ユーザーのため、外部AI・行動分析・法務書類・公開周知は不要。
    エラー監視は Sentry を §4.3 監視で採用、コスト追跡は §4.6 最小構成。§9/§4.8 に不要明記。
```
