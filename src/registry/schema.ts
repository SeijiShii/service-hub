import { z } from "zod";

const SECRET_LITERAL = /^(sk_|pk_|rk_|Bearer\s|ey[A-Za-z0-9_-]{10,})/; // 直書き秘密の疑い
const INTERNAL = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|172\.(1[6-9]|2\d|3[01])\.)/i;

const envName = (label: string) =>
  z.string().refine((v) => !SECRET_LITERAL.test(v), {
    message: `${label} は env キー名のみ可 (秘密の直書き禁止, O25)`,
  });

const publicUrl = z.string().url().refine((u) => {
  try { return !INTERNAL.test(new URL(u).hostname); } catch { return false; }
}, { message: "内部アドレスは不可 (SSRF 予防, [論点-004])" });

export const providerRefsSchema = z.object({
  vercel: z.object({ projectId: z.string().min(1) }).optional(),
  neon: z.object({ projectId: z.string().min(1) }).optional(),
  clerk: z.object({ appId: z.string().min(1), secretEnv: envName("clerk.secretEnv").optional() }).optional(),
  cloudflare: z.object({ accountId: z.string().min(1), r2Bucket: z.string().optional() }).optional(),
  sentry: z.object({ org: z.string().min(1), project: z.string().min(1) }).optional(),
}).default({});

export const serviceDescriptorSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug は小文字英数とハイフンのみ"),
  name: z.string().min(1),
  url: publicUrl,
  subdomain: z.string().optional(),
  status: z.enum(["active", "paused", "retired"]).default("active"),
  providers: providerRefsSchema,
  serviceInfo: z.object({
    endpoint: publicUrl.optional(),
    secretEnv: envName("serviceInfo.secretEnv").optional(),
  }).optional(),
  thresholds: z.record(z.string(), z.object({ warnPct: z.number().optional(), limit: z.number().optional() })).optional(),
});

export const servicesTomlSchema = z.object({
  service: z.array(serviceDescriptorSchema).default([]),
});
