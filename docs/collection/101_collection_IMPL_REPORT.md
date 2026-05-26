# collection 実装レポート (101)

**実装日**: 2026-05-26 / **コマンド**: /flow:tdd（Phase3 反復6）/ **状態**: コア完了（GREEN）、cron handler glue は bootstrap

## 実装ファイル（src/features/collection/）
| ファイル | 内容 | 状態 |
|---|---|---|
| runner.ts | runCollection(deps): load active → getAdapters → collect → saveSnapshots → saveRun。throw せず CollectionRun 返却。ok/partial/failed 判定 + onCollected(alerts) hook | ✅ |
| cronSecret.ts | checkCronSecret(authHeader)（フェイルクローズ） | ✅ |
| index.ts | バレル | ✅ |

## 設計反映
- O35 注入: loadServices/getAdapters/saveSnapshots/saveRun/onCollected を deps 注入 → 実 I/O なしでテスト。
- 部分成功: adapter error は run.errors 集約、全滅/ DB 失敗で failed、一部で partial。
- alerts 連携: onCollected hook（収集直後に evaluate を呼ぶ口）。

## 保留（Phase 3.5 bootstrap）
- `api/cron/collect.ts`（Vercel Function: cronSecret 照合 → runner 結線、実 db/providers/registry 注入）+ `vercel.json`（cron スケジュール）。dashboard bootstrap でまとめて配線。[論点-CO1] 多重起動/実行時間は実 deploy 時に評価。

## 検証
- `npm run test`: 60 passed（collection 8 + 既存 52）/ `npm run typecheck`: green。
