# 改修: 秘密ゼロ化（MAU 自己申告 + service-info 共通シークレット）

- **issue / slug**: secret-zero / mau-selfreport
- **実施日**: 2026-05-28
- **対象**: _shared/providers（../README.md）
- **改修要望**: concept §7 [D20260528-002] の providers 実装（step 3）。HUB のサービス固有シークレットを撤廃。Clerk MAU を service-info 自己申告に移し、service-info 認証を共通 1 本に統一、型/スキーマから secretEnv 撤去。step 2（registry DB 化）の後続。
- **設計判断**: Q1 MAU フォールバック=A（なし）/ Q2 共通鍵未設定時=A（ヘッダなしで叩く）
- **状態**: 設計完了 → 実装

## ドキュメント
- 001_REVISE_SPEC / 002_REVISE_PLAN / 003_REVISE_UNIT_TEST / 004_REVISE_E2E_TEST
- 101_REVISE_IMPL_REPORT / 102_REVISE_UNIT_TEST_REPORT（実装後）

## 関連
- concept §7 [D20260528-002] / perspectives O48(2026-05-28 改訂)
- 前段: registry の DB SoT 化（docs/registry/revise_db-sot_20260528_db-admin-write）
- 後続: hana-memo に service-info（mau 自己申告 + 共通鍵）retrofit（別リポ /flow:revise）
