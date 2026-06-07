# クレーム判定: 投げ銭(tip)指標が dashboard に表示されない

- **claim id**: C20260607-001
- **実施日**: 2026-06-07
- **対象**: ../README.md （dashboard 機能フォルダ）
- **基準 SPEC**: ../001_dashboard_SPEC.md
- **クレーム内容**: 各サービスが service-info の metrics[] で申告する投げ銭(tip)指標 (tip_count / tip_total_yen) が service-hub ダッシュボードに反映されない。期待: 各サービスカードに投げ銭の累計(件数・金額)が表示される。現実: 表示されない(実装漏れ)。
- **状態**: 判定完了 → 分岐実行 (revise)
- **判定結果**: 仕様検討漏れ (revise) — 収集/保存/VM 層は汎用で tip_* を既に保持済、表示層 (ServiceRow.tsx) が選択描画で tip 列を持たないための表示漏れ
- **分岐先**: ../revise_C20260607-001_20260607_tip-metrics-display/

## このフォルダに置くドキュメント

- `000_CLAIM_REPORT.md` — クレーム整理（期待 / 現実 / 文脈 / 影響 / 報告経路）
- `001_TRIAGE.md` — 判定レポート（三項照合根拠 + 種別判定 + 分岐先）

## 関連

- 起点 (producer): bousai-bag-checker fix/revise C20260607-001 (service-info v2 metrics[] に tip_count/tip_total_yen 追加・本番デプロイ済 2026-06-07)
- cross-repo follow-up perspective: O48 / CF-20260607-002 (producer の新 metric key は consumer 側実装を tracked follow-up で起票)
- 分岐先: `../revise_C20260607-001_20260607_tip-metrics-display/`
