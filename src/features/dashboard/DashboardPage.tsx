import { DashboardView } from "./DashboardView.js";
import type { DashboardVM } from "./summary.js";
import { useFetch } from "../../lib/useFetch.js";

export function DashboardPage() {
  const { loading, data, error } = useFetch<DashboardVM>("/api/dashboard/summary");
  if (loading) return <main><p>読み込み中…</p></main>;
  if (error || !data) return <main><p role="alert">読み込みに失敗しました（{error}）</p></main>;
  return <DashboardView vm={data} />;
}
