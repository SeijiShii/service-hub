# service-hub 開発シナリオ

**最終更新**: 2026-06-01 12:46
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
- 現在フェーズ: **Phase 4 (Release gate ✅ 18th deploy 完了)** — 18 回 deploy 完了済、本番 https://service-hub.givers.work 稼働中 (internal tool)。13th〜16th deploy (2026-06-07/08) = 収益指標 / 収益推移chart+collect hotfix / chart-ux / chart-colors。17th deploy (2026-06-18) = summary-projection [論点-011]。**18th deploy (2026-06-18) = feedback-inbox [論点-007]/O67 本番反映** (feedback_items 本番 Neon 追加 + /api/feedback/inbox LIVE + dpl_7rAUwePWVhy3jdw99BfBtTRa3dqj、smoke green = frontend 200 / public-status 200 / feedback-inbox 401 authed / dashboard 401。.vercelignore で test を関数除外し Hobby 12 関数上限を回避)。
- 進行中ターゲット: **なし** — feedback-inbox ([論点-007]/O67) consumer は **18th deploy で本番反映完了** (feedback_items 本番 Neon 追加 + /api/feedback/inbox LIVE、smoke green = frontend 200 / public-status 200 / feedback-inbox 401 authed gate / dashboard 401)。HUB consumer 側の配線は完結。**下流の follow-up (別 PJ/別 repo)**: (1) producer 各サービスが `GET /api/hub/feedback` 実装 (O66) → インボックスに実データが流れ始める (現状は空 = graceful degradation で正常)、(2) Shipyard 専用 adapter ([論点-FI-4])、(3) shipyard [論点-010] summary consumer。
- 最終更新セッション: D20260618_017_release_feedback-inbox
- 最終更新時刻: 2026-06-18
- 完了フェーズ: [Phase1, Phase1.5, Phase2, Phase3 実装, Phase4 デプロイ(**18 回完了**): 1st-12th + 13th (収益指標 C20260607-001) + 14th (収益推移chart+collect hotfix C20260607-002) + 15th (chart-ux) + 16th (chart-colors) + 17th=D20260618_007 (summary-projection [論点-011]) + **18th=D20260618_017 (feedback-inbox [論点-007]/O67、feedback_items db:push + dpl_7rAUwePWVhy3jdw99BfBtTRa3dqj)**、Clerk production instance / sk_live_* 稼働中]
- デプロイ状況: ✅ 公開 URL = https://service-hub.givers.work (custom domain、Clerk production、live キー稼働中、18th deploy = feedback-inbox 本番反映、**19th deploy (2026-06-18) = /feedback スタイル token 化 (CF-20260618-008、生値 hex → design-system 状態色トークン)**、post-deploy smoke green = frontend 200 / public-status 200 / feedback-inbox 401 authed)。
- 次の推奨コマンド: **service-hub は P5 完了** (feedback-inbox [論点-007] 18th deploy で本番反映済)。HUB 側に残作業なし。次の一手は別 PJ/別 repo = (1) producer 各サービスが `GET /api/hub/feedback` 実装 (O66、各サービス `/flow:revise`) → feedback が実際に流れ始める、(2) Shipyard 専用 adapter ([論点-FI-4])、(3) shipyard [論点-010] summary consumer。
- Open 論点: 001✅/002✅/003✅/004✅/005✅/006✅/**007✅ 全 7 件解決済** (007 = feedback-inbox consumer 追従、18th deploy で本番反映完了 closed)。
- 残ゲート: P3.7 Spec-review ✅ (feedback-inbox 905) / P4.4 Design ✅ green / P4.45 Wording ✅ defer (internal) / P4.46 Auth-impl 不発火 (単一 owner) / P4.5 E2E ✅ (feedback-inbox 3 green) / **P4.7 Release ✅ 18th deploy 完了** (feedback-inbox 本番反映済、smoke green) / P4.8 Promote 不発火 (非公開) / 既知 Low: queries.test.ts tsc TS2578 (deploy 非ブロッカー)。
- release-pre 必須監査 (CF-009): summary prod 反映前に ✅ 2段クリア (AUDIT_20260618_1139 full Critical 0/High 0 + SECURITY_REVIEW_20260618_1140 新規 SEC 0、最新 AUDIT 参照 = HEAD)。
- audit 検出常習化 (CHRONIC 注記): SCENARIO §5 drift が AUDIT_20260610_0805 で再発 (High) → 2026-06-18 reconcile で解消、以降 17th deploy まで同期維持。
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
- 2026-05-31: **dashboard biz-charts revise 全工程完了 + 10th deploy** (/flow:auto loop、D20260531_001、7 反復)。ユーザー要望「上部 chart を死活/ストレージでなくビジネス指標 (課金額/コスト/採算/ユーザー数) に」を design→spec-review (905、P87) → tdd (unit 全 307 green、commits f852745/a0d3e2e) → e2e (D20260531_002、E2E 9/9 green + snapshot 2 件再生成 [dashboard=biz意図 / service-detail=既存 ResponsiveContainer drift reconcile]、commit feae45e) → standard audit (D-003、AUDIT_0616、High 1 drift) → scenario reconcile (D-004、P5→Phase4 再オープン) → design review green (D-005、c119eaf) → release-pre full audit (D-006、AUDIT_0622、Critical 0/High 0 = drift 解消・CHRONIC 6回 → 解除) → release-pre secure (D-007、新規 SEC 0) → **release 10th deploy** (D-008、dpl_A1v4GA2yrduXehqUfPQT5CeEXfqz、24s build、aliased givers.work、post-deploy smoke 全 green = frontend 200/api 401/public 200、ユーザー承認「今デプロイ」) で完遂。biz-charts 本番反映 (上部 chart = ビジネス 4 枚)。P4.8 Promote 不発火 (internal) → **P5 シナリオ完了**。
- 2026-06-07: **dashboard 収益(revenue)指標表示 revise 全工程 + 13th deploy** (C20260607-001、cross-repo CF-20260607-002)。bousai-bag-checker が service-info に投げ銭指標を申告→HUB 表示漏れの claim を判定=仕様検討漏れ(revise)。claim→revise 設計→tdd 実装。**ユーザー 3 フィードバックで収益化**: ①ラベル 投げ銭→収益 (源泉はサービスにより寄付/売上/投げ銭) ②契約 canonical を tip_*→汎用 revenue_count/revenue_total_yen ③旧 tip_* は service-info adapter で後方互換正規化 (producer 強制再デプロイ不要)。unit 323 green (commits c8dc410/9eacdfe/fcb8433/b4d7252)。**13th deploy** (D20260607_004、dpl_BLukFUJLpeZ1jCk6qyCGohb3hxN2、25s build、aliased givers.work、post-deploy smoke green = frontend 200/api 401、ユーザー yes)。収益表示は次 collect (手動 pull or daily cron) 後に反映。producer 移行は任意 ([論点-002])。P4.8 Promote 不発火 (internal)。
- 2026-06-07: **収益推移 chart 追加 + collect unit-resilience hotfix + 14th deploy** (C20260607-001/002)。本番データ確認でユーザー 3 指摘: ①sales_* は producer 修正 (HUB 非対応) ②大切なのは収益の推移 → 上部に収益(revenue_total_yen)推移 chart 追加 (DASHBOARD_CHARTS 2番目・¥軸、commit cb2314d) ③一覧は合計額 (収益¥=累計、既存)。並行で naze-bako 追加後の collect 全失敗 (service-info の unit 欠落→NOT NULL 違反→all-or-nothing batch 死、C20260601-003 同系) を runner の永続境界で unit "" 矯正・非有限 skip により解消 (fix C20260607-002、regression CO-RES-01、commit 7046d88)。unit 324 green。**14th deploy** (D20260607_006、dpl_E7gb6QmcMYEgUN9Q94Sfp8UwmahW、aliased givers.work、smoke green)。手動 pull で collect 復旧確認待ち。producer follow-up: naze-bako は unit 付与 / hana-memo は sales_*→revenue_* (producer 側契約遵守)。
- 2026-06-08: **15th deploy (chart-ux)** (D20260608_005、commit e7b6d2b)。dashboard chart の時間軸統一 + 期間選択 + usd 系 chart 削除。aliased givers.work、smoke green。
- 2026-06-08: **16th deploy (chart-colors)** (D20260608_009、commit 25b4794)。dashboard chart 線色 palette を暖寒交互に並べ替え。本番反映済 (frontend 200、課金経路なし)。
- 2026-06-18: **summary-projection [論点-011]/concept [論点-006] 実装完了** (/flow:auto loop、D20260618_001、commit 8e97a26)。shipyard [論点-010] 上流の O48 v3 consumer 追従: service-info `summary?:string` を ServiceHUB が受信し公開 status API (`/api/public/status`) 安全サブセットへ露出 (shipyard 配信用、HUB 自身は非表示)。iconUrl=favicon-projection の確立パターンを踏襲し types(ServiceInfoResponse/ServiceMeta/ServiceDescriptor)→adapter(pickServiceInfoSummary sanitize)→updateServiceMeta(列単位 SET 保持)→toServiceDescriptor→buildPublicStatus 安全投影→db schema+testdb DDL に配線。+16 tests (SM-U-01〜07/SM-U-10〜15/SM-PS-01〜03)、全 39 files 353 tests green。**prod 適用 (db:push で services.summary 列 + redeploy) は未実施 = Class B (release 人手ゲート) として残**。
- 2026-06-18: /flow:scenario --update で §5 reconcile (本セッション D20260618_002、AUDIT_20260610_0805 の High chronic drift シューティング = §5 cursor が 12th deploy で stale → 13th〜16th deploy + summary-projection [論点-011] 実装完了を反映、concept [論点-006] を実装完了 prod 反映待ちに更新、decision_id=D20260618-002-01) — 残 service-hub 作業 = summary prod 反映 (/flow:release で release-pre 監査 → db:push + redeploy、Class B)。
- 2026-06-18: ✅ **17th deploy 完了 (summary-projection 本番反映)** (/flow:auto loop D20260618_002、5 反復: scenario reconcile → release-pre full audit C0/H0 → concept [論点-006] closed → release-pre secure 新規SEC0 → release)。ユーザー承認後 ① db:push (本番 Neon に services.summary nullable 列追加、[✓] Changes applied) → ② deploy-prod.sh (17th、dpl_4bUadnQGfUGwoPHxpaajQjkxLnZT、READY、aliased givers.work) → post-deploy smoke green (/api/public/status 200 safe-subset 構造正常・summary は producer 未申告で未出現=正常 / frontend 200)。**[論点-006] 完全 closed (code + prod)**。P4.7 Release gate ✅ 通過 → service-hub P5 完了。下流 = shipyard [論点-010] consumer (別 PJ)。
