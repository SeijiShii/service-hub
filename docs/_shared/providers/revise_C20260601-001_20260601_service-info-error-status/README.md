# revise: service-info 契約のエラー status 意味論（認証失敗→401/403）

- **id**: C20260601-001
- **実施日**: 2026-06-01
- **対象**: ../001_providers_SPEC.md（service-info adapter / 契約 SoT）+ _shared/types 連動
- **起点クレーム**: `../../../collection/claim_C20260601-001_20260601_error-diagnostics/001_TRIAGE.md`
  （decision: 三項照合 → 仕様検討漏れ revise、対象 = _shared/providers 契約）
- **状態**: 設計待ち（/flow:revise で 001_REVISE_SPEC〜004 を生成）

## 背景（クレーム要約）

collection pull で bousai-bag-checker / service-info が `http_404` を返し詳細不明。
真因は HUB_SERVICE_INFO_SECRET 不一致の疑いで、**本来 401（認証失敗）で返るべき**が
producer が 404 を返すため、service-hub が「不在」と誤認し汎用 `http_404` に落ちる。
service-info 契約が**認証失敗時の status code（401/403）を未規定**なのが根因。

## revise スコープ（確定済み方針）

1. service-info 契約に「**認証失敗（秘密不一致/欠落）→ 401（または 403）**、404 はエンドポイント
   不在に限定」を明文化（`001_providers_SPEC.md` + `_shared/types` の `ServiceInfoResponse` ドキュメント）。
2. クロスサービス波及（concept §6.1）: producer 実装ガイドが認証失敗で 401 を返すよう要求。
3. 下流タスク（別 repo）: bousai-bag-checker の service-info エンドポイントを 404→401 に修正（/flow:fix）。

## 関連

- 起点クレーム: `../../../collection/claim_C20260601-001_20260601_error-diagnostics/`
- 契約 SoT: `concept.md §6.1` / `[論点-003]` / `src/types/service.ts:29-44`
- 実装: `src/providers/adapters.ts:35-37, 207-212`
