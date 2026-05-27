# AI_LOG セッション D20260528_002 — /flow:revise (registry)

**実行日時**: 2026-05-28 (+09:00)
**コマンド**: /flow:revise
**対象**: registry（レジストリ SoT を Git services.toml → Neon services テーブル + Clerk ゲート内 admin write）
**実行者**: Claude (Opus 4.7) + seiji
**状態**: 設計完了（実装は /flow:tdd で別途）
**含まれる decision**: D20260528-003 〜 D20260528-006 (4 件)
**ファイル**: `D20260528_002_revise_registry_db-sot.md`

---

## 主要決定サマリ

| ID | テーマ | 採用 | type |
|---|---|---|---|
| D20260528-003 | admin write 実装範囲 | A. 最小 admin フォーム + Clerk ゲート内 API（API のみ案は却下） | explicit-choice |
| D20260528-004 | 移行方式 | import スクリプト不要（未運用＝データ移行なし） | explicit-choice |
| D20260528-005 | services.toml の扱い | 削除して DB 一本化 | explicit-choice |
| D20260528-006 | providers secretEnv の撤去タイミング | 本 revise では optional 残置、step 3（providers ①）で撤去（build green 維持） | auto-recommended |

## 依存関係
- 全 decision → depends_on: [D20260528-001, D20260528-002]（concept の DB SoT + 秘密ゼロ化）。
- D20260528-006 → 関連: adapters.ts:119-142（clerk.secretEnv / serviceInfo.secretEnv 消費）。step 3 で撤去。
- 元 feature: D20260526-004(registry SoT, superseded) / registry SPEC。

## Read スコープ（確定）
src/registry/{load,schema,index}.ts, src/db/{schema,client,queries,index}.ts, api/cron/collect.ts, api/public/status.ts, src/features/collection/runner.ts, src/providers/adapters.ts(secretEnv 消費確認), src/types/service.ts, vercel.json, package.json。Read は --auto 相当でユーザーブリーフに含まれていたため追加確認なしで実施。

## 生成・更新したアーティファクト
- 新規: revise_db-sot_20260528_db-admin-write/{README, 001_REVISE_SPEC, 002_REVISE_PLAN, 003_REVISE_UNIT_TEST, 004_REVISE_E2E_TEST, INDEX}.md
- 更新: docs/registry/INDEX.md（サブフォルダ行）, docs/INDEX.md（registry 改修件数 +1）, 本 AI_LOG + INDEX
- 005_MIGRATION: 不要（未運用・データ移行なし、PLAN §4 に集約）

## 設計の要点
- services テーブル: slug PK + name/url/subdomain/status + providers/service_info/thresholds(jsonb) + timestamps。
- loadServices: sync(toml) → async(DB)。波及: runner.RunnerDeps.loadServices を Promise 化、collect.ts / public/status.ts を await 化。
- admin: api/admin/services.ts（Clerk 認証必須・public 例外にしない）POST/PATCH/DELETE + serviceDescriptorSchema 検証（SSRF/秘密/slug）+ slug 一意。最小フォームをダッシュボード Clerk ゲート内に。
- validateServicesToml 廃止、services.toml 削除、vercel.json includeFiles から除去。@iarna/toml は pricing が使うため残置。
- 削除既定 = retire（論理）、API で hard 可。

## 学習・改善
- なし（コマンド自己学習トリガーなし）。ユーザー feedback「質問は1文字で答えられる選択肢に」はグローバル運用 feedback として記憶（service-hub/memory）に保存。

---

## Decisions

```yaml
- id: D20260528-003
  timestamp: 2026-05-28T00:00:00+09:00
  command: /flow:revise
  phase: Step 3 / admin write 実装範囲
  question: サービス登録/編集をどこまで作るか
  options:
    - A. 最小 admin フォーム + Clerk ゲート内 API (recommended)
    - B. API のみ（フォームなし、curl/スクリプト運用）
  recommended: A
  chosen: A
  chosen_type: explicit-choice
  depends_on: [D20260528-001]
  context: |
    「HUB 画面から1件追加」という concept 決定を素直に満たすため最小フォーム + Clerk ゲート内 API を採用。
    公開穴なし、単一ユーザーに必要十分。

- id: D20260528-004
  timestamp: 2026-05-28T00:00:00+09:00
  command: /flow:revise
  phase: Step 3 / 移行方式
  question: services.toml(hana-memo 1件) を DB にどう移すか
  options:
    - A. 冪等 import スクリプト (recommended)
    - B. admin フォームから手動再入力
    - (実際の回答) 移行不要
  recommended: A
  chosen: 移行スクリプト不要（未運用ゆえデータ移行なし）
  chosen_type: explicit-choice
  depends_on: [D20260528-001]
  context: |
    seiji「移行スクリプトは必要ない。まだ運用していない」。未運用でレジストリに実データがないため
    データ移行・import スクリプト・005_MIGRATION は不要。hana-memo は運用開始時に admin フォームで登録。

- id: D20260528-005
  timestamp: 2026-05-28T00:00:00+09:00
  command: /flow:revise
  phase: Step 3 / services.toml の扱い
  question: services.toml を移行後どうするか
  options:
    - A. 削除して DB 一本化 (recommended)
    - B. ローカル seed として残す
  recommended: A
  chosen: A
  chosen_type: explicit-choice
  depends_on: [D20260528-004]
  context: |
    未運用・移行なしのため退役の障害がなく、SoT 二重化(toml と DB)を残さないのが最もシンプルで drift も防げる。
    services.toml + toml ローダ + vercel.json includeFiles 参照を撤去。@iarna/toml は pricing が使うため残置。

- id: D20260528-006
  timestamp: 2026-05-28T00:00:00+09:00
  command: /flow:revise
  phase: Step 4 / providers secretEnv の sequencing
  question: clerk.secretEnv / serviceInfo.secretEnv を本 revise で撤去するか
  options:
    - A. step 3 まで optional 残置（build green 維持） (recommended)
    - B. 本 revise で即撤去
  recommended: A
  chosen: A
  chosen_type: auto-recommended
  depends_on: [D20260528-002]
  context: |
    adapters.ts:119-142 が clerk.secretEnv(MAU)/serviceInfo.secretEnv を消費。即撤去すると providers がビルド不能。
    step 3(① MAU を service-info 自己申告 + 共通鍵)で adapters を切替えてから撤去するのが安全。本 revise は schema/types に
    optional 残置、admin フォームは収集しない（秘密ゼロ化の実体は満たす）。

- id: D20260528-007
  timestamp: 2026-05-28T00:00:00+09:00
  command: /flow:revise
  phase: orchestration / command-feedback
  question: registry 設計完了後に「A/B/C(C=一旦止める)」の停止オプション付きメニューを出したのは適切か
  options:
    - 不適切（Class A 継続を停止選択肢化＝人為的 pause の捏造）
    - 適切
  recommended: 不適切
  chosen: 不適切
  chosen_type: auto-recommended
  type: command-feedback
  depends_on: []
  context: |
    ユーザー [flow] 指摘「ここで停止するのは適切か」。command-feedback-loop §0.5 (即時適用パス) に従い
    triage=(b) flow コマンド表現不足と判定。CF-20260528-001 を inbox に捕捉し、resume-contract §0.1.1 を
    その場で新設 (Class A 継続は提示して進める/停止を選択肢に並べない)。flow-suite 編集は Class B のため
    commit はユーザー確認待ち。本 PJ では停止せず次の Class A (registry 実装) へ進む。
```
