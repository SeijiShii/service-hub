# 改修: レジストリ SoT を DB 化 + Clerk ゲート内 admin write

- **issue / slug**: db-sot / db-admin-write
- **実施日**: 2026-05-28
- **対象機能**: ../README.md（registry）
- **基準 SPEC**: ../001_registry_SPEC.md
- **改修要望**: 新マイクロサービス追加のたびに services.toml + .env を書き換えて再デプロイするのを解消。レジストリを Neon の services テーブルに移し、HUB の Clerk ゲート内 admin フォームから登録する（concept §7 [D20260528-001]/[D20260528-002]）。公開 POST/共通鍵は不採用。未運用ゆえデータ移行なし、services.toml は削除。
- **状態**: 設計完了（実装前）

## このフォルダに置くドキュメント
- `001_REVISE_SPEC.md` — 変更仕様（before/after, 影響, 後方互換, sequencing）
- `002_REVISE_PLAN.md` — 変更計画（ファイル変更/新規/削除, Phase 分割）
- `003_REVISE_UNIT_TEST.md` — 単体テスト計画
- `004_REVISE_E2E_TEST.md` — E2E テスト計画
- （005_MIGRATION は不要 = データ移行なし、PLAN §4 に記載）
- `101_*_IMPL_REPORT.md` — 実装レポート（/flow:tdd で生成予定）

## 関連
- concept 決定: ../../concept.md §7 [D20260528-001]/[D20260528-002]
- flow 契約: perspectives O48（2026-05-28 改訂、共通鍵 + MAU 自己申告 + admin 登録）
- 後続: step 3 = _shared/providers の ① 実装（MAU を service-info 自己申告 / 共通鍵）、hana-memo retrofit
- 高度レビュー: `/flow:feedback` or `/dev-review` 推奨 → `/flow:tdd` で実装
