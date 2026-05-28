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
- 現在フェーズ: Phase 4 (Release gate **通過** ✅) — 3 revise + 新 endpoint 含む再デプロイ完了、API gate 動作確認済 (post-deploy smoke green)
- 進行中ターゲット: なし (3 revise 全実装完了、unit 194 green / typecheck 0)
- 最終更新セッション: D20260528_013_release_post-deploy (deploy 2nd time + smoke)
- 最終更新時刻: 2026-05-28 12:45
- 完了フェーズ: [Phase1, Phase1.5, Phase2, Phase3 実装(全9フォルダ unit+E2E green, 視覚レビュー green, vite build green), Phase4 デプロイ(2 回完了): 1st=2026-05-27 D20260527-025 / **2nd=2026-05-28 D20260528-021 (3 revise + 新 endpoint `/api/admin/collect` 反映、deploy_id=dpl_P4M6ct7FNVp6FejyfiMgenmUAjJ5)**、**Clerk production instance / sk_live_*** で稼働中, **新規追加: registry DB SoT 化 + providers 秘密ゼロ化 + 3 revise (dashboard admin-ux: /admin link + form styling, collection refresh-cadence: 最終更新表示, collection force-pull: admin ボタン + 新エンドポイント `/api/admin/collect`)** 全 unit 194 passed]
- デプロイ状況: **公開 URL = https://service-hub.givers.work** (custom domain、Clerk production instance、live キー稼働中)。`.env.production.local` + Vercel production env 全 8 var 同期済 (CLERK_SECRET_KEY=sk_live_*, VITE_CLERK_PUBLISHABLE_KEY=pk_live_*, HUB_SERVICE_INFO_SECRET / CRON_SECRET / VERCEL_API_TOKEN / NEON_API_KEY / ALLOWED_USER_ID / DATABASE_URL)。**post-deploy smoke (D20260528-021)**: / 200 / /admin 200 / /api/admin/services 401 ✅ / **/api/admin/collect POST 401 ✅ (新エンドポイント反映確認)** / /api/cron/collect 401 forbidden (CRON_SECRET gate 維持)
- 次の推奨コマンド: 残作業は (a) **ブラウザで /admin の「今すぐ pull」ボタン + form styling + dashboard 最終更新表示の実機確認** (Class C、seiji)、(b) **論点-005 accepted-risk 明示確定** (Class C、seiji)、(c) **P4.45 Wording gate defer 判断** (内部ツール非公開、Class C、seiji)。実機 (a) で OK 確認後、(b)(c) を含めて P5 完了に進むか決定
- Open 論点: 001✅/002✅/003✅/004✅ 解決済。005[SEC-003] @vercel/node devDep High CVE = accepted-risk 推奨 (本番ランタイム非搭載で低リスク、ユーザー明示確認後 §8 closed へ移動)。
- 残ゲート: P4.7 Release **通過済** ✅ / P4.45 Wording (内部ツール低優先、1度も未実行、defer 判断待ち) / P4.8 Promote は §4.7 非公開のため**不発火**。
<!-- AUTO-GENERATED:END scenario-cursor -->

## 6. 変更履歴
- 2026-05-26: /flow:concept で初回生成
- 2026-05-27: /flow:scenario --update で §5 カーソルを reconcile (Phase4 デプロイ済 test キーへ、~10 session 分の stale を解消、decision_id=D20260527-032)。/flow:auto §3.0c drift シューティング由来 (AUDIT_20260527_2126 検出)
- 2026-05-28: AUDIT_20260528_1230b 由来の bookkeeping reconcile。3 revise tdd 完了 (admin-ux / refresh-cadence / force-pull, unit 177→194) + 新エンドポイント `/api/admin/collect` を §5 完了フェーズに追記、未デプロイ明示 (decision_id=D20260528-020)
- 2026-05-28 [flow] 補正: §5 が「test/dev Clerk キー」と stale 記述していたが、実態は `.env.production.local` に `sk_live_*` / `pk_live_*` がセット済で live 化完了。残作業は「3 revise + 新 endpoint の再デプロイのみ」に補正 (CF-20260528-011、release/auto 側の「.env.production.local 実物確認ベースの live 判定」を flow-suite に補強: auto.md c858737 + release.md 2dbc578)
- 2026-05-28: 2nd deploy 完了 (D20260528-021、dpl_P4M6ct7FNVp6FejyfiMgenmUAjJ5)。8 env synced + vite build 23s + custom domain `service-hub.givers.work` で稼働、post-deploy smoke green (/api/admin/collect POST 401 = 新エンドポイント反映確認、全 gate 正常)
