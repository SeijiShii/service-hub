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
- 現在フェーズ: **Phase 4 再オープン** (biz-charts 完遂、**10th deploy 待ち**)。9 回 deploy 済 (9th=last-deploy-col)。本 loop (2026-05-31) で **dashboard biz-charts revise 全工程完了** (上部 chart をビジネス指標化: ユーザー数/課金額/コスト/採算、design→spec-review→unit→E2E、全 307 unit + E2E 9/9 green)、未デプロイ。
- 進行中ターゲット: dashboard biz-charts (実装+E2E 完了、deploy 前ゲート評価中)
- 最終更新セッション: D20260531_004_scenario_update
- 最終更新時刻: 2026-05-31 06:20
- 完了フェーズ: [Phase1, Phase1.5, Phase2, Phase3 実装, Phase4 デプロイ(**9 回完了**): 1st-7th + **8th (timeseries-topchart)** + **9th (last-deploy-col、dpl_2JKZcinXnWiCsMRchTWzjpYtsoWs)**、Clerk production instance / sk_live_* 稼働中]。**biz-charts は実装+E2E green だが 10th deploy 未済**。
- デプロイ状況: ✅ 公開 URL = https://service-hub.givers.work (custom domain、Clerk production、live キー稼働中、9th=last-deploy-col まで本番反映済)。**biz-charts (上部 chart ビジネス指標化) は未デプロイ → 10th deploy 対象**。
- 次の推奨コマンド: biz-charts UI 変更ゲート評価 → **P4.4 Design gate (b) 視覚レビュー** (新ラベル/4 chart レイアウト) → release-pre 必須監査 (full audit + secure、最新 HEAD) → **P4.7 Release gate (10th deploy)**。Wording は本 PJ で defer 確定済 (internal 単一ユーザー、コピーは seiji 直管理)。
- Open 論点: 001✅/002✅/003✅/004✅/005✅ 全 5 件解決済 (変更なし)。
- 残ゲート: P4.4 Design (biz-charts 視覚レビュー、E2E snapshot で実画面確認済だが /flow:design --review-only 未実行) / P4.45 Wording ✅ defer 確定 (internal) / **P4.7 Release 10th deploy 待ち** / P4.8 Promote 不発火 (internal、非公開 PJ) / 既知 Low: queries.test.ts tsc TS2578 (deploy 非ブロッカー)。
- release-pre 必須監査 (CF-009): biz-charts 完遂時の standard audit ✅ (本回 AUDIT_20260531_0616、Critical 0)。**10th deploy 前に full audit + secure を最新 HEAD で再実行が必須** (P4.7 評価直前)。
- audit 検出常習化 (CHRONIC 注記): SCENARIO drift = **6 回連続** (...1830 → 0616)、本セッションで reconcile。active 開発で §5 が遅れる構造的性質 (release 前 reconcile で実害なし)。
<!-- AUTO-GENERATED:END scenario-cursor -->

