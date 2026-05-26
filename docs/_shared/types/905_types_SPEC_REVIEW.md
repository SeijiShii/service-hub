# _shared/types 設計レビュー (905, spec-review)

**レビュー日**: 2026-05-26
**レビュー実施者**: Claude (Opus 4.7)（/flow:auto P3.7 Spec-review gate）
**対象**: docs/_shared/types/ (001_SPEC / 002_PLAN / 003_UNIT_TEST)
**モード**: auto-pick（設計判断は推奨で自動解決し本レポート + 必要に応じ 001-003 に反映、AI_LOG 記録）
**前提**: greenfield（既存コードなし）→ 実コード調査は最小、**設計健全性・責務境界・concept 整合**を中心にレビュー

<!-- auto-generated-start -->

## 1. 総評
foundational な型フォルダとして設計は健全。**責務境界が正しい**（型 + ガード + 定数のみ、ランタイム検証は registry/providers に委譲）。concept §5.1 データ設計と整合。新規 Critical/High 設計問題なし。以下は auto-pick で解決した軽微な設計判断。

## 2. 影響範囲
- **被依存 = 全フォルダ**（_shared/db, _shared/providers, registry, collection, dashboard, service-detail, alerts）。型変更は全体波及するため、初版で contract を固めることが重要。
- greenfield のため既存実装との衝突なし。最初の実装対象（scaffold 兼任）。

## 3. レビュー観点別

### 3.1 責務逸脱 — ✅ 問題なし
- 型フォルダがランタイム検証ライブラリ（Zod 等）を持ち込んでいない（registry/providers の責務に正しく分離）。
- DB スキーマ（DDL/Drizzle）は `_shared/db` に委譲、型のみ本フォルダ。境界が明快。

### 3.2 既存パターン整合 — N/A（最初のコード）
- preferences §2.13 で Drizzle 採用 → `_shared/db` が本フォルダの型に整合する Drizzle スキーマを書く流れが自然。

### 3.3 設計判断の解決（auto-pick）

| # | 論点 | 解決（推奨採用） |
|---|---|---|
| R1 | `id` フィールドの型 | **string（DB 生成、UUID/cuid 等）**。型層は string で受け、生成は db 層の責務。001 §1.3/§1.4 の `id: string` のままで OK、SPEC に「DB 生成識別子」注記を追加。 |
| R2 | 日時表現 | **型境界は ISO 8601 string で統一**（`capturedAt`/`triggeredAt` 等）。Date への変換は利用側。現状の設計どおり、一貫性 OK。 |
| R3 | `rawJson: unknown` | **`unknown` を維持**（`any` でなく）。利用側で必ず narrowing を強制でき、[論点-004] の raw_json スクラブとも整合。OK。 |
| R4 | `ProviderAdapter.collect` の失敗表現 | **`{ metrics, error? }` を返す（throw しない）**設計を維持。部分成功（一部 provider 失敗でも他は収集）に必須。collection が `CollectionRun.errors` に集約。OK。 |
| R5 | `MetricKey` の open union | **`KnownMetricKey | (string & {})` を維持**。Phase2 のメトリクス追加で破壊変更を避ける。既知キーは KnownMetricKey で typo 防止。OK。 |

→ R1 のみ SPEC に 1 行注記を追加（他は現状設計を承認）。

### 3.4 設計判断漏れ — 軽微
- **service-info レスポンス型未定義**: [論点-T1]（[論点-003] 連動）で正しく deferred。providers 設計時に `ServiceInfoResponse`（最小固定 + `extra: Record<string,unknown>`）を追加する旨が記録済。漏れではなく意図的保留。OK。

## 4. tdd 着手可否
**可**。型 contract は実装着手に十分。`_shared/db` が本フォルダの型を import して Drizzle スキーマを書くため、**db 設計と並行 or 直後**が自然。greenfield のため types の tdd が tsconfig/vitest scaffold を兼ねる（PLAN §4 記載済）。

## 5. 次アクション
- 001_SPEC に R1 注記（id は DB 生成 string）を反映。
- tdd は types → db の順（db が types を import）。
<!-- auto-generated-end -->
