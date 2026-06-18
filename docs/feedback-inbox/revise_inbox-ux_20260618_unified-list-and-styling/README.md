# 改修: feedback-inbox インボックス UX — 統合一覧 + スタイル適用

- **issue / slug**: inbox-ux / unified-list-and-styling
- **実施日**: 2026-06-18
- **対象機能**: ../README.md
- **基準 SPEC**: ../001_feedback-inbox_SPEC.md
- **改修要望**: (seiji [flow]) ①スタイルが当たっていない。②サービスを選ぶ形式だと届いたメッセージ確認に手動総当たりが必要で見落としリスク → 全サービスのメッセージを一覧でき、かつフィルタリングできるようにする。
- **状態**: 設計中

## 改修の本質 (調査結果)

- CSS トークン (`--bg`/`--surface`/`--accent`/`--status-*`) は `src/index.css :root` に定義済 = 色は解決する。だが **filter の `<select>`/`<label>` が raw 未スタイル** (browser default が dark テーマ上で浮き「スタイルが当たっていない」印象) + select 行が主役で「サービス選択フォーム」に見える。
- 一覧は**既に unified** (`FeedbackInboxPage` は初期 service フィルタなし → `listFeedback` が全サービス全件返す)。機能としては総当たり不要だが、**UI がそう見えない**。
- → 改修 = (a) 全コントロールを design-system トークンで styling (dashboard 同等の polish)、(b) **統合インボックスであることを視覚的に明示** (件数サマリ + per-item サービスアイコン/名の強調) + フィルタを二次的な絞り込みとして配置。

## このフォルダのドキュメント

- `001_REVISE_SPEC.md` — 変更仕様 (before/after)
- `002_REVISE_PLAN.md` — 変更計画
- `003_REVISE_UNIT_TEST.md` — 単体テスト計画
- `004_REVISE_E2E_TEST.md` — E2E テスト計画 (視覚 baseline 更新含む)
- (migration なし — UI/presentation のみ、data/型/API 不変)

## 関連
- 親機能 INDEX: ../INDEX.md
- 視覚レビュー基準: docs/design/design-system.md (トークン + Card/Panel + 状態色)
- flow 学習: CF-20260618-008 (design Step 4 #2.6 token-conformance)
