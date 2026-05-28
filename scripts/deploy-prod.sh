#!/usr/bin/env bash
# service-hub 本番デプロイ。
#
# env 分離原則 (CF-20260527-013 / CF-20260528-002): **.env.local の本番値を inline しない**。
#   .env.local = dev/test 専用。production の live 値は deploy-target (Vercel) の
#   **永続 env (production scope)** に直接置き、ビルド/関数がそこから読む。
#
# 事前 (1 回だけ、値はその場で人間が貼る = Class C): 不足分を永続設定
#   ! vercel env add DATABASE_URL production
#   ! vercel env add CLERK_SECRET_KEY production
#   ! vercel env add ALLOWED_USER_ID production
#   ! vercel env add CRON_SECRET production            # 永続化必須 (cron 401 回避)
#   ! vercel env add VITE_CLERK_PUBLISHABLE_KEY production
#   ! vercel env add HUB_SERVICE_INFO_SECRET production # service-info 共通鍵 (hana-memo retrofit 後)
#   現状確認: ! vercel env ls production
#
# 使い方: ! bash scripts/deploy-prod.sh
set -euo pipefail
cd "$(dirname "$0")/.."

# 永続 env が揃っているか軽くチェック (値は表示しない)。
if command -v vercel >/dev/null 2>&1; then
  missing=""
  have="$(vercel env ls production 2>/dev/null || true)"
  for k in DATABASE_URL CLERK_SECRET_KEY ALLOWED_USER_ID CRON_SECRET VITE_CLERK_PUBLISHABLE_KEY; do
    grep -q "$k" <<<"$have" || missing="$missing $k"
  done
  if [ -n "$missing" ]; then
    echo "⚠️  Vercel 本番 env に未設定の可能性:$missing"
    echo "   各 KEY を ' ! vercel env add <KEY> production ' で設定してから再実行してください。"
    echo "   (.env.local の本番値 inline は廃止 — CF-013 / CF-20260528-002)"
    exit 1
  fi
fi

# 本番 env は Vercel 永続 env から供給される (inline -e/-b は使わない)。
exec vercel deploy --prod --yes
