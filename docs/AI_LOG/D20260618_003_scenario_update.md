# D20260618_003_scenario_update — /flow:scenario --update (§5 cursor reconcile)

**状態**: 完了
**モード**: update (§5 cursor reconcile + §6 history append)
**開始**: 2026-06-18
**dispatch元**: /flow:auto (D20260618_002, §3.0c drift-shooting)

## サマリ

AUDIT_20260610_0805 の High/chronic finding [AUDIT-scenario-drift] をシューティング。
§5 cursor が 12th deploy で停止 (実態 16th deploy + summary-projection [論点-011] 実装完了) を reconcile。

## decisions

- id: D20260618-003-01
  question: §5 cursor reconcile 内容
  chosen: 12th→16th deploy + summary-projection [論点-011] 実装完了 (prod 反映待ち=Class B) を反映
  chosen_type: auto-recommended
  context: |
    13th(収益指標 C20260607-001) / 14th(収益推移chart+collect hotfix C20260607-002) /
    15th(chart-ux e7b6d2b) / 16th(chart-colors 25b4794) を完了フェーズに追記。
    進行中ターゲット = summary-projection (8e97a26 実装完了、残=db:push services.summary + redeploy=Class B)。
    Open 論点 006 = 実装完了 prod 反映待ちに更新。
    残ゲート P4.7 = summary prod 反映が残 (要 release-pre full audit + secure、最新 AUDIT 参照 commit ≠ HEAD)。
    §6 履歴に 15th/16th deploy + summary-projection + 本 reconcile を append。

- id: D20260618-003-02
  question: concept §8 [論点-006] stale 表記 (「未実装」) の扱い
  chosen: 本コマンドでは編集せず次反復に委譲 (scenario.md やってはいけないこと#3)
  chosen_type: auto-recommended
  context: |
    concept §8 [論点-006] が「現状(2026-06-10 監査)...未実装」と stale。8e97a26 で実装済。
    /flow:scenario は concept.md を編集しない規約 → /flow:concept UPDATE (Class A drift) は auto 次反復で評価。
    SCENARIO §5 側には [論点-006]=実装完了 prod 反映待ち を正しく記録済。

## 生成・更新ファイル
- docs/SCENARIO.md (§5 cursor reconcile + §6 history append)
- 本 AI_LOG

## 次アクション
- concept §8 [論点-006] stale 表記の reconcile (/flow:concept UPDATE、Class A)
- summary-projection prod 反映 (/flow:release、Class B、要 release-pre 監査)
