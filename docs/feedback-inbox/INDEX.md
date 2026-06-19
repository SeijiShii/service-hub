# feedback-inbox ドキュメントインデックス

**最終更新**: 2026-06-18
**生成元**: /flow:concept → /flow:feature → /flow:spec-review → /flow:tdd → /flow:e2e
**状態**: 実装 + E2E + 視覚レビュー green + **本番反映済 (18th deploy)** — feedback_items 本番 Neon 追加 + /api/feedback/inbox LIVE (smoke 401 authed gate green)。producer 各サービスの /api/hub/feedback 実装 (O66) 待ちでインボックスは空 (graceful degradation)

<!-- ticket-status: shipped | updated: 20260618 | ref: dpl_7rAUwePWVhy3jdw99BfBtTRa3dqj (18th deploy) -->

<!-- auto-generated-start -->

## 機能概要 (短縮、詳細は README.md)
各サービスのユーザーフィードバック/問い合わせを pull して運営者が横断閲覧する consumer インボックス ([論点-007]/O67)

## ファイル一覧（番号順）
| 番号 | ファイル | 種別 | 状態 | 最終更新 | 短い説明 |
|---|---|---|---|---|---|
| 001 | [001_feedback-inbox_SPEC.md](./001_feedback-inbox_SPEC.md) | SPEC | 確定 | 2026-06-18 | pull + FeedbackItem + 運営者画面 |
| 002 | [002_feedback-inbox_PLAN.md](./002_feedback-inbox_PLAN.md) | PLAN | 確定 | 2026-06-18 | 5 Phase (型/DB→adapter→runner→API→UI) |
| 003 | [003_feedback-inbox_UNIT_TEST.md](./003_feedback-inbox_UNIT_TEST.md) | UNIT_TEST | 確定 | 2026-06-18 | upsert冪等/pull検証/401/cap |
| 004 | [004_feedback-inbox_E2E_TEST.md](./004_feedback-inbox_E2E_TEST.md) | E2E_TEST | 確定 | 2026-06-18 | 一覧/フィルタ/空/認証 + 視覚L1/L2 |
| 905 | [905_feedback-inbox_SPEC_REVIEW.md](./905_feedback-inbox_SPEC_REVIEW.md) | SPEC_REVIEW | 完了 | 2026-06-18 | High1/Med2/Low2 (R1責務分離=feedbackRunner別関数) |
| 101 | [101_feedback-inbox_IMPL_REPORT.md](./101_feedback-inbox_IMPL_REPORT.md) | IMPL_REPORT | 完了 | 2026-06-18 | 型/DB/adapter/feedbackRunner/API/UI |
| 102 | [102_feedback-inbox_UNIT_TEST_REPORT.md](./102_feedback-inbox_UNIT_TEST_REPORT.md) | UNIT_TEST_REPORT | 完了 | 2026-06-18 | 37 green / 全390 (回帰なし) |
| 103 | [103_feedback-inbox_E2E_REPORT.md](./103_feedback-inbox_E2E_REPORT.md) | E2E_REPORT | 完了 | 2026-06-18 | Playwright 3 green (一覧/空/フィルタ + visual L1/L2) |

## サブフォルダ（改修・バグ修正・クレーム判定履歴）
| パス | 種別 | issue/slug | 状態 | 概要 | INDEX |
|---|---|---|---|---|---|
| [revise_inbox-ux_20260618_unified-list-and-styling](./revise_inbox-ux_20260618_unified-list-and-styling/) | revise | inbox-ux | shipped (20th deploy) | 統合一覧の明示 + token styling (件数サマリ/絞り込みバー) | [INDEX](./revise_inbox-ux_20260618_unified-list-and-styling/INDEX.md) |
| [claim_C20260618-001_20260618_shipyard-feedback-not-loading](./claim_C20260618-001_20260618_shipyard-feedback-not-loading/) | claim | C20260618-001 | 判定完了 (cross-repo 判断待ち) | shipyard feedback 未表示 = [論点-FI-4] Shipyard adapter 未実装 (バグでない) | [INDEX](./claim_C20260618-001_20260618_shipyard-feedback-not-loading/INDEX.md) |
| [revise_inbox-pull-source_20260619_unregistered-controls](./revise_inbox-pull-source_20260619_unregistered-controls/) | revise | inbox-pull-source | shipped (21st deploy) | 無登録 shipyard pull (HUB_FEEDBACK_SOURCES) + inbox ホームリンク + その場 pull | [INDEX](./revise_inbox-pull-source_20260619_unregistered-controls/INDEX.md) |
| [revise_inquiries-reply-channel_20260619_reply-via-inquiries](./revise_inquiries-reply-channel_20260619_reply-via-inquiries/) | revise | inquiries-reply-channel | 設計完了 (実装待ち) | source kind 追加 → shipyard /api/hub/inquiries 消費で email+adminUrl 取り込み + inbox 返信導線 | [INDEX](./revise_inquiries-reply-channel_20260619_reply-via-inquiries/INDEX.md) |

## 関連
- 親 concept: `../concept.md` §1.3.1 feedback-inbox 行 / §6.2
- **依存**: _shared/types, _shared/db, _shared/auth, collection, registry
- 実装コード: `src/`（§1.4 参照）
- perspectives: O66 (producer) / O67 (consumer、本フォルダ)

## 機能性質タグ
- feature, auth-required (Clerk ゲート内 運営者インボックス UI)

## 未決事項 (SPEC §8)
- [論点-FI-1] pull オーケストレーション (推奨: 既存 collection cron 統合)
- [論点-FI-2] 保持期間 (推奨: MVP 全保持 + 表示直近 N)
- [論点-FI-3] 増分 pull (推奨: 直近 N + idempotent upsert)
- [論点-FI-4] Shipyard 専用 adapter (follow-up、本 MVP 対象外)

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
