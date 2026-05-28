# collection 変更仕様書（更新頻度 15 分化 + ダッシュボード最終更新表示）

> **改修種別**: 機能拡張（CI/CD cron 移行 + UI 追加情報）
> **issue / slug**: refresh-cadence / 15min-and-last-updated
> **基準 SPEC**: `../001_collection_SPEC.md`
> **最終更新**: 2026-05-28
> **タグ**: scheduled, ui

---

## 1. 変更概要

(1) 自動 pull の頻度を**日次 → 15 分間隔**に上げる（個人サービスとして頻繁な更新を希望）。Vercel Hobby は日次しか許可しないため [論点-002] 案 B どおり **GitHub Actions cron** で `/api/cron/collect` を `CRON_SECRET` 付きで叩く方式に切り替え、Vercel Cron は撤去（二重起動防止）。
(2) ダッシュボード（`/`）に**「最終更新: YYYY-MM-DD HH:MM」表示**を追加（最新 `collection_runs.finishedAt` を表示）。ユーザーがデータの鮮度を一目で確認できるように。

## 2. 変更前 vs 変更後

### 2.1 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| 自動 pull スケジュール | Vercel Cron `0 0 * * *`（日次 00:00 UTC、`vercel.json` `crons`） | **GitHub Actions cron `*/15 * * * *`**（15 分間隔）が `POST /api/cron/collect` を `Authorization: Bearer $CRON_SECRET` 付きで叩く。Vercel Cron は撤去 | 後方互換: エンドポイント側は不変、ハンドラ・認証も同じ |
| ダッシュボード `/` | サービス一覧 + 各 latest snapshot | 上記 + ヘッダ等に**「最終更新: YYYY-MM-DD HH:MM (xx 分前)」**表示 | 後方互換: 追加表示のみ |

### 2.2 データモデル変更
変更なし（`collection_runs` の `finishedAt` を読むだけ。既存 `recentRuns(db, 1)` を API ですでに呼んでいる）。

### 2.3 バリデーション・エラー変更
- GitHub Actions が `CRON_SECRET` を保持（GitHub Secrets に追加、user 作業）。
- ダッシュボード: 最新 run が無い場合は「未収集」表示。run 失敗時は status を表示（`ok`/`partial`/`failed`）。

## 3. 影響範囲
| 対象 | 影響度 | 説明 |
|---|---|---|
| `.github/workflows/cron-collect.yml`（新規） | 高 | 15 分間隔 + `curl` で本番 endpoint を叩く |
| `vercel.json` | 中 | `crons` 配列を削除（GH Actions に移管） |
| `src/features/dashboard/summary.ts`（VM 構築） | 中 | VM に `lastUpdatedAt` / `lastRunStatus` を追加 |
| `src/features/dashboard/DashboardView.tsx` | 中 | ヘッダに「最終更新」表示追加 |
| `api/dashboard/summary.ts` | 低 | 既に `recentRuns(db, 1)` を呼んでいるので VM 構築だけ拡張 |
| `api/cron/collect.ts` | なし | 変更なし（既存の `CRON_SECRET` 認証経路を再利用） |
| GitHub Secrets | 設定 | `CRON_SECRET` 値を追加（user の手動操作、Class C） |

## 4. 後方互換性
- ✅ **完全互換**。エンドポイント・認証・DB スキーマ・既存 UI は不変。Vercel Cron 撤去で `vercel.json` の cron 設定が消えるだけ。

## 5. ロールバック方針
- ✅ コード revert で戻せる: `vercel.json` の cron 復活 + GH Actions workflow 削除 + dashboard 追加表示削除。GitHub Secret は残してもよい（参照側が消えれば無害）。

## 6. リリース戦略
- 一括（内部ツール）。デプロイ → GitHub Secrets に `CRON_SECRET` 登録 → GH Actions workflow が有効化 → 次の 15 分境界から起動開始。Vercel Cron 撤去は同 PR で。

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC
- **UC-RC1 自動 pull 15 分間隔**: GH Actions cron が 15 分ごとに `POST https://service-hub.givers.work/api/cron/collect` を `Authorization: Bearer $CRON_SECRET` で叩き、既存ハンドラが `runCollection` を実行。
- **UC-LU1 最終更新表示**: ダッシュボード `/` ヘッダ部に「最終更新: YYYY-MM-DD HH:MM」（+ `xx 分前` の相対時間）を表示。最新 `collection_runs.finishedAt` を JST 表示。run が無ければ「未収集」。

### 7.2 入出力
- `.github/workflows/cron-collect.yml`:
  ```yaml
  on:
    schedule: [{ cron: '*/15 * * * *' }]
    workflow_dispatch:        # 手動実行も可
  jobs:
    collect:
      runs-on: ubuntu-latest
      steps:
        - run: |
            curl -fsS -X POST \
              -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
              https://service-hub.givers.work/api/cron/collect
  ```
- ダッシュボード VM: 既存 `DashboardVM` に `lastUpdatedAt: string | null` / `lastRunStatus: 'ok'|'partial'|'failed' | null` を追加。
- `vercel.json`: `"crons": [...]` を削除（`functions`・`rewrites` は残す）。

### 7.3 データモデル
変更なし。

### 7.4 バリデーション・エラー
- GH Actions 側 `curl -f`: 非 2xx で fail → 通知（GH Actions の失敗通知を流用、ユーザー側で受け取り）。
- ダッシュボード: `lastUpdatedAt` null → 「未収集」/ status=`failed` → 警告色で表示。

### 7.5 機能固有 NFR + 既存連携
- GH Actions 無料枠: public repo は無制限、private でも 15 分間隔 × 月で 2880 回 × 約 30 秒 = ~24 時間 / 月 → Free tier 2000 分/月の範囲内。
- レート制限: 15 分間隔で各 PaaS API を叩くが Phase 2 (cloudflare/sentry) を実装するまでは ping/Vercel/Neon のみ、無料枠内に収まる想定。

## 8. タグ別追加項目
- **scheduled**: GH Actions cron スケジュール + 手動 dispatch 対応。失敗時 GH Actions 通知。
- **ui**: ダッシュボードヘッダに最終更新表示（最低限）。

## 9. 未決事項
現時点で論点なし（2026-05-28）。Vercel Pro 課金は無料運用方針外なので不採用、GH Actions で確定。

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成（15 分 cron 化 + 最終更新表示） | /flow:revise |
