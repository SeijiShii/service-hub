#!/usr/bin/env bash
# 本番 Neon DB に drizzle schema を push する (additive migration、例: services.summary 列)。
# DATABASE_URL を .env.production.local (gitignore 済、CF-013 で dev とは別) から読み、
# drizzle-kit push を本番 DB に対して実行する。
# ⚠️ Class B: 本番 DB スキーマを変更する。実行は明示承認後のみ。
set -euo pipefail
cd "$(dirname "$0")/.."

PROD=".env.production.local"
[ -f "$PROD" ] || { echo "❌ $PROD がありません (本番 DATABASE_URL の source)"; exit 1; }

DATABASE_URL="$(grep -E '^DATABASE_URL=' "$PROD" | head -1 | cut -d= -f2-)"
[ -n "$DATABASE_URL" ] || { echo "❌ DATABASE_URL が $PROD にありません"; exit 1; }
export DATABASE_URL

# 値は出さず host 部のみ表示 (秘密マスク)。
echo "→ 本番 Neon に drizzle-kit push 実行 (host=${DATABASE_URL#*@})"
npx drizzle-kit push
