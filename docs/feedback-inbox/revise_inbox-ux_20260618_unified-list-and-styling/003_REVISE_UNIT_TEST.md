# feedback-inbox 単体テスト計画（インボックス UX — 統合一覧 + スタイル適用）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, 既存 inbox.test.ts / FeedbackInboxView.test.tsx
> **最終更新**: 2026-06-18

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| RU-01 | `buildInboxVM` counts | 3 サービス混在 items (feedback×2/bug×1/inquiry×1) | `counts.total=4`、`byKind={feedback:2,bug:1,inquiry:1}` |
| RU-02 | `buildInboxVM` counts (空) | items 0 | `counts.total=0`、byKind 全 0 |
| RU-03 | View 件数サマリ | counts={total:4,...} | 「全 4 件」+ kind 別内訳が描画 |
| RU-04 | View 統合明示 | 複数サービスの items | 各 item にサービス名 + `ServiceIcon` が表示 (横断スキャン可) |
| RU-05 | View kind segmented chips | chips クリック | `onKindChange` が該当 kind で呼ばれる (すべて→空文字) |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待振る舞い |
|---|---|---|---|
| RU-10 | View | counts 未定義 (後方互換) | サマリ非表示 or 0 件扱いで throw しない |

### 1.3 境界値
| ID | 対象 | 境界 | 期待振る舞い |
|---|---|---|---|
| RU-20 | counts | 1 kind のみ | その kind だけ内訳に出る (0 件 kind は 0 表示 or 省略、実装で確定) |

## 2. 修正テストケース
| ID | 対象 | 修正前 | 修正後 | 理由 |
|---|---|---|---|---|
| (既存維持) | FeedbackInboxView.test FI-V1〜UC3-S1 (5 件) | kind-badge 等 testid 参照 | **testid 維持で全 pass** (styling 変更が testid/role を壊さないこと) | リグレッション保証 |

## 3. 削除テストケース
| ID | 対象 | 削除理由 |
|---|---|---|
| (なし) | | |

## 4. リグレッション強化
- 既存 `data-testid` (`feedback-list`/`feedback-item`/`kind-badge`/`empty-state`/`filters`) を維持し、styling 変更で UI 構造アサーションが壊れないことを確認。
- inbox.test.ts (queries/parseFeedbackFilter/buildClaimText/buildInboxVM) の既存ケースは維持。

## 5. Mock 方針差分
| 対象 | 前回 | 今回 | 理由 |
|---|---|---|---|
| (差分なし) | testing-library + fixture VM | 同左 (counts 付き VM を fixture に追加) | additive |

## 6. カバレッジ目標
| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | 既存継承 |
| 分岐 | 70% | 既存継承 |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-18 | 初版作成 | /flow:revise |
