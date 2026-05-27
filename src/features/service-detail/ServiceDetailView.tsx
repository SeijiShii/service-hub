import { MetricChart } from "./MetricChart.js";
import { StatusDot } from "../../components/StatusDot.js";
import type { ServiceDetailVM } from "./detail.js";

/** vm=null は 404。 */
export function ServiceDetailView({ vm }: { vm: ServiceDetailVM | null }) {
  if (!vm) {
    return (
      <main>
        <p data-testid="not-found">サービスが見つかりません (404)</p>
      </main>
    );
  }
  return (
    <main
      style={{
        background: "var(--bg, #0b0e14)",
        color: "var(--text, #e6e9ef)",
      }}
    >
      <header>
        <h1>
          <StatusDot
            kind={vm.status === "active" ? "up" : "unknown"}
            label={vm.status}
          />{" "}
          <span style={{ fontFamily: "ui-monospace, monospace" }}>
            {vm.slug}
          </span>
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
      <section data-testid="revenue-projection">
        <h2>収益見込み</h2>
        {vm.revenueProjection.every((v) => v == null) ? (
          <p>データ不足</p>
        ) : (
          <dl style={{ fontFamily: "ui-monospace, monospace" }}>
            {vm.revenueProjection.map((v, i) => (
              <span key={i}>
                <dt>{i + 1}ヶ月後</dt>
                <dd data-proj={i + 1}>
                  {v == null ? "—" : `$${v.toFixed(2)}`}
                </dd>
              </span>
            ))}
          </dl>
        )}
      </section>
      <section data-testid="funnel">
        <h2>決済ファネル</h2>
        {vm.funnel.started == null ? (
          <p>データなし</p>
        ) : (
          <dl style={{ fontFamily: "ui-monospace, monospace" }}>
            <dt>決済画面到達</dt>
            <dd data-funnel-started>{vm.funnel.started}</dd>
            <dt>離脱率</dt>
            <dd data-funnel-abandon>
              {vm.funnel.abandonmentRate == null
                ? "—"
                : `${Math.round(vm.funnel.abandonmentRate * 100)}%`}
            </dd>
            <dt>うちカード決済が理由</dt>
            <dd data-funnel-card>
              {vm.funnel.cardFailureRate == null
                ? "—"
                : `${Math.round(vm.funnel.cardFailureRate * 100)}%`}
            </dd>
          </dl>
        )}
      </section>
      <section data-testid="alerts">
        <h2>アラート履歴</h2>
        {vm.alerts.length === 0 ? (
          <p>なし</p>
        ) : (
          <ul>
            {vm.alerts.map((a) => (
              <li key={a.id} data-rule={a.rule}>
                {a.rule} @ {a.triggeredAt}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
