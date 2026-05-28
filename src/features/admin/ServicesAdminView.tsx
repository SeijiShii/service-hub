import { useState, type CSSProperties } from "react";
import type {
  ServiceDescriptor,
  ServiceStatus,
  CollectionRun,
} from "../../types/index.js";

const STATUSES: ServiceStatus[] = ["active", "paused", "retired"];

export interface ForcePullState {
  running?: boolean;
  lastResult?: CollectionRun;
  error?: string;
}

interface Props {
  services: ServiceDescriptor[];
  onSave: (d: ServiceDescriptor) => void;
  onRetire: (slug: string) => void;
  onForcePull?: () => void;
  forcePullState?: ForcePullState;
}

const empty = {
  slug: "",
  name: "",
  url: "",
  subdomain: "",
  status: "active" as ServiceStatus,
  vercelProjectId: "",
  neonProjectId: "",
  endpoint: "",
};

// design-system のダーク/コックピット theme (CSS 変数) に揃えた inline スタイル
const inputStyle: CSSProperties = {
  background: "var(--surface, #131720)",
  color: "var(--text, #e6e9ef)",
  border: "1px solid var(--border, #232b3a)",
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 14,
  width: "100%",
};
const labelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  color: "var(--text-muted, #9aa4b2)",
  fontSize: 13,
};
const fieldsetStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  border: "1px solid var(--border, #232b3a)",
  borderRadius: 8,
  padding: "12px 16px",
  margin: 0,
  background: "var(--surface, #131720)",
};
const legendStyle: CSSProperties = {
  color: "var(--text, #e6e9ef)",
  fontWeight: 500,
  padding: "0 8px",
};
const primaryBtn: CSSProperties = {
  background: "var(--accent, #4f9cf9)",
  color: "#0b0e14",
  border: "none",
  borderRadius: 6,
  padding: "10px 18px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};
const secondaryBtn: CSSProperties = {
  background: "transparent",
  color: "var(--text, #e6e9ef)",
  border: "1px solid var(--border, #232b3a)",
  borderRadius: 6,
  padding: "4px 10px",
  fontSize: 12,
  cursor: "pointer",
  marginRight: 6,
};
const statusBadge = (status: ServiceStatus): CSSProperties => {
  const color =
    status === "active"
      ? "var(--status-up, #34d399)"
      : status === "paused"
        ? "var(--status-warn, #fbbf24)"
        : "var(--text-faint, #5b6676)";
  return {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 12,
    fontSize: 12,
    color,
    border: `1px solid ${color}`,
  };
};

/** 最小 admin フォーム (D20260528-001、admin-ux Phase 2 で styling 適用)。
 * Clerk ゲート内で seiji がサービス座標を登録/編集/退役。HTML 構造を保持しつつ
 * design-system テーマを適用 (縦並び・ラベル上・3 セクション fieldset・登録ボタン accent・テーブル装飾)。 */
export function ServicesAdminView({
  services,
  onSave,
  onRetire,
  onForcePull,
  forcePullState,
}: Props) {
  const running = forcePullState?.running === true;
  const lastResult = forcePullState?.lastResult;
  const [f, setF] = useState({ ...empty });
  const [editing, setEditing] = useState(false);

  const set =
    (k: keyof typeof empty) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setF((p) => ({ ...p, [k]: e.target.value }));

  const startEdit = (s: ServiceDescriptor) => {
    setEditing(true);
    setF({
      slug: s.slug,
      name: s.name,
      url: s.url,
      subdomain: s.subdomain ?? "",
      status: s.status,
      vercelProjectId: s.providers.vercel?.projectId ?? "",
      neonProjectId: s.providers.neon?.projectId ?? "",
      endpoint: s.serviceInfo?.endpoint ?? "",
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const providers: ServiceDescriptor["providers"] = {};
    if (f.vercelProjectId) providers.vercel = { projectId: f.vercelProjectId };
    if (f.neonProjectId) providers.neon = { projectId: f.neonProjectId };
    const d: ServiceDescriptor = {
      slug: f.slug,
      name: f.name,
      url: f.url,
      subdomain: f.subdomain || undefined,
      status: f.status,
      providers,
      serviceInfo: f.endpoint ? { endpoint: f.endpoint } : undefined,
    };
    onSave(d);
    setF({ ...empty });
    setEditing(false);
  };

  return (
    <main>
      <h1 style={{ marginTop: 0 }}>サービスレジストリ管理</h1>

      {onForcePull && (
        <section
          data-section="force-pull"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
            padding: "12px 16px",
            border: "1px solid var(--border, #232b3a)",
            borderRadius: 8,
            background: "var(--surface, #131720)",
          }}
        >
          <button
            type="button"
            onClick={onForcePull}
            disabled={running}
            style={{
              ...primaryBtn,
              opacity: running ? 0.6 : 1,
              cursor: running ? "not-allowed" : "pointer",
            }}
          >
            {running ? "実行中…" : "今すぐ pull"}
          </button>
          {lastResult && (
            <span
              data-testid="force-pull-result"
              style={{
                color: "var(--text-muted, #9aa4b2)",
                fontSize: 13,
              }}
            >
              直近: {lastResult.servicesCount} サービス / エラー{" "}
              {lastResult.errors?.length ?? 0} 件 ({lastResult.status})
            </span>
          )}
          {forcePullState?.error && (
            <span
              role="alert"
              style={{ color: "var(--status-down, #f87171)", fontSize: 13 }}
            >
              {forcePullState.error}
            </span>
          )}
        </section>
      )}

      {services.length > 0 && (
        <table style={{ marginBottom: 24 }}>
          <thead>
            <tr>
              <th>slug</th>
              <th>name</th>
              <th>status</th>
              <th style={{ width: 160 }}>actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.slug} data-slug={s.slug} data-status={s.status}>
                <td>{s.slug}</td>
                <td>{s.name}</td>
                <td>
                  <span style={statusBadge(s.status)}>{s.status}</span>
                </td>
                <td>
                  <button
                    type="button"
                    style={secondaryBtn}
                    onClick={() => startEdit(s)}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    style={secondaryBtn}
                    onClick={() => onRetire(s.slug)}
                  >
                    退役
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form
        onSubmit={submit}
        aria-label="サービス登録"
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <fieldset style={fieldsetStyle} data-section="basic">
          <legend style={legendStyle}>基本情報</legend>
          <label style={labelStyle}>
            slug
            <input
              style={inputStyle}
              value={f.slug}
              onChange={set("slug")}
              readOnly={editing}
              required
            />
          </label>
          <label style={labelStyle}>
            名前
            <input
              style={inputStyle}
              value={f.name}
              onChange={set("name")}
              required
            />
          </label>
          <label style={labelStyle}>
            URL
            <input
              style={inputStyle}
              value={f.url}
              onChange={set("url")}
              required
            />
          </label>
          <label style={labelStyle}>
            サブドメイン
            <input
              style={inputStyle}
              value={f.subdomain}
              onChange={set("subdomain")}
            />
          </label>
          <label style={labelStyle}>
            状態
            <select
              style={inputStyle}
              value={f.status}
              onChange={set("status")}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        <fieldset style={fieldsetStyle} data-section="providers">
          <legend style={legendStyle}>Providers</legend>
          <label style={labelStyle}>
            Vercel projectId
            <input
              style={inputStyle}
              value={f.vercelProjectId}
              onChange={set("vercelProjectId")}
            />
          </label>
          <label style={labelStyle}>
            Neon projectId
            <input
              style={inputStyle}
              value={f.neonProjectId}
              onChange={set("neonProjectId")}
            />
          </label>
        </fieldset>

        <fieldset style={fieldsetStyle} data-section="service-info">
          <legend style={legendStyle}>Service-info</legend>
          <label style={labelStyle}>
            service-info endpoint
            <input
              style={inputStyle}
              value={f.endpoint}
              onChange={set("endpoint")}
            />
          </label>
        </fieldset>

        <button type="submit" style={primaryBtn}>
          {editing ? "更新" : "登録"}
        </button>
      </form>
    </main>
  );
}
