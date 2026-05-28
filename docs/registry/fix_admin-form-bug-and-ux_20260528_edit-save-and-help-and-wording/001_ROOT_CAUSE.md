# 根本原因分析: admin-form 編集保存 + UX 3 件

> **入力**: `./000_調査レポート.md`、Step 2 で読んだ src/features/admin/* + api/admin/services.ts + src/db/queries.ts
> **最終更新**: 2026-05-28

---

## 1. 5 Whys (中心 = #3 PATCH 編集が保存されないように見える)

| # | 問い | 答え |
|---|---|---|
| Why 1 | なぜユーザーは「保存されない」と認識するか? | 「更新」ボタン押下 → フォームが空になる以外の UI 反応が無い。「保存しました」表示も、saving spinner も無い。table 上の値の更新も認知遅延 (~500ms) のうえ table を凝視しない限り気づかない |
| Why 2 | なぜ UI 反応が無いか? | `ServicesAdminView.tsx submit()` が `onSave(d)` を **fire-and-forget (await なし)** で呼び、その直後に `setF({...empty})` + `setEditing(false)` で**即時フォームクリア**している。saving 状態を View が持たず Page にも UI 反映用 state が無い |
| Why 3 | なぜ submit が async 完了を待たず即 clear するか? | 初版 (registry admin write、D-003〜007) の最小 form 設計で「同期完了の前提」で UI を組んだため。async fetch + UI feedback の必要性が SPEC の UC §7.1 / UNIT_TEST §1 に明文化されていなかった |
| Why 4 | なぜ明文化されなかったか? | admin form は「seiji 1 人が新サービス登録時に 1 回触る程度」の想定で、UX の細かさ (saving / 成功 / 失敗) は **MVP scope 外** として暗黙省略。tdd でも `onSave` 呼び出しの存在のみテスト (AF-2)、async UX は test 化されず |
| Why 5 | **【根本原因】** なぜそれが見落とされたか? | **「フォームの非同期完了 UX 観点」が flow-suite の perspectives / feature SPEC テンプレに無い**。設計時に async ハンドラの完了状態 (idle / saving / success / error) を 4 状態として強制的に洗い出す観点が無く、design gate (P4.4) も静的画面検査のみで対話的状態遷移を見ない |

**根本原因**: **submit の async UX を 4 状態で扱う観点が flow 設計テンプレに欠落**していたため、admin form の初版で「fire-and-forget + 即時 clear」という UX-blind な実装が通り、後続 revise (admin-ux styling / force-pull / nav-and-pull) でも同じ submit ハンドラに触れる契機が無く看過された。

## 2. 直接原因 (コード位置)

| ファイル | 行 | 問題箇所 |
|---|---|---|
| `src/features/admin/ServicesAdminView.tsx` | 118-135 (submit 関数) | `onSave(d)` を await せず即 `setF({...empty})` + `setEditing(false)` で form clear。saving / success / error の UI 状態が無い |
| `src/features/admin/ServicesAdminPage.tsx` | 27-46 (onSave) | PATCH 成功時に user に見える feedback 無し。失敗時 `setError("save_failed_<status>")` は Page top 表示で form 切り替えに埋もれる |
| `src/features/admin/ServicesAdminView.tsx` | 170 (退役 button) | label 「退役」が日本語として不自然 (#4) |
| `src/features/admin/ServicesAdminView.tsx` | 263-269 (endpoint input) | placeholder/help text 無し → full URL か path か不明 (#1) |
| `src/features/admin/ServicesAdminView.tsx` | 217-223 (subdomain input) | placeholder/help text 無し + そもそも**未 wire の dead field** (#2、grep 確認: business logic から参照ゼロ) |

## 3. 根本原因

(§1 Why 5 参照)

**「フォームの非同期完了 UX (idle/saving/success/error 4 状態)」が flow-suite の feature SPEC + UNIT_TEST テンプレに無い**。admin form 初版設計時に観点不在のため、submit ハンドラを「同期前提」で組んでしまった。subsequent revise (admin-ux / force-pull / nav-and-pull) は別 scope だったため看過。

## 4. 寄与要因

| 種別 | 内容 |
|---|---|
| テスト不足 | AF-2 が `onSave` の呼び出しのみ検証、async 後の UI 状態 (success/error) は未検証。MockServiceWorker 等での fetch round-trip テストも未導入 |
| レビュー漏れ | spec-review 機構 (P3.7) が**実装後の UX 反応**まで見ない (SPEC 整合性中心) |
| ドキュメント不足 | concept §1.1 admin UC が「サービス登録 / 編集 / 退役」と粒度粗く、async UX 要件未記述 |
| 運用ミス | なし (デプロイ自体は成功、本番反映済) |
| 外部要因 | なし |

#1 #2 #4 寄与:
- #1: providers SPEC で endpoint=full URL は確定済だが、admin form 側の UC §7 で input help を要求していなかった
- #2: registry SPEC §1.3.1 entity 定義 (slug/name/url/subdomain/status) で subdomain を列挙したが、用途を未定義のまま admin form に exposed
- #4: D-001 reverse 時に「retired」を直訳の「退役」と命名、日本語チェック観点無し

## 5. 仮説と検証

| 仮説 | 検証方法 | 結果 |
|---|---|---|
| 1: PATCH は実体上成功している (UI feedback gap) | a) サーバ logs (Vercel function logs) で PATCH 200 確認 / b) browser network tab で 200 確認 / c) DB を直接覗いて updated_at が動いているか確認 / d) reload 後に編集後の値が table 表示されているか | **コードレビュー + test green から「成功している可能性高」**。実機での確証は次回 user 操作時に取得 (debug log を一時追加して安全網) |
| 2: PATCH 失敗時の error 表示が見落とされる | error 表示位置と form 切り替えの視覚干渉を inspect | **目視で問題あり** (form 即時 clear で error が読まれない) |
| 3: endpoint が path 入力されると 500 等で fail | adapter `getJson(ref.endpoint)` を path で呼ぶと URL parse error or invalid URL fetch | **path 入力時は fetch 失敗** (providers コード上から確認、Node.js fetch は relative path 受け付けない) |
| 4: subdomain は dead field | `grep "\.subdomain\b" src/` で business logic 参照を探す | **参照ゼロ** (schema/queries/admin form のみ) |
| 5: 「退役」の wording 問題 | 「退役」を Google 翻訳 / 国語辞書 / 一般 SaaS UI 比較 | **「退役」は軍事用語、UI 文脈で不自然**。「削除」が標準 (Notion/Slack/Linear 等他サービスも「Delete」直訳の「削除」) |

## 6. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-05-28 | 初版 | /flow:fix |
