import { PROVIDER_KINDS, type ProviderKind } from "./provider.js";
import { SERVICE_STATUSES, type ServiceStatus } from "./service.js";
import { COLLECTION_STATUSES, type CollectionStatus } from "./alert.js";

export function isProviderKind(x: unknown): x is ProviderKind {
  return typeof x === "string" && (PROVIDER_KINDS as readonly string[]).includes(x);
}

export function isServiceStatus(x: unknown): x is ServiceStatus {
  return typeof x === "string" && (SERVICE_STATUSES as readonly string[]).includes(x);
}

export function isCollectionStatus(x: unknown): x is CollectionStatus {
  return typeof x === "string" && (COLLECTION_STATUSES as readonly string[]).includes(x);
}
