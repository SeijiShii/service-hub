# AI_LOG インデックス — service-hub

**最終更新**: 2026-05-28 (+09:00)
**総セッション数**: 35 (D20260528_017 fix registry admin-form 追加)
**総 decision 数**: 64 (D20260528-001〜032、D20260527-001〜035、+ D20260526 系)

> セッションごとに 1 ファイル、append-only、過去ファイルは削除・編集禁止。
> 人間向けサマリは `../concept.md` §7 決定事項ログ を参照。

<!-- auto-generated-start -->

## セッション一覧（新しい順）
| ファイル | 実行日 | コマンド | 対象 | decision 範囲 | 状態 |
|---|---|---|---|---|---|
| [D20260528_017_fix_registry_admin-form.md](./D20260528_017_fix_registry_admin-form.md) | 2026-05-28 | /flow:fix | registry admin-form-bug-and-ux (High 1+Low 3) | D20260528-029〜032 | 修正計画完了 → tdd 待ち |
| [D20260528_016_release_post-deploy.md](./D20260528_016_release_post-deploy.md) | 2026-05-28 | /flow:release | post-deploy 3rd (nav-and-pull) + 4th (favicon 反映) | D20260528-027〜028 | 完了 |
| [D20260528_015_tdd_dashboard_nav-and-pull.md](./D20260528_015_tdd_dashboard_nav-and-pull.md) | 2026-05-28 | /flow:tdd | dashboard nav-and-pull (Phase 1+2 実装、unit 196 passed) | D20260528-026 | 完了 |
| [D20260528_014_revise_dashboard_nav-and-pull.md](./D20260528_014_revise_dashboard_nav-and-pull.md) | 2026-05-28 | /flow:revise | dashboard nav-and-pull (back-link + force-pull relocation) | D20260528-022〜025 | 設計完了 |
| [D20260528_013_release_post-deploy.md](./D20260528_013_release_post-deploy.md) | 2026-05-28 | /flow:release | post-deploy 2nd (3 revise + 新 endpoint 反映 + smoke) | D20260528-021 | 完了 |
| [D20260528_012_audit_standard.md](./D20260528_012_audit_standard.md) | 2026-05-28 | /flow:audit | standard 2回目 (鮮度 + bookkeeping reconcile) | D20260528-020 | 完了 |
| [D20260528_011_tdd_collection_force-pull.md](./D20260528_011_tdd_collection_force-pull.md) | 2026-05-28 | /flow:tdd | collection force-pull (admin ボタン + endpoint) | D20260528-019 | 完了 |
| [D20260528_010_tdd_collection_refresh-cadence.md](./D20260528_010_tdd_collection_refresh-cadence.md) | 2026-05-28 | /flow:tdd | collection refresh-cadence (最終更新表示) | D20260528-018 | 完了 |
| [D20260528_009_tdd_dashboard_admin-ux.md](./D20260528_009_tdd_dashboard_admin-ux.md) | 2026-05-28 | /flow:tdd | dashboard admin-ux (link + styling) | D20260528-017 | 完了 |
| [D20260528_008_audit_standard.md](./D20260528_008_audit_standard.md) | 2026-05-28 | /flow:audit | standard (鮮度トリガ) | D20260528-016 | 完了 |
| [D20260528_007_revise_dashboard_admin-ux.md](./D20260528_007_revise_dashboard_admin-ux.md) | 2026-05-28 | /flow:revise | dashboard (admin 導線 + admin styling) | D20260528-015 | 設計完了 |
| [D20260528_006_revise_collection_refresh-cadence.md](./D20260528_006_revise_collection_refresh-cadence.md) | 2026-05-28 | /flow:revise | collection (最終更新表示・cron 移行は撤回) | D20260528-013〜014 | 設計完了 (縮小) |
| [D20260528_005_revise_collection_force-pull.md](./D20260528_005_revise_collection_force-pull.md) | 2026-05-28 | /flow:revise | collection (強制プルボタン) | D20260528-012 | 設計完了 |
| [D20260528_004_revise_providers_secret-zero.md](./D20260528_004_revise_providers_secret-zero.md) | 2026-05-28 | /flow:revise | providers 秘密ゼロ化 (設計+実装) | D20260528-010〜011 | 完了 |
| [D20260528_003_tdd_registry_revise_db-sot.md](./D20260528_003_tdd_registry_revise_db-sot.md) | 2026-05-28 | /flow:tdd | registry revise (DB SoT 実装) | D20260528-008〜009 | 完了 |
| [D20260528_002_revise_registry_db-sot.md](./D20260528_002_revise_registry_db-sot.md) | 2026-05-28 | /flow:revise | registry (DB SoT + admin write) | D20260528-003〜007 | 設計完了 |
| [D20260528_001_concept_update_20260528.md](./D20260528_001_concept_update_20260528.md) | 2026-05-28 | /flow:concept | update (レジストリ DB 化 + 秘密ゼロ化) | D20260528-001〜002 | 完了 |
| [D20260527_010_release_service-hub.md](./D20260527_010_release_service-hub.md) | 2026-05-27 | /flow:release | service-hub (Phase 1 FILL) | D20260527-035〜 | 完了 (後続 D20260528_013 で deploy 2nd 完遂、本セッションは Phase 1 のみで分離 close) |
| [D20260527_009_scenario_update.md](./D20260527_009_scenario_update.md) | 2026-05-27 | /flow:scenario | --update (bookkeeping reconcile 5 件) | D20260527-032 | 完了 |
| [D20260527_008_secure_deps.md](./D20260527_008_secure_deps.md) | 2026-05-27 | /flow:secure | deps (L4) | D20260527-029〜031 | 完了 |
| [D20260527_007_audit_standard.md](./D20260527_007_audit_standard.md) | 2026-05-27 | /flow:audit | standard (初回) | D20260527-027〜028 | 完了 |
| [D20260527_006_resume_continuous.md](./D20260527_006_resume_continuous.md) | 2026-05-27 | /flow:auto | continuous(audit→secure→scenario) | D20260527-026,032 | 完了 |
| [D20260527_005_feedback__shared_auth_public-status-api.md](./D20260527_005_feedback__shared_auth_public-status-api.md) | 2026-05-27 | /flow:feedback | public-status-api | D20260527-023〜025 | 完了 |
| [D20260527_004_tdd__shared_auth_public-status-api.md](./D20260527_004_tdd__shared_auth_public-status-api.md) | 2026-05-27 | /flow:tdd | public-status-api | (Phase A/B/C) | 完了 |
| [D20260527_003_revise__shared_auth_public-status-api.md](./D20260527_003_revise__shared_auth_public-status-api.md) | 2026-05-27 | /flow:revise | public-status-api | (4文書) | 完了 |
| [D20260527_002_resume_continuous.md](./D20260527_002_resume_continuous.md) | 2026-05-27 | /flow:auto | continuous | — | 完了(superseded) |
| [D20260527_001_revise__shared_providers_business-observability.md](./D20260527_001_revise__shared_providers_business-observability.md) | 2026-05-27 | /flow:revise | business-observability | (4文書) | 完了 |
| [D20260526_012_release_service-hub.md](./D20260526_012_release_service-hub.md) | 2026-05-26 | /flow:release | service-hub (deploy) | D20260526-060〜063 | 完了(deploy確定 D20260527-025) |
| [D20260526_011_fix__shared_auth_deploy-blockers.md](./D20260526_011_fix__shared_auth_deploy-blockers.md) | 2026-05-26 | /flow:fix | deploy-blockers | (GAP-1/2) | 完了 |
| [D20260526_010_release_service-hub.md](./D20260526_010_release_service-hub.md) | 2026-05-26 | /flow:release | service-hub | (Phase1 FILL) | 完了(blocker→fix委譲) |
| [D20260526_009_resume_continuous.md](./D20260526_009_resume_continuous.md) | 2026-05-26 | /flow:auto | continuous(再開4) | — | 完了(superseded) |
| [D20260526_008_resume_continuous.md](./D20260526_008_resume_continuous.md) | 2026-05-26 | /flow:auto | continuous(P4.7到達) | — | 完了(Release gate pause) |
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
| D20260528-032 | /flow:fix | 5 Whys 末段 = 根本原因 | A. 「フォーム async 完了 UX (4 状態) 観点が flow-suite テンプレに無い」 → flow-suite 補強 candidate を Postmortem §8 に予約 | auto-recommended | D20260528_017_fix_registry_admin-form.md |
| D20260528-031 | /flow:fix | Read スコープ | A. src/features/admin/* + api/admin/services.ts + src/db/queries.ts + src/db/schema.ts + src/providers/adapters.ts | auto-recommended | D20260528_017_fix_registry_admin-form.md |
| D20260528-030 | /flow:fix | 再現可否 (#3) | B. 再現困難 (実機 prod でのみ観測、unit test green) | auto-recommended | D20260528_017_fix_registry_admin-form.md |
| D20260528-029 | /flow:fix | severity 推定 | A. High (実機致命機能不全、Postmortem 必須) | auto-recommended | D20260528_017_fix_registry_admin-form.md |
| D20260528-028 | /flow:release | 4th deploy + favicon 本番反映確認 | A. /favicon.svg = image/svg+xml 200 + index.html link 配信確認 → 反映 OK | auto-recommended | D20260528_016_release_post-deploy.md |
| D20260528-027 | /flow:release | 3rd deploy + smoke + favicon 後続化 | A. 3rd deploy 結果 record、favicon は別 commit (c0818c9) で次回 deploy 反映 | auto-recommended | D20260528_016_release_post-deploy.md |
| D20260528-026 | /flow:tdd | Phase 軽重 + useFetch 拡張 | A. 両 Phase メイン直接 + useFetch.refetch 追加 (race-safe + 既存 caller 互換) | auto-recommended | D20260528_015_tdd_dashboard_nav-and-pull.md |
| D20260528-025 | /flow:revise | Phase 軽重 + 共通型配置 | A. 両 Phase 軽メイン + ForcePullState は src/features/dashboard/forcePull.ts 新設 | auto-recommended | D20260528_014_revise_dashboard_nav-and-pull.md |
| D20260528-024 | /flow:revise | Q3 force-pull スタイル | B. dashboard CSS 変数で控えめ section (admin より小ぶり) | auto-recommended | D20260528_014_revise_dashboard_nav-and-pull.md |
| D20260528-023 | /flow:revise | Q2 force-pull 配置 | B. summary 直下別ブロック (alert-banner と並列・独立) | auto-recommended | D20260528_014_revise_dashboard_nav-and-pull.md |
| D20260528-022 | /flow:revise | Q1 ServicesAdminView Props | A. 除去 (dead code 化、Page 同時更新で typecheck red 回避) | auto-recommended | D20260528_014_revise_dashboard_nav-and-pull.md |
| D20260528-021 | /flow:release | post-deploy 2nd + smoke | A. 全 gate 期待値通り → Release gate 通過扱い + D-010 セッション close | auto-recommended | D20260528_013_release_post-deploy.md |
| D20260528-020 | /flow:audit | §3.0c シューティング + 結果総括 | A. Low 2 件即 reconcile + Medium 1 件 (論点-005) は release Phase 1 まで pause | auto-recommended | D20260528_012_audit_standard.md |
| D20260528-019 | /flow:tdd | Phase 軽重 + View props 後方互換 | A. メイン直接 + Props オプショナル + ForcePullState 型を View export | auto-recommended | D20260528_011_tdd_collection_force-pull.md |
| D20260528-018 | /flow:tdd | Phase 軽重 + 設計微差分 | A. メイン直接 + formatter 分離 + lastRunStatus を null 許容に格上げ | auto-recommended | D20260528_010_tdd_collection_refresh-cadence.md |
| D20260528-017 | /flow:tdd | Phase 軽重 + styling 手段 | A. 全 Phase 軽メイン + inline style + CSS 変数 (Tailwind 未設定) | auto-recommended | D20260528_009_tdd_dashboard_admin-ux.md |
| D20260528-011 | /flow:revise | 共通鍵未設定時 | A. ヘッダなしで叩く | explicit-choice | D20260528_004_revise_providers_secret-zero.md |
| D20260528-010 | /flow:revise | MAU フォールバック | A. なし(service-info 自己申告のみ) | explicit-choice | D20260528_004_revise_providers_secret-zero.md |
| D20260528-009 | /flow:tdd | 全テスト + feedback | 176 passed / feedback skip(推奨提示) | auto-recommended | D20260528_003_tdd_registry_revise_db-sot.md |
| D20260528-008 | /flow:tdd | Phase 軽重判定 | 全 4 Phase メイン直接実装 | auto-recommended | D20260528_003_tdd_registry_revise_db-sot.md |
| D20260528-007 | /flow:revise | orchestration / command-feedback | 停止メニューは不適切（CF-20260528-001） | auto-recommended | D20260528_002_revise_registry_db-sot.md |
| D20260528-006 | /flow:revise | providers secretEnv sequencing | step 3 まで optional 残置（build green） | auto-recommended | D20260528_002_revise_registry_db-sot.md |
| D20260528-005 | /flow:revise | services.toml | 削除して DB 一本化 | explicit-choice | D20260528_002_revise_registry_db-sot.md |
| D20260528-004 | /flow:revise | 移行方式 | import 不要（未運用＝移行なし） | explicit-choice | D20260528_002_revise_registry_db-sot.md |
| D20260528-003 | /flow:revise | admin write 範囲 | A. 最小フォーム + Clerk ゲート内 API | explicit-choice | D20260528_002_revise_registry_db-sot.md |
| D20260528-002 | /flow:concept | 秘密ゼロ化 | Clerk MAU を service-info 自己申告 + service-info 秘密 共通1本 | explicit-choice | D20260528_001_concept_update_20260528.md |
| D20260528-001 | /flow:concept | レジストリ SoT/登録方式 | Neon services テーブル + Clerk ゲート内 admin write (公開POST/共通鍵 不採用、D-004 反転) | explicit-choice | D20260528_001_concept_update_20260528.md |
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
| [論点-005] | [SEC-003] @vercel/node devDep High CVE 6件（accepted-risk 推奨、本番ランタイム非搭載、ユーザー確認待ち） | D20260527_008 | D20260527-030 |
| [論点-DB1] | スナップショット保持期間・集約（無料枠 50% 到達時） | D20260526_006(db) | — |
| [論点-PR1] | Clerk 厳密 MAU 取得（Phase2、実トークン検証時） | D20260526_007(providers) | D20260526-025 |
| [論点-CO1] | collection 多重起動防止 + 実行時間（Vercel Hobby） | D20260526_007 | D20260526-028 |
| [論点-AL1] | アラート通知チャネル（Webhook/メール/画面内） | D20260526_007 | D20260526-031 |

## Superseded chain（旧 Open → 解決済）
| 旧 ID | 解決 | 解決日 | 解決セッション |
|---|---|---|---|
| [D20260526-004] (decision) | 🔄 レジストリ SoT = Git services.toml → **[D20260528-001] DB SoT + Clerk ゲート内 admin write** に反転（再デプロイ不要、公開POST/共通鍵 不採用）。メトリクス pull(D20260526-002) は維持 | 2026-05-28 | D20260528_001 |
| [論点-004] | ✅ [SEC-002] O24 入力検証 = 実装充足で closed（fetch.ts safeFetch: INTERNAL_HOST block+timeout+redirect:manual+scrubSecrets / registry Zod） | 2026-05-27 | D20260527_008 (D031) |
| [論点-002] | ✅ Vercel Hobby cron 日次のみ → vercel.json `0 0 * * *` で確定（案A daily） | 2026-05-26 | D20260526_012 (D061) |
| [論点-001] | ✅ providers SPEC §1.2 で段階導入方針確定（MVP=ping/Vercel/Neon/Clerk、free-tier% は thresholds 算出） | 2026-05-26 | D20260526_007 (D026) |
| [論点-003] | ✅ providers SPEC §1.3 で契約スキーマ確定（最小固定+extra）。波及(hana-memo retrofit/O48 具体化)は別 PJ | 2026-05-26 | D20260526_007 (D026) |
| [論点-T1] | ✅ types SPEC §1.2 に ServiceInfoResponse 追加 | 2026-05-26 | D20260526_007 (D026) |

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
