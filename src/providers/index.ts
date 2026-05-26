import type { ProviderAdapter, ServiceDescriptor } from "../types/index.js";
import {
  type AdapterDeps,
  createPingAdapter, createVercelAdapter, createNeonAdapter,
  createClerkAdapter, createServiceInfoAdapter,
} from "./adapters.js";

export * from "./fetch.js";
export * from "./adapters.js";

/** service の providers / serviceInfo から有効な adapter を構築。ping は常に含む。 */
export function getAdapters(service: ServiceDescriptor, deps: AdapterDeps = {}): ProviderAdapter[] {
  const list: ProviderAdapter[] = [createPingAdapter(deps)];
  if (service.providers.vercel) list.push(createVercelAdapter(deps));
  if (service.providers.neon) list.push(createNeonAdapter(deps));
  if (service.providers.clerk) list.push(createClerkAdapter(deps));
  if (service.serviceInfo?.endpoint) list.push(createServiceInfoAdapter(deps));
  // cloudflare/sentry は Phase2
  return list;
}
