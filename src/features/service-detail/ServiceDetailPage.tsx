import { useParams } from "react-router-dom";
import { ServiceDetailView } from "./ServiceDetailView.js";
import type { ServiceDetailVM } from "./detail.js";
import { useFetch } from "../../lib/useFetch.js";

export function ServiceDetailPage() {
  const { slug } = useParams();
  const { loading, data, error } = useFetch<ServiceDetailVM | null>(`/api/services/${slug}/timeseries`);
  if (loading) return <main><p>読み込み中…</p></main>;
  if (error === "not_found") return <ServiceDetailView vm={null} />;
  if (error) return <main><p role="alert">読み込みに失敗しました（{error}）</p></main>;
  return <ServiceDetailView vm={data ?? null} />;
}
