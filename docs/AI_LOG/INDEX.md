# AI_LOG インデックス — service-hub

**最終更新**: 2026-05-26 09:48 (+09:00)
**総セッション数**: 7
**総 decision 数**: 32

> セッションごとに 1 ファイル、append-only、過去ファイルは削除・編集禁止。
> 人間向けサマリは `../concept.md` §7 決定事項ログ を参照。

<!-- auto-generated-start -->

## セッション一覧（新しい順）
| ファイル | 実行日 | コマンド | 対象 | decision 範囲 | 状態 |
|---|---|---|---|---|---|
| [D20260526_007_resume_continuous.md](./D20260526_007_resume_continuous.md) | 2026-05-26 | /flow:auto | continuous(再開3) | D20260526-022〜032 | 完了(max-iter停止) |
| [D20260526_006_feature__shared_types.md](./D20260526_006_feature__shared_types.md) | 2026-05-26 | /flow:feature | _shared/types | D20260526-019〜020 | 完了 |
| [D20260526_005_resume_continuous.md](./D20260526_005_resume_continuous.md) | 2026-05-26 | /flow:auto | continuous(再開) | D20260526-018,021 | 完了(pause) |
| [D20260526_004_design_system.md](./D20260526_004_design_system.md) | 2026-05-26 | /flow:design | system (NEW) | D20260526-015〜016 | 完了 |
| [D20260526_003_secure_concept.md](./D20260526_003_secure_concept.md) | 2026-05-26 | /flow:secure | concept (design) | D20260526-011〜013 | 完了 |
| [D20260526_002_resume_continuous.md](./D20260526_002_resume_continuous.md) | 2026-05-26 | /flow:auto | continuous | D20260526-010,014,017 | 完了(pause) |
| [D20260526_001_concept_initial.md](./D20260526_001_concept_initial.md) | 2026-05-26 | /flow:concept | initial | D20260526-001〜009 | 完了 |

## decision_id 索引（grep 用、新しい順）
| ID | command | phase | chosen (短縮) | type | ファイル |
|---|---|---|---|---|---|
| D20260526-020 | /flow:feature | 型契約設計 | concept §5.1 型一式 + ProviderAdapter IF | auto-recommended | D20260526_006_feature__shared_types.md |
| D20260526-019 | /flow:feature | target タグ | cross-cutting (E2E スキップ) | auto-recommended | D20260526_006_feature__shared_types.md |
| D20260526-018 | /flow:auto | 反復1(新loop) | /flow:feature _shared/types | auto-recommended | D20260526_005_resume_continuous.md |
| D20260526-016 | /flow:design | SoT 生成 | 状態色主役/mono/lucide | auto-recommended | D20260526_004_design_system.md |
| D20260526-015 | /flow:design | 方向 (Class C) | コックピット (dark 主体) | explicit-choice | D20260526_004_design_system.md |
| D20260526-014 | /flow:auto | 反復2 auto-pick | /flow:design (Design gate) | auto-recommended | D20260526_002_resume_continuous.md |
| D20260526-013 | /flow:secure | [SEC-002] O24 | Medium → §8 論点-004 open | auto-recommended | D20260526_003_secure_concept.md |
| D20260526-012 | /flow:secure | [SEC-001] O25 | accepted-as-requirement (§3.X) | auto-recommended | D20260526_003_secure_concept.md |
| D20260526-011 | /flow:secure | PJ性質+観点フィルタ | 適用 O24/O25、SKIP O23/26/27/28 | auto-recommended | D20260526_003_secure_concept.md |
| D20260526-010 | /flow:auto | 反復1 auto-pick | /flow:secure --phase=design | auto-recommended | D20260526_002_resume_continuous.md |
| D20260526-009 | /flow:concept | service-info 契約波及 | 各サービス標準エンドポイントを HUB pull + hana-memo retrofit + flow 標準化 | explicit-choice | D20260526_001_concept_initial.md |
| D20260526-008 | /flow:concept | Step 7.5 preferences | 更新する | explicit-choice | D20260526_001_concept_initial.md |
| D20260526-007 | /flow:concept | Step 7.7 Git | git init + コミット | explicit-choice | D20260526_001_concept_initial.md |
| D20260526-006 | /flow:concept | Q12.5/6/8/11 | AI/分析/法務/マーケ 不要 | auto-recommended | D20260526_001_concept_initial.md |
| D20260526-005 | /flow:concept | Q4 MVP対象 | ping+Vercel+Neon+Clerk | auto-recommended | D20260526_001_concept_initial.md |
| D20260526-004 | /flow:concept | レジストリSoT | Git 宣言ファイル | explicit-choice | D20260526_001_concept_initial.md |
| D20260526-003 | /flow:concept | 管理スコープ | 閲覧のみ observability | explicit-choice | D20260526_001_concept_initial.md |
| D20260526-002 | /flow:concept | 収集方式 | PaaS API を pull | auto-recommended | D20260526_001_concept_initial.md |
| D20260526-001 | /flow:concept | 起動前 | 内部運用ダッシュボード | explicit-choice | D20260526_001_concept_initial.md |

## Open 論点（chosen_type=open、全期間横断）
| ID | 論点タイトル | 採番セッション | 関連 decision |
|---|---|---|---|
| [論点-002] | スケジューラ頻度と Vercel Hobby Cron 制限（[論点-CO1] と連動） | D20260526_001 | D20260526-002 |
| [論点-004] | [SEC-002] O24 入力検証（SSRF/安全パース/raw_json スクラブ、Medium、実装時） | D20260526_003 | D20260526-013 |
| [論点-DB1] | スナップショット保持期間・集約（無料枠 50% 到達時） | D20260526_006(db) | — |
| [論点-PR1] | Clerk 厳密 MAU 取得（Phase2、実トークン検証時） | D20260526_007(providers) | D20260526-025 |
| [論点-CO1] | collection 多重起動防止 + 実行時間（Vercel Hobby） | D20260526_007 | D20260526-028 |
| [論点-AL1] | アラート通知チャネル（Webhook/メール/画面内） | D20260526_007 | D20260526-031 |

## Superseded chain（旧 Open → 解決済）
| 旧 ID | 解決 | 解決日 | 解決セッション |
|---|---|---|---|
| [論点-001] | ✅ providers SPEC §1.2 で段階導入方針確定（MVP=ping/Vercel/Neon/Clerk、free-tier% は thresholds 算出） | 2026-05-26 | D20260526_007 (D026) |
| [論点-003] | ✅ providers SPEC §1.3 で契約スキーマ確定（最小固定+extra）。波及(hana-memo retrofit/O48 具体化)は別 PJ | 2026-05-26 | D20260526_007 (D026) |
| [論点-T1] | ✅ types SPEC §1.2 に ServiceInfoResponse 追加 | 2026-05-26 | D20260526_007 (D026) |

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
