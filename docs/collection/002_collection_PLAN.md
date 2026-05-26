# collection 実装計画書

> **入力**: `./001_collection_SPEC.md`, `../_shared/{providers,db}/`, `../registry/`, `../concept.md` §4.3
> **最終更新**: 2026-05-26

---

## 1. 実装対象ファイル一覧
| ファイル | 責務 | 依存 | LOC 見積 |
|---|---|---|---|
| `src/features/collection/runner.ts` | オーケストレーション（load→collect→upsert→record） | registry, providers, db, types | ~110 |
| `src/features/collection/cronSecret.ts` | Cron secret 照合 | — | ~20 |
| `api/cron/collect.ts` | Vercel Function（cron handler）→ runner 呼び出し | runner, cronSecret | ~40 |
| `vercel.json` | Cron スケジュール定義（例: 毎時 / 数時間ごと） | — | ~10 |

## 2. 実装 Phase 分割（/flow:tdd）
### Phase 1: runner（mock 注入）
- 対象: runner.ts。registry/providers/db を**注入**（O35）、mock で「2 service × 2 adapter、1 つ失敗」等を再現。
- テスト: 正常（全 upsert + status=ok）/ 部分失敗（status=partial + errors）/ 全失敗（failed）/ 冪等。
### Phase 2: cron handler + secret
- 対象: cronSecret.ts, api/cron/collect.ts。secret 照合（401）、runner 結線。
### Phase 3.5: app bootstrap（vercel.json cron、O37）
- vercel.json に cron スケジュール。実 deploy は release。

## 3. 依存関係順序
（registry/providers/db 設計済）→ runner.ts → cronSecret.ts → api/cron/collect.ts

## 4. 既存ファイルへの影響
- providers/db/registry の公開関数を利用（変更なし）。
- env に `CRON_SECRET` 追加（.env.example）。

## 5. 横断フォルダへの追加・変更
alerts の evaluate を収集直後に呼ぶ（連携）。

## 6. リスク・注意点
- **並列度**: provider レート遵守のため同時実行を絞る（p-limit 等）。
- **多重起動 / 実行時間**（[論点-CO1] / [論点-002]）: MVP は逐次、超過時 GitHub Actions cron 分割へ。
- **Cron secret**: Vercel Cron の Authorization ヘッダ検証（Clerk ゲート外）。

## 7. 完了の定義（DoD）
- [ ] Phase 1-2 完了、runner の unit green（ok/partial/failed/冪等）
- [ ] cron secret 不一致が 401
- [ ] vercel.json cron 定義（実 deploy は release）
- [ ] E2E: cron handler の統合テスト（mock providers + 実/mock DB で 1 ラン）。UI なし。

## 8. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成 | /flow:feature |
