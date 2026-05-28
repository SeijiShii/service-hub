import type { ProviderAdapter, ServiceDescriptor } from "../types/index.js";
import {
  type AdapterDeps,
  createPingAdapter,
  createVercelAdapter,
  createNeonAdapter,
  createServiceInfoAdapter,
} from "./adapters.js";

export * from "./fetch.js";
export * from "./adapters.js";

/** service の providers / serviceInfo から有効な adapter を構築。ping は常に含む。 */
export function getAdapters(
  service: ServiceDescriptor,
  deps: AdapterDeps = {},
): ProviderAdapter[] {
  const list: ProviderAdapter[] = [createPingAdapter(deps)];
  if (service.providers.vercel) list.push(createVercelAdapter(deps));
  if (service.providers.neon) list.push(createNeonAdapter(deps));
  // clerk adapter は撤去 ([D20260528-002])。MAU は service-info 自己申告から取得。
  if (service.serviceInfo?.endpoint) list.push(createServiceInfoAdapter(deps));
  // cloudflare/sentry は Phase2
  return list;
}
