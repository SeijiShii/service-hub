# AI_LOG セッション D20260527_001 — /flow:revise (_shared/providers, business-observability)

**実行日時**: 2026-05-27 (進行中) (+09:00)
**コマンド**: /flow:revise
**対象**: _shared/providers (アンカー) + 横断 (types/dashboard/service-detail/concept/registry)
**issue/slug**: 001 / business-observability
**実行者**: Claude (Opus 4.7)
**状態**: 完了 (REVISE_SPEC + PLAN + UNIT_TEST + E2E_TEST 4文書生成)
**依存**: D20260526 providers SPEC ([論点-003] service-info 契約), dashboard/service-detail feature

## Decisions
```yaml
- id: D20260527-001
  timestamp: 2026-05-27T00:00:00+09:00
  command: /flow:revise
  phase: Step 1-2 (コンテキスト + Read スコープ + アンカー判定)
  question: 横断スコープ拡張のアンカーと Read 範囲
  chosen: アンカー=_shared/providers。service-info 契約拡張が基盤、views は downstream
  chosen_type: auto-recommended
  depends_on: []
  context: |
    seiji 要望「収益性 (AIコスト+収益+1/2/3ヶ月見込み+keep/kill) + 決済離脱率」を service-hub に追加。
    現 concept §4.6 は「収益指標・BEP 不要」と明記 → 本拡張で SoT 改定が必要 (cross-cutting)。
    重要発見: providers SPEC §1.3 service-info 契約が既に metrics[] 例に ai_cost_month_usd を含む
    → アプリ層ビジネスメトリクスの service-info 自己申告は既存の設計意図。usage_snapshots は
    generic (metric_key/value) でスキーマ変更不要。よって revise は主に「標準メトリクスキー定義 +
    採算/ファネルビュー追加 + concept §4.6 制約解除」。アンカー=providers (契約) 妥当。
    影響: types(新メトリクス型/キー), dashboard(採算ビュー+見込み), service-detail(ファネル/離脱率),
    concept §1/§4.6/§5, registry(収益閾値/BEP 任意)。

- id: D20260527-002
  timestamp: 2026-05-27T00:00:00+09:00
  command: /flow:revise
  phase: Phase 1 REVISE_SPEC — 設計判断 Q1 (データ取得元)
  question: 収益/AIコスト/決済ファネルのデータ取得元
  chosen: (保留 — seiji 確認待ち)
  chosen_type: open
  recommended: service-info 自己申告 (既存契約が ai_cost を例示済、O25 秘密集中回避)
  depends_on: [D20260527-001]
  context: |
    候補A service-info 自己申告 (各サービスが metrics[] で revenue/ai_cost/checkout funnel を申告):
      利点=既存契約の自然拡張・HUB が Stripe/OpenAI キーを多数抱えない (O25)・1 契約で全部・
      各サービス実装は軽い。欠点=各サービスが service-info に funnel カウントを実装する必要。
    候補B service-hub が直接 pull (各サービスの read-only Stripe + OpenAI usage API):
      利点=サービス側実装不要。欠点=HUB が多数の秘密鍵を集中保持 (O25 違反方向)・provider 毎
      attribution が必要・Stripe/OpenAI の per-service 紐付けが煩雑。
    推奨=A。次質問で確定。
```

- id: D20260527-003
  timestamp: 2026-05-27T00:00:00+09:00
  command: /flow:revise
  phase: Phase 1 REVISE_SPEC — Q1/Q2 確定 + 残り auto-pick
  question: データ取得元 / 離脱率定義 / 見込み法 / キー命名 / BEP / スキーマ
  chosen: |
    Q1 データ取得元=service-info 自己申告 (explicit-choice, seiji)。
    Q2 離脱率=両方を別指標 (explicit-choice, seiji): started/completed/card_failed →
       全体離脱率=1−completed/started, カード失敗率=card_failed/started。
    以下 auto-pick (Class A, 機械的):
    - 収益見込み: 既存 usage_snapshots 時系列からの単純 trend 外挿 (直近窓の線形)。MAU×ARPU は将来精緻化。
    - メトリクスキー命名 (既存 ai_cost_month_usd パターン踏襲): revenue_month_usd / ai_cost_month_usd /
      mrr_usd(任意) / paid_users / checkout_started / checkout_completed / checkout_card_failed。
    - BEP/収益閾値: services.toml に任意フィールド (default 無し、後から付与可)。
    - スキーマ: DB 変更なし (usage_snapshots は generic、新 metric_key で乗る)。採算/ファネルは
      view 層 (dashboard/service-detail) で snapshots から算出。ServiceInfoResponse は metrics[] 既存で可。
  chosen_type: explicit-choice
  depends_on: [D20260527-002]
  context: service-info 契約が ai_cost を既に例示 → 自己申告が自然。生成側 (各サービス) は funnel カウント実装要。

