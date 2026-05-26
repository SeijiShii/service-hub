# _shared/providers 変更仕様書（business-observability: ビジネス/収益観測の追加）

> **改修種別**: 拡張（横断スコープ拡張）
> **issue / slug**: 001 / business-observability
> **基準 SPEC**: `../001_providers_SPEC.md`（service-info 契約 §1.3）
> **アンカー**: `_shared/providers`（service-info 契約拡張）。横断: types / dashboard / service-detail / registry / concept
> **最終更新**: 2026-05-27
> **タグ**: cross-cutting, analytics
> **AI_LOG**: `../../../AI_LOG/D20260527_001_revise__shared_providers_business-observability.md`

---

## 1. 変更概要

service-hub を **インフラ観測（稼働/利用/コスト概算/エラー）→ インフラ + ビジネス/収益観測** に拡張し、各サービスの採算・決済ファネル・無料枠コストを横断把握して **keep / upgrade / consolidate / sunset の判断材料**を提供する。3 次元を追加:

1. **収益性**: 各サービスの収益 / AI 等の従量コスト / 1・2・3 ヶ月の収益見込み / 採算ビュー（収益−コスト）。
2. **決済ファネル / 離脱率**: Stripe Checkout の到達→完了→カード失敗 を per-service で可視化（全体離脱率 + カード失敗率）。
3. **コストシミュレーション / 格上げ判断**: 無料枠（多くは provider アカウント単位で共有）の合算消費 → 上限到達予測 + 格上げ（free→paid）コスト vs 合算収益 → 格上げ要否を**最新料金で提案**。

判断の**実行**（撤退）は `/flow:sunset`、本拡張は**判断材料の提供**側。

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| ダッシュボード横断サマリ | 稼働/利用/コスト概算/エラー | + **採算列**（収益−コスト、見込み、離脱率バッジ） | 採算で keep/kill 一覧 |
| サービス個別 | 利用/DB/帯域/エラーの時系列 | + **収益・AIコスト・決済ファネル**の時系列 + 離脱率 | サービス単位の採算/ファネル把握 |
| （新規）コストシミュレーション | なし | **provider アカウント別の無料枠合算 vs 上限 + 格上げコスト/収益の提案ビュー** | 無料枠食い潰し→格上げ判断 |

### 2.2 入出力変更（service-info 契約）
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| `ServiceInfoResponse.metrics[]` | 任意のアプリ層メトリクス（例: active_users_7d, ai_cost_month_usd） | **標準ビジネスメトリクスキーを定義**（下記 §7.1）。`metrics[]` 形式は不変、キーを増やすだけ | ✅ 完全後方互換（additive） |

### 2.3 データモデル変更
| エンティティ | 変更内容 | マイグレーション |
|---|---|---|
| `usage_snapshots` | **変更なし**（generic な metric_key/metric_value に新キーが乗る） | 不要 |
| `services.toml`（ServiceDescriptor） | **任意フィールド追加**: `account`（provider アカウント識別＝無料枠共有グルーピング用）, `revenueThresholds`/`bep`（任意の採算閾値） | 不要（任意・後方互換） |
| **新規 SoT** `docs/pricing.toml` | provider 別「無料枠上限 + 有料プラン価格」。WebSearch で随時更新（更新日付き） | 新規 |

## 3. 影響範囲
| 対象 | 影響度 | 説明 |
|---|---|---|
| `_shared/providers`（service-info adapter） | 高 | 標準ビジネスメトリクスキーの正規化（既存 adapter にキー追加、ロジックは不変） |
| `_shared/types` | 中 | 標準メトリクスキーの型/定数、`PricingTable` / `CostSimResult` 型 |
| `dashboard` | 高 | 採算列 + コストシミュレーションビュー（provider アカウント別） |
| `service-detail` | 高 | 収益/AIコスト/決済ファネル時系列 + 離脱率 |
| `registry`（services.toml schema） | 中 | 任意フィールド `account` / `revenueThresholds` |
| **新規** cost-sim モジュール + pricing SoT | 高 | 合算・上限予測・格上げコスト/収益比較・WebSearch 更新 |
| `concept` §1 / §4.6 / §5 | 高 | スコープを収益観測に拡張、§4.6「収益不要」を解除、撤退判断を採算ベースに格上げ |

## 4. 後方互換性
- **互換維持**: ✅ 完全（すべて additive）。`metrics[]` は形式不変でキー追加のみ。services.toml の新フィールドは任意。usage_snapshots スキーマ不変。service-info を未実装/ビジネスメトリクス未申告のサービスは従来通り（採算列は「データなし」表示）。

## 5. ロールバック方針
- **コード revert で戻せる**: ✅（git tracked、DB 変更なし）。
- pricing.toml / 新ビュー / 新キー正規化は独立追加 → 部分 revert 可。

## 6. リリース戦略
段階的（フィーチャーフラグ不要、additive のため）:
1. **Phase A**: 標準メトリクスキー定義（types）+ service-info adapter 正規化 + 採算算出（収益−コスト）の純ロジック + dashboard 採算列。
2. **Phase B**: 決済ファネル/離脱率（service-detail の funnel ビュー + 算出）。
3. **Phase C**: 収益見込み（trend 外挿）。
4. **Phase D**: コストシミュレーション（pricing SoT + provider アカウント合算 + 上限予測 + 格上げ提案 + WebSearch 更新）。
> 各 Phase は独立に価値を出す。実装は後続 `/flow:tdd`。

