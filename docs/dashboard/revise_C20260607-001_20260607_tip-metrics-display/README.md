# 改修: dashboard に投げ銭(tip)指標を表示

- **issue/slug**: C20260607-001 / tip-metrics-display
- **実施日**: 2026-06-07
- **対象**: ../README.md (dashboard 機能フォルダ)
- **起点クレーム**: `../claim_C20260607-001_20260607_tip-metrics-display/001_TRIAGE.md` (判定: 仕様検討漏れ → revise、decision D20260607-003)
- **cross-repo**: 起点 producer = bousai-bag-checker C20260607-001 / O48 CF-20260607-002
- **状態**: 設計完了（001-004 生成済、実装待ち）

## 改修概要 (claim TRIAGE §3 から)

dashboard 各サービス行に tip_total_yen(¥表記) / tip_count を additive 表示。収集/保存/VM は既に汎用で tip_* を保持済 (変更不要)、表示層 ServiceRow.tsx の列追加が主。任意で KnownMetricKey に tip_* 追記 (typo 防止)。上部 chart 化はスコープ外推奨。jpy 固定・PII なし (O48)。

## このフォルダに置くドキュメント (/flow:revise が生成)

- `001_REVISE_SPEC.md` / `002_REVISE_PLAN.md` / `003_REVISE_UNIT_TEST.md` / `004_REVISE_E2E_TEST.md`
