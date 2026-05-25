# プロダクトドキュメントマップ (service-hub)

**最終更新**: 2026-05-26 07:58 (+09:00)
**最新コマンド**: /flow:concept (D20260526_001_concept_initial)
**統計**: 機能フォルダ 5 / 横断フォルダ 4 / 改修 0 / バグ修正 0 / クレーム 0 / Open 論点 3

> このファイルは AI 用エントリポイント。目的別に「どこから読むか」を示す。

<!-- auto-generated-start -->

## 0. AI 用クイックアクセス（目的別）
| 目的 | 最初に Read | 次に Read | 注記 |
|---|---|---|---|
| プロダクト全体を理解する | `./concept.md` (§1, §1.3, §4) | `./INDEX.md` | 内部観測ダッシュボード |
| 次に何をすべきか判断する | `./SCENARIO.md` (§5 カーソル) | `./AI_LOG/INDEX.md` | `/flow:auto` 起動 |
| 特定機能を理解する | `./<feature>/README.md` | `./<feature>/INDEX.md` | feature 一覧は §2 |
| 設計判断の経緯を辿る | `./AI_LOG/INDEX.md` | 該当セッションファイル | decision_id 索引 |
| 未決論点を見る | `./concept.md §8` | `./AI_LOG/INDEX.md` Open 論点 | 3 件 |
| 実装前準備 | `./PREREQUISITES.md` | — | API トークン一覧 |

## 1. プロダクト全体
- 概念設計 (SoT): [./concept.md](./concept.md)
  - 一行: flow 連発マイクロサービスの稼働/利用/コスト/障害を PaaS API pull で横断把握する内部ダッシュボード
  - 現フェーズ: 企画
- プロジェクト INDEX: [./INDEX.md](./INDEX.md)

## 2. 機能フォルダ
| 優先度 | 基盤 | フォルダ | 状態 | INDEX |
|---|---|---|---|---|
| 2 | ✅ | registry | 計画 | [INDEX](./registry/INDEX.md) |
| 3 | ✅ | collection | 計画 | [INDEX](./collection/INDEX.md) |
| 4 | ❌ | dashboard | 計画 | [INDEX](./dashboard/INDEX.md) |
| 4 | ❌ | service-detail | 計画 | [INDEX](./service-detail/INDEX.md) |
| 4 | ❌ | alerts | 計画 | [INDEX](./alerts/INDEX.md) |

## 3. 横断フォルダ（_shared/*）
| 優先度 | フォルダ | 状態 | INDEX |
|---|---|---|---|
| 1 | _shared/types | 計画 | [INDEX](./_shared/types/INDEX.md) |
| 1 | _shared/db | 計画 | [INDEX](./_shared/db/INDEX.md) |
| 2 | _shared/providers | 計画 | [INDEX](./_shared/providers/INDEX.md) |
| 2 | _shared/auth | 計画 | [INDEX](./_shared/auth/INDEX.md) |

## 4. 設計判断の経緯
- AI_LOG インデックス: [./AI_LOG/INDEX.md](./AI_LOG/INDEX.md)
- Open 論点: 3 件（concept §8 と同期）

## 5. 観点・選好データ（PJ 外部参照）
- 観点 SoT: `~/.claude/flow-data/perspectives.md`（O25 秘密管理 / O29 公開 / O32 BaaS 分離 が特に関連）
- 開発者選好: `~/.claude/flow-data/preferences.md`（§3.1 マイクロサービス連発スタック）

## 7. 依存・優先度グラフ
```
types (優先度 1, 基盤 ✅)
db (優先度 1, 基盤 ✅) ← types
providers (優先度 2, 基盤 ✅) ← types
auth (優先度 2, 基盤 ✅)
registry (優先度 2, 基盤 ✅) ← types
collection (優先度 3, 基盤 ✅) ← providers, db, registry
dashboard (優先度 4) ← db, auth, registry
service-detail (優先度 4) ← db, auth, registry
alerts (優先度 4) ← db, collection
```
循環依存: なし

## 8. コマンド使い分けガイド
| やりたいこと | コマンド |
|---|---|
| 新規機能を設計 | `/flow:feature <feature>` |
| 実装 | `/flow:tdd` |
| 工数見積もり | `/flow:estimate` |
| 次の一手を自動実行 | `/flow:auto` |

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
