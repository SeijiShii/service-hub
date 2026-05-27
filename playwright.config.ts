import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:4173", trace: "off" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // route-mock E2E は Clerk bare (サインインゲート無効) で動かす。
    // .env.local に VITE_CLERK_PUBLISHABLE_KEY があるとビルドに焼き込まれゲートが出て
    // 全ルートがログイン画面で塞がるため、E2E ビルドでは明示的に空にする。
    command:
      "VITE_CLERK_PUBLISHABLE_KEY= npm run build && npm run preview -- --port 4173",
    url: "http://localhost:4173",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
