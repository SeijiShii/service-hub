# _shared/types 単体テスト計画

> **入力**: `./001_types_SPEC.md`, `./002_types_PLAN.md`
> **最終更新**: 2026-05-26

---

## 1. テストケース一覧

> 本フォルダの実行時挙動は**型ガード**のみ。構造型は typecheck（`tsc --noEmit` + `@ts-expect-error` 型レベルテスト）で担保。

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| T-N1 | `isProviderKind` | 'vercel' / 'neon' / 'clerk' / 'ping' / 'cloudflare' / 'sentry' | true |
| T-N2 | `isServiceStatus` | 'active' / 'paused' / 'retired' | true |
| T-N3 | `isCollectionStatus` | 'ok' / 'partial' / 'failed' | true |
| T-N4 | `PROVIDER_KINDS` | — | 6 種すべて含む配列、重複なし |
| T-N5 | `MVP_PROVIDERS` | — | ['ping','vercel','neon','clerk']（Sentry/CF 除外） |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待振る舞い |
|---|---|---|---|
| T-E1 | `isProviderKind` | 'aws' / '' / 大文字 'Vercel' | false |
| T-E2 | `isServiceStatus` | 'deleted' / null / 123 | false |
| T-E3 | 型レベル | ServiceDescriptor に未知 status を代入 | `@ts-expect-error` でコンパイルエラーを確認 |

### 1.3 境界値
| ID | 対象 | 境界 | 期待振る舞い |
|---|---|---|---|
| T-B1 | `isProviderKind` | undefined / 数値 / オブジェクト | false（throw しない） |
| T-B2 | MetricKey open union | 未知キー 'custom_xyz' を MetricKey に代入 | 型エラーにならない（拡張可を確認） |
| T-B3 | KnownMetricKey | typo 'maus' を KnownMetricKey に代入 | `@ts-expect-error`（既知キーは厳格） |

## 2. Mock 方針
| 対象 | 方針 | 理由 |
|---|---|---|
| 外部依存 | なし | 純型 + ガードのため mock 不要 |
| 時刻/ランダム | なし | 本フォルダは扱わない |

## 3. カバレッジ目標
| 種別 | 目標 | 根拠 |
|---|---|---|
| 行カバレッジ | 90%+ | ガードは小さく全分岐到達容易（concept 80% を上回る） |
| 分岐カバレッジ | 90%+ | true/false 両方を網羅 |
| 型レベル | typecheck green 必須 | 構造型の担保は `tsc --noEmit` |

## 4. 既存ユーティリティ依存
なし（最初の実装対象）。

## 5. テスト実行環境
- フレームワーク: Vitest（concept §4.3 系、本フォルダの tdd で初期化）
- 型レベルテスト: `tsc --noEmit` + `@ts-expect-error` コメント（必要なら `tsd`）
- 並列実行: ✅
- 実行コマンド（例示）: `npm run test` / `npm run typecheck`

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成 | /flow:feature |
