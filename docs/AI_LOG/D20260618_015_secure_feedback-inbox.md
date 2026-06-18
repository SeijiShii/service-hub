# D20260618_015_secure_feedback-inbox — /flow:secure --phase=design

**実行日時**: 2026-06-18
**コマンド**: /flow:secure --phase=design
**対象**: feedback-inbox (新 endpoint + feedback pull adapter)
**実行者**: seiji (auto via /flow:auto D20260618_008)
**状態**: 完了

## サマリ

§3.0c secure トリガ (新 authed endpoint /api/feedback/inbox + 新外部入力)。L1 設計レビュー: 新規
Critical/High SEC = **0**。O23 authz (requireSeiji) / O24 SSRF (safeFetch) + 多段入力検証 / O25 secret (env) /
O26 PII ログ (body 非ログ・rawJson 非保存) / XSS (React escape) すべて PASS。Info 2 (PII 保持=[論点-FI-2] 追跡済 /
producer scrub 信頼前提=defense-in-depth 済)。O22/O54 は単一ユーザー internal で N/A。

## Decisions

- id: D20260618-015-00
  command: /flow:secure
  phase: Step 2 (L1 設計レビュー)
  question: feedback-inbox 新 trust boundary の脆弱性照合
  chosen: 新規 Critical/High 0、Info 2 (既存論点 + 信頼前提)
  chosen_type: auto-recommended
  context: |
    feedback-inbox は producer の untrusted feedback body を pull→保存→authed 運営者画面表示する新 trust
    boundary。L1: O23 (requireSeiji + 401 結合テスト) / O24 (safeFetch SSRF + schemaVersion/items/per-item
    検証 + body cap) / O25 (HUB_SERVICE_INFO_SECRET env、新規 secret なし) / O26 (body 非ログ・rawJson 非保存) /
    XSS (React escape、dangerouslySetInnerHTML なし) すべて PASS。新規 SEC finding 0 ゆえ §8 論点登録なし。
    Info: [論点-FI-2] PII 保持 (追跡済) + producer scrub 信頼前提 (HUB は length cap/authed/rawJson 非保存で
    defense-in-depth)。901_feedback-inbox_SECURITY_REVIEW.md 生成。
