# クレーム判定: collection エラーの診断粒度不足（http_404 のみで詳細不明）

- **claim id**: C20260601-001
- **実施日**: 2026-06-01
- **対象**: ../README.md （collection 機能フォルダ）
- **基準 SPEC**: ../001_collection_SPEC.md
- **クレーム内容**: collection の pull 結果で status="partial"、errors[] に `serviceSlug=bousai-bag-checker / provider=service-info / message=http_404` が返るが、どの URL に対する 404 か・なぜ 404 か・運用者が何をすべきかが分からない。
- **状態**: 判定完了（Won't Fix — service-hub 側）
- **判定結果**: 却下 (Won't Fix) — 真因=秘密不一致（運用、解消済み）。service-hub のコードは正しく動作。「本来 401」は producer (bousai-bag-checker) 側の責務（別 repo fix、任意）。
- **分岐先**: なし（service-hub の revise は取り下げ・フォルダ削除）。下流: 運用で秘密一致（済）+ bousai-bag-checker 401 化（別 repo）

## このフォルダに置くドキュメント

- `000_CLAIM_REPORT.md` — クレーム整理（期待 / 現実 / 文脈 / 影響 / 報告経路）
- `001_TRIAGE.md` — 判定レポート（種別判定 + 三項照合根拠 + 分岐先）

## 関連

- 過去類似 claim: なし（本 PJ 初の claim）
- 発生源コード: `src/providers/adapters.ts:37`（`throw new Error('http_'+status)`）, `src/features/collection/runner.ts:44-49`（error 集約）
- 分岐先候補（判定後追記）: ../revise_*/
