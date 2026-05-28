import { useCallback, useState } from "react";
import { DashboardView } from "./DashboardView.js";
import type { DashboardVM } from "./summary.js";
import type { ForcePullState } from "./forcePull.js";
import type { CollectionRun } from "../../types/index.js";
import { useFetch } from "../../lib/useFetch.js";

/** dashboard `/` の Page。
 *  - GET /api/dashboard/summary で VM 取得
 *  - 「今すぐ pull」: POST /api/admin/collect (force-pull、D20260528-022 で /admin から relocation)
 */
export function DashboardPage() {
  const { loading, data, error, refetch } = useFetch<DashboardVM>(
    "/api/dashboard/summary",
  );
  const [forcePull, setForcePull] = useState<ForcePullState>({});

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
      // 鮮度更新: dashboard summary を再取得して「最終更新」を新スナップショットに同期
      await refetch();
    } catch (e) {
      setForcePull({
        running: false,
        error: e instanceof Error ? e.message : "force_pull_failed",
      });
    }
  }, [refetch]);

  if (loading)
    return (
      <main>
        <p>読み込み中…</p>
      </main>
    );
  if (error || !data)
    return (
      <main>
        <p role="alert">読み込みに失敗しました（{error}）</p>
      </main>
    );
  return (
    <DashboardView
      vm={data}
      onForcePull={onForcePull}
      forcePullState={forcePull}
    />
  );
}
