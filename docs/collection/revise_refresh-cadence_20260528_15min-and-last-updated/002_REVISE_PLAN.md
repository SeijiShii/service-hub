# collection 変更計画書（ダッシュボード最終更新表示）

> **入力**: `./001_REVISE_SPEC.md`, 既存 `api/dashboard/summary.ts` / `src/features/dashboard/*`
> **最終更新**: 2026-05-28（スコープ縮小: cron 移行撤回、最終更新表示のみ）

---

## 1. 既存ファイル変更一覧
| ファイル | 変更内容 | リスク |
|---|---|---|
| `src/features/dashboard/summary.ts` | `DashboardVM` に `lastUpdatedAt: string \| null` / `lastRunStatus: ...` を追加、`buildDashboard(services, latest, alerts, run)` から構築 | 低 |
| `src/features/dashboard/DashboardView.tsx` | ヘッダに「最終更新: ... (xx 分前)」表示を追加（run なし→「未収集」、failed→警告色） | 低 |
| `src/features/dashboard/summary.test.ts` | VM 拡張のテスト追加 | 低 |
| `src/features/dashboard/DashboardView.test.tsx` | 最終更新表示のテスト追加（正常 / 未収集 / failed / 相対時間） | 低 |

## 2. 新規ファイル一覧
なし。

## 3. 削除ファイル一覧
なし（`vercel.json` / `.github/workflows/` 触らない、cron 移行撤回）。

## 4. マイグレーション要否
- DB スキーマ変更: ❌
- データ変換: ❌
- 設定変更: ❌（cron 移行撤回、`vercel.json` 無変更）
- → 005_MIGRATION 不要。

## 5. 実装 Phase 分割
### Phase 1: dashboard VM + 表示
- `summary.ts` の VM 拡張（`lastUpdatedAt` / `lastRunStatus` 追加）+ `buildDashboard` で `run` から構築。
- `DashboardView` ヘッダに表示追加（JST 整形 + 相対時間 `xx 分前` / 「未収集」/ failed 警告色）。
- RED→GREEN→IMPROVE。

（Phase 2 はもう無い。cron 移行撤回。）

## 6. 依存関係順序
単一 Phase。

## 7. ロールアウト計画
| ステップ | 内容 | 検証 |
|---|---|---|
| 1 | Phase 1 実装 + テスト green | typecheck / vitest pass |
| 2 | `! bash scripts/deploy-prod.sh` で本番デプロイ | デプロイ URL 200 / ダッシュボードに「最終更新」表示 |

## 8. リスク・注意点
- 既存の `recentRuns(db, 1)` 呼び出しに依存（既に `api/dashboard/summary.ts` で実装済）→ ほぼ追加だけ。
- 相対時間 `xx 分前` の決定的テストは `vi.setSystemTime` で時刻固定。

## 9. 完了の定義 (DoD)
- [ ] Phase 1 完了、テスト green、typecheck clean
- [ ] ダッシュボードに「最終更新」表示が出る（正常 / 未収集 / failed の 3 状態）
- [ ] Vercel Cron / `vercel.json` / GH Actions は無変更（撤回スコープが本当に触られていないことの確認）

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 | /flow:revise |
| 2026-05-28 | スコープ縮小（cron 移行撤回、最終更新表示のみ）。Phase 2 削除、新規ファイル削除 | /flow:revise (scope amend) |
