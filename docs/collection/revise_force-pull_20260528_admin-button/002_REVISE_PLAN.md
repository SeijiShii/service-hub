# collection 変更計画書（強制プルボタン）

> **入力**: `./001_REVISE_SPEC.md`, 既存 `api/cron/collect.ts` / `src/features/collection/runner.ts` / `src/features/admin/*`
> **最終更新**: 2026-05-28

---

## 1. 既存ファイル変更一覧
| ファイル | 変更内容 | リスク |
|---|---|---|
| `src/features/admin/ServicesAdminView.tsx` | 「今すぐ pull」ボタン + 結果サマリ表示エリア追加。Props に `onForcePull` / `forcePullState` を追加 | 低 |
| `src/features/admin/ServicesAdminPage.tsx` | `onForcePull` ハンドラ追加（POST `/api/admin/collect` を `credentials:include` で叩き、state に結果格納） | 低 |
| `src/features/admin/ServicesAdminView.test.tsx` | ボタン click → onForcePull 呼ばれる + 結果サマリ表示 のテスト追加 | 低 |

## 2. 新規ファイル一覧
| ファイル | 責務 | 依存 | LOC 見積 |
|---|---|---|---|
| `api/admin/collect.ts` | Clerk 認証 → `createDb` → `loadServices(db, {onlyActive})` + `getAdapters` + `runCollection` を組み立てて実行 → `CollectionRun` を JSON 返却。`api/cron/collect.ts` の deps 構築をほぼコピーするが auth が Clerk | requireSeiji/AuthError/getAuthFromRequest, db, registry, providers, collection.runner, alerts | ~70 |
| `api/admin/collect.test.ts` | 未認証 401 / 認証成功で runCollection 呼ばれる / 戻り値の形 — vi.mock パターン | vitest + vi.hoisted モック | ~80 |

## 3. 削除ファイル一覧
なし。

## 4. マイグレーション要否
- DB スキーマ変更: ❌
- 既存データ変換: ❌
- 設定ファイル変更: ❌
- → 005_MIGRATION 不要。

## 5. 実装 Phase 分割
### Phase 1: backend エンドポイント
- `api/admin/collect.ts` 実装（Clerk gate + runCollection 配線）。`api/cron/collect.ts` の deps 構築ロジックを参考にしつつ、auth だけ requireSeiji に差し替え。
- `api/admin/collect.test.ts` 追加: 未認証 401 / 認証成功 200 + 結果 / 内部エラー 500（runCollection が throw した場合の handling）。

### Phase 2: frontend ボタン
- `ServicesAdminView.tsx`: View に「今すぐ pull」ボタン + 結果表示エリア + props 拡張。
- `ServicesAdminPage.tsx`: `onForcePull` ハンドラ（fetch POST → 結果 state）+ Page から View へ渡す。
- `ServicesAdminView.test.tsx`: ボタン click → onForcePull 呼ばれる + 結果サマリ表示 を追加。

## 6. 依存関係順序
Phase 1（backend）→ Phase 2（frontend）。Phase 2 は Phase 1 のエンドポイント仕様を前提とする。

## 7. ロールアウト計画
| ステップ | 内容 | 検証 |
|---|---|---|
| 1 | デプロイ | build green / `/admin` にボタン出現 |
| 2 | seiji がボタンを押す | snapshot が増える / collection_runs に記録 / ダッシュボード反映 |

## 8. リスク・注意点
- **並行連打**: seiji が連打すると runCollection が同時に走る可能性（[論点-CO1] 既存）。本 revise では対応せず、ボタンの `disabled={running}` で**フロント側だけ簡易ガード**。バックエンドの並行起動防止は別 revise。
- **長時間実行**: サービス数増で Vercel function timeout に当たる懸念。本 revise では特別対応せず、cron と同じ挙動。

## 9. 完了の定義 (DoD)
- [ ] Phase 1-2 完了、全テスト green、typecheck clean
- [ ] `/api/admin/collect` が 401/200/500 を返す
- [ ] `/admin` にボタンが出る・押すと結果サマリ表示
- [ ] `api/cron/collect.ts` 不変（Vercel Cron 互換）

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 | /flow:revise |
