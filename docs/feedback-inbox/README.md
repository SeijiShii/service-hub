# docs/feedback-inbox/ — 運営者フィードバック/問い合わせインボックス

> **役割**: 各マイクロサービスがユーザーから収集したフィードバック/問い合わせを、運営者 (seiji) が ServiceHUB 上で横断閲覧する consumer 側機能。
> **由来**: [論点-007] / perspectives O67 (consumer) / concept §6.2 / CF-20260618-006
> **種別**: 機能フォルダ (feature)、優先度 4

---

## 概要

各サービスは O40 でアプリ内フィードバック導線 (好き嫌い + バグ報告 + 問い合わせ) を持つが、集めたフィードバックを**運営者が横断して閲覧する仕組みが無かった** (各サービス DB に溜まるだけの死角)。本機能は ServiceHUB を運営者の閲覧面にする。

service-info (§6.1、O48/O63) と**完全同型の pull / 共有シークレットモデル** (O66 producer ↔ O67 consumer):

- **producer 側 (各サービス、O66)**: `GET /api/hub/feedback` を公開 (`HUB_SERVICE_INFO_SECRET` で保護、PII scrub 済み)。本フォルダの対象外 (各サービスが `/flow:revise` で実装)。
- **consumer 側 (本 HUB、O67 = 本フォルダ)**: 各サービスの `/api/hub/feedback` を pull → `FeedbackItem` 型で保存 → Clerk ゲート内の運営者インボックス画面 (横断一覧 + サービス別フィルタ + `/flow:claim` トリアージ導線) を提供。

## 境界 (このフォルダがやること / やらないこと)

| やること | やらないこと |
|---|---|
| 各サービスの feedback エンドポイントを pull する adapter | producer 側 `/api/hub/feedback` の実装 (各サービス、O66) |
| `FeedbackItem` 受信値の DB 保存 (idempotent) | フィードバックへの返信/ステータス writeback (pull only、サービスは受け身) |
| 運営者インボックス画面 (横断一覧 + フィルタ + トリアージ導線) | トリアージ後の修正実装 (`/flow:claim` → `/flow:fix`/`/flow:revise` が担当) |
| 未実装サービスの graceful degradation (空 items/404) | Shipyard 専用 adapter (MVP 対象外、[論点-FI-4] で follow-up) |

## 依存

- `_shared/types` — `FeedbackItem` / `FeedbackResponse` 型 (新規追加)
- `_shared/db` — `feedback_items` テーブル (新規追加)
- `_shared/auth` — Clerk 単一ユーザーゲート (運営者画面保護)
- `collection` — pull オーケストレーション層 (feedback pull を同層 adapter として統合)
- `registry` — 管理対象サービス一覧 (どこを pull するか)

## 設計文書

| 番号 | 文書 | 状態 |
|---|---|---|
| 001 | SPEC (仕様) | 設計中 |
| 002 | PLAN (実装計画) | 設計中 |
| 003 | UNIT_TEST (単体テスト計画) | 設計中 |
| 004 | E2E_TEST (E2E テスト計画) | 設計中 |
