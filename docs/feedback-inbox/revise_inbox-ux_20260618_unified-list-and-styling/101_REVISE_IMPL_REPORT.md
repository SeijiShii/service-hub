# 実装レポート: feedback-inbox inbox-ux (統合一覧 + スタイル適用)

## 実装日時
2026-06-18 (JST)

## モード
revise

## 関連ドキュメント
- [001_REVISE_SPEC.md] / [002_REVISE_PLAN.md] / [003_REVISE_UNIT_TEST.md]
- [AI_LOG](../../AI_LOG/D20260618_020_tdd_feedback-inbox_inbox-ux.md)

## 変更一覧

### Phase 1: VM 件数算出 (軽・メイン)
- `src/features/feedback-inbox/inbox.ts`: `FeedbackCounts` 型 + `FeedbackInboxVM.counts` 追加、`buildInboxVM` で items から total + byKind を集計 (additive)。

### Phase 2: View styling + 統合明示 (重・メイン)
- `src/features/feedback-inbox/FeedbackInboxView.tsx`:
  - **件数サマリ** (`data-testid=count-summary`): 「全 N 件（ひとこと a / 不具合 b / 問い合わせ c）」を header 下に表示 → 統合インボックスであることを明示。
  - **token 化した絞り込みバー**: `CONTROL`/`FIELD_LABEL` 共通スタイル定数 (surface-raised + border + text トークン) で service/period の `<select>` を styling (raw browser-default を解消)。
  - **kind = segmented chips**: 「すべて + ひとこと/不具合/問い合わせ」を button group (`role=group`) 化。選択中は `--accent`、非選択は `--text-muted` (token のみ、選択状態が視認可能)。
  - サービス名を `fontWeight:600` で強調 (per-item 横断スキャン)。empty-state / 日時も token 化。
  - **生値 hex 単独ゼロ** (全て `var(--token, fallback)`、原則#3 / CF-20260618-008 #2.6)。
- 既存 `data-testid` (feedback-list/feedback-item/kind-badge/empty-state/filters) 維持。

### Phase 3: Page 配線 (軽)
- `FeedbackInboxPage.tsx`: 変更なし。`counts` は API (`buildInboxVM`) → VM 経由で流れるため Page は素通し (型整合確認のみ)。

## 実装計画からの差分
| 項目 | 内容 |
|------|------|
| 計画にない追加変更 | なし |
| 計画から省略 | Page 変更 (counts が VM 内で完結するため不要、計画通り) |
| 想定外の問題 | なし |

## PR Description
### タイトル
feedback-inbox: 統合インボックス明示 + デザインシステム token styling (revise inbox-ux)

### 概要
`/feedback` を全サービス統合インボックスとして明示 (件数サマリ + per-item サービス強調 + kind segmented chips) し、raw 未スタイル control を design-system トークンで styling。総当たり確認の見落としリスクを解消。

### 変更内容
- VM に `counts` (total + kind 別) 追加 / 件数サマリ表示
- 絞り込みバーを token 化 (select + kind chips)、生値 hex 単独ゼロ
- サービス名強調・empty/button token 化

### テスト
- unit: 本機能 +4 (RU-01/02/03/05) / 全 394 passed (回帰なし、390→394)
- typecheck clean (既知 TS2578 のみ)
