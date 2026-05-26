import { StatusDot } from "../../components/StatusDot.js";
import { rowStatusKind } from "./rowStatus.js";
import type { ServiceRowVM } from "./summary.js";

const mono = { fontFamily: "ui-monospace, monospace", textAlign: "right" as const };
const fmt = (m?: { value: number; unit: string }) => (m ? `${m.value}` : "—");

export function ServiceRow({ row }: { row: ServiceRowVM }) {
  const kind = rowStatusKind(row);
  return (
    <tr data-status={kind} data-slug={row.slug}>
      <td><StatusDot kind={kind} label={`${row.slug} ${kind}`} /></td>
      <td style={{ fontFamily: "ui-monospace, monospace" }}>{row.slug}</td>
      <td style={mono}>{fmt(row.metrics.mau)}</td>
      <td style={mono}>{row.metrics.error_count ? row.metrics.error_count.value : "—"}</td>
      <td style={mono}>{row.openAlertCount || ""}</td>
    </tr>
  );
}
