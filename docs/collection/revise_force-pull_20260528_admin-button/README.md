# 改修: アプリ内強制プルボタン（force-pull）

- **issue / slug**: force-pull / admin-button
- **実施日**: 2026-05-28
- **対象**: collection（../README.md）
- **改修要望**: 日次 00:00 UTC の Vercel Cron まで待たず、`/admin` から「今すぐ pull」ボタンで即時 `/api/cron/collect` 相当の処理を実行できるようにする。curl + CRON_SECRET 不要に。
- **設計判断（auto-pick）**: ボタンは `/admin` に配置 / 結果表示は簡素サマリ（件数 + errors）/ 新エンドポイント `api/admin/collect.ts`（Clerk ゲート内、cron 経路は無変更）/ 並行起動防止は別 revise（[論点-CO1]）。
- **状態**: 設計完了 → 実装

## ドキュメント
- 001_REVISE_SPEC / 002_REVISE_PLAN / 003_REVISE_UNIT_TEST / 004_REVISE_E2E_TEST
- 101_REVISE_IMPL_REPORT / 102_REVISE_UNIT_TEST_REPORT（実装後）

## 関連
- 基準 SPEC: `../001_collection_SPEC.md`
- 既存 cron 経路: `api/cron/collect.ts`（不変、Vercel Cron 互換）
- 後続: `/flow:tdd collection force-pull` で実装
