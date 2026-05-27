# バグフィードバックレビュー: public-status-api

## レビュー日時
2026-05-27 (JST) / ラウンド 1

## レビュー対象
| ファイル | 操作 |
|---|---|
| `src/features/public-status/buildPublicStatus.ts` | 新規 |
| `api/public/status.ts` | 新規 |
| `src/auth/guard.ts` (isPublicPath) | 変更 |
| `src/lib/vercel.ts` (setHeader/end) | 変更 |

レビュー: 観点A (型/境界/ロジック) + 観点B (セキュリティ/エラー/性能) を並列実行 (公開・無認証エンドポイントのため漏洩・公開面リスク重点)。

## レビューサマリー
| 観点 | 指摘数 | CRITICAL | HIGH | MEDIUM | LOW |
|---|---|---|---|---|---|
| 型/境界/ロジック (A) | 3 | 0 | 0 | 3 | 0 |
| セキュリティ/エラー/性能 (B) | 5 | 0 | 0 | 2 | 3 |
| **合計** | **8** | **0** | **0** | **5** | **3** |

> **Critical/High は 0**。Agent B 評: 「fundamentally secure」。明示 DTO 投影による漏洩防止・サーバ側 JWT 検証・エラー詳細非開示・セマンティック status code を確認済 (no_issues)。

## 指摘 + 対応

### [FB1] up の値が 0/1 以外 (NaN/0.5) で "down" と誤表示 (観点A, MEDIUM) → 修正済
- 問題: `up === 1 ? "up" : "down"` だと想定外値が全て "down" に。公開ステータスでデータ異常を「障害」と誤表示する恐れ。
- 修正: `up===1→up / up===0→down / それ以外→unknown`。RED (PS-N2b) → GREEN。

### [FB2] lastCheckedAt が全メトリクスの最大時刻 (観点A, MEDIUM) → 修正済
- 問題: 「状態確認日時」なのに db_storage 等 up 以外のメトリクス時刻も採用。
- 修正: up メトリクスの capturedAt のみ採用。RED (PS-N2c) → GREEN。

### [FB3] catch がエラーを握り潰しログなし (観点B, LOW) → 修正済
- 修正: `console.error("public/status error:", e)` を catch に追加 (stderr のみ、client body には出さない=漏洩なし)。Vercel logs で運用追跡可。

### [FB4] 公開ルートの認証バイパス耐性テスト不足 (観点B, LOW) → 修正済
- 修正: PS-H6 追加 — `__session` cookie 付きでも同じ公開データを返す (真に public・ユーザー別にならない) を assert。

### [FB5] isPublicPath/isPublicCronPath が enforcement に未接続 (観点B, MEDIUM) → 文書化 (据え置き)
- 内容: gate は各 handler の requireSeiji で実施 (middleware なし)。isPublicPath は公開ルートの SoT + 将来 middleware 用。現状の全 gate 済 handler は正しく requireSeiji を呼んでおり**実害なし**。リスク=将来 handler が requireSeiji を忘れる。
- 対応: 据え置き (中央 middleware は Vercel 非 Next で fiddly + 別 revise 相当)。auth SPEC に「公開は /api/public/* と cron のみ、他は fail-close」を明記済。将来 [論点] として中央 enforcement を検討。

### [FB6] レート制限なし (観点B, MEDIUM) → 据え置き ([論点-PS2])
- MVP 許容 (低トラフィック + Cache 60s)。濫用が見えたら Upstash 等で追加。

### [FB7] CORS=* の env 制限余地 (観点B, LOW) → 据え置き ([論点-PS1])
- 公開安全データのため `*` で可。showcase ドメイン確定後に env 制限を検討。

### [FB8] 405/500 に明示 Content-Type なし (観点B, LOW) → 不対応
- Vercel が application/json を自動付与するため実害なし。

## 修正サマリー
| 項目 | 値 |
|---|---|
| 指摘 | 8 (Crit 0 / High 0 / Med 5 / Low 3) |
| 修正済み | 4 (FB1-4) |
| 据え置き (文書/論点) | 4 (FB5-8) |
| 追加テスト | 3 (PS-N2b/N2c/H6) |
| 全 unit | 153 passed (100%) |

## 手動動作確認 (Step 6-M)
判定: **不要**。BE のみ (公開 API)・UI なし・追加テストで指摘挙動を直接アサーション。実動作はデプロイ後 curl スモーク (PS-RE2) で確認。

## 関連 AI_LOG
- 実装: D20260527_004_tdd__shared_auth_public-status-api
- 本レビュー: D20260527_005_feedback__shared_auth_public-status-api
