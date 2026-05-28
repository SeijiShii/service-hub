# dashboard 単体テスト計画（戻る link + 「今すぐ pull」を dashboard へ relocation）

> **入力**: 001/002、既存 `DashboardView.test.tsx` / `ServicesAdminView.test.tsx`
> **最終更新**: 2026-05-28

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待 |
|---|---|---|---|
| TFP-N3 | DashboardView | `onForcePull` 渡し + ボタン click | onForcePull が 1 回呼ばれる |
| TFP-N4 | DashboardView | `forcePullState.lastResult` 渡し | DOM `[data-testid="force-pull-result"]` に servicesCount / errors 件数表示 |
| UX-N4 | ServicesAdminView | back-link が表示 | `[data-testid="back-link"]` 存在 + `href="/"` + label "← ダッシュボード" |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待 |
|---|---|---|---|
| TFP-E4 | DashboardView | `forcePullState.running=true` でボタン押下 | ボタン disabled + 「実行中…」表記 + click しても onForcePull 呼ばれない |

### 1.3 境界値
| ID | 対象 | 境界 | 期待 |
|---|---|---|---|
| TFP-B2 | DashboardView | `onForcePull` 未渡し | force-pull section 非表示 (button 不在) — 既存呼び出しに後方互換 |

## 2. 修正テストケース
| ID | 対象 | 修正前 | 修正後 | 理由 |
|---|---|---|---|---|
| (なし) | — | — | — | 既存 DA-* / UX-N1 / UX-N3 / AF-1〜4 / RC-* は無修正で通る (resilient query) |

## 3. 削除テストケース
| ID | 対象 | 削除理由 |
|---|---|---|
| FP-N3 | ServicesAdminView | force-pull が dashboard へ移管されたため admin 側で検証不要。TFP-N3 として dashboard に移動 |
| FP-N4 | ServicesAdminView | 同上、TFP-N4 として移動 |
| FP-E4 | ServicesAdminView | 同上、TFP-E4 として移動 |

## 4. リグレッション強化
- DashboardView 既存テスト (UX-N1 admin-link / DA-N4 サマリ + 行 / DA-E1 empty / DA-N4/E2 alert / RC-N2/N3 最終更新表示) はすべて維持される。
- ServicesAdminView 既存テスト (UX-N3 3 fieldset / AF-1〜4 registry CRUD) はすべて維持される。
- `api/admin/collect.test.ts` は無変更で 5 件 pass を維持。

## 5. Mock 方針差分
| 対象 | 前回 | 今回 | 理由 |
|---|---|---|---|
| DashboardView の force-pull テスト | なし | vi.fn() callback + fakeTimers なし (relative time は別) | 単純な click + state 渡しのみ、時刻固定不要 |

## 6. カバレッジ目標
| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | 既存継承 |
| 分岐 | 70% | 既存継承 (running/disabled/未渡しの 3 分岐) |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 | /flow:revise |
