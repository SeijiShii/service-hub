#!/usr/bin/env bash
# service-hub 本番デプロイ。
#
# 本番値は **.env.production.local** (専用ファイル・gitignore 済み = .env*.local) で管理する。
#   Vite 規約: `.local` = 「git にコミットしない秘密」。環境は `production`。
#   .env.local (dev) とは別ファイル → dev/prod を混ぜない (CF-20260527-013 / CF-20260528-002)。
# このスクリプトが .env.production.local を読み、Vercel 本番 env (production scope) に同期してから
# デプロイする。= ファイルが本番値の単一 source、GUI への手入力コピペ (人為ミス源) を排除。
#
# 初回:  cp .env.production.example .env.production.local  → 本番値を記入
# 使い方: ! bash scripts/deploy-prod.sh
set -euo pipefail
cd "$(dirname "$0")/.."

PROD=".env.production.local"
[ -f "$PROD" ] || {
  echo "❌ $PROD がありません。"
  echo "   cp .env.production.example $PROD して本番値を記入してください。"
  exit 1
}
command -v vercel >/dev/null 2>&1 || { echo "❌ vercel CLI が必要です (npm i -g vercel)"; exit 1; }

# .env.production.local の各 KEY=VAL を Vercel 本番 env に同期 (rm→add で冪等・file が SoT)。
# 値は表示しない (秘密)。空値・コメント行はスキップ。
synced=0
while IFS= read -r line || [ -n "$line" ]; do
  line="${line%$'\r'}"
  case "$line" in
    ''|\#*) continue ;;            # 空行 / コメント
  esac
  key="${line%%=*}"
  val="${line#*=}"
  [ -z "$key" ] && continue
  [ -z "$val" ] && { echo "skip (空値): $key"; continue; }
  vercel env rm "$key" production -y >/dev/null 2>&1 || true
  printf '%s' "$val" | vercel env add "$key" production >/dev/null
  echo "synced: $key"
  synced=$((synced + 1))
done < "$PROD"
echo "→ $synced 件を Vercel(production) に同期しました"

# 本番 env は上記同期で Vercel 側に入っている。inline -e/-b は使わない (.env.local も読まない)。
exec vercel deploy --prod --yes
