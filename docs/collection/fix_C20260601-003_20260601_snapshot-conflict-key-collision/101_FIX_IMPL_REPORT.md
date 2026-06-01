# 実装レポート: snapshot conflict key 衝突 (C20260601-003)

## 実装日時
2026-06-01 12:42 (JST) / モード: fix (hotfix、C20260601-002 リグレッション)

## 変更
- `src/db/queries.ts`: `dedupeByConflictKey(rows)` 追加 (Map で `service_slug + metric_key + captured_at` キー後勝ち) → `upsertSnapshots` の `.values()` 前段に適用。
- `src/db/queries.test.ts`: DB-FX-003 追加 (ping/up + service-info/up 同一 captured_at → 1 行 last-wins、修正前は pglite が SQLSTATE 21000 で throw)。

## テスト
- RED: DB-FX-003 が SQLSTATE 21000 (ON CONFLICT DO UPDATE cannot affect row a second time) を再現して失敗。
- GREEN: DB-FX-003 pass、full 315/315 green。

## release-pre 判定 (hotfix)
本 hotfix は **pure code dedup** (既存関数内、新 endpoint/新 dep/schema migration なし)。直前の full audit (AUDIT_20260601_1229 Critical0/High0) + secure (SECURITY_REVIEW_20260601 新規0) は本 delta に対し有効 (新たな構造/依存/観点/脆弱性 surface ゼロ)。本番障害復旧優先で 12th deploy へ。

## PR Description
fix(collection): usage_snapshots 同一 conflict key 衝突で collect 全 insert 失敗を解消 (C20260601-003)
- upsert 前に (service,metric,captured_at) 後勝ち dedup。C20260601-002 (1 run 単一 capturedAt) が複数 provider 同一 metric_key (ping/up + service-info/up) で露呈させた衝突を解消。migration 不要。
