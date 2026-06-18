import { useState } from "react";
import { FeedbackInboxView } from "./FeedbackInboxView.js";
import type { FeedbackInboxVM } from "./inbox.js";
import type { FeedbackKind } from "../../types/index.js";
import { useFetch } from "../../lib/useFetch.js";
import { DEFAULT_PERIOD, type ChartPeriod } from "../dashboard/chartPeriod.js";

/** `/feedback` 運営者インボックス Page。GET /api/feedback/inbox を service/kind/period 付きで取得。 */
export function FeedbackInboxPage() {
  const [service, setService] = useState("");
  const [kind, setKind] = useState<FeedbackKind | "">("");
  const [period, setPeriod] = useState<ChartPeriod>(DEFAULT_PERIOD);

  const qs = new URLSearchParams({ period });
  if (service) qs.set("service", service);
  if (kind) qs.set("kind", kind);
  const { loading, data, error } = useFetch<FeedbackInboxVM>(
    `/api/feedback/inbox?${qs.toString()}`,
  );

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
    />
  );
}
