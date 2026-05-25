# AI_LOG インデックス — service-hub

**最終更新**: 2026-05-26 08:48 (+09:00)
**総セッション数**: 4
**総 decision 数**: 17

> セッションごとに 1 ファイル、append-only、過去ファイルは削除・編集禁止。
> 人間向けサマリは `../concept.md` §7 決定事項ログ を参照。

<!-- auto-generated-start -->

## セッション一覧（新しい順）
| ファイル | 実行日 | コマンド | 対象 | decision 範囲 | 状態 |
|---|---|---|---|---|---|
| [D20260526_004_design_system.md](./D20260526_004_design_system.md) | 2026-05-26 | /flow:design | system (NEW) | D20260526-015〜016 | 完了 |
| [D20260526_003_secure_concept.md](./D20260526_003_secure_concept.md) | 2026-05-26 | /flow:secure | concept (design) | D20260526-011〜013 | 完了 |
| [D20260526_002_resume_continuous.md](./D20260526_002_resume_continuous.md) | 2026-05-26 | /flow:auto | continuous | D20260526-010,014,017 | 完了(pause) |
| [D20260526_001_concept_initial.md](./D20260526_001_concept_initial.md) | 2026-05-26 | /flow:concept | initial | D20260526-001〜009 | 完了 |

## decision_id 索引（grep 用、新しい順）
| ID | command | phase | chosen (短縮) | type | ファイル |
|---|---|---|---|---|---|
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
| [論点-001] | 無料枠使用量 pull API の実在性・粒度 | D20260526_001 | D20260526-005 |
| [論点-002] | スケジューラ頻度と Vercel Hobby Cron 制限 | D20260526_001 | D20260526-002 |
| [論点-003] | service-info エンドポイントの標準契約スキーマ定義（★クロスサービス波及: hana-memo retrofit + flow 標準化） | D20260526_001 | D20260526-009 |
| [論点-004] | [SEC-002] O24 入力検証（SSRF/安全パース/raw_json スクラブ、Medium） | D20260526_003 | D20260526-013 |

## Superseded chain（旧 Open → 新解決）
| 旧 ID | 新 ID | 解決日 | 解決セッション |
|---|---|---|---|
| (なし) | | | |

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
