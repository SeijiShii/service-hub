# registry E2E テスト計画（DB SoT + admin write）

> **入力**: `./001_REVISE_SPEC.md`, `../../concept.md` §1.1, 既存 E2E（dashboard / service-detail）
> **最終更新**: 2026-05-28
> **基盤**: Playwright（既存 `e2e/`）。Clerk ゲート内操作のため認証済みコンテキストが必要

---

## 1. 変更 UC シナリオ

### UC4a: admin フォームからサービス登録（happy）
| シナリオ ID | 前提 | 操作ステップ | 期待結果 |
|---|---|---|---|
| E-01 | seiji で認証済 / services 空 | admin 画面 → 「登録」→ slug=`demo-svc` / url=`https://demo.example.com` / endpoint 入力 → 送信 | 一覧に `demo-svc` 表示、ダッシュボードにも反映（再デプロイなし） |

### UC4b: 編集
| E-02 | E-01 後 | `demo-svc` の name を変更 → 保存 | 変更が一覧に反映、行は増えない |

### UC4c: 停止/退役
| E-03 | E-01 後 | `demo-svc` を retire | onlyActive 一覧から消える、status=retired |

### 認証ガード（edge）
| E-04 | 未認証コンテキスト | `/api/admin/services` に POST | 401、登録されない |
| E-05 | フォーム検証 | url=`http://localhost:3000` で送信 | 400 表示（SSRF 拒否）、登録されない |

## 2. リグレッションシナリオ（既存 UC、重要度高）
| UC | シナリオ ID | 確認観点 |
|---|---|---|
| ダッシュボード一覧 | R-01 | DB に登録済サービスが横断サマリに出る（旧 toml 経路撤去後も表示維持） |
| 個別時系列 | R-02 | `/services/:slug` が DB の services を参照して描画 |
| collect cron | R-03 | `/api/cron/collect`（CRON_SECRET 付き）が DB から active を読み snapshots を保存（loadServices async 化後も動作） |
| public-status | R-04 | `/api/public/status` が DB read で公開安全サブセットを返す（async 化後も 200） |

## 3. 移行検証シナリオ
**なし**（未運用・データ移行なし、[D20260528-004]）。新規テーブルは空で開始し E-01 で初投入。

## 4. 環境要件差分
| 項目 | 前回 | 今回 | 理由 |
|---|---|---|---|
| services 供給 | `services.toml`（同梱） | Neon `services` テーブル（test は pglite/Neon ブランチ） | DB 化 |
| 認証 | 閲覧のみ Clerk gate | admin 操作に Clerk 認証済コンテキスト | write 経路新設 |

## 5. 期待 KPI
| 指標 | 目標 |
|---|---|
| admin 登録 → ダッシュボード反映 | 再デプロイ 0 回で反映 |
| 認証ガード | 未認証 write は 100% 401 |

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 | /flow:revise |
