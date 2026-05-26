import { MetricChart } from "./MetricChart.js";
import { StatusDot } from "../../components/StatusDot.js";
import type { ServiceDetailVM } from "./detail.js";

/** vm=null は 404。 */
export function ServiceDetailView({ vm }: { vm: ServiceDetailVM | null }) {
  if (!vm) {
    return <main><p data-testid="not-found">サービスが見つかりません (404)</p></main>;
  }
  return (
    <main style={{ background: "var(--bg, #0b0e14)", color: "var(--text, #e6e9ef)" }}>
      <header>
        <h1>
          <StatusDot kind={vm.status === "active" ? "up" : "unknown"} label={vm.status} />{" "}
          <span style={{ fontFamily: "ui-monospace, monospace" }}>{vm.slug}</span>
        </h1>
        <a href={vm.url}>{vm.url}</a>
      </header>
      <section data-testid="charts">
        {vm.series.length === 0 ? (
          <p data-testid="empty-state">まだ時系列データがありません</p>
        ) : (
          vm.series.map((s) => <MetricChart key={s.metricKey} series={s} />)
        )}
      </section>
      <section data-testid="alerts">
        <h2>アラート履歴</h2>
        {vm.alerts.length === 0 ? <p>なし</p> : (
          <ul>{vm.alerts.map((a) => <li key={a.id} data-rule={a.rule}>{a.rule} @ {a.triggeredAt}</li>)}</ul>
        )}
      </section>
    </main>
  );
}