## 6. 変更履歴
- 2026-05-26: /flow:concept で初回生成
- 2026-05-27: /flow:scenario --update で §5 カーソルを reconcile (Phase4 デプロイ済 test キーへ、~10 session 分の stale を解消、decision_id=D20260527-032)。/flow:auto §3.0c drift シューティング由来 (AUDIT_20260527_2126 検出)
- 2026-05-28: AUDIT_20260528_1230b 由来の bookkeeping reconcile。3 revise tdd 完了 (admin-ux / refresh-cadence / force-pull, unit 177→194) + 新エンドポイント `/api/admin/collect` を §5 完了フェーズに追記、未デプロイ明示 (decision_id=D20260528-020)
- 2026-05-28 [flow] 補正: §5 が「test/dev Clerk キー」と stale 記述していたが、実態は `.env.production.local` に `sk_live_*` / `pk_live_*` がセット済で live 化完了。残作業は「3 revise + 新 endpoint の再デプロイのみ」に補正 (CF-20260528-011、release/auto 側の「.env.production.local 実物確認ベースの live 判定」を flow-suite に補強: auto.md c858737 + release.md 2dbc578)
- 2026-05-28: 2nd deploy 完了 (D20260528-021、dpl_P4M6ct7FNVp6FejyfiMgenmUAjJ5)。8 env synced + vite build 23s + custom domain `service-hub.givers.work` で稼働、post-deploy smoke green (/api/admin/collect POST 401 = 新エンドポイント反映確認、全 gate 正常)
- 2026-05-28: nav-and-pull revise 設計 (D-022〜025) + 実装 (D-026、unit 196 green) + 3rd deploy (D-027、dpl_25it7fuh7rjzaREy1xH3vRDvKGSp)。双方向 navigation 確立 (admin → / back-link)、force-pull を /admin → dashboard へ relocation。同セッション末で favicon SVG 追加 (commit c0818c9、4th deploy 待ち)
- 2026-05-28: 4th deploy (D-028、dpl_9oEMWfVEL51THcA7Ky4dVoAjztT2) で favicon 本番反映 (image/svg+xml で 200 配信確認)。直後ユーザー指摘 4 件: (1) service-info endpoint 入力形式不明 / (2) サブドメイン field 意味不明 / (3) **編集→更新で保存されない (致命バグ)** / (4) 「退役」→「削除」wording → /flow:fix へ
- 2026-05-28: admin-form fix Phase 1+2 完了 (D-017 fix / D-018 tdd、commit 2f6dbf3、unit 203 green、5th deploy 待ち) — async UX 4 状態 + UX help + 退役→削除 wording、stderr 調査ログ追加 (commit 225cbf3)
- 2026-05-28: favicon-projection 全工程完了 — revise 設計 (D-019、service-info contract v2 + iconUrl + safeUrl 共通化、commit 0318f28) → spec-review (D-020、auto-pick R1-R9 解決 + P78-P80 学習、commit 8184b7d) → tdd Phase 1-4 (D-022、unit 255 green、5 commits a025cb3/26a4508/f818d28/6bf8a69/c7cfb2a)。連動 PJ bousai-bag-checker producer 側 revise リマインダ (release 後、CF-016)
- 2026-05-28: release-pre 必須監査 (CF-009) 2 段クリア — audit --scope=full (D-023、AUDIT_20260528_1724.md、Critical 0 / High 1 SCENARIO drift bookkeeping / Medium 2 / Low 1 = release-blocking なし) → secure (D-024、SECURITY_REVIEW_20260528.md、新規 SEC 0 件 + 既存 SEC-003 Class C maintain) → P4.7 Release gate 評価可能化
- 2026-05-28: /flow:scenario --update で §5 reconcile (本セッション、audit High #1 シューティング、admin-form Phase 1+2 + favicon-projection 全工程完了 + release-pre 監査 2 段クリアを反映、CF-018 歪曲停止 anti-pattern 巻き戻し継続による auto loop reiteration 4 結果) — 次は /flow:release で 5th deploy
- 2026-05-28: 5th deploy 完了 (D-026、commit b4f70b5 = admin-form Phase 1+2 + favicon-projection 本番反映、services.icon_url カラム db:push 済)。続けて 6th deploy (内部 dashboard + admin UI icon、commit de8bdfa)、7th deploy (admin/collect updateServiceMeta hot-fix、commit a1a8f88) 完了
- 2026-05-28: dashboard timeseries-topchart 全工程完了 — revise 設計 (D-027、画面上部に時系列グラフ + 下部に既存テーブル、commit 676954a) → spec-review (D-029、auto-pick R1-R6 全件解決、commit f5f83ba) → tdd Phase 1-4 (D-030、unit 287 green、4 commits 0eaf627/5f34d6a/f0d84b2/0aba2c3、CF-021 歪曲停止再発 4 件目で巻き戻し継続)。8th deploy 待ち
- 2026-05-28: release-pre 必須監査本回 audit 1 段目 (D-031、AUDIT_20260528_2010.md、Critical 0 / High 1 SCENARIO drift 4 回連続 CHRONIC / Medium 1 / Low 1 = release-blocking なし、続く secure で 2 段クリア予定) → /flow:scenario --update で §5 reconcile (本セッション、audit High #1 シューティング、7 回 deploy 完了 + timeseries-topchart 全工程完了 + release-pre 監査本回 1 段目を反映、decision_id=D20260528-120) — 次は /flow:secure で release-pre 2 段目 → /flow:release で 8th deploy
- 2026-05-28: release-pre 2 段目 (D-033 secure --phase=deps、SECURITY_DEPS_20260528b.md、新規 SEC 0 件、SEC-003 Class C maintain 4 回連続) → release-pre 必須監査 2 段クリア完了 → P4.7 Release gate 評価可能
- 2026-05-28: ✅ **8th deploy 完了** (D-034 release、commit 群 0eaf627/5f34d6a/f0d84b2/0aba2c3 + 6b2942c/dde07e5/106855d、dpl_2VjaF8Ay4fzcdEbxT2yuHtHa8LH5、24s build、aliased https://service-hub.givers.work、post-deploy smoke 全 green) + SEC-003 accepted-risk 確定 close (D-126、§8 [論点-005] status=open → closed、4 回連続再提示の悪循環断ち) — 次は /flow:auto で全 P5 完了判定 or bousai-bag-checker 連動 revise (別 PJ)
- 2026-05-30: **dashboard last-deploy-col revise 全工程完了** (/flow:auto loop、D20260530_002)。ユーザー要望「last_deploy_at はチャート表示しない、一覧に日時カラム追加」を design (D-001 revise) → spec-review (D-003、905、P86 学習) → tdd (D-004、unit 全 297 green、commits 77105ae/a264d66/ba28a72) → e2e (D-005、dashboard E2E 4/4 green + 既存 fixtures charts drift reconcile、commits 5bc67d5/04f7339) → audit full (D-006、AUDIT_20260530_1830、release-blocking なし) → scenario reconcile (D-007) → secure release-pre 2 段目 (D-008、新規 SEC 0) で完遂。
- 2026-05-30: ✅ **9th deploy 完了** (D-009 release、ユーザー承認「今デプロイ」、dpl_2JKZcinXnWiCsMRchTWzjpYtsoWs、24s build、aliased https://service-hub.givers.work、post-deploy smoke 全 green = frontend 200 / api auth 401 / public 200)。**last-deploy-col 本番反映** (last_deploy_at chart 除外 + 一覧「最終デプロイ」列)。P4.8 Promote 不発火 (internal) → **P5 シナリオ完了**。loop 停止条件 #1 で正常終了 (8 反復、歪曲停止なし)。
- 2026-05-31: **dashboard biz-charts revise 全工程完了** (/flow:auto loop、D20260531_001)。ユーザー要望「上部 chart を死活/ストレージでなくビジネス指標 (課金額/コスト/採算/ユーザー数) に」を design→spec-review (D-001~、905、P87) → tdd (D20260530-050~、unit 全 307 green、commits f852745/a0d3e2e) → e2e (D20260531_002、E2E 9/9 green + snapshot 2 件再生成 [dashboard=biz意図 / service-detail=既存 ResponsiveContainer drift reconcile]、commit feae45e) で完遂。未デプロイ (10th deploy 待ち)。続く standard audit (D20260531_003、AUDIT_20260531_0616、Critical 0 / High 1=SCENARIO drift 常習6回) → 本 reconcile (§5 を P5→Phase4 再オープン + 10th deploy 待ち、decision_id=D20260531-008)。次は P4.4 Design gate → release-pre full audit+secure → P4.7 Release (10th deploy)。
