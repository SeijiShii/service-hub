# 実装レポート: collection force-pull (admin button)

## 実装日時
2026-05-28 12:21 (JST)

## モード
revise

## 関連ドキュメント
- 001_REVISE_SPEC / 002_REVISE_PLAN / 003_REVISE_UNIT_TEST / 004_REVISE_E2E_TEST
- [AI_LOG](../../AI_LOG/D20260528_011_tdd_collection_force-pull.md)

## 変更一覧

### Phase 1: backend エンドポイント (commit fe7c71f)
- `api/admin/collect.ts` (新規): `requireSeiji` + `runCollection` 配線。`api/cron/collect.ts` と同形 deps、auth だけ Clerk へ差し替え。POST 以外は 405、runner throw は 500 generic。
- `api/admin/collect.test.ts` (新規): FP-N1/N2/E1/E2/E3/B1 = 5 件。`vi.hoisted` で auth 切替 + `runCalls` カウント + `runImpl` 差し替えで例外パス検証。
- `api/cron/collect.ts` 無変更 (Vercel Cron 互換維持)。

### Phase 2: frontend ボタン (commit debfb39)
- `src/features/admin/ServicesAdminView.tsx`:
  - Props 拡張: `onForcePull?` / `forcePullState?: ForcePullState` (オプショナル、既存呼び出しに後方互換)
  - 新セクション `<section data-section="force-pull">`: ボタン (実行中…/disabled) + 直近結果サマリ + エラー表示
  - 既存 admin form / table は無変更
- `src/features/admin/ServicesAdminPage.tsx`: `useState<ForcePullState>` + `onForcePull` callback (`POST /api/admin/collect` を `credentials:include` で叩き、結果を state に格納)
- `src/features/admin/ServicesAdminView.test.tsx`: FP-N3 (click 呼び出し) + FP-N4 (サマリ表示) + FP-E4 (running disabled + click 抑止)

## 実装計画からの差分

| 項目 | 内容 |
|------|------|
| 計画外の追加 | `ForcePullState` 型を View からエクスポート (Page 側で再利用、PLAN は inline 想定だったが型集約の方が安全)。Props を**オプショナル**にし、既存テスト (`onForcePull` 非渡し) も破壊しない設計に。 |
| 計画から省略 | なし |
| 想定外 | なし。既存 AF-1〜4 + UX-N3 + admin/services テストは無変更で全 green。 |

## PR Description

### タイトル
collection force-pull: admin 「今すぐ pull」ボタン + 新 Clerk ゲート内 collect endpoint

### 概要
Vercel Cron (日次 00:00 UTC) を待たずに seiji が `/admin` から即時収集できるよう、Clerk ゲート内 `POST /api/admin/collect` + UI ボタンを追加。cron 経路は不変。

### 変更内容
- 新エンドポイント `api/admin/collect.ts` (Clerk + runCollection 再利用)
- View に「今すぐ pull」セクション (running disabled / 結果サマリ / エラー)
- Page に fetch 配線 + state 管理

### テスト
- 新規: backend 5 + frontend 3 = 8 件
- 全スイート: 194 passed / typecheck clean
