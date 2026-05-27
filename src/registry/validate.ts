import { serviceDescriptorSchema } from "./schema.js";
import type { ServiceDescriptor } from "../types/index.js";
import type { ValidationError } from "./load.js";

export type ValidateResult =
  | { ok: true; data: ServiceDescriptor }
  | { ok: false; errors: ValidationError[] };

/**
 * admin write 経路の入力検証 (D20260528-001)。serviceDescriptorSchema を再利用し
 * SSRF (内部アドレス禁止) / 秘密直書き検出 / slug 形式 を write でも担保する。
 * slug 一意性は DB 依存のため呼び出し側 (endpoint) で getService と組み合わせる。
 */
export function validateServiceInput(raw: unknown): ValidateResult {
  const r = serviceDescriptorSchema.safeParse(raw);
  if (!r.success) {
    return {
      ok: false,
      errors: r.error.issues.map((i) => ({
        message: i.path.length
          ? `${i.path.join(".")}: ${i.message}`
          : i.message,
      })),
    };
  }
  return { ok: true, data: r.data as ServiceDescriptor };
}
