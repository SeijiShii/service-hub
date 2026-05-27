import { useState } from "react";
import type { ServiceDescriptor, ServiceStatus } from "../../types/index.js";

const STATUSES: ServiceStatus[] = ["active", "paused", "retired"];

interface Props {
  services: ServiceDescriptor[];
  onSave: (d: ServiceDescriptor) => void;
  onRetire: (slug: string) => void;
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

/** 最小 admin フォーム (D20260528-001)。Clerk ゲート内で seiji がサービス座標を登録/編集/退役。 */
export function ServicesAdminView({ services, onSave, onRetire }: Props) {
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
      <h1>サービスレジストリ管理</h1>

      <table>
        <tbody>
          {services.map((s) => (
            <tr key={s.slug} data-slug={s.slug} data-status={s.status}>
              <td>{s.slug}</td>
              <td>{s.name}</td>
              <td>{s.status}</td>
              <td>
                <button type="button" onClick={() => startEdit(s)}>
                  編集
                </button>
                <button type="button" onClick={() => onRetire(s.slug)}>
                  退役
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form onSubmit={submit} aria-label="サービス登録">
        <label>
          slug
          <input
            value={f.slug}
            onChange={set("slug")}
            readOnly={editing}
            required
          />
        </label>
        <label>
          名前
          <input value={f.name} onChange={set("name")} required />
        </label>
        <label>
          URL
          <input value={f.url} onChange={set("url")} required />
        </label>
        <label>
          サブドメイン
          <input value={f.subdomain} onChange={set("subdomain")} />
        </label>
        <label>
          状態
          <select value={f.status} onChange={set("status")}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Vercel projectId
          <input value={f.vercelProjectId} onChange={set("vercelProjectId")} />
        </label>
        <label>
          Neon projectId
          <input value={f.neonProjectId} onChange={set("neonProjectId")} />
        </label>
        <label>
          service-info endpoint
          <input value={f.endpoint} onChange={set("endpoint")} />
        </label>
        <button type="submit">{editing ? "更新" : "登録"}</button>
      </form>
    </main>
  );
}
