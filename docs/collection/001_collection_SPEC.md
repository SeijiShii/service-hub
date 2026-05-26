# collection 機能仕様書

> **役割**: 定期 pull オーケストレーション。registry の active サービス × 各 adapter を回し、スナップショットを DB に保存、ラン結果を記録する。Vercel Cron がトリガー。
> **タグ**: feature（API のみ、標準 UI なし）, stateful（collection_run）
> **最終更新**: 2026-05-26
> **入力**: `../concept.md`（§1.1 UC / §4 / §5.2 データフロー）, `../_shared/{providers,db,types}/`, `../registry/`
> **依存**: `_shared/providers`, `_shared/db`, `registry`

---

## 1. 詳細 UC
### UC（concept §5.2 データフロー）: 定期収集
- **トリガー**: Vercel Cron → `GET/POST /api/cron/collect`（Cron secret で保護、Clerk ゲート外）。手動実行も可（dev: curl）。
- **処理ステップ**:
  1. `recordRun(started)` で collection_run 開始。
  2. `loadServices({onlyActive:true})`（registry）。
  3. 各 service について `getAdapters(service)`（providers）→ 並列度を抑えて `collect()`。
  4. 取得 `UsageMetric[]` を `SnapshotRow[]` に変換 → `upsertSnapshots`（db）。
  5. adapter エラーは run.errors に集約（部分成功、status=partial）。
  6. （閾値判定は alerts に委譲 or 本ランで evaluate 呼び出し → recordAlert）。
  7. `recordRun(finished, status)` で確定。
- **出力**: DB 更新 + レスポンス（`{ run: CollectionRun }`、内部確認用）。

## 2. 入出力
### 2.1 API
| メソッド | パス | 入力 | 出力 | 認証 |
|---|---|---|---|---|
| POST | `/api/cron/collect` | （なし、全 active を収集） | `{ run }` | **Cron secret**（`CRON_SECRET` ヘッダ照合、Clerk 外） |

### 2.2 副作用
- DB 書き込み（upsertSnapshots / recordRun / recordAlert）。
- 外部 read-only API 呼び出し（providers 経由）。

## 3. データモデル
新規 entity なし。`collection_runs` に書き込み（db）。

## 4. バリデーション + エラーケース
| ケース | 振る舞い |
|---|---|
| Cron secret 不一致 | 401（不正トリガー拒否） |
| 一部 adapter 失敗 | 継続、run.errors に集約、status=partial |
| 全 adapter 失敗 / DB 失敗 | status=failed、run 記録（次回 /flow:auto や dashboard で可視） |
| 同時実行（前回未完） | ロック or スキップ（多重起動防止、[論点-CO1]） |
| タイムアウト（Vercel Function 上限） | バッチ分割 or 並列度調整（[論点-CO1]） |

## 5. 機能固有 NFR + 連携
### 5.1 NFR
| 項目 | 目標 | 根拠 |
|---|---|---|
| 並列度抑制 | provider レート遵守（O27） | 課金/レート回避 |
| 冪等 | 同一時刻の再実行で重複しない（db upsert 冪等） | db SPEC |
| 自己可観測 | 成否を collection_run に記録 | concept §3 運用・監視 |
| 実行時間 | Vercel Function 上限内（[論点-CO1]） | Hobby 制限 |

### 5.2 連携
| 連携先 | 種別 | 内容 |
|---|---|---|
| registry | 呼び出し | loadServices(active) |
| providers | 呼び出し | getAdapters/collect |
| db | 書き込み | upsertSnapshots/recordRun/recordAlert |
| alerts | 呼び出し | 閾値 evaluate（収集直後） |
| _shared/auth | 非経由 | cron は Clerk でなく Cron secret |

## 6. タグ別追加項目
### stateful
- collection_run 状態: started → (ok/partial/failed)。
- 多重起動防止（[論点-CO1]）。

## 7. スコープ外
- メトリクスの取得方法（providers）。閾値判定の詳細（alerts）。表示（dashboard）。

## 8. 未決事項
### [論点-CO1] 多重起動防止 + 実行時間（Vercel Hobby）
- **影響範囲**: cron handler, [論点-002] と連動
- **問い**: Vercel Function 実行時間上限内に全サービス収集できるか / 前回未完時の多重起動をどう防ぐか。
- **候補**: A) サービス数が少ない前提で逐次+短タイムアウト ／ B) DB ロック行で多重防止 + バッチ分割。
- **推奨**: A（MVP、数十サービスなら 1 ラン内）。超過したら B + [論点-002] の GitHub Actions cron 分割。
- **判断期限**: 実装 + 実サービス数増加時
- **担当**: seiji

## 9. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成（/flow:auto 反復7） | /flow:feature |
