# _shared/providers 単体テスト計画

> **入力**: `./001_providers_SPEC.md`, `./002_providers_PLAN.md`
> **最終更新**: 2026-05-26

---

## 1. テストケース一覧（mock fetch / fixture 注入、O35）

### 1.1 正常系
| ID | 対象 | 入力(mock) | 期待 |
|---|---|---|---|
| PR-N1 | ping | 200 応答 | `up=1` メトリクス |
| PR-N2 | ping | 503 応答 | `up=0` |
| PR-N3 | neon | project JSON fixture | db_storage_bytes/compute を正規化 |
| PR-N4 | vercel | deployments fixture | last_deploy_at 抽出 |
| PR-N5 | clerk | total_count header | mau(代理) 抽出 |
| PR-N6 | serviceInfo | ServiceInfoResponse fixture | metrics[] を UsageMetric に正規化 |
| PR-N7 | getAdapters | providers={vercel,neon} の service | vercel/neon/ping adapter を返す |

### 1.2 異常系
| ID | 対象 | 条件 | 期待 |
|---|---|---|---|
| PR-E1 | 任意 adapter | timeout | `{metrics:[], error:'timeout'}`（throw しない） |
| PR-E2 | 任意 adapter | 401 | `{error:'auth'}` |
| PR-E3 | 任意 adapter | 429 | バックオフ後 `{error:'rate_limited'}` |
| PR-E4 | serviceInfo | 不正 JSON | `{error:'parse'}`、raw 保存なし |
| PR-E5 | fetch.ts | 内部アドレス(127.0.0.1/169.254.x) への fetch | 抑止（[論点-004] SSRF） |

### 1.3 境界値 / セキュリティ
| ID | 対象 | 境界 | 期待 |
|---|---|---|---|
| PR-B1 | スクラブ | raw に token/secret/authorization キー | スクラブ済（値が消える/マスク） |
| PR-B2 | serviceInfo | schemaVersion=99(未知) | 既知部分のみ解釈、クラッシュなし（後方互換） |
| PR-B3 | fetch.ts | リダイレクト 5 回超 | 中断 |

## 2. Mock 方針
| 対象 | 方針 | 理由 |
|---|---|---|
| 外部 API | **mock fetch / fixture（公開ドキュメント基準）** | 実トークン不要で正規化ロジック検証（O35） |
| 実 API 疎通 | /flow:release Phase2（実キー軽めスモーク） | 実形状の最終確認 |
| 時刻 | 固定注入 | last_deploy_at 等の決定性 |

## 3. カバレッジ目標
| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | concept 継承 |
| 分岐 | 75% | エラー分岐(timeout/auth/429/parse)を網羅 |
| セキュリティ | PR-E5/PR-B1 必須 | [論点-004] SSRF/スクラブ |

## 4. 既存ユーティリティ依存
- `_shared/types`（ProviderAdapter/UsageMetric/ServiceInfoResponse）
- msw or 自前 mock fetch

## 5. テスト実行環境
- フレームワーク: Vitest + msw（HTTP mock）
- 実行コマンド（例示）: `npm run test`

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版作成 | /flow:feature |
