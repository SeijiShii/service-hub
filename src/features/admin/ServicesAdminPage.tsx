import { useCallback, useEffect, useState } from "react";
import { ServicesAdminView, type ForcePullState } from "./ServicesAdminView.js";
import type { ServiceDescriptor, CollectionRun } from "../../types/index.js";

/** admin write + force-pull の配線。
 *  - GET 一覧 + POST/PATCH/DELETE → /api/admin/services
 *  - 「今すぐ pull」 → POST /api/admin/collect (force-pull、D20260528-019) */
export function ServicesAdminPage() {
  const [services, setServices] = useState<ServiceDescriptor[]>([]);
  const [error, setError] = useState<string>();
  const [forcePull, setForcePull] = useState<ForcePullState>({});

  const reload = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/services", { credentials: "include" });
      if (!r.ok) throw new Error(`http_${r.status}`);
      setServices((await r.json()) as ServiceDescriptor[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onSave = useCallback(
    async (d: ServiceDescriptor) => {
      const exists = services.some((s) => s.slug === d.slug);
      const url = exists
        ? `/api/admin/services?slug=${encodeURIComponent(d.slug)}`
        : "/api/admin/services";
      const r = await fetch(url, {
        method: exists ? "PATCH" : "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(d),
      });
      if (!r.ok) {
        setError(`save_failed_${r.status}`);
        return;
      }
      await reload();
    },
    [services, reload],
  );

  const onRetire = useCallback(
    async (slug: string) => {
      await fetch(`/api/admin/services?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
        credentials: "include",
      });
      await reload();
    },
    [reload],
  );

  const onForcePull = useCallback(async () => {
    setForcePull((p) => ({ ...p, running: true, error: undefined }));
    try {
      const r = await fetch("/api/admin/collect", {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) {
        setForcePull({ running: false, error: `http_${r.status}` });
        return;
      }
      const lastResult = (await r.json()) as CollectionRun;
      setForcePull({ running: false, lastResult });
    } catch (e) {
      setForcePull({
        running: false,
        error: e instanceof Error ? e.message : "force_pull_failed",
      });
    }
  }, []);

  return (
    <>
      {error && <p role="alert">エラー: {error}</p>}
      <ServicesAdminView
        services={services}
        onSave={onSave}
        onRetire={onRetire}
        onForcePull={onForcePull}
        forcePullState={forcePull}
      />
    </>
  );
}
