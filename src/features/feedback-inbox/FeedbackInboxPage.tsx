import { useCallback, useState } from "react";
import { FeedbackInboxView, type InboxPullState } from "./FeedbackInboxView.js";
import type { FeedbackInboxVM } from "./inbox.js";
import type { FeedbackKind } from "../../types/index.js";
import { useFetch } from "../../lib/useFetch.js";
import { DEFAULT_PERIOD, type ChartPeriod } from "../dashboard/chartPeriod.js";

/** `/feedback` 運営者インボックス Page。GET /api/feedback/inbox を service/kind/period 付きで取得。 */
export function FeedbackInboxPage() {
  const [service, setService] = useState("");
  const [kind, setKind] = useState<FeedbackKind | "">("");
  const [period, setPeriod] = useState<ChartPeriod>(DEFAULT_PERIOD);
  const [pull, setPull] = useState<InboxPullState>({});

  const qs = new URLSearchParams({ period });
  if (service) qs.set("service", service);
  if (kind) qs.set("kind", kind);
  const { loading, data, error, refetch } = useFetch<FeedbackInboxVM>(
    `/api/feedback/inbox?${qs.toString()}`,
  );

  // 「今すぐ pull」: dashboard と同じ POST /api/admin/collect (metrics + feedback 取り込み)
  // → 成功で inbox を refetch し、shipyard 等の新着メッセージを即反映。
  const onForcePull = useCallback(async () => {
    setPull({ running: true });
    try {
      const r = await fetch("/api/admin/collect", {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) {
        setPull({ running: false, error: `http_${r.status}` });
        return;
      }
      setPull({ running: false });
      await refetch();
    } catch (e) {
      setPull({
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
    <FeedbackInboxView
      vm={data}
      service={service}
      kind={kind}
      period={period}
      onServiceChange={setService}
      onKindChange={setKind}
      onPeriodChange={setPeriod}
      onForcePull={onForcePull}
      forcePullState={pull}
    />
  );
}
