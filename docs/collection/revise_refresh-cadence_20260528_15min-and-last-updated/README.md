# 改修: 更新頻度 15 分化 + ダッシュボード最終更新表示

- **issue / slug**: refresh-cadence / 15min-and-last-updated
- **実施日**: 2026-05-28
- **対象**: collection（../README.md）
- **改修要望**:
  (1) 自動 pull を 24 時間に 1 回 → 15 分に 1 回にしたい（個人サービス）。
  (2) ダッシュボードに「最終更新」を表示。
- **解決**: Vercel Hobby は cron 日次のみ許可（[論点-002]）→ **GitHub Actions cron `*/15 * * * *`** で `/api/cron/collect` を `CRON_SECRET` 付きで叩く（[論点-002] 案 B 採用、無料）。Vercel Cron は撤去（二重起動防止）。ダッシュボードは既存 `recentRuns(db, 1)` を VM に反映してヘッダ表示。
- **状態**: 設計完了 → 実装

## ドキュメント
- 001_REVISE_SPEC / 002_REVISE_PLAN / 003_REVISE_UNIT_TEST / 004_REVISE_E2E_TEST
- 101_REVISE_IMPL_REPORT / 102_REVISE_UNIT_TEST_REPORT（実装後）

## 関連
- 基準 SPEC: `../001_collection_SPEC.md`
- 関連既存論点: `../../concept.md` §8 [論点-002] 解決済（Hobby cron 日次制約、GH Actions cron が案 B）
- 同時進行: `../revise_force-pull_20260528_admin-button/`（強制プルボタン）
- 後続: `/flow:tdd collection refresh-cadence` で実装 + デプロイ後に GitHub Secrets 登録（user 手動）
