# D20260618_018_revise_feedback-inbox_inbox-ux — /flow:revise feedback-inbox inbox-ux

**実行日時**: 2026-06-18
**コマンド**: /flow:revise
**対象機能+issue**: feedback-inbox / inbox-ux (unified-list-and-styling)
**実行者**: seiji
**状態**: 完了 (設計、実装は tdd へ)

## サマリ

[flow] フィードバック: (1) スタイルが当たっていない、(2) サービスを選ぶ形式だと届いたメッセージ確認に
手動総当たりが要り見落としリスク → 全サービスのメッセージを一覧 + フィルタリング。
調査結果: CSS トークンは index.css :root に定義済 (色は解決) だが、**フィルタの select/label が
raw 未スタイル browser default** で「当たっていない」印象 + 「サービス選択フォーム」感。一覧自体は
既に unified default (Page は初期 service フィルタなし)。→ 改修 = (a) 全コントロールを token 化スタイル、
(b) unified inbox を明示 (件数サマリ + per-item サービス名強調 + フィルタは二次的な絞り込み)。
backend/data 変更なし = migration 不要・後方互換。

## Decisions

- id: D20260618-018-00
  command: /flow:revise
  phase: Step 1.2 / Step 2 (要望取得 + 影響範囲調査)
  question: 改修要望の確定 + styling 根本原因
  chosen: UI/UX 改修 (token スタイル適用 + unified inbox 明示)。FeedbackInboxView + Page + inbox.ts (件数) のみ、backend 不変
  chosen_type: explicit-choice
  context: |
    seiji [flow]「スタイルが当たっていない / 全サービスのメッセージを一覧 + フィルタリング (総当たり見落とし回避)」。
    調査: index.css :root に --bg/--surface/--accent/--status-* 定義済 = 色は解決するが、FeedbackInboxView の
    filter は raw <select>/<label> で未スタイル (browser default が dark 上で浮く) + select 行が主役で
    「サービス選択フォーム」に見える。一覧は既に listFeedback(service なし)=全件 unified。
    改修方針: (a) header/filter/list/empty を design-system トークンで styling (dashboard 同等の polish、
    raw control をやめる)、(b) 件数サマリ + per-item サービスアイコン+名を強調し「全サービスを一度に見る」
    を視覚的に明示、フィルタは二次的な絞り込み (segmented/styled select)。data model 不変 → migration 不要。

- id: D20260618-018-01
  command: /flow:revise
  phase: Step 3.1 (改修固有 5 項目、Class A auto-pick)
  question: 後方互換 / リリース / テスト扱い / ロールバック / 動機
  chosen: 後方互換=維持 (UI のみ) / リリース=一括 (19th 後の次 deploy) / テスト=既存 View test 維持+件数・フィルタ追加 / ロールバック=code revert / 動機=可用性 (見落とし回避) + 適切な styling
  chosen_type: auto-recommended
  context: |
    UI/presentation のみの改修で API/型/DB 不変 → 後方互換維持・migration なし・ロールバックは revert で完結。
    既存 FeedbackInboxView.test の 5 ケースは維持し、件数サマリ + フィルタ refinement のケースを追加。E2E は
    visual baseline 更新 + 件数/フィルタ refinement シナリオ追加。
