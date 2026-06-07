# クレーム判定レポート

**claim id**: C20260607-001
**判定日**: 2026-06-07
**判定者**: Claude (opus-4-8) + seiji
**判定**: 仕様検討漏れ (revise)

## 1. 三項照合

クレームが提示した 3 つの確認要点に沿って照合した。結論を先に: **収集/契約層は汎用で
tip_* を既に受理・保存・VM 投影しており、表示層 (ServiceRow.tsx) のみが選択描画で tip 列を
持たない**。よって「汎用描画だから表示確認のみで close」には**該当せず**、表示追加 (revise) が必要。

### 1.1 期待 (Expected)
各サービス行に tip_total_yen(¥表記) と tip_count(件数) の累計が表示される。

### 1.2 既存仕様 (Spec)
- 契約型 `ServiceInfoResponse.metrics[]` (`src/types/service.ts:39`) は
  `Array<{ key: string; value: number; unit: string }>` — **key に enum 制約なし (既に汎用)**。
- メトリクスキー型 `MetricKey` (`src/types/metric.ts:22-23`) は
  `KnownMetricKey | (string & {})` の **open union** — Phase2 の metric 追加を破壊変更なく許容
  (型コメントに明記)。`tip_count` / `tip_total_yen` は `KnownMetricKey` に未列挙だが open union 側で
  既に受理される。
- dashboard SPEC (`../001_dashboard_SPEC.md`) および各 revise は、表示列を**既知ビジネスメトリクスの
  選択描画**として設計 (mau / 採算 / 離脱率 / error_count / アラート / last_deploy_at)。
  → **tip_count / tip_total_yen の表示は SPEC に未記載** (期待は SPEC 外)。
- 収集ポリシー (concept §6.1 / [D20260528-002]): 各サービスが service-info で自己申告した指標を
  HUB が pull。新 metric key は producer 主導で増える前提 (open union 設計の意図)。

### 1.3 現実 (Actual)
収集 → 保存 → VM → 表示 の各層を確認:

- **収集層 (汎用・問題なし)**: `src/providers/adapters.ts:222-229` の `createServiceInfoAdapter` は
  `j.metrics ?? []` を**全 key そのまま** `UsageMetric` に push (allowlist フィルタなし)。
  → tip_count/tip_total_yen は収集される。
- **保存層 (汎用・問題なし)**: `usage_snapshots` は `metricKey: MetricKey` (open) で任意キーを保存。
- **VM 層 (汎用・問題なし)**: `src/features/dashboard/summary.ts:200-201` の `buildDashboard` は
  `metrics[s.metricKey] = { value, unit }` で**全キーを generic に VM (`ServiceRowVM.metrics`) へ保持**
  (型は `Partial<Record<MetricKey, …>>`、コメント L221「新ビジネスメトリクスキーは generic に乗っている」)。
  → tip_* は VM に既に乗っている。
- **表示層 (選択描画・ここが漏れ)**: `src/features/dashboard/ServiceRow.tsx` は
  `row.metrics.mau` (L45) / 採算 (L46-55) / 離脱率 (L56-65) / `row.metrics.error_count` (L66-68) /
  openAlert (L69) / `row.metrics.last_deploy_at` (L71-73) を**個別に列描画**するのみで、
  **tip_count / tip_total_yen を参照する列が存在しない**。汎用ループで全 metric を描く実装ではない。

### 1.4 照合結果
- 確認要点1の答え: **選択描画** (既知キーのみ列描画)。汎用描画ではない。
- 確認要点2の答え: 契約型 `ServiceInfoResponse.metrics[]` / `MetricKey` は open で**変更必須ではない**。
  ただし typo 防止・自己文書化のため `KnownMetricKey` に `tip_count` / `tip_total_yen` を追記するのは
  **推奨 (任意・revise 内で実施可)**。
- 確認要点3の答え: **表示実装が必要** (各サービス行に tip_total_yen ¥表記 / tip_count を追加描画)。
- 三項関係: 期待 ≠ SPEC (SPEC に tip 表示の記載なし) / 現実 = SPEC 記載通り (選択描画として正しく動作)。
  → SPEC 外の妥当な期待 = **仕様検討漏れ (revise)**。バグ (fix) ではない (実装は現 SPEC 通り)。

## 2. 判定根拠

1. 期待 (tip 表示) は SPEC に未記載であり、現実 (tip 列なし) は SPEC 通りの選択描画として正しく
   動作している。「期待 ≠ SPEC かつ現実 = SPEC」は典型的な**仕様検討漏れ = revise**。fix ではない。
2. 該当機能 (dashboard) の SPEC 自体は存在するため feature ではない。既存ダッシュボードへの表示追加。
3. 収集・保存・VM は汎用設計で tip_* を既に保持しており、**表示層の追加のみで完結する軽量 revise**。
   データ移行・収集側変更は不要 (producer は申告済、HUB は蓄積済)。
4. 通貨は jpy 固定 (¥表記)、集計値のみで PII なし (O48 適合) — セキュリティ/プライバシー上の新規論点なし。
5. producer→consumer の cross-repo follow-up (CF-20260607-002) として計画的に起票された連携であり、
   producer 側 C20260607-001 の表示側を閉じる位置づけ。

## 3. 推奨分岐先

- **コマンド**: `/flow:revise`
- **引数**: `dashboard C20260607-001 --from-claim=C20260607-001`
- **想定変更範囲 (revise 側で確定)**:
  1. `src/features/dashboard/ServiceRow.tsx`: 各行に tip 列を追加。
     - `tip_total_yen` → ¥表記 (例 `¥100`、jpy 固定、`row.metrics.tip_total_yen?.value`)。未申告は `—`。
     - `tip_count` → 件数 (例 `1`、`row.metrics.tip_count?.value`)。未申告は `—`。
  2. dashboard テーブルヘッダ (列見出し) に「投げ銭」系の見出しを追加 (ServiceRow を含む表ヘッダ側)。
  3. (推奨・任意) `src/types/metric.ts` `KnownMetricKey` に `tip_count` / `tip_total_yen` を追記
     (typo 防止・自己文書化)。open union のため後方互換、破壊変更なし。
  4. (要検討) 上部 chart (`DASHBOARD_CHARTS`) への tip 系列追加は**今回スコープ外**を推奨
     (まず一覧表示で close、chart 化は別 revise)。revise 側で要否を確定。
  5. 単体テスト: `ServiceRow.test.tsx` / `summary.test.ts` に tip 列描画・未申告 `—` fallback を追加。
- **優先度**: medium (収益可視化の欠落だが、収集・保存は健全でデータ損失なし)。
- **i18n/コピー注意**: ¥ 接頭・「投げ銭」見出し等のユーザー向け文言は design-system ボイス & O38 準拠で
  revise 側のテキストレビューに乗せる。

## 4. 却下時の対応
（該当なし）

## 5. 判定保留時の論点
（該当なし）

## 6. 関連
- クレーム原文: `./000_CLAIM_REPORT.md`
- 基準 SPEC: `../001_dashboard_SPEC.md`
- 三項照合の発生源:
  - 汎用 (収集/VM): `src/providers/adapters.ts:222-229`, `src/features/dashboard/summary.ts:200-201`
  - 契約型 (open): `src/types/service.ts:35-44`, `src/types/metric.ts:4-23`
  - 表示漏れ (選択描画): `src/features/dashboard/ServiceRow.tsx:36-76`
- 起点 (producer): bousai-bag-checker fix/revise C20260607-001
- cross-repo follow-up: O48 / CF-20260607-002
- 分岐先サブフォルダ: `../revise_C20260607-001_20260607_tip-metrics-display/`
