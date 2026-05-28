# collection 変更仕様書（アプリ内強制プルボタン）

> **改修種別**: 機能拡張（新規 admin trigger surface + UI）
> **issue / slug**: force-pull / admin-button
> **基準 SPEC**: `../001_collection_SPEC.md`
> **最終更新**: 2026-05-28
> **タグ**: auth-required（Clerk ゲート内）

---

## 1. 変更概要

`/api/cron/collect`（Vercel Cron 専用、`CRON_SECRET` 認証、日次 00:00 UTC）に加え、**Clerk ゲート内の admin 用「今すぐ pull」エンドポイント + UI ボタン**を追加する。seiji がサービス登録直後やデバッグ時に curl + CRON_SECRET なしで即時 pull できるようにする。Vercel Cron 経路は無変更（後方互換）。

## 2. 変更前 vs 変更後

### 2.1 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| `POST /api/admin/collect`（新規） | なし | Clerk セッション必須（`requireSeiji`）→ `runCollection` 実行 → 結果 JSON 返却 | 新規（後方互換無関係） |
| `/admin` 画面 | services 登録/編集/退役のみ | 上記 + **「今すぐ pull」ボタン**（押下→ POST `/api/admin/collect` → 実行中 disabled+スピナー → 結果サマリ表示） | 既存機能維持・追加 |
| `/api/cron/collect`（Vercel Cron） | `CRON_SECRET` Bearer 検証→ `runCollection` | **変更なし**（Vercel Cron 互換性保持） | ✅ |

### 2.2 データモデル変更
変更なし（`runCollection` の出力 = 既存 `CollectionRun` を返す）。

### 2.3 バリデーション・エラー変更
- 新エンドポイント: 未認証 → 401 / 別人 → 403（既存 `requireSeiji`/`AuthError` 経由）/ 成功 → 200 + `CollectionRun` JSON / 内部失敗 → 500（詳細は stderr ログのみ、client には generic）。
- 並行起動防止は本 revise では入れない（[論点-CO1] は別 revise）。seiji 単独が連打しないだけで実害なし、`collection_runs` に複数行記録されるだけ。

## 3. 影響範囲
| 対象 | 影響度 | 説明 |
|---|---|---|
| 新規 `api/admin/collect.ts` | 高 | 新エンドポイント本体 |
| `src/features/admin/ServicesAdminView.tsx` | 中 | ボタン UI 追加 + 結果サマリ表示 |
| `src/features/admin/ServicesAdminPage.tsx` | 中 | onForcePull ハンドラ（fetch POST 配線）追加 |
| `api/cron/collect.ts` | 低 | **無変更**（Vercel Cron 互換のため） |
| 既存 `runCollection` (`src/features/collection/runner.ts`) | 低 | 無変更で再利用 |

## 4. 後方互換性
- ✅ **完全互換**。Vercel Cron 経路 (`/api/cron/collect`) は不変。新エンドポイントは追加のみ。

## 5. ロールバック方針
- ✅ コード revert で戻せる（新エンドポイント削除 + UI ボタン削除のみ、DB 変更なし）。

## 6. リリース戦略
- 一括（内部ツール・単一ユーザー・段階展開不要）。デプロイ → `/admin` に「今すぐ pull」ボタンが出現 → 押せば即実行。

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC
- **UC-FP1 強制プル**: seiji が `/admin` で「今すぐ pull」ボタンを押す → ボタン disabled+スピナー → 完了後にサマリ表示「N サービス、X 件 snapshot 保存、エラー Y 件」+ エラーあれば一覧。次回押下まで disabled 解除。

### 7.2 入出力
```ts
// POST /api/admin/collect (Clerk-gated)
// Response 200: CollectionRun (既存型) — { id, startedAt, finishedAt, status, servicesCount, errors?[] }
// Response 401: { error: "unauthorized" }
// Response 500: { error: "internal" }
```

UI 側:
- ボタン: `<button onClick={onForcePull} disabled={running}>{running ? "実行中…" : "今すぐ pull"}</button>`
- 結果表示エリア: `running` true なら spinner、完了後 `lastResult` を表示（services_count / errors）。

### 7.3 データモデル
変更なし。`runCollection` は既存どおり `collection_runs` に 1 行追加、`usage_snapshots` に upsert、`alert_events` 評価。

### 7.4 バリデーション・エラー
- 認証は既存 `requireSeiji(await getAuthFromRequest(req.headers))` 完全再利用（admin/services と同じパターン）。
- HTTP method: POST のみ（GET 等は 405）。

### 7.5 機能固有 NFR + 既存連携
- 実行時間: Vercel function timeout 内（runCollection の現状実行時間 ≤ 数十秒、サービス数増で伸びる。[論点-CO1] 並行起動/タイムアウトは別 revise）。
- 認証ゲート: 全ルート Clerk gate の例外にしない（admin/services と同じ厳格認証）。

## 8. タグ別追加項目
- **auth-required**: Clerk セッション必須、未認証 401 / 別人 403。`/api/public/*` のような無認証例外には**しない**。

## 9. 未決事項
現時点で論点なし（2026-05-28）。並行起動防止は [論点-CO1] として既存登録、本 revise スコープ外。

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成（admin force-pull ボタン + 新 Clerk ゲート内エンドポイント） | /flow:revise |
