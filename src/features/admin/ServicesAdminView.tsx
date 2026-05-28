import { useState, type CSSProperties } from "react";
import type { ServiceDescriptor, ServiceStatus } from "../../types/index.js";
import type { SaveState } from "./saveState.js";
import { ServiceIcon } from "../../components/ServiceIcon.js";

const STATUSES: ServiceStatus[] = ["active", "paused", "retired"];

interface Props {
  services: ServiceDescriptor[];
  /** 成功は true、失敗は false を返す。失敗時 View は form 値を保持する。 */
  onSave: (d: ServiceDescriptor) => Promise<boolean>;
  onRetire: (slug: string) => void;
  /** 親が管理する保存進捗。idle 時は表示なし。 */
  saveState?: SaveState;
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
const helpStyle: CSSProperties = {
  color: "var(--text-faint, #6b7280)",
  fontSize: 11,
  marginTop: -2,
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
const saveStatusStyle = (kind: "success" | "error"): CSSProperties => ({
  color:
    kind === "success"
      ? "var(--status-up, #34d399)"
      : "var(--status-down, #f87171)",
  fontSize: 13,
  marginLeft: 12,
});

/** 最小 admin フォーム (D20260528-001、admin-ux Phase 2 で styling 適用、
 * nav-and-pull で back-link 追加、admin-form-bug-and-ux で async UX 4 状態化)。
 * Clerk ゲート内で seiji がサービス座標を登録/編集/削除。 */
export function ServicesAdminView({
  services,
  onSave,
  onRetire,
  saveState,
}: Props) {
  const [f, setF] = useState({ ...empty });
  const [editing, setEditing] = useState(false);

  const saving = saveState?.kind === "saving";

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

  const submit = async (e: React.FormEvent) => {
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
    const ok = await onSave(d);
    if (ok) {
      // 成功時のみ form clear + editing 終了。失敗時は値を保持し再試行可能に。
      setF({ ...empty });
      setEditing(false);
    }
  };

  const submitLabel = saving ? "保存中…" : editing ? "更新" : "登録";

  return (
    <main>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 8,
        }}
      >
        <h1 style={{ margin: 0 }}>サービスレジストリ管理</h1>
        <nav>
          <a
            href="/"
            data-testid="back-link"
            style={{
              color: "var(--text, #e6e9ef)",
              textDecoration: "none",
              padding: "6px 12px",
              border: "1px solid var(--border, #2a2f3a)",
              borderRadius: 6,
              fontSize: 13,
            }}
          >
            ← ダッシュボード
          </a>
        </nav>
      </header>

      {services.length > 0 && (
        <table style={{ marginBottom: 24 }}>
          <thead>
            <tr>
              <th style={{ width: 36 }}>icon</th>
              <th>slug</th>
              <th>name</th>
              <th>status</th>
              <th style={{ width: 160 }}>actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.slug} data-slug={s.slug} data-status={s.status}>
                <td>
                  <ServiceIcon iconUrl={s.iconUrl} slug={s.slug} size={24} />
                </td>
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
                    aria-label={`${s.slug} を削除`}
                  >
                    削除
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
              placeholder="https://example.com"
              required
            />
          </label>
          <label style={labelStyle}>
            サブドメイン
            <input
              style={inputStyle}
              value={f.subdomain}
              onChange={set("subdomain")}
              placeholder="(任意・現状未使用)"
            />
            <span data-testid="subdomain-help" style={helpStyle}>
              将来の公開 URL 表記用予約 field。現状ビジネス logic から未参照。
            </span>
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
              placeholder="prj_xxx"
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
              placeholder="https://example.com/api/hub/service-info"
            />
            <span data-testid="endpoint-help" style={helpStyle}>
              フル URL を指定 (例:
              https://&lt;service&gt;.example.com/api/hub/service-info)。 path
              のみは不可。
            </span>
          </label>
        </fieldset>

        <div style={{ display: "flex", alignItems: "center" }}>
          <button type="submit" style={primaryBtn} disabled={saving}>
            {submitLabel}
          </button>
          {saveState?.kind === "success" && (
            <span
              data-testid="save-status"
              data-status="success"
              style={saveStatusStyle("success")}
              role="status"
            >
              ✓ 保存しました
            </span>
          )}
          {saveState?.kind === "error" && (
            <span
              data-testid="save-status"
              data-status="error"
              style={saveStatusStyle("error")}
              role="alert"
            >
              保存に失敗しました ({saveState.message})
            </span>
          )}
        </div>
      </form>
    </main>
  );
}