## 7. 詳細仕様（新仕様）

### 7.1 標準ビジネスメトリクスキー（service-info `metrics[]`、自己申告）
各サービスが `/api/hub/service-info` の `metrics[]` で申告（既存 `ai_cost_month_usd` パターン踏襲、未申告は HUB 側「データなし」）:

| key | unit | 意味 |
|---|---|---|
| `revenue_month_usd` | usd | 当月収益（確定/見込みの確定分） |
| `mrr_usd`（任意） | usd | 月次経常収益 |
| `ai_cost_month_usd` | usd | 当月の AI 等従量コスト（**既存例示済**） |
| `paid_users`（任意） | count | 課金ユーザー数 |
| `checkout_started` | count | 決済画面到達数（窓: 当月 or 直近 N 日） |
| `checkout_completed` | count | 決済完了数 |
| `checkout_card_failed` | count | カード決済を試みて失敗した数 |

> 窓（当月/7d 等）は key サフィックス or unit メタで表現（実装時に確定、Phase A 論点）。

### 7.2 採算（profitability）算出 — HUB 側純ロジック
- **採算 = revenue_month_usd − ai_cost_month_usd −（按分した無料枠超過コスト, §7.4）**。
- ダッシュボード採算列: 黒字/薄利/赤字をバッジ表示（閾値は services.toml `revenueThresholds` 任意、無ければ単純符号）。

### 7.3 決済ファネル / 離脱率 — HUB 側純ロジック
- **全体離脱率 = 1 −（checkout_completed / checkout_started）**。
- **カード失敗率 = checkout_card_failed / checkout_started**（「クレジット決済が理由で離脱」の切り出し、D20260527-002）。
- service-detail で時系列 + 直近値。started=0 はゼロ除算回避で「データなし」。

### 7.4 コストシミュレーション / 格上げ判断（新規モジュール）
- **無料枠は provider アカウント単位で共有**が基本（Vercel Hobby / Neon 等）。services.toml の任意 `account`（無指定時は「provider ごとに全サービス 1 アカウント相乗り」を既定モデル）でグルーピングし、**アカウント単位で使用量を合算**。
- **入力**: アカウント別合算使用量（snapshots）+ 成長 trend（時系列）+ `pricing.toml`（無料枠上限 + 有料価格）。
- **出力**:
  - provider アカウント別: 無料枠消費 %、**上限到達予測日**（trend 外挿）、free→paid **格上げコスト**。
  - 事業レベル: そのアカウントに相乗りする全サービスの**合算収益 vs 格上げコスト** → **提案**: `keep（無料枠内）` / `upgrade（収益が格上げコストを上回る）` / `consolidate（統合）` / `sunset（収益が見合わない → /flow:sunset）`。
- **最新料金の提案**: `pricing.toml` が古い場合は WebSearch で provider の現行「無料枠上限・有料価格」を拾って SoT を更新（更新日記録）してからシミュレート（D20260527-006）。

### 7.5 機能固有 NFR + 連携
- 収益/コスト/ファネルはすべて **service-info 自己申告**（O25: HUB が Stripe/OpenAI キーを集中保持しない、D20260527-002）。
- 採算/見込み/ファネル/コスト sim は **view・算出層**（snapshots から計算）。収集（providers/collection）は generic に新キーを通すだけ。
- `/flow:sunset`（撤退実行）/ service-hub 採算ビュー（判断材料）の役割分担を明記。

## 8. タグ別追加項目（analytics）
- 集計の時間窓（当月 / 直近 N 日）を明確化。ゼロ除算・データ欠損時の表示規約（「データなし」）。trend 外挿の窓と外挿法（線形、直近 k スナップショット）を実装時に固定。

## 9. 未決事項
### [論点-BO1] メトリクス時間窓の規約
- **問い**: `revenue_month_usd`（当月）と `checkout_started`（当月? 直近7d?）の窓をキー名で固定するか unit メタで持つか。
- **推奨**: キー名にサフィックス（`_month` / `_7d`）で明示。Phase A 実装時に確定。
- **担当**: seiji

### [論点-BO2] provider アカウント・グルーピングと無料枠上限の同定
- **問い**: services.toml は project ID 単位。無料枠はアカウント単位共有。`account` 任意フィールドの導入 + 既定「provider ごと単一アカウント相乗り」で足りるか。free-tier 上限の単位（アカウント/プロジェクト）は provider 依存。
- **推奨**: 既定=provider ごと単一アカウント相乗り（solo maker 前提）。pricing.toml に「無料枠の単位」も持つ。Phase D で精緻化。
- **担当**: seiji

### [論点-BO3] pricing.toml の更新運用
- **問い**: WebSearch 更新を手動トリガー（sim 実行時に「古いので更新?」）か、定期か。
- **推奨**: sim 実行時に SoT の更新日が N 日超なら WebSearch 更新を提案（Class A、ローカル更新）。Phase D で確定。
- **担当**: seiji

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-27 | 初版作成（収益性 + 決済ファネル + コストシミュレーションの3次元）。データ源=service-info 自己申告、離脱率=両方別指標、料金=pricing SoT+WebSearch | /flow:revise |
