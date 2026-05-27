# service-hub 開発シナリオ

**最終更新**: 2026-05-26 07:58
**生成元**: /flow:concept (初回) / /flow:scenario (更新)
**シナリオ種別**: 個人ツール（UI あり・内部・非公開）

> AI が「次に何をすべきか」を判断する参照ドキュメント。`/flow:auto` 等が Read する。
> §5 現在地カーソルは flow コマンドが auto-generated 範囲で書き換える。

---

## 1. ゴール
flow で連発するマイクロサービス群の稼働/利用/コスト/障害を、各 PaaS API を pull して一画面で横断把握する内部ダッシュボードを、無料枠で構築・運用する。

## 2. 進行フェーズ
1. **Phase 1: 概念設計** — concept.md + SCENARIO.md 確定（完了）
2. **Phase 1.5: デザインシステム** — データ密ダッシュボードの design-system 導出（`/flow:design`）
3. **Phase 2: 機能設計** — §1.3 優先度順（types→db→providers→auth→registry→collection→dashboard/service-detail/alerts）に SPEC/PLAN/UNIT_TEST/E2E_TEST 生成
4. **Phase 3: 実装** — TDD で基盤から順次。画面実装後に視覚レビュー（Design gate）
5. **Phase 4: デプロイ（公開準備は軽め）** — Clerk gate で seiji 限定 + Vercel デプロイ + read-only トークン設定。**一般公開・マーケはなし**
6. ~~Phase 5: 公開後運用~~ — エンドユーザーなしのため不要（claim/feedback サイクルなし）

## 3. 各フェーズで使う flow コマンド + 完了ゲート
### Phase 1: 概念設計
- 主: `/flow:concept`（完了）/ セキュア: `/flow:secure --phase=design --scope=concept`（トークン集中リスク）
- 見積（1回目）: `/flow:estimate`
- ゲート: concept.md 全節 + secure Critical/High closed + 初回見積

### Phase 1.5: デザインシステム
- 主: `/flow:design`
- ゲート: `docs/design/design-system.md` 生成、トークンがスタイル基盤に反映

### Phase 2: 機能設計
- 主: `/flow:feature <target>`（優先度順、連続）/ 各機能 secure
- ゲート: 各機能 001〜004 生成 + Critical/High 解決

### Phase 3: 実装
- 主: `/flow:tdd`（連続実装）/ secure --phase=pre-impl, --phase=deps
- ゲート: 101/102 レポート + 全テスト通過

### Phase 4: デプロイ
- 主: `/flow:audit` + `/flow:secure --phase=deps` + `/flow:release`（実トークン FILL → ローカル確認 → Vercel deploy）
- ゲート: Clerk gate 有効 + 本番 pull 成功 + ダッシュボード表示確認

## 4. 分岐ルール
| イベント | 切替先 | 戻り先 |
|---|---|---|
| Critical/High SEC finding | `/flow:fix` or `/flow:revise` | 元 Phase |
| 設計 drift（audit 発覚） | `/flow:revise` | 元 Phase |
| 依存 Critical CVE | `/flow:fix` | 元 Phase |

## 5. 現在地カーソル

<!-- AUTO-GENERATED:BEGIN scenario-cursor -->
- 現在フェーズ: Phase 4 (Release gate 進行中) — **本番デプロイ済 (test キー)**、live 化 + 実 pull データ投入が残
- 進行中ターゲット: なし (全機能 実装完了)
- 最終更新セッション: D20260527_006_resume_continuous (audit→secure→scenario reconcile)
- 最終更新時刻: 2026-05-27 21:30
- 完了フェーズ: [Phase1, Phase1.5, Phase2, Phase3 実装(全9フォルダ unit+E2E green, 視覚レビュー green, vite build green), Phase4 一次デプロイ(service-hub-lake.vercel.app, test/dev Clerk キー)]
- デプロイ状況: 本番 URL = https://service-hub-lake.vercel.app (Clerk gate で seiji 限定)。post-deploy スモーク green (D20260527-025)。第一弾監視対象 hana-memo (hana-memo.givers.work) を実 URL + provider 座標で配線済 (commit fea80f1/eaa8bb6)。public-status-api 実装+feedback round1 完了。
- 次の推奨コマンド: /flow:release (test→live 化: 実 Group B provider read-only トークン FILL + Clerk production instance 化 + 実 pull データ疎通確認)。Class C(実キー)+Class B(再デプロイ)=seiji
- Open 論点: 001✅/002✅/003✅/004✅(SEC O24 実装充足 closed) 解決済。005[SEC-003] @vercel/node devDep High CVE = accepted-risk 推奨 (ユーザー明示確認待ち、本番ランタイム非搭載)。
- 残ゲート: P4.7 Release (live キー化=production-spec、CF-009 で test 居座り回避) / P4.45 Wording (内部ツールのため低優先、1度も未実行) / P4.8 Promote は §4.7 非公開のため不発火。
<!-- AUTO-GENERATED:END scenario-cursor -->

## 6. 変更履歴
- 2026-05-26: /flow:concept で初回生成
- 2026-05-27: /flow:scenario --update で §5 カーソルを reconcile (Phase4 デプロイ済 test キーへ、~10 session 分の stale を解消、decision_id=D20260527-032)。/flow:auto §3.0c drift シューティング由来 (AUDIT_20260527_2126 検出)
