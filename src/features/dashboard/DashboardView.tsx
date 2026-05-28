import { ServiceRow } from "./ServiceRow.js";
import type { DashboardVM } from "./summary.js";

export function DashboardView({ vm }: { vm: DashboardVM }) {
  const showAlert = vm.downCount > 0 || vm.lastRunStatus === "failed";
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
