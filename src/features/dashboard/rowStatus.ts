import type { StatusKind } from "../../components/tokens.js";
import type { ServiceRowVM } from "./summary.js";

/** 行の総合状態を 1 つの StatusKind に集約 (down > over > warn > up > unknown)。 */
export function rowStatusKind(r: ServiceRowVM): StatusKind {
  if (r.up === false || r.freeTierState === "over") return "down";
  if (r.freeTierState === "warn") return "warn";
  if (r.up === true) return "up";
  return "unknown";
}
