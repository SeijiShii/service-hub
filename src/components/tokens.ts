/** design-system (コックピット/dark) の状態色トークン。 */
export const STATUS_COLOR = {
  up: "var(--status-up, #34d399)",
  warn: "var(--status-warn, #fbbf24)",
  down: "var(--status-down, #f87171)",
  unknown: "var(--status-unknown, #6b7280)",
} as const;

export type StatusKind = keyof typeof STATUS_COLOR;

/** 状態を色覚非依存の形状記号でも区別 (design-system §1 原則1)。 */
export const STATUS_SHAPE: Record<StatusKind, string> = {
  up: "●", warn: "▲", down: "■", unknown: "○",
};
