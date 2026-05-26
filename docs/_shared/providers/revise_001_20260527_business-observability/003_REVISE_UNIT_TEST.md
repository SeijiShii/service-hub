# 単体テスト計画（business-observability）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, 既存 src テスト
> **最終更新**: 2026-05-27

## 1. 追加テストケース

### 1.1 採算（profitability.ts, Phase A）
| ID | 入力 | 期待 |
|---|---|---|
| BO-PR1 | revenue=10, ai_cost=3 | profit=7, 黒字 |
| BO-PR2 | revenue=1, ai_cost=0.9 | profit=0.1, 薄利（閾値内） |
| BO-PR3 | revenue=2, ai_cost=5 | profit=-3, 赤字 |
| BO-PR4 | revenue 未申告（メトリクスなし） | 「データなし」(null)、クラッシュしない |
| BO-PR5 | revenueThresholds 指定（薄利境界） | 閾値に従い 薄利/黒字 を判定 |

### 1.2 決済ファネル/離脱率（funnel.ts, Phase B）
| ID | 入力 | 期待 |
|---|---|---|
| BO-FN1 | started=100, completed=70, card_failed=12 | 全体離脱率=0.30, カード失敗率=0.12 |
| BO-FN2 | started=0 | 両 rate=null（ゼロ除算回避、「データなし」） |
| BO-FN3 | completed>started（異常データ） | clamp or 警告（離脱率 0 下限） |
| BO-FN4 | card_failed のみ未申告 | 全体離脱率は算出、カード失敗率=null |

### 1.3 収益見込み / trend 外挿（projection.ts, Phase C）
| ID | 入力 | 期待 |
|---|---|---|
| BO-PJ1 | 直近 3 点が線形増（例 月 2,4,6） | 1/2/3ヶ月後 = 8,10,12（線形外挿） |
| BO-PJ2 | データ 1 点のみ | 外挿不可 → 「見込み不足」(null) |
| BO-PJ3 | フラット系列 | 見込み = 直近値維持 |

### 1.4 コストシミュレーション（simulate.ts, Phase D）
| ID | 入力 | 期待 |
|---|---|---|
| BO-CS1 | 2 サービスが同一 Vercel アカウント、合算使用量=無料枠の 90% | account 別合算 90%、警告状態 |
| BO-CS2 | 合算が無料枠超過予測 + 合算収益 > 格上げコスト | 提案=upgrade |
| BO-CS3 | 合算超過予測 + 合算収益 < 格上げコスト | 提案=consolidate or sunset |
| BO-CS4 | 無料枠内で余裕 | 提案=keep |
| BO-CS5 | 上限到達予測（trend で N 日後）| projection 連携で到達日を返す |
| BO-CS6 | `account` 無指定 | provider ごと単一アカウント相乗りで合算（既定モデル） |

### 1.5 pricing SoT（pricing.ts, Phase D）
| ID | 入力 | 期待 |
|---|---|---|
| BO-PC1 | 正常 pricing.toml | PricingTable にパース（provider 別 無料枠上限 + 有料価格 + 単位 + updated） |
| BO-PC2 | updated が N 日超 | 鮮度フラグ stale=true（→ WebSearch 更新提案の根拠） |
| BO-PC3 | 不正/欠損フィールド | Zod でエラー集約、既知分は解釈 |

## 2. 修正テストケース
| ID | 対象 | 修正前 | 修正後 |
|---|---|---|---|
| dashboard summary 既存 | buildDashboard 出力 | 採算/離脱率フィールドなし | フィールド追加（既存フィールドは不変、後方互換） |
| service-detail 既存 | detail VM | ファネルなし | ファネル追加（既存不変） |

## 3. 削除テストケース
なし。

## 4. リグレッション強化
- 既存 `summary.test.ts` / `ServiceDetailView.test.tsx` / `queries.test.ts` は不破壊（採算/ファネルは追加フィールド）。
- 未申告サービス（メトリクスなし）で全算出が「データなし」を返し、既存の空データ耐性（buildDashboard）を維持。

## 5. Mock 方針
| 対象 | 固定値 | 理由 |
|---|---|---|
| 時刻 / trend 窓 | 固定 now + 既知系列 | projection 決定性 |
| pricing | テスト用 PricingTable 注入 | WebSearch/ファイル非依存で決定的 |
| WebSearch 更新 | 注入式（fetch シーム）でモック | ネットワーク非依存 |

## 6. カバレッジ目標
- profitability / funnel / projection / simulate / pricing: 修正・新規行 90%+（純ロジック中心、容易）。

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-27 | 初版作成 | /flow:revise |
