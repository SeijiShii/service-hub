# Postmortem: admin-form 編集保存 + UX 3 件 (High)

> **重大度**: High (#3 PATCH 編集が保存されないように見える) + Low 3 件併合
> **発生日**: 2026-05-28 (admin form 運用開始日と同日)
> **検知日**: 2026-05-28 13:25 (4th deploy 直後の実機確認時、ユーザー指摘)
> **対応完了日**: 2026-05-28 (本 fix セッション + 5th deploy で完了予定)
> **入力**: `./000_調査レポート.md`、`./001_ROOT_CAUSE.md`、`./002_FIX_PLAN.md`

---

## 1. 概要

admin form の **「編集 → 更新」操作で UI 反応が無く、ユーザーに「保存されない」と認識された**。実態としては PATCH は成功している可能性が高い (test green + SQL 正常) が、submit が `onSave(d)` を await せず即 form clear するため saving/success/error の UI フィードバックが完全に欠落していた。併せて endpoint/subdomain field の help 不足、「退役」wording の不自然さも同時指摘。

## 2. 時系列

| 時刻 (JST 2026-05-28) | イベント | 対応 |
|---|---|---|
| 12:45 | 2nd deploy 完了 (3 revise + 新 endpoint /api/admin/collect) | smoke green |
| 13:07 | nav-and-pull revise TDD 完了 (force-pull dashboard 移管 + back-link) | 196 unit green |
| 13:20 | 3rd deploy 完了 (nav-and-pull 反映) | smoke green、admin form 実機初運用 |
| 13:25 | 4th deploy 完了 (favicon) | smoke green |
| 13:25 直後 | **ユーザー実機確認で 4 件指摘** (中心 #3 編集保存問題) | `/flow:fix` dispatch |
| 13:30 (見込み) | 本 fix セッション完了 (4 文書 + Postmortem 生成) | — |
| 後続 (見込み) | /flow:tdd 実装 → 5th deploy → 実機再確認 | — |

## 3. 影響範囲

| 項目 | 内容 |
|---|---|
| 影響ユーザー数 | 1 (seiji、single user 内部ツール) |
| データ損失 | **おそらく無し** (PATCH 実体は成功している可能性高、5 Whys 仮説 1) |
| ダウンタイム | 無し (UI feedback 欠如のみ、機能自体は動作) |
| 売上 / SLA 影響 | 無し (内部ツール非公開) |
| セキュリティ影響 | 無し |

## 4. 検知の経緯

- **検知**: ユーザー直接実機確認 (4th deploy 直後)
- **検知遅延の原因**:
  - admin form は 2nd deploy で本番投入されたが、user 実機運用が 4th deploy まで遅延
  - 設計 (D-003〜007) + TDD (admin-ux Phase 2) + audit (HIGH-1 O55 / LOW-1 styling) のいずれも **async UX 観点を持っていなかった**ため、本番投入前に検知不能だった
  - Design gate (P4.4) は静的画面検査のみで対話的状態遷移を見ない

## 5. 対応の流れ

1. 検知 (ユーザー指摘 4 件)
2. 仮対応: 暫定回避策 = 「編集後にブラウザ reload して table で値確認」(000_調査レポート §6)
3. 根本修正:
   - submit 関数を async + await onSave + 戻り値 Promise<boolean> 連携
   - SaveState 型 (idle/saving/success/error) で 4 状態 UI フィードバック
   - 失敗時 form 保持・成功時のみ clear
   - 並行 UX 3 件 (endpoint placeholder、subdomain help、退役→削除)
   - 副: api/admin/services.ts に PATCH stderr ログ (実機調査の安全網)
4. 5th deploy (見込み) → 実機再確認 → 完了

## 6. 直接原因 + 根本原因

(`001_ROOT_CAUSE.md` §1-3 から引用)

**直接原因**:
- `src/features/admin/ServicesAdminView.tsx:118-135` の submit が `onSave(d)` を fire-and-forget で呼び、即 `setF({...empty})` + `setEditing(false)`。saving / success / error の UI 状態が無い。

**根本原因**:
- **「フォームの非同期完了 UX (idle/saving/success/error 4 状態)」が flow-suite の feature SPEC + UNIT_TEST テンプレに無い**。設計時に async ハンドラの 4 状態を強制的に洗い出す観点が欠如、admin form 初版で「fire-and-forget + 即時 clear」という UX-blind な実装が通過。後続 revise (admin-ux / force-pull / nav-and-pull) で submit に触れる契機が無く看過。

## 7. 学習事項

### 7.1 良かった点

- ユーザー実機確認で 4 件まとめて指摘 → `/flow:fix` で **1 セッション併合修正**が可能 (scope を膨らませず効率的)
- /flow:auto loop 内の `/flow:fix` dispatch が機能、bookkeeping (4th deploy AI_LOG) と並行で fix flow に着手
- 5 Whys が **「コードバグでなく観点欠落」**という根本原因まで掘れた → flow-suite 補強の動機が明確化

### 7.2 改善点

- **fix までの遅延**: 2nd deploy (12:45) → 4th deploy (13:25) の 40 分間、admin form の async UX 不具合が**未検知のまま prod に立ち上がっていた**。Design gate / E2E gate のいずれもインタラクティブ状態遷移を見ていない (本 PJ では E2E gate skip)。
- **観点欠落の構造的根因**: 「async ハンドラの 4 状態 UX」が perspectives.md に無い → 全 PJ で同じ抜けが発生し得る。

## 8. 再発防止策

| 対策 | 種別 | 担当 | 期限 |
|---|---|---|---|
| (a) 本 fix で SaveState 4 状態の参考実装を確立 (admin form) | テスト | Claude + seiji | 本 fix 完了時 (2026-05-28) |
| (b) ServicesAdminView.test.tsx に SAVE-N1〜SAVE-E1 + FORM-N1/N2 + WORD-N1 を追加 (regression test、6 件) | テスト | Claude + seiji | 本 fix 完了時 |
| (c) **[flow]** perspectives.md に「フォームの非同期完了 UX (idle/saving/success/error 4 状態)」観点 OXX を新設提案 — feature SPEC + UNIT_TEST テンプレに強制チェック項目化 | プロセス / SoT | seiji (flow-suite 反映は別 [flow] セッション) | 後追い (本 fix 完了後、別 [flow] 機会で) |
| (d) **[flow]** flow-suite の design.md or feature.md に「対話的状態遷移チェック」を追加 — Design gate でフォーム類は async UX 4 状態の表示確認まで含める | プロセス | seiji (flow-suite 反映は別 [flow] セッション) | 後追い |
| (e) api/admin/services.ts の stderr ログ追加 (PATCH 経路) — 実機調査の安全網として恒久化 | 監視 | Claude (本 fix 内) | 本 fix 完了時 |

## 9. タイムライン KPI

| 指標 | 値 |
|---|---|
| MTTD (Mean Time To Detect、本番投入 → 検知) | ~40 分 (2nd deploy 12:45 → 検知 13:25) |
| MTTR (Mean Time To Repair、検知 → 修正完了) | 見込み ~2 時間 (本 fix + tdd + 5th deploy で完了予定) |
| 影響期間 | ~2.5 時間 (admin form 本番投入 → 修正完了) |
| 影響ユーザー実害 | 0 (single user、データ実体は無事の可能性高) |

## 10. 関連リンク

- 設計起点 AI_LOG: D20260528_002_revise_registry_db-sot (D-003〜007)
- 改修 AI_LOG: D20260528_007/009 (admin-ux)、D20260528_014/015 (nav-and-pull)
- 4th deploy AI_LOG: D20260528_016 (D-028)
- 公開 URL: https://service-hub.givers.work/admin

## 11. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版 | /flow:fix |
