# 単体テストレポート: dashboard nav-and-pull

## 実施日時
2026-05-28 13:07 (JST)

## テスト実行環境
- vitest 2.1.9 (happy-dom + @testing-library/react)

## テスト結果

| # | テストケース | ファイル | 結果 |
|---|---|---|---|
| TFP-B2 | onForcePull 未渡し → force-pull section 非表示 (button 不在) | DashboardView.test.tsx | ✓ |
| TFP-N3 | 「今すぐ pull」ボタン click → onForcePull が 1 回 | DashboardView.test.tsx | ✓ |
| TFP-N4 | forcePullState.lastResult → サマリに servicesCount + errors 件数 | DashboardView.test.tsx | ✓ |
| TFP-E4 | running=true → ボタン disabled + 「実行中…」+ click 抑止 | DashboardView.test.tsx | ✓ |
| UX-N4 | ServicesAdminView ヘッダに back-link (href="/" + label "ダッシュボード") | ServicesAdminView.test.tsx | ✓ |
| 既存 | DA-N1/N2/N4/E1/E3/B1 + UX-N1 + RC-N1/N2/N3/E1/E2/B1 + 採算/funnel etc. | dashboard 配下 | ✓ (全保持) |
| 既存 | UX-N3 + AF-1/2/3/4 | admin 配下 | ✓ (全保持) |
| 既存 | api/admin/collect.test.ts (FP-N1/N2/E1/E2/E3/B1) | api 配下 | ✓ (POST 経路無変更) |

## 削除テストケース
- FP-N3 (ServicesAdminView): force-pull が dashboard へ移管されたため admin 側で検証不要。TFP-N3 として dashboard に移動。
- FP-N4 (ServicesAdminView): 同上、TFP-N4 として移動。
- FP-E4 (ServicesAdminView): 同上、TFP-E4 として移動。

## 追加テストケース
- TFP-N3/N4/E4/B2 + UX-N4 = 5 件、SPEC §7.1/§7.2 + PLAN §5 Phase 1/2 をカバー。

## サマリー
| 項目 | 値 |
|---|---|
| 本 revise 関連の新規テスト | 5 (TFP-N3/N4/E4/B2 + UX-N4) |
| 本 revise 関連の削除テスト | 3 (FP-N3/N4/E4、dashboard へ移動) |
| 全スイート合計 | 196 |
| 成功 | 196 |
| 失敗 | 0 |
| 成功率 | 100% |
| typecheck | exit 0 |
| 既存テスト破壊 | なし (resilient query + Props オプショナル設計) |
