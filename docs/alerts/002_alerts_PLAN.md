# alerts 実装計画書

> **入力**: `./001_alerts_SPEC.md`, `../_shared/db/`, `../collection/`, `../concept.md` §4.6
> **最終更新**: 2026-05-26

---

## 1. 実装対象ファイル一覧（src/features/alerts/）
| ファイル | 責務 | 依存 | LOC 見積 |
|---|---|---|---|
| `src/features/alerts/evaluate.ts` | 閾値判定（down / free_tier_80pct / over）+ 発火/回復 | db, registry, types | ~90 |
| `src/features/alerts/notify.ts` | 通知送信（Webhook/メール、注入 channel）+ notifiedAt 更新 | db, types | ~50 |
| `src/features/alerts/index.ts` | バレル | 上記 | ~5 |

## 2. 実装 Phase 分割（/flow:tdd、O35 injectable）
### Phase 1: evaluate（mock db/registry）
- 閾値判定ロジック。db/registry 注入。
- テスト: down 検知 / 80% / over / 重複抑制（未解決あり）/ 回復（resolve）。
### Phase 2: notify（channel 注入）
- 通知 channel を interface 注入（Webhook/メール/no-op）。未通知のみ送信 → notifiedAt。
- テスト: 未通知のみ送信、送信失敗で notifiedAt 据え置き、no-op channel。
### Phase 3.5: channel 実装（[論点-AL1] 確定後、実 URL は release/env）

## 3. 依存関係順序
db/registry（済）→ evaluate.ts → notify.ts → index.ts。collection が evaluate→notify を呼ぶ。

## 4. 既存ファイルへの影響
- collection runner が収集直後に evaluate+notify を呼ぶ（collection PLAN と整合）。
- env に通知チャネル設定（[論点-AL1]、.env.example）。

## 5. 横断フォルダへの追加・変更
db の recordAlert/openAlerts/resolve を利用。

## 6. リスク・注意点
- **重複通知抑制**: 未解決アラートの存在チェックが要（db openAlerts）。
- **通知チャネル**（[論点-AL1]）: interface 注入で実装を後付け（MVP は no-op or Webhook）。
- **回復判定**: 次ランで条件解消 → resolvedAt。

## 7. 完了の定義（DoD）
- [ ] Phase 1-2 完了、evaluate/notify の unit green（発火/抑制/回復/送信）
- [ ] collection からの呼び出し統合（collection の E2E/統合でカバー）
- [ ] E2E: アラート表示は dashboard の AlertBanner（dashboard E2E UC1-S5）でカバー。通知送信は unit + 手動確認。

## 8. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成 | /flow:feature |
