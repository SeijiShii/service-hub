import { StatusDot } from "../../components/StatusDot.js";
import { ServiceIcon } from "../../components/ServiceIcon.js";
import {
  STATUS_COLOR,
  STATUS_SHAPE,
  type StatusKind,
} from "../../components/tokens.js";
import { rowStatusKind } from "./rowStatus.js";
import { formatDeployAt } from "./deployAtFormat.js";
import type { ProfitState } from "./profitability.js";
import type { ServiceRowVM } from "./summary.js";

const mono = {
  fontFamily: "ui-monospace, monospace",
  textAlign: "right" as const,
};
const fmt = (m?: { value: number; unit: string }) => (m ? `${m.value}` : "—");
const usd = (v: number | null) => (v == null ? "—" : `$${v.toFixed(2)}`);
const pct = (r: number | null) => (r == null ? "—" : `${Math.round(r * 100)}%`);
// revenue-metrics-display: 未申告 (キーなし=undefined) は —、申告ありは 0 も有効値として表示。
const yen = (m?: { value: number; unit: string }) => (m ? `¥${m.value}` : "—");

/** 採算状態を状態色 (design-system 原則1: status-first) にマップ。 */
const PROFIT_KIND: Record<Exclude<ProfitState, null>, StatusKind> = {
  profit: "up",
  thin: "warn",
  loss: "down",
};

export function ServiceRow({ row }: { row: ServiceRowVM }) {
  const kind = rowStatusKind(row);
  const pState = row.profitability.state;
  const pKind: StatusKind = pState ? PROFIT_KIND[pState] : "unknown";
  // 離脱率が高いほど警告色 (>=50% down, >=30% warn)
  const ab = row.funnel.abandonmentRate;
  const abKind: StatusKind =
    ab == null ? "unknown" : ab >= 0.5 ? "down" : ab >= 0.3 ? "warn" : "up";
  return (
    <tr data-status={kind} data-slug={row.slug}>
      <td>
        <StatusDot kind={kind} label={`${row.slug} ${kind}`} />
      </td>
      <td style={{ fontFamily: "ui-monospace, monospace" }}>
        <ServiceIcon iconUrl={row.iconUrl} slug={row.slug} />
        {row.slug}
      </td>
      <td style={mono}>{fmt(row.metrics.mau)}</td>
      <td
        style={{
          ...mono,
          color: pState ? STATUS_COLOR[pKind] : "var(--text-faint, #5b6676)",
        }}
        data-profit-state={pState ?? ""}
        title={pState ? `${STATUS_SHAPE[pKind]} ${pState}` : "データなし"}
      >
        {usd(row.profitability.profit)}
      </td>
      <td
        style={{
          ...mono,
          color:
            ab == null ? "var(--text-faint, #5b6676)" : STATUS_COLOR[abKind],
        }}
        data-abandon
      >
        {pct(row.funnel.abandonmentRate)}
      </td>
      <td style={mono}>
        {row.metrics.error_count ? row.metrics.error_count.value : "—"}
      </td>
      <td style={mono}>{row.openAlertCount || ""}</td>
      {/* last-deploy-col: 最終デプロイ日時 (epoch_ms→JST、未収集/0 は —)。データは latestPerService 由来で chart と独立 (spec-review R2) */}
      <td style={mono} data-deploy-at>
        {formatDeployAt(row.metrics.last_deploy_at?.value)}
      </td>
      {/* revenue-metrics-display (C20260607-001): 累計収益 (producer 自己申告、寄付/売上等)。未申告は —、0 は有効値。jpy 固定 ¥表記、PII なし (O48)。旧 tip_* は adapter で revenue_* へ正規化 */}
      <td style={mono} data-revenue-count>
        {fmt(row.metrics.revenue_count)}
      </td>
      <td style={mono} data-revenue-yen>
        {yen(row.metrics.revenue_total_yen)}
      </td>
    </tr>
  );
}
