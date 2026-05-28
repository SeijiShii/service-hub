#!/usr/bin/env bash
# .env.production.local の値を Vercel 本番 env (production scope) に同期する (デプロイはしない)。
# 「env だけ更新したい」時に使う独立スクリプト。deploy-prod.sh はデプロイ前にこれを呼ぶ。
#
# 本番値の単一 source = .env.production.local (.env.local=dev とは別ファイル、CF-013)。
# 各行 `KEY=VALUE` を読む。行頭 `#` 行・空行はスキップ。値の後ろのインラインコメント
# ( 空白+# ) は除去し前後空白を trim する (非 ASCII コメント混入による env 破損を防ぐ)。
# 空値のキーは Vercel から削除する (テンプレの未記入キーが garbage で残らないよう掃除)。
set -euo pipefail
cd "$(dirname "$0")/.."

PROD=".env.production.local"
[ -f "$PROD" ] || {
  echo "❌ $PROD がありません。cp .env.production.example $PROD して本番値を記入してください。"
  exit 1
}
command -v vercel >/dev/null 2>&1 || { echo "❌ vercel CLI が必要です (npm i -g vercel)"; exit 1; }

synced=0
while IFS= read -r line || [ -n "$line" ]; do
  line="${line%$'\r'}"
  case "$line" in '' | \#*) continue ;; esac   # 空行 / 行頭コメント
  key="$(printf '%s' "${line%%=*}" | tr -d '[:space:]')"
  [ -z "$key" ] && continue
  val="${line#*=}"
  # インライン comment ( 空白+# 以降 ) を除去し前後空白を trim
  val="$(printf '%s' "$val" | sed -E 's/[[:space:]]+#.*$//; s/^[[:space:]]+//; s/[[:space:]]+$//')"
  if [ -z "$val" ]; then
    vercel env rm "$key" production -y >/dev/null 2>&1 || true   # 空値は Vercel からも削除 (掃除)
    echo "skip/removed (空値): $key"
    continue
  fi
  vercel env rm "$key" production -y >/dev/null 2>&1 || true     # 冪等: 既存を消して
  printf '%s' "$val" | vercel env add "$key" production >/dev/null
  echo "synced: $key"
  synced=$((synced + 1))
done < "$PROD"
echo "→ $synced 件を Vercel(production) に同期しました"
