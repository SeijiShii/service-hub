import type { CollectionRun } from "../../types/index.js";

/**
 * 「今すぐ pull」操作の UI state (D20260528-022/025、nav-and-pull revise)。
 * dashboard `/` ヘッダ内 force-pull section が参照。
 * - running: true → ボタン disabled + 「実行中…」表記
 * - lastResult: 直近実行結果 (件数 / errors を summary 表示)
 * - error: fetch 失敗時のメッセージ
 */
export interface ForcePullState {
  running?: boolean;
  lastResult?: CollectionRun;
  error?: string;
}
