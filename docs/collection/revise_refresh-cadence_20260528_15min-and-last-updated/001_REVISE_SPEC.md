# collection 変更仕様書（ダッシュボード最終更新表示）

> **改修種別**: 機能拡張（UI 追加情報）
> **issue / slug**: refresh-cadence / 15min-and-last-updated（**スコープ縮小: cron 移行撤回・最終更新表示のみ**、2026-05-28 §10 参照）
> **基準 SPEC**: `../001_collection_SPEC.md`
> **最終更新**: 2026-05-28
> **タグ**: ui

---

## 1. 変更概要

ダッシュボード（`/`）に**「最終更新: YYYY-MM-DD HH:MM (xx 分前)」表示**を追加する。最新 `collection_runs.finishedAt` を JST で表示し、データの鮮度を一目で確認できるようにする。**手動補完は別 revise `force-pull` の「今すぐ pull」ボタン**で行う（Vercel Cron 日次は維持、頻度は変えない）。

> **スコープ変更 (2026-05-28)**: 初版は「GitHub Actions cron 15 分間隔への移行」も含めていたが、ユーザー方針「Vercel 経由にしたい・日次でよい・手動更新で補完する」により**撤回**。Vercel Cron は無変更（日次 00:00 UTC のまま）、手動更新は force-pull ボタンに委ねる。

## 2. 変更前 vs 変更後

### 2.1 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| ダッシュボード `/` | サービス一覧 + 各 latest snapshot | 上記 + ヘッダ等に**「最終更新: YYYY-MM-DD HH:MM (xx 分前)」**表示 | 後方互換（追加表示のみ） |
| Vercel Cron / GH Actions | Vercel `0 0 * * *`（日次） | **無変更**（撤回） | ✅ |

### 2.2 データモデル変更
変更なし（`collection_runs` の `finishedAt` を読むだけ。既存 `recentRuns(db, 1)` を `api/dashboard/summary.ts` が既に呼んでいる）。

### 2.3 バリデーション・エラー変更
- 最新 run が無い場合 → 「未収集」表示。
- run 失敗時 → status を表示（`ok` / `partial` / `failed`、failed は警告色）。

## 3. 影響範囲
| 対象 | 影響度 | 説明 |
|---|---|---|
| `src/features/dashboard/summary.ts`（VM 構築） | 中 | `DashboardVM` に `lastUpdatedAt: string \| null` / `lastRunStatus: 'ok'\|'partial'\|'failed' \| null` を追加 |
| `src/features/dashboard/DashboardView.tsx` | 中 | ヘッダに「最終更新」表示追加 |
| `api/dashboard/summary.ts` | 低 | 既に `recentRuns(db, 1)` を呼んでいる → `buildDashboard` に渡す引数構築だけ拡張（既存実装でほぼ済んでいる） |
| `api/cron/collect.ts` / `vercel.json` | なし | **無変更**（Vercel Cron 維持） |
| GH Actions workflow / GitHub Secrets | なし | **不要**（cron 移行撤回） |

## 4. 後方互換性
- ✅ **完全互換**。表示の追加のみ、データ・エンドポイント・スケジュールは不変。

## 5. ロールバック方針
- ✅ コード revert で戻せる（dashboard VM/View の追加だけ）。

## 6. リリース戦略
- 一括。デプロイで完了。

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC
- **UC-LU1 最終更新表示**: ダッシュボード `/` ヘッダ部に「最終更新: YYYY-MM-DD HH:MM (xx 分前)」を表示。最新 `collection_runs.finishedAt` を JST で。run が無ければ「未収集」。failed run は警告色 + status を併記。

### 7.2 入出力
ダッシュボード VM:
```ts
interface DashboardVM {
  // 既存フィールド…
  lastUpdatedAt: string | null;        // ISO 8601 (UTC)、表示時に JST 化
  lastRunStatus: 'ok' | 'partial' | 'failed' | null;
}
```

### 7.3 データモデル
変更なし。

### 7.4 バリデーション・エラー
- `lastUpdatedAt` null → 「未収集」/ status=`failed` → 警告色 + status 表示。

### 7.5 機能固有 NFR + 既存連携
- 日次 Vercel Cron 維持で snapshot が更新 → 「最終更新」が動く。鮮度が気になる時は **force-pull ボタン（別 revise `force-pull`）** で即時更新。

## 8. タグ別追加項目
- **ui**: ダッシュボードヘッダに最終更新 + 相対時間表示（最低限）。

## 9. 未決事項
現時点で論点なし（2026-05-28）。cron 移行は撤回済（Vercel 日次 + force-pull 手動補完の方針で確定）。

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成（15 分 cron 化 + 最終更新表示） | /flow:revise |
| 2026-05-28 | **スコープ縮小**: cron 移行（GH Actions 15 分）を撤回、ダッシュボード最終更新表示のみ残す。ユーザー方針「Vercel 経由・日次で良い・手動補完（force-pull）」による。Vercel Cron / `vercel.json` / GH Actions workflow / GitHub Secrets はすべて無変更 | /flow:revise (scope amend) |
