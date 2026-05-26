import { defineConfig } from "drizzle-kit";
import { readFileSync } from "node:fs";

// DATABASE_URL が未設定なら .env.local からロード (ローカル開発の利便)。
// CI/本番は env が供給するため、この分岐は走らない。
if (!process.env.DATABASE_URL) {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const m = line.match(/^DATABASE_URL=(.+)$/);
      if (m) process.env.DATABASE_URL = m[1].trim();
    }
  } catch {
    // .env.local 不在は許容
  }
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
