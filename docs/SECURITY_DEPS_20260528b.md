# 依存ライブラリ脆弱性スキャン結果 (release-pre 2 段目、2026-05-28 20:12)

**スキャン日**: 2026-05-28 20:12 (+09:00)
**対象**: `package-lock.json` (npm)
**スキャナ**: `npm audit --json`
**dispatch 元**: /flow:auto continuous loop reiteration 8 (D-031 audit + D-032 scenario reconcile 後、release-pre 2 段目)

## 1. サマリ

- 総検出: **17 件** (Critical 0 / High 6 / Moderate 11 / Low 0)
- 直接依存 High: **1 件** (`@vercel/node`)、推移的 High: 5 件
- **新規 finding (前回 D-024 secure 比較)**: **0 件**
- 既存 SEC-003 (concept §8 [論点-005]): status=`open` 推奨=accepted-risk 継続、本回も維持
- release-blocking: **なし**

## 2. 検出内訳 (前回と同一)

### 2.1 High (6 件、すべて @vercel/node devDep chain)
| パッケージ | 直接/推移 | via | fix |
|---|---|---|---|
| `@vercel/node` | 直接 (devDep) | @vercel/build-utils + path-to-regexp + undici | @vercel/node@4.0.0 (SemVer Major) |
| `@vercel/build-utils` | 推移 | @vercel/python-analysis | 同上 |
| `@vercel/python-analysis` | 推移 | minimatch + smol-toml | 同上 |
| `path-to-regexp` | 推移 | (ReDoS) | 同上 |
| `undici` | 推移 | (RCE / SSRF related) | 同上 |
| `minimatch` | 推移 | (ReDoS) | 同上 |

### 2.2 Moderate (11 件、主に build tooling)
- `drizzle-kit` / `@esbuild-kit/*` / `esbuild` / `vite` / `@vitest/mocker` / `ajv` 等、いずれも devDep ビルドツール chain
- 本番ランタイム搭載なし、開発時 only

## 3. 既存 SEC-003 (concept §8 [論点-005]) 維持判定

**前回 D-024 secure (release-pre 1 段目、2026-05-28 17:30) との変化**:
- 検出件数: 同一 (Critical 0 / High 6 / Moderate 11)
- 新規 finding: 0 件
- @vercel/node 4.0.0 upgrade 状況: **upstream forward fix 依然未提供** (Vercel public roadmap 未動)

**accepted-risk 維持理由** (前回と同一):
1. **影響範囲**: devDep build-tooling chain のみ、本番ランタイム未搭載
2. **代替手段**: @vercel/node@4.0.0 への SemVer Major upgrade は **vercel dev / @vercel/node serverless runtime の breaking change** を伴う ((B) Class B、本 PJ は serverless function 5+ で active)
3. **forward fix**: Vercel 側で `path-to-regexp` / `undici` の patch を待つ方が安全
4. **検証期間**: 2026-05-26 (初検知 D-013) → 本回 (D-033、4 回連続検知) = 3 日間、状況変化なし

**Class C maintain 推奨**: 次回 `/flow:release` Phase 1 で「accepted-risk 確定」のユーザー明示判断窓を出す (毎回 audit/secure 4 回連続再提示の悪循環を 1 回で断つ)。

## 4. release-pre 2 段クリア判定

- ✅ 新規 SEC finding: 0 件
- ✅ Critical: 0 件
- ✅ release-blocking High: 0 件 (SEC-003 既存 accepted-risk maintain)
- ✅ **release-pre 必須監査 (CF-009) 2 段クリア完了** → P4.7 Release gate 評価可能 (8th deploy = timeseries-topchart 反映)

## 5. 次のステップ

1. `/flow:release` で 8th deploy:
   - Phase 1: SEC-003 accepted-risk ユーザー確認窓 + .env 充足確認
   - Phase 2: ローカル動作確認 (dashboard / chart section 「直近 30 日の推移」表示、軽め)
   - Phase 3: vercel deploy --prod (Class B 明示確認、db schema 変更なし = db:push 不要)
2. release 後リマインダ: bousai-bag-checker producer 連動 revise (CF-016)

## 6. 自動更新メカニズム (再掲)

- Dependabot 未設定 (本 PJ では active dev 中、手動制御方針)
- forward fix 監視: 次回 secure 通常スキャンで再評価
