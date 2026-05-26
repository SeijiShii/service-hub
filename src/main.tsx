import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { DashboardPage } from "./features/dashboard/DashboardPage.js";
import { ServiceDetailPage } from "./features/service-detail/ServiceDetailPage.js";
import "./index.css";

const router = createBrowserRouter([
  { path: "/", element: <DashboardPage /> },
  { path: "/services/:slug", element: <ServiceDetailPage /> },
]);

const pubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? "";
const app = <RouterProvider router={router} />;

// 本番/preview は Clerk key あり → ClerkProvider でラップ。
// E2E/dev (key なし) は bare 描画 (認可の本体は API 側 requireSeiji、SPA は session provider のみ)。
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {pubKey ? (
      <ClerkProvider publishableKey={pubKey}>{app}</ClerkProvider>
    ) : (
      app
    )}
  </StrictMode>,
);
