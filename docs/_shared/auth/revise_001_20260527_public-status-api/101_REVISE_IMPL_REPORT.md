# 実装レポート: public-status-api (revise)

## 実装日時
2026-05-27 (JST)

## モード
revise（_shared/auth）

## 関連ドキュメント
- 001_REVISE_SPEC.md / 002_REVISE_PLAN.md / 003_REVISE_UNIT_TEST.md / 004_REVISE_E2E_TEST.md
- AI_LOG: `../../../AI_LOG/D20260527_004_tdd__shared_auth_public-status-api.md`

## 変更一覧

### Phase 1: 投影ロジック
- `src/features/public-status/buildPublicStatus.ts`（新規）: `PublicServiceStatus` DTO + `buildPublicStatus(services, latest)`。active サービスのみ、最新 `up` メトリクスから up/down/unknown 判定、lastCheckedAt。**明示 DTO のみ構築（内部 VM を流用しない）**。
- `src/features/public-status/index.ts`（新規）: re-export。
- テスト 6（PS-N1〜N4 / **PS-S1 内部キー非漏洩** / B1）。

### Phase 2: 公開ハンドラ + 認可カーブアウト
- `src/auth/guard.ts`: `isPublicPath(path)`（`/api/public/*`）追加。cron と同列の唯一の公開例外。
- `src/lib/vercel.ts`: `VercelResponse` に `setHeader` / `end` を additive 追加（CORS/Cache/OPTIONS 用）。
- `api/public/status.ts`（新規）: 認証なし公開ハンドラ。CORS `*` + `Cache-Control: public, max-age=60`、OPTIONS 204、非 GET 405、GET は `buildPublicStatus` を返す（requireSeiji 不使用）。DB 失敗は 500（詳細非開示）。
- テスト: 結合 5（PS-H1 無認証 200 / **PS-H2 内部キー非漏洩** / H3 OPTIONS 204 / H4 CORS+Cache ヘッダ / H5 405）、guard 2（PS-G1〜G3）。

### Phase 3: 文書（認可カーブアウト明記）
- `001_auth_SPEC.md` §5.1/§5.2: 「全ルート保護」を「2 例外（`/api/cron/*`, `/api/public/*`）以外」に更新 + 公開ルート注記（安全サブセットのみ・唯一例外・新ルートを安易に足さない）。

## 実装計画からの差分
| 項目 | 内容 |
|---|---|
| 計画にない追加 | `vercel.ts` に setHeader/end を追加（CORS/OPTIONS に必須、最小型に無かった）。type のみで挙動は Vercel 供給 |
| 省略 | なし |
| 想定外 | なし（テストフィクスチャの `...over` 漏れを 1 回修正） |

## PR Description
### タイトル
public-status-api: 公開ステータス API（安全サブセット・無認証）を追加
### 概要
別サービスの公開ショーケースが消費するリアルタイム稼働一覧 API。全ルート Clerk gate の唯一の公開例外で、収益/コスト/利用数/トークン等の内部指標は構造的に非公開。
### 変更内容
- `GET /api/public/status`（無認証・CORS・Cache）+ `buildPublicStatus` 安全投影 + `isPublicPath` カーブアウト + auth SPEC 明記。
### テスト
- 新規 13（buildPublicStatus 6 / handler 5 / guard 2）。全 150 unit green / typecheck / build green。内部キー非漏洩（PS-S1/PS-H2）を含む。
