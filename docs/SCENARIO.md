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
- 現在フェーズ: Phase 4 (Release gate 進行中) — **本番デプロイ済 (live キー)**、残りは「3 revise + 新 endpoint 含む再デプロイ」のみ (live 化は完了済)
- 進行中ターゲット: なし (3 revise 全実装完了、unit 194 green / typecheck 0)
- 最終更新セッション: D20260528_012_audit_standard (2 回目 audit + bookkeeping reconcile + 状態誤認補正)
- 最終更新時刻: 2026-05-28 12:30
- 完了フェーズ: [Phase1, Phase1.5, Phase2, Phase3 実装(全9フォルダ unit+E2E green, 視覚レビュー green, vite build green), Phase4 一次デプロイ(service-hub-lake.vercel.app, **Clerk production instance / sk_live_*** 確認済 in .env.production.local), **新規追加: registry DB SoT 化 + providers 秘密ゼロ化 + 3 revise (dashboard admin-ux: /admin link + form styling, collection refresh-cadence: 最終更新表示, collection force-pull: admin ボタン + 新エンドポイント `/api/admin/collect`)** 全 unit 194 passed]
- デプロイ状況: 本番 URL = https://service-hub-lake.vercel.app (Clerk gate で seiji 限定、**live キーで稼働中**)。`.env.production.local` 完備 (CLERK_SECRET_KEY=sk_live_*, VITE_CLERK_PUBLISHABLE_KEY=pk_live_*, HUB_SERVICE_INFO_SECRET / CRON_SECRET / VERCEL_API_TOKEN / NEON_API_KEY / ALLOWED_USER_ID 全 SET)。post-deploy スモーク green (D20260527-025)。**未デプロイの新規変更**: 3 revise 実装 + 新 endpoint `/api/admin/collect`、registry DB SoT 化、providers 秘密ゼロ化 → **次の再デプロイで反映**
- 次の推奨コマンド: `bash scripts/deploy-prod.sh` (test→live 化は不要、再デプロイだけで反映完了)。Class B(本番デプロイ)=seiji 手動実行 (auto では実行しない)
- Open 論点: 001✅/002✅/003✅/004✅(SEC O24 実装充足 closed) 解決済。005[SEC-003] @vercel/node devDep High CVE = accepted-risk 推奨 (本番ランタイム非搭載のため低リスク。次回 release セッションで明示確認窓を出す)。
- 残ゲート: P4.7 Release は live 化済のため再デプロイのみ / P4.45 Wording (内部ツールのため低優先、1度も未実行) / P4.8 Promote は §4.7 非公開のため不発火。
<!-- AUTO-GENERATED:END scenario-cursor -->

## 6. 変更履歴
- 2026-05-26: /flow:concept で初回生成
- 2026-05-27: /flow:scenario --update で §5 カーソルを reconcile (Phase4 デプロイ済 test キーへ、~10 session 分の stale を解消、decision_id=D20260527-032)。/flow:auto §3.0c drift シューティング由来 (AUDIT_20260527_2126 検出)
- 2026-05-28: AUDIT_20260528_1230b 由来の bookkeeping reconcile。3 revise tdd 完了 (admin-ux / refresh-cadence / force-pull, unit 177→194) + 新エンドポイント `/api/admin/collect` を §5 完了フェーズに追記、未デプロイ明示 (decision_id=D20260528-020)
- 2026-05-28 [flow] 補正: §5 が「test/dev Clerk キー」と stale 記述していたが、実態は `.env.production.local` に `sk_live_*` / `pk_live_*` がセット済で live 化完了。残作業は「3 revise + 新 endpoint の再デプロイのみ」に補正 (CF-20260528-XXX、release/auto 側の「.env.production.local 実物確認ベースの live 判定」も flow-suite に補強)
