# collection 変更計画書（15 分 cron + 最終更新表示）

> **入力**: `./001_REVISE_SPEC.md`, 既存 `vercel.json` / `api/cron/collect.ts` / `api/dashboard/summary.ts` / `src/features/dashboard/*`
> **最終更新**: 2026-05-28

---

## 1. 既存ファイル変更一覧
| ファイル | 変更内容 | リスク |
|---|---|---|
| `vercel.json` | `"crons"` 配列を削除（GH Actions に移管） | 低 |
| `src/features/dashboard/summary.ts`（VM 構築） | `DashboardVM` に `lastUpdatedAt: string \| null` / `lastRunStatus: ...` を追加、`buildDashboard(services, latest, alerts, run)` から構築 | 低 |
| `src/features/dashboard/DashboardView.tsx` | ヘッダに「最終更新: ... (xx 分前)」表示を追加 | 低 |
| `src/features/dashboard/summary.test.ts` | VM 拡張のテスト追加 | 低 |
| `src/features/dashboard/DashboardView.test.tsx` | 最終更新表示のテスト追加 | 低 |

## 2. 新規ファイル一覧
| ファイル | 責務 | LOC 見積 |
|---|---|---|
| `.github/workflows/cron-collect.yml` | 15 分間隔 GH Actions cron。`curl -fsS -X POST -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" https://service-hub.givers.work/api/cron/collect` | ~25 |

## 3. 削除ファイル一覧
なし（`vercel.json` の cron 設定だけ削除）。

## 4. マイグレーション要否
- DB スキーマ変更: ❌
- データ変換: ❌
- 設定変更: ✅（`vercel.json` 更新 + GH Actions workflow + GitHub Secret 登録）
- → 005_MIGRATION 不要、ロールアウト計画に手順を集約。

## 5. 実装 Phase 分割
### Phase 1: dashboard VM + 表示
- `summary.ts` の VM 拡張 + `DashboardView` に最終更新表示。Phase 1 から進めるとデプロイなしでテストで挙動確認できる。
- RED: VM が `lastUpdatedAt` を含むテスト、View に表示されるテスト。

### Phase 2: cron 移行（vercel.json + GH Actions workflow）
- `vercel.json` から `crons` 削除。
- `.github/workflows/cron-collect.yml` 追加（15 分間隔 + `workflow_dispatch`）。
- ロールアウトに「GitHub Secrets に `CRON_SECRET` 登録」を含める（user 作業、Class C）。

## 6. 依存関係順序
Phase 1（ローカル動作確認可）→ Phase 2（インフラ側、デプロイ + GitHub Secret 登録要）。並列実装も可だが順次が安全。

## 7. ロールアウト計画
| ステップ | 内容 | 検証 |
|---|---|---|
| 1 | Phase 1-2 実装 + テスト green | typecheck / vitest pass |
| 2 | `! bash scripts/deploy-prod.sh` で本番デプロイ | デプロイ URL 200 |
| 3 | GitHub Secrets に `CRON_SECRET` 登録（user 手動・Class C） — repo Settings → Secrets and variables → Actions → New secret → `CRON_SECRET` に `.env.production.local` と同じ値を貼る | `gh secret list` で存在確認 |
| 4 | GH Actions `cron-collect.yml` を手動 dispatch（初回確認） | Actions 画面で run 成功 + dashboard に「最終更新」反映 |
| 5 | 15 分待つ | 次の `*/15` 境界で自動起動 |

## 8. リスク・注意点
- **重複起動**: Vercel Cron を撤去するので二重起動は起きない。GH Actions のみ。
- **GH Actions cron の遅延**: 公式に「最短粒度 5 分、混雑時は遅延あり」とされる。15 分間隔で実害なし。
- **Secret rotation**: `CRON_SECRET` を変える時は (a) `.env.production.local` 更新 → sync-prod-env.sh → deploy、(b) GitHub Secrets も更新、の 2 箇所必須。
- **GH Actions 無料枠**: private repo でも free 2000 分/月、15 分間隔 × 30 秒 ≒ 24 時間/月で範囲内。

## 9. 完了の定義 (DoD)
- [ ] Phase 1-2 完了、テスト green、typecheck clean
- [ ] `vercel.json` から `crons` 削除済み
- [ ] `.github/workflows/cron-collect.yml` 追加済み
- [ ] ダッシュボードに「最終更新」表示が出る
- [ ] GitHub Secrets に `CRON_SECRET` 登録済（user 完了報告）
- [ ] GH Actions 手動 dispatch で 1 回成功
- [ ] 次の 15 分境界で自動 run 成功

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 | /flow:revise |
