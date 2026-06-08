# D20260608_005 release: 15th deploy (dashboard chart-ux)

**実行日時**: 2026-06-08 (+09:00)
**コマンド**: /flow:release (ユーザー「デプロイする」認可)
**対象**: dashboard chart-ux
**実行者**: seiji + Claude
**状態**: 完了
**結果**: 15th deploy = dpl_4qEehtw6HcUzfixhZox4Pykdp6Mm、READY、aliased https://service-hub.givers.work、post-deploy smoke green (/ 200・/api?period=7d 401)。

## 主要決定
- **本番デプロイ (Class B) をユーザー認可で実行**: chart-ux (時間軸統一 + 期間セレクタ + usd系3chart削除)。env 変更なし (period は client-side、新 secret なし)、依存変更なし (lockfile 不変 → secure deps 新規 0)。production build green。
- post-deploy smoke: `?period=` クエリが本番 endpoint で受理され 401 (auth-gated) を確認 = period 配線が本番で機能。

## Decisions
- id: D20260608-014
  timestamp: 2026-06-08T12:50:00+09:00
  command: /flow:release
  phase: デプロイ実行
  question: 15th deploy (Class B) 実行可否
  options: [deploy 実行, 保留]
  recommended: deploy 実行 (unit 331 + E2E 16 green、env/deps 変更なし)
  chosen: deploy 実行 (ユーザー「デプロイする」)
  chosen_type: explicit-choice
  depends_on: [D20260608-012, D20260608-013]
  context: 本番 givers.work への 15th deploy。dpl_4qEehtw6HcUzfixhZox4Pykdp6Mm READY、smoke green。

## 生成・更新ファイル
- (デプロイのみ、コード変更なし) + 本 AI_LOG

## 学習・改善
- 表示+取得層のみの改修 (新 env/dep なし) は release-pre のリスクが低く、production build + 全テスト green + smoke の軽量検証で安全にデプロイできる。
- post-deploy smoke で新クエリパラメータ (?period) が本番 endpoint に受理されることを 401 で確認 = 配線の本番疎通チェックになる。
