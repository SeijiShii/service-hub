import { STATUS_COLOR, STATUS_SHAPE, type StatusKind } from "./tokens.js";

/** 状態ドット: 色 + 形状(色覚非依存) + aria-label。 */
export function StatusDot({ kind, label }: { kind: StatusKind; label?: string }) {
  return (
    <span
      role="img"
      aria-label={label ?? kind}
      data-status={kind}
      style={{ color: STATUS_COLOR[kind], fontFamily: "ui-monospace, monospace" }}
    >
      {STATUS_SHAPE[kind]}
    </span>
  );
}
