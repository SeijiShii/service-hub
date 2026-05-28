/**
 * admin form の save 4 状態 (D20260528-029〜032、fix admin-form-bug-and-ux)。
 * Postmortem §8 (c)(d) で flow-suite に「フォーム async UX 4 状態」観点 OXX を
 * 新設提案予定。現状本 PJ 内のローカル参考実装。
 */
export type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "success" }
  | { kind: "error"; message: string };
