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
- 現在フェーズ: Phase 4 (Release gate **8th deploy 待ち** ⏳) — 7 回 deploy 完了済、本セッションで dashboard timeseries-topchart 全工程完了 (revise+spec-review+tdd Phase 1-4 unit 287 green + release-pre 監査本回) → **8th deploy で timeseries-topchart 反映予定** (db schema 変更なし = db:push 不要)
- 進行中ターゲット: なし (timeseries-topchart 全完了)
- 最終更新セッション: D20260528_031_audit_release-pre (release-pre 必須監査 1 段目クリア、続く secure で 2 段クリア予定)
- 最終更新時刻: 2026-05-28 20:11
- 完了フェーズ: [Phase1, Phase1.5, Phase2, Phase3 実装, Phase4 デプロイ(7 回完了): 1st=D20260527-025 / 2nd=D-021 / 3rd=D-027 / 4th=D-028 (favicon SVG) / **5th=D-026 (admin-form Phase 1+2 + favicon-projection)** / **6th=内部 dashboard icon (commit de8bdfa)** / **7th=admin/collect hot-fix (commit a1a8f88)**、Clerk production instance / sk_live_* 稼働中, **追加: registry DB SoT + providers 秘密ゼロ + 4 revise + favicon SVG + admin-form fix Phase 1+2 + favicon-projection revise/spec-review/tdd + dashboard timeseries-topchart revise/spec-review/tdd Phase 1-4 (D-027/D-029/D-030 commits 676954a/f5f83ba/0eaf627/5f34d6a/f0d84b2/0aba2c3 unit 287)** + release-pre 監査本回 (D-031 audit)]
- デプロイ状況: **公開 URL = https://service-hub.givers.work** (custom domain、Clerk production instance、live キー稼働中、favicon=hub+4 dots SVG、services.icon_url 本番反映済)。**8th deploy 未実施 (timeseries-topchart 反映待ち、db schema 変更なし = db:push 不要)**。
- 次の推奨コマンド: **`/flow:release`** (8th deploy = timeseries-topchart 反映):
  1. Phase 1 で SEC-003 accepted-risk ユーザー確認窓 (4 回連続再提示の悪循環を 1 回確定で断つ)
  2. Phase 2 ローカル動作確認 (dashboard /, chart section 「直近 30 日の推移」表示確認、軽め)
  3. Phase 3 vercel deploy (Class B 明示確認、8th deploy、db:push 不要)
- Open 論点: 001✅/002✅/003✅/004✅ 解決済。005[SEC-003] accepted-risk 推奨 (4 回連続 audit/secure 再提示 = 次 release Phase 1 で確定推奨)。
- 残ゲート: **P4.7 Release 8th deploy 要** / P4.45 Wording (低優先、defer 判断待ち) / P4.8 Promote 不発火 / 連動 PJ **bousai-bag-checker producer 連動 revise (CF-016)** — release 後リマインダ。
- release-pre 必須監査 (CF-009): ⏳ **1 段クリア** (audit D-031、AUDIT_20260528_2010.md、Critical 0 / High 1 SCENARIO drift bookkeeping = release-blocking なし) → **続く secure で 2 段クリア予定**。
- audit 検出常習化 (本回 audit §6.2): SCENARIO drift = **4 回連続 CHRONIC** (1230 → 1230b → 1724 → 本回 2010)、本回 reconcile が **解消行為** だが flow-suite 補強候補 3 案を §8 自己学習プロトコルに記録 (tdd Step Z 拡張 / release Step Z 拡張 / auto §3.0c シューティング 1st action 固定)。
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
