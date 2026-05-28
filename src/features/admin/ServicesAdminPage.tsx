import { useCallback, useEffect, useState } from "react";
import { ServicesAdminView } from "./ServicesAdminView.js";
import type { ServiceDescriptor } from "../../types/index.js";

/** admin write の配線 (force-pull は D20260528-022 で dashboard へ relocation 済)。
 *  - GET 一覧 + POST/PATCH/DELETE → /api/admin/services */
export function ServicesAdminPage() {
  const [services, setServices] = useState<ServiceDescriptor[]>([]);
  const [error, setError] = useState<string>();

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

  return (
    <>
      {error && <p role="alert">エラー: {error}</p>}
      <ServicesAdminView
        services={services}
        onSave={onSave}
        onRetire={onRetire}
      />
    </>
  );
}
