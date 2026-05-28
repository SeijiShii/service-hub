# 実装レポート: collection refresh-cadence (最終更新表示)

## 実装日時
2026-05-28 12:15 (JST)

## モード
revise (スコープ縮小版 — cron 移行撤回、最終更新表示のみ)

## 関連ドキュメント
- 001_REVISE_SPEC / 002_REVISE_PLAN / 003_REVISE_UNIT_TEST / 004_REVISE_E2E_TEST
- [AI_LOG](../../AI_LOG/D20260528_010_tdd_collection_refresh-cadence.md)

## 変更一覧

### Phase 1: dashboard VM + 最終更新表示 (commit 9b26234)
- `src/features/dashboard/summary.ts`:
  - `DashboardVM` に `lastUpdatedAt: string | null` / `lastRunStatus: CollectionRun["status"] | null` (null 許容に格上げ) を追加
  - `buildDashboard`: `lastRun?.finishedAt ?? lastRun?.startedAt ?? null` を抽出
- `src/features/dashboard/lastUpdatedFormat.ts` (新規): JST 化 (UTC+9 手動オフセット、サマータイムなし) + 相対時間 (`N 秒前/分前/時間前/日前`) + `未収集` フォールバック。`now` を引数化して `vi.setSystemTime` と整合
- `src/features/dashboard/DashboardView.tsx` ヘッダに `[data-testid="last-updated"]` で「最終更新: YYYY-MM-DD HH:MM (xx 分前)」表示。`lastRunStatus=failed` 時は `--status-down` 色 + " · failed" 併記。`data-status` 属性で機械検証可
- `src/features/dashboard/summary.test.ts` / `DashboardView.test.tsx`: RC-N1/N2/N3 + RC-E1/E2 + RC-B1 (時刻固定で相対時間決定的化)

### スコープ外 (撤回済、無変更を確認)
- `vercel.json` — 触らず (日次 cron 維持)
- `.github/workflows/` — 作成せず
- `api/cron/collect.ts` — 触らず

## 実装計画からの差分

| 項目 | 内容 |
|------|------|
| 計画外の追加 | `lastUpdatedFormat.ts` を分離 (DashboardView 内 inline ではなく独立ファイル、テスト容易性 + 再利用余地)。`lastRunStatus` の型を `CollectionRun["status"] \| undefined` → `\| null` に格上げ (PLAN §1 SPEC §7.2 が null を想定していたため整合)。 |
| 計画から省略 | なし |
| 想定外 | なし。既存 `DA-N4/E2: lastRunStatus="failed"` 既存テストは `null` 既定の `vm()` ヘルパ修正 + 既存 status 評価ロジックは無変更で resilient。 |

## PR Description

### タイトル
collection refresh-cadence: dashboard 最終更新表示 (cron 移行は撤回)

### 概要
日次 Vercel Cron 後の鮮度を一目で把握できるよう、ダッシュボードに「最終更新: YYYY-MM-DD HH:MM (xx 分前)」を追加。手動補完は別 revise force-pull に委譲。

### 変更内容
- DashboardVM 拡張 (`lastUpdatedAt` + `lastRunStatus` null 化)
- `lastUpdatedFormat.ts` 追加 (JST + 相対時間)
- DashboardView ヘッダ表示 (未収集 / failed 警告色対応)

### テスト
- 新規: RC-N1/N2/N3 + RC-E1/E2 + RC-B1 = 6 件
- 全スイート: 186 passed / typecheck clean