- id: D20260527-004
  timestamp: 2026-05-27T00:00:00+09:00
  command: /flow:revise
  phase: Phase 1 — concept §4.6 制約解除 (companion change)
  question: concept §4.6「収益指標・BEP 不要」をどうするか
  chosen: 本拡張で解除 — service-hub のスコープを「インフラ + ビジネス/収益観測」に拡張
  chosen_type: auto-recommended
  depends_on: [D20260527-003]
  context: |
    §4.6 が「収益不要」のままだと新 SPEC と SoT が矛盾。revise の影響範囲として concept §1 スコープ /
    §4.6 / §5 を更新 (収益・採算観測を第一級スコープに、撤退判断基準=採算ベースに格上げ、/flow:sunset 連携)。

- id: D20260527-005
  timestamp: 2026-05-27T00:00:00+09:00
  command: /flow:revise
  phase: Phase 1 — 第3次元追加 (コストシミュレーション / 格上げ判断)
  question: 無料枠食い潰し→格上げ要否のコストシミュレーション + 最新料金の取得元
  chosen: (取得元は seiji 確認待ち)。モデル: provider アカウント単位で全サービス使用量を合算 vs 無料枠 → 上限到達予測 (trend) + 格上げコスト vs 合算収益で keep/upgrade/consolidate/sunset を提案
  chosen_type: open
  recommended: 料金参照 SoT (provider 別 無料枠上限 + 有料価格) を保持し WebSearch で随時更新、sim がそれを読む
  depends_on: [D20260527-003]
  context: |
    seiji 要望: 薄利サービス複数が無料枠 (アカウント単位で共有) を食い潰し、上限到達時に全体収益が
    格上げコストに見合わない事態 → 格上げ要否のコストシミュレーション。最新料金で提案。
    モデル示唆: 無料枠は provider アカウント単位共有が多い (Vercel Hobby/Neon)。サービス別使用量を
    provider アカウントで合算 → 無料枠 % + 上限到達予測 + 格上げ($free→paid)コスト vs 合算収益。
    料金 (無料枠上限/有料価格) は時間で変わる → 取得元の設計判断が必要 (SoT+WebSearch更新 / 都度WebSearch / 手入力)。

- id: D20260527-006
  timestamp: 2026-05-27T00:00:00+09:00
  command: /flow:revise
  phase: Phase 1 — Q3 料金データ源確定
  question: コストシミュレーションの最新料金取得元
  chosen: 料金参照 SoT (docs/pricing.toml: provider 別 無料枠上限 + 有料価格) + WebSearch で随時更新
  chosen_type: explicit-choice
  depends_on: [D20260527-005]
  context: |
    sim は pricing.toml を読む。古ければ WebSearch で最新値を拾い SoT 更新 (更新履歴付き)。
    鮮度と信頼性のバランス。「最新を提案」= SoT を refresh して現行価格で格上げ判断を提示。
    → 3次元 (収益性/決済ファネル/コストシミュレーション) の設計判断が全確定。REVISE_SPEC 生成へ。

- id: D20260527-008
  timestamp: 2026-05-27T00:00:00+09:00
  command: /flow:revise
  phase: Phase 2-4 完了 (PLAN + UNIT_TEST + E2E_TEST)
  question: revise 設計文書一式の完成
  chosen: 002_PLAN / 003_UNIT_TEST / 004_E2E_TEST 生成完了。実装 Phase A-D + DoD + テスト計画確定
  chosen_type: auto-recommended
  depends_on: [D20260527-006]
  context: |
    Phase A(採算)/B(離脱率)/C(見込み)/D(コストシミュレーション) に分割。新規: pricing.toml SoT +
    cost-sim モジュール + projection。完全 additive (DB 変更なし、未申告は「データなし」)。
    マイグレーション不要 (005 省略)。実装は後続 /flow:tdd。次 loop = P4 tdd (Phase A から)。
