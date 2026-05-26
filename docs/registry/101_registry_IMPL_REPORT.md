# registry 実装レポート (101)

**実装日**: 2026-05-26 / **コマンド**: /flow:tdd（Phase3 反復5）/ **状態**: 完了（GREEN）

## 実装ファイル（src/registry/）
| ファイル | 内容 |
|---|---|
| schema.ts | Zod: serviceDescriptorSchema / providerRefsSchema / servicesTomlSchema。slug 形式 / URL 公開(SSRF 抑止) / secretEnv 直書き検出 |
| load.ts | validateServicesToml(不正除外+errors集約) / loadServices(onlyActive) |
| index.ts | バレル |
| (root) services.toml | レジストリ SoT 初期版(hana-memo、env キー名のみ) |

## 設計反映 / セキュリティ
- 秘密直書き検出: `sk_/pk_/Bearer/JWT` パターンを secretEnv 値に検出→error（O25）。
- 内部 URL 禁止: url/endpoint の内部アドレスを reject（SSRF 予防 [論点-004]）。
- 不正 service は除外し errors に集約（全体は止めない）。TOML 壊れは throw。

## 検証
- `npm run test`: 52 passed（registry 8 + 既存 44）/ `npm run typecheck`: green。
