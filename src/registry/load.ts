import { readFileSync } from "node:fs";
import toml from "@iarna/toml";
import { serviceDescriptorSchema } from "./schema.js";
import type { ServiceDescriptor } from "../types/index.js";

export interface ValidationError {
  slug?: string;
  message: string;
}

/** services.toml 文字列を検証。不正 service は除外し errors に集約 (全体は止めない)。 */
export function validateServicesToml(raw: string): {
  services: ServiceDescriptor[];
  errors: ValidationError[];
} {
  let parsed: unknown;
  try {
    parsed = toml.parse(raw);
  } catch (e) {
    throw new Error(
      `TOML パースエラー: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  const arr = (parsed as { service?: unknown[] })?.service ?? [];
  const services: ServiceDescriptor[] = [];
  const errors: ValidationError[] = [];
  const seen = new Set<string>();
  for (const item of Array.isArray(arr) ? arr : []) {
    const r = serviceDescriptorSchema.safeParse(item);
    if (!r.success) {
      errors.push({
        slug: (item as { slug?: string })?.slug,
        message: r.error.issues
          .map((i: { message: string }) => i.message)
          .join("; "),
      });
      continue;
    }
    if (seen.has(r.data.slug)) {
      errors.push({ slug: r.data.slug, message: "slug 重複" });
      continue;
    }
    seen.add(r.data.slug);
    services.push(r.data as ServiceDescriptor);
  }
  return { services, errors };
}

export function loadServices(
  opts: { onlyActive?: boolean; path?: string } = {},
): ServiceDescriptor[] {
  const path = opts.path ?? "services.toml";
  const { services } = validateServicesToml(readFileSync(path, "utf8"));
  return opts.onlyActive
    ? services.filter((s) => s.status === "active")
    : services;
}
