#!/usr/bin/env bash
# service-hub 本番デプロイ。
#
# 本番値は .env.production.local (専用・gitignore 済み・.env.local=dev とは別、CF-013) で管理。
# このスクリプトは sync-prod-env.sh で .env.production.local を Vercel 本番 env に同期してから
# vercel deploy --prod する。env だけ更新したい時は scripts/sync-prod-env.sh を単独実行。
#
# 初回:  cp .env.production.example .env.production.local  → 本番値を記入
# 使い方: ! bash scripts/deploy-prod.sh
set -euo pipefail
cd "$(dirname "$0")/.."

bash scripts/sync-prod-env.sh          # .env.production.local → Vercel 本番 env (同期)
exec vercel deploy --prod --yes        # 本番 env は上記同期で Vercel 側にある (inline -e/-b は使わない)
