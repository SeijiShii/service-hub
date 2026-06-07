# D20260607_006 release: 14th deploy (収益推移chart + collect unit-resilience hotfix)

**実行日時**: 2026-06-07
**コマンド**: /flow:release (継続、live化済 再デプロイ)
**状態**: 完了
**結果**: 14th deploy = dpl_E7gb6QmcMYEgUN9Q94Sfp8UwmahW、READY、aliased givers.work、post-deploy smoke green (/ 200・/api 401)

## 主要決定
- 反映 2 件: ① collect unit-欠落 resilience hotfix (C20260607-002、naze-bako エラー解消・全サービス collect 復旧) ② 収益(revenue_total_yen)推移 chart (C20260607-001 [論点-001] 案B)。
- naze-bako の unit 欠落 6 metric は runner で "" 矯正、非有限値は skip。1 producer の不正で全 collect が落ちない (C20260601-003 と同系の resilience)。
- 収益 chart は DASHBOARD_CHARTS 2 番目、¥軸。一覧の収益(¥)=累計合計額。

## 残件 / 次アクション
- 手動 pull (admin「今すぐ pull」) で collect 成功を確認 (naze-bako で落ちないこと)。成功後: bousai 収益¥200/件2、naze-bako 収益¥100/件1、hana-memo は sales_*(契約違反) のため収益—。
- producer follow-up (別 repo、任意): naze-bako は全 metric に unit を付す / hana-memo は sales_*→revenue_* に修正 (producer 側で契約遵守)。

## Decisions
- id: D20260607-017
  command: /flow:release
  question: 14th deploy (Class B) 実行可否
  chosen: deploy 実行 (ユーザー YES) → dpl_E7gb6QmcMYEgUN9Q94Sfp8UwmahW READY、smoke green
  chosen_type: explicit-choice
  context: collect 障害 hotfix (C20260607-002) + 収益推移 chart (C20260607-001) を本番反映。

## metrics
- deploy_target: production / deployed_url: https://service-hub.givers.work
- check_result: smoke green (frontend 200 / api 401)
