# feedback-inbox 単体テスト計画（無登録 shipyard pull + インボックス操作導線）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, Step 2 で読んだ既存テスト
> **最終更新**: 2026-06-19

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| RU-S1 | `parseFeedbackSources` | `[{"slug":"shipyard","name":"Shipyard","url":"https://givers.work"}]` | 1 件の合成 descriptor (status=active, providers={}) |
| RU-S2 | `mergeFeedbackSources` | registered=[a], env=[shipyard] | `[a, shipyard]` (両方含む) |
| RU-S3 | `mergeFeedbackSources` dedup | registered=[shipyard(reg)], env=[shipyard(env)] | registered 優先で 1 件 (env 側は捨てる) |
| RU-S4 | feedback pull (配線) | env ソース込みで `runFeedbackCollection` | env ソースの `/api/hub/feedback` も pull され items 合算 |
| RU-S5 | `FeedbackInboxPage` pull | 「今すぐ pull」click | `POST /api/admin/collect` 呼出 → 成功で refetch 発火 |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待振る舞い |
|---|---|---|---|
| RU-E1 | `parseFeedbackSources` | env 未設定 / 空文字 | `[]` を返す (従来挙動) |
| RU-E2 | `parseFeedbackSources` | 不正 JSON | `[]` + console.warn (throw しない) |
| RU-E3 | `parseFeedbackSources` | エントリの url が非安全 (http / 内部 host / >1024) | 当該エントリ skip + warn、他は採用 |
| RU-E4 | `parseFeedbackSources` | slug が正規表現外 / name 空 | 当該エントリ skip + warn |
| RU-E5 | `FeedbackInboxPage` pull | `POST /api/admin/collect` が 401/500 | `http_<n>` を簡易表示、refetch しない |

### 1.3 境界値
| ID | 対象 | 境界 | 期待振る舞い |
|---|---|---|---|
| RU-B1 | `parseFeedbackSources` | url ちょうど 1024 chars | 採用 / 1025 chars | skip |
| RU-B2 | `mergeFeedbackSources` | env=[] | registered のみ返す |

## 2. 修正テストケース

| ID | 対象 | 修正前 | 修正後 | 理由 |
|---|---|---|---|---|
| (なし) | — | — | — | 既存挙動を変えないため修正不要 (env 未設定で従来同一) |

## 3. 削除テストケース

| ID | 対象 | 削除理由 |
|---|---|---|
| (なし) | — | additive 改修 |

## 4. リグレッション強化

- 既存 `feedbackRunner` / `providers/feedback` テスト (37 + 全 390) を**全維持**。env 未設定経路が従来と完全同一であることを RU-E1 + 既存スイートで担保。
- `FeedbackInboxView` 既存テスト (一覧/フィルタ/空/件数サマリ) は props 追加後も green を維持 (`onForcePull` 省略時はボタン非表示)。

## 5. Mock 方針差分

| 対象 | 前回 | 今回 | 理由 |
|---|---|---|---|
| `fetch` (inbox pull) | inbox は GET のみ | `POST /api/admin/collect` を mock | pull ボタンの呼出検証 |
| env | — | `parseFeedbackSources` に `env` 引数注入 (process.env 直読みしない) | テスト容易性 + 既存 deps 注入方針 |

## 6. カバレッジ目標

| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | 既存継承 |
| 分岐 | 70% | 既存継承 (parse の skip 分岐を網羅) |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-19 | 初版作成 | /flow:revise |
