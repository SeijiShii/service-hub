import { z } from "zod";

const SECRET_LITERAL = /^(sk_|pk_|rk_|Bearer\s|ey[A-Za-z0-9_-]{10,})/; // 直書き秘密の疑い
const INTERNAL =
  /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|172\.(1[6-9]|2\d|3[01])\.)/i;

// 識別子フィールドに秘密 (sk_/pk_/Bearer/JWT) を直書きさせないガード (O25、秘密ゼロ化)。
// レジストリは秘密を一切持たない ([D20260528-002])。
const idStr = (label: string) =>
  z
    .string()
    .min(1)
    .refine((v) => !SECRET_LITERAL.test(v), {
      message: `${label} に秘密を直書きしないこと (識別子のみ, O25)`,
    });

const publicUrl = z
  .string()
  .url()
  .refine(
    (u) => {
      try {
        return !INTERNAL.test(new URL(u).hostname);
      } catch {
        return false;
      }
    },
    { message: "内部アドレスは不可 (SSRF 予防, [論点-004])" },
  );

export const providerRefsSchema = z
  .object({
    vercel: z.object({ projectId: idStr("vercel.projectId") }).optional(),
    neon: z.object({ projectId: idStr("neon.projectId") }).optional(),
    clerk: z.object({ appId: idStr("clerk.appId") }).optional(),
    cloudflare: z
      .object({
        accountId: idStr("cloudflare.accountId"),
        r2Bucket: z.string().optional(),
      })
      .optional(),
    sentry: z
      .object({ org: idStr("sentry.org"), project: idStr("sentry.project") })
      .optional(),
  })
  .default({});

export const serviceDescriptorSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug は小文字英数とハイフンのみ"),
  name: z.string().min(1),
  url: publicUrl,
  subdomain: z.string().optional(),
  status: z.enum(["active", "paused", "retired"]).default("active"),
  providers: providerRefsSchema,
  serviceInfo: z
    .object({
      endpoint: publicUrl.optional(),
    })
    .optional(),
  thresholds: z
    .record(
      z.string(),
      z.object({
        warnPct: z.number().optional(),
        limit: z.number().optional(),
      }),
    )
    .optional(),
});

export const servicesTomlSchema = z.object({
  service: z.array(serviceDescriptorSchema).default([]),
});
