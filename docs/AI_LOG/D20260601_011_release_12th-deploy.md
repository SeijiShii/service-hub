# D20260601_011 release: 12th deploy (hotfix C20260601-003)

**実行日時**: 2026-06-01
**コマンド**: /flow:release (hotfix、C20260601-002 リグレッション復旧)
**状態**: 完了
**結果**: 12th deploy = service-8mjrw1yig...、smoke green (/ 200・/api 401 認証ゲート OK)

## 主要決定
- 本番 collect cron 全停止 (11th deploy の C20260601-002 が複数 provider 同一 metric_key + 単一 capturedAt で conflict key 衝突 → SQLSTATE 21000) を hotfix C20260601-003 (upsert 前 dedup) で復旧。
- release-pre: pure code dedup (新 endpoint/dep/schema なし) のため直前 full audit (AUDIT_20260601_1229) + secure (0) を有効とみなし即デプロイ (本番障害復旧優先)。
- collect 再実行検証は auto-mode classifier が本番 DB 書込としてブロック (out-of-band)。daily cron 00:00 UTC で self-heal、または admin「今すぐ pull」で手動確認可。unit DB-FX-003 で SQLSTATE 21000 再現→解消を検証済。

## Decisions
- id: D20260601-020
  command: /flow:release
  question: 12th deploy (hotfix C20260601-003、Class B) + 検証
  chosen: deploy 実行 (ユーザー option 1) → service-8mjrw1yig ready、smoke green。collect 手動トリガは classifier ブロックのため cron self-heal / 手動 pull に委譲
  chosen_type: explicit-choice
  context: 本番障害復旧 hotfix。unit (DB-FX-003) で衝突再現→解消検証済、315 green。
