# 根本原因分析: Clerk セッション検証未実装

> **入力**: `./000_調査レポート.md`, `src/auth/server.ts`, `src/lib/useFetch.ts`, 2 API handlers
> **最終更新**: 2026-05-26

## 1. 5 Whys
| # | 問い | 答え |
|---|---|---|
| Why 1 | なぜ API が常時 401 か? | `getAuthFromRequest` が常に `userId: null` を返すため |
| Why 2 | なぜ null か? | `x-clerk-user-id` ヘッダを立てる検証層が存在せず、ヘッダが常に未設定 |
| Why 3 | なぜ検証層が無いか? | `server.ts` が MVP プレースホルダのまま（`@clerk/backend` 未導入、middleware 不在） |
| Why 4 | なぜプレースホルダのままか? | 「実 Clerk 検証は release/bootstrap で差し替える」と意図的に後回し（`[論点-AUTH-SERVER]`） |
| Why 5 | なぜ差し替え漏れに気づかなかったか? | **E2E(D045) が route-mock で `/api/*` を全て差し替え、認可チェーンを迂回したため「全 green」に見えた**（mocked green ≠ wiring OK） |

**根本原因**: 認可サーバ検証が意図的に deferred されたまま完了判定に至り、かつ唯一の動的検証である E2E が API をモックして認可チェーンを実行しなかったため、欠落が検知されなかった。

## 2. 直接原因
| ファイル | 行 | 問題 |
|---|---|---|
| `src/auth/server.ts` | 7-10 | `getAuthFromRequest` がクライアント供給ヘッダ `x-clerk-user-id` を読むだけ（誰も立てない＝常時 null。かつ本番では偽装可能） |

## 3. 根本原因
段階実装で認可の「フロント gate（ClerkProvider）」だけ先行し、「サーバ検証」を release まで明示的に保留した。保留タスクが完了ゲートの前に消化されず、E2E のモック戦略が穴を覆い隠した。

## 4. 寄与要因
| 種別 | 内容 |
|---|---|
| テスト不足 | 認可チェーン（cookie→検証→requireSeiji）の結合テストが無い。`guard.test.ts` は純ロジックのみ |
| 検証戦略 | E2E が `/api/*` を route-mock し、本物の認可を一度も実行していない |
| ドキュメント | `[論点-AUTH-SERVER]` で保留は明記されていたが、完了ゲートに紐づいていなかった |

## 5. 仮説と検証
| 仮説 | 検証 | 結果 |
|---|---|---|
| ヘッダを立てる層が無い | `grep x-clerk-user-id`（server.ts のみ）、`middleware.ts` 不在確認 | ✅ 確定 |
| useFetch は cookie を送る | `src/lib/useFetch.ts` 確認（`credentials: include`） | ✅ cookie 経由で検証可能 |

## 6. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-05-26 | 初版 | /flow:fix |
