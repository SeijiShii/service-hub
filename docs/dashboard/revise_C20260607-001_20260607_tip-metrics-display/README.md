# 改修: dashboard に収益(revenue)指標を表示 + 契約キー正規化

- **issue/slug**: C20260607-001 / tip-metrics-display（収益化に伴い実体は revenue-metrics-display）
- **実施日**: 2026-06-07
- **対象**: ../README.md (dashboard 機能フォルダ)
- **起点クレーム**: `../claim_C20260607-001_20260607_tip-metrics-display/001_TRIAGE.md` (判定: 仕様検討漏れ → revise、decision D20260607-003)
- **cross-repo**: 起点 producer = bousai-bag-checker C20260607-001 / O48 CF-20260607-002
- **状態**: 実装完了 (2026-06-07、unit 323 green)

## 改修概要

dashboard 各サービス行に収益(件数・¥金額)を additive 表示。当初 producer は投げ銭(tip_*)名で申告したが、収益源泉はサービスにより寄付/売上/投げ銭等さまざまなため、ラベルを「収益」、契約 canonical キーを汎用 `revenue_count` / `revenue_total_yen` に統一。旧 `tip_*` 申告は service-info adapter で後方互換正規化(producer 強制再デプロイ不要)。jpy 固定・PII なし (O48)。上部 chart 化はスコープ外。

## このフォルダに置くドキュメント (/flow:revise が生成)

- `001_REVISE_SPEC.md` / `002_REVISE_PLAN.md` / `003_REVISE_UNIT_TEST.md` / `004_REVISE_E2E_TEST.md`
