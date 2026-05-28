# _shared/types マイグレーション計画（favicon-projection）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`
> **最終更新**: 2026-05-28

---

## 1. 移行対象

| 対象 | 種別 | 変更内容 |
|---|---|---|
| `services` テーブル | DB schema | `icon_url text` カラム追加 (nullable、default NULL) |
| (既存データ) | データ | 変更なし — 既存行の icon_url は NULL でデフォルト挿入 |

## 2. 移行手順

### Step 1: drizzle migration ファイル生成
- **内容**:
  - `src/db/schema.ts` に `iconUrl: text("icon_url")` 追加後、`scripts/with-env.sh drizzle-kit generate` で `drizzle/<NNNN>_<auto_name>.sql` を生成
  - 生成 SQL を目視確認: `ALTER TABLE "services" ADD COLUMN "icon_url" text;` のみであること (他テーブル変更が紛れ込まないこと)
- **検証**:
  ```bash
  $ cat drizzle/<NNNN>_*.sql
  # 期待: ALTER TABLE "services" ADD COLUMN "icon_url" text; のみ
  ```
- **想定所要時間**: 1 分

### Step 2: DEV 環境で migration apply (動作確認)
- **内容**:
  - DEV (devbranch、もしあれば) または preview deploy で `scripts/with-env.sh drizzle-kit migrate` 実行
  - 既存 services 行が完全保持されていることを確認
- **検証**:
  ```bash
  $ scripts/with-env.sh psql -c "\d services"
  # 期待: icon_url | text |  | |  (nullable, default NULL)
  $ scripts/with-env.sh psql -c "select slug, icon_url from services"
  # 期待: 全行 icon_url = NULL
  ```
- **想定所要時間**: 2 分

### Step 3: 本番 (Neon main branch) で migration apply
- **内容**:
  - 本番 DB に migration 適用 (`scripts/with-env.sh drizzle-kit migrate` を production env で実行 — `release.md` の標準フロー §3 参照)
  - 既存 services テーブルにロックがかかる時間は ms オーダー (`ADD COLUMN` で default NULL は metadata-only operation、PostgreSQL 11+ で fast path)
- **検証**:
  ```bash
  $ scripts/with-env.sh psql -c "\d services"  # production
  # 期待: icon_url 列存在
  ```
- **想定所要時間**: < 1 分 (本番 apply)

### Step 4: 本番デプロイ後の動作確認
- **内容**:
  - `curl https://service-hub-lake.vercel.app/api/public/status` でレスポンス取得
  - 既存サービス (hana-memo) のレコードに iconUrl キーがないこと (NULL → optional 投影で undefined → JSON 非含有) を確認
- **検証**:
  ```bash
  $ curl -sL https://service-hub-lake.vercel.app/api/public/status | jq '.[0] | keys'
  # 期待: ["lastCheckedAt","name","slug","status","url"] (iconUrl 無し、producer 未対応のため)
  ```
- **想定所要時間**: 1 分

### Step 5: 連動 PJ bousai-bag-checker 側 revise + deploy 後の確認
- **前提**: bousai-bag-checker 側で同 slug `favicon-projection` の revise + tdd + deploy 完了済 (本セッション後の別作業)
- **内容**:
  - 翌日 cron collect 実行後、`services.icon_url` が更新されていることを確認
  - 公開 API レスポンスに iconUrl が含まれていることを確認
- **検証**:
  ```bash
  $ scripts/with-env.sh psql -c "select slug, icon_url from services where slug='bousai-bag-checker'"
  # 期待: icon_url = 'https://bousai-bag-checker.givers.work/favicon.svg' (実値は producer 側設定値)
  $ curl -sL https://service-hub-lake.vercel.app/api/public/status | jq '.[] | select(.slug=="bousai-bag-checker")'
  # 期待: iconUrl: 'https://...' 含む
  ```
- **想定所要時間**: 5 分

## 3. ロールバック手順

| 元 Step | 逆操作 | 検証 |
|---|---|---|
| Step 3 (本番 migration apply) | rollback migration: `ALTER TABLE services DROP COLUMN icon_url;` を手動 SQL or rollback migration ファイル経由で適用 | `\d services` で icon_url 列消失確認、既存行データ完全保持確認 |
| Step 1 (schema.ts 変更) | git revert で `src/db/schema.ts` を変更前に戻す + drizzle migration ファイル削除 | `git diff` で差分なし確認 |
| (アプリコード) | git revert で `src/types/service.ts` / `src/providers/adapters.ts` / `src/features/public-status/buildPublicStatus.ts` 等の変更を戻す | `npm run build` green、`npm test` green |

**ロールバック完了後の状態**: 改修前と完全に同じ (公開 API レスポンスから iconUrl キー消失、producer からの iconUrl 申告は受信するが破棄)。

**データ消失リスク**: `DROP COLUMN icon_url` で保存済 URL は失われるが、producer 側が依然 v2 で iconUrl を返している限り、次回 cron collect で再取得可能 → **永続的損失なし**。

## 4. ダウンタイム

- **要否**: **不要** (オンライン migration)
- **理由**: PostgreSQL 11+ で `ADD COLUMN <name> <type>` (no default または default NULL) は metadata-only operation、テーブルロックは ms オーダー、書き込みブロックなし
- **本番影響**: なし (Neon の `services` テーブルへのアクセスは中断なし)

## 5. 失敗時の対応

| 失敗箇所 | 対応 | 連絡先 |
|---|---|---|
| Step 2 DEV migration 失敗 | ローカル `pglite` で migration apply を試行、SQL 確認 | seiji |
| Step 3 本番 migration 失敗 | rollback (§3) で即時撤退、原因調査 (Neon console で error log 確認) | seiji |
| Step 4 公開 API が 500 を返す | アプリコード rollback (vercel deploy revert) + DB migration は維持 (cascade で型不整合発生時のみ rollback) | seiji |
| Step 5 producer 連携で iconUrl 更新されない | bousai-bag-checker 側 revise の deploy 確認 → cron 手動 trigger で再収集 → DB 直接 query で確認 | seiji |
| format check で全 producer の iconUrl が拒否される | adapters.ts の publicUrl 相当ロジックの実装誤り疑い → unit test で再現 → 修正 deploy | seiji |

## 6. 事前準備

- **バックアップ**: Neon は PITR (Point-in-Time Recovery、Launch plan で 7 日) で自動バックアップ。migration apply 前に明示的 snapshot 取得は不要 (rollback 容易性のため)
- **ステージング検証**: 本番 deploy 前に preview deploy (feature/* branch の Vercel auto preview) で動作確認推奨
- **関係者通知**: 不要 (additive 後方互換、公開 API consumer も optional フィールド許容)
- **連動 PJ リマインダ**: 本セッション完了サマリで bousai-bag-checker 側 revise 必要性を明示、ユーザー手動 dispatch

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版作成 (icon_url カラム追加 + オンライン migration + rollback 手順 + 連動 PJ 確認手順) | /flow:revise |
