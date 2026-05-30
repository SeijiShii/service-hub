import { ServiceRow } from "./ServiceRow.js";
import { DashboardCharts } from "./DashboardCharts.js";
import type { DashboardVM } from "./summary.js";
import { formatLastUpdated } from "./lastUpdatedFormat.js";
import type { ForcePullState } from "./forcePull.js";

interface Props {
  vm: DashboardVM;
  onForcePull?: () => void;
  forcePullState?: ForcePullState;
}

export function DashboardView({ vm, onForcePull, forcePullState }: Props) {
  const showAlert = vm.downCount > 0 || vm.lastRunStatus === "failed";
  const lastUpdatedText = formatLastUpdated(vm.lastUpdatedAt);
  const lastUpdatedFailed = vm.lastRunStatus === "failed";
  const running = forcePullState?.running === true;
  const lastResult = forcePullState?.lastResult;
  return (
    <main
      style={{
        background: "var(--bg, #0b0e14)",
        color: "var(--text, #e6e9ef)",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>service-hub</h1>
          <p data-testid="summary" style={{ margin: "4px 0 0" }}>
            {vm.upCount} up · {vm.downCount} down
          </p>
          <p
            data-testid="last-updated"
            data-status={vm.lastRunStatus ?? "none"}
            style={{
              margin: "4px 0 0",
              fontSize: 12,
              color: lastUpdatedFailed
                ? "var(--status-down, #f87171)"
                : "var(--text-muted, #9aa3b2)",
            }}
          >
            最終更新: {lastUpdatedText}
            {lastUpdatedFailed && " · failed"}
          </p>
        </div>
        <nav>
          <a
            href="/admin"
            data-testid="admin-link"
            style={{
              color: "var(--text, #e6e9ef)",
              textDecoration: "none",
              padding: "6px 12px",
              border: "1px solid var(--border, #2a2f3a)",
              borderRadius: 6,
            }}
          >
            管理
          </a>
        </nav>
      </header>
      {onForcePull && (
        <section
          data-section="force-pull"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 16px",
            fontSize: 12,
            color: "var(--text-muted, #9aa3b2)",
            borderBottom: "1px solid var(--border, #2a2f3a)",
          }}
        >
          <button
            type="button"
            onClick={onForcePull}
            disabled={running}
            style={{
              background: "transparent",
              color: "var(--text, #e6e9ef)",
              border: "1px solid var(--border, #2a2f3a)",
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: 12,
              cursor: running ? "not-allowed" : "pointer",
              opacity: running ? 0.6 : 1,
            }}
          >
            {running ? "実行中…" : "今すぐ pull"}
          </button>
          {lastResult && (
            <span data-testid="force-pull-result">
              直近: {lastResult.servicesCount} サービス / エラー{" "}
              {lastResult.errors?.length ?? 0} 件 ({lastResult.status})
            </span>
          )}
          {forcePullState?.error && (
            <span role="alert" style={{ color: "var(--status-down, #f87171)" }}>
              {forcePullState.error}
            </span>
          )}
        </section>
      )}
      {showAlert && (
        <div
          role="alert"
          data-testid="alert-banner"
          style={{ color: "var(--status-down, #f87171)" }}
        >
          {vm.downCount > 0
            ? `${vm.downCount} 件のサービスがダウンしています`
            : "直近の収集に失敗があります"}
        </div>
      )}
      <DashboardCharts charts={vm.charts} />
      {vm.rows.length === 0 ? (
        <p data-testid="empty-state">
          まだ収集データがありません（収集を待っています）
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>status</th>
              <th>service</th>
              <th>MAU</th>
              <th>採算</th>
              <th>離脱率</th>
              <th>errors</th>
              <th>alerts</th>
              <th>最終デプロイ</th>
            </tr>
          </thead>
          <tbody>
            {vm.rows.map((r) => (
              <ServiceRow key={r.slug} row={r} />
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
