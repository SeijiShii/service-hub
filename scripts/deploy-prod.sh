#!/usr/bin/env bash
# service-hub 本番デプロイヘルパー (暫定: .env.local の値を inline env として渡す)。
# 使い方: ! bash scripts/deploy-prod.sh
# TODO(恒久化): Vercel プロジェクトに本番 env を永続設定すれば `vercel deploy --prod` だけで済む。
#   特に Vercel Cron 認証用 CRON_SECRET は永続 env に入れないと scheduled cron が 401 になる。
set -euo pipefail
cd "$(dirname "$0")/.."

get() { grep -E "^$1=" .env.local | cut -d= -f2-; }

exec vercel deploy --prod --yes \
  -b VITE_CLERK_PUBLISHABLE_KEY="$(get VITE_CLERK_PUBLISHABLE_KEY)" \
  -e DATABASE_URL="$(get DATABASE_URL)" \
  -e CLERK_SECRET_KEY="$(get CLERK_SECRET_KEY)" \
  -e ALLOWED_USER_ID="$(get ALLOWED_USER_ID)" \
  -e CRON_SECRET="$(get CRON_SECRET)"
