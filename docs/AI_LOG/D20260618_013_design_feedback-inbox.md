# D20260618_013_design_feedback-inbox — /flow:design --review-only

**実行日時**: 2026-06-18
**コマンド**: /flow:design --review-only
**対象**: feedback-inbox (/feedback 新規画面)
**実行者**: seiji (auto via /flow:auto D20260618_008)
**状態**: 完了 (視覚レビュー green)

## サマリ

P4.4 Design gate(b): [論点-007] で追加した新規 UI 画面 /feedback の視覚レビュー。SoT
(docs/design/design-system.md) 適合 + O38 コピー走査 + O55 ルート到達性を確認。2 件の逸脱を TDD 修正。

| # | severity | 逸脱 | 修正 |
|---|---|---|---|
| D-R1 | Medium | kind バッジに絵文字 (💬🐞✉️) = design 原則#4「絵文字は使わない」違反 | 絵文字除去、色 + 文言のみで区別 (FeedbackInboxView) |
| D-R2 | Medium | /feedback への inbound nav link 不在 = O55 orphaned page | DashboardView nav に「フィードバック」リンク追加 (/admin と並置) |

視覚 (SoT トークン var(--*) 適用済・素 HTML でない) / コピー (技術用語なし、内部運営ツール) / O41 (内部 authed
ツールのため入口「これは何?」スキップ) / O43 (非課金画面) は OK。修正後 unit 81 green + E2E 12 green
(feedback-inbox baseline 更新、dashboard 回帰なし)。

## Decisions

- id: D20260618-013-00
  command: /flow:design
  phase: Step 4-5 (視覚レビュー + 修正)
  question: /feedback 画面の SoT 適合・コピー・到達性レビュー
  chosen: D-R1 絵文字除去 + D-R2 nav link 追加 (TDD、視覚 baseline 更新)
  chosen_type: auto-recommended
  context: |
    新規画面 /feedback を review。検出: (D-R1) kind バッジ絵文字が design 原則#4 違反 (リポジトリ唯一の
    絵文字 UI)、(D-R2) dashboard は /admin のみ link し /feedback が orphaned (O55)。両者 Class A で TDD 修正。
    絵文字除去で E2E visual baseline (list/empty) を同一セッション内の意図的変更として更新、clean run で
    安定 green 確認。nav link 追加で DashboardView は既存 15 unit + dashboard E2E 無回帰。O41/O43 は
    内部ツール/非課金で非該当。視覚レビュー green 到達 → Design gate(b) クリア。

- id: D20260618-013-01
  command: /flow:design (token-conformance 後追い修正)
  phase: Step 4 #2.6 (CF-20260618-008、[flow] フィードバック由来)
  question: /feedback の生値 hex バッジ色をデザインシステムトークンに是正
  chosen: kind バッジを chip スタイル (state-color トークン) + item card に --surface + text-muted fallback 修正
  chosen_type: explicit-choice
  context: |
    seiji [flow]「ページを設計するときは適切なスタイルを充てること」。初回視覚レビュー (D-R1/D-R2) は
    絵文字・orphan は捕捉したが、kind バッジ色 #2d6cdf/#c0392b/#8e44ad の生値直書き (原則#3 違反) を pass。
    flow-suite design.md Step 4 に #2.6 token-conformance チェックを新設 (CF-20260618-008、commit 467e0da) +
    PJ 側を是正: バッジ = design-system 状態色トークン (feedback→--accent / bug→--status-down /
    inquiry→--status-warn) を文字+枠線に、面は --surface-raised の chip スタイル。item card に
    --surface 背景 + --border (fallback を SoT 値 #232b3a に) + text-muted fallback #8a94a6→#9aa4b2、
    トリアージ button もトークン化。生値 hex 単独ゼロ (全て var() fallback)。unit 5 + E2E 3 green
    (snapshot 更新)。**prod 反映は次回 deploy (19th、Class B)** = ユーザー判断。
