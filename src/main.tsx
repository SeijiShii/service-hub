import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignIn,
  UserButton,
} from "@clerk/clerk-react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { DashboardPage } from "./features/dashboard/DashboardPage.js";
import { ServiceDetailPage } from "./features/service-detail/ServiceDetailPage.js";
import { CostSimPage } from "./features/cost-sim/CostSimPage.js";
import { ServicesAdminPage } from "./features/admin/ServicesAdminPage.js";
import { FeedbackInboxPage } from "./features/feedback-inbox/FeedbackInboxPage.js";
import "./index.css";

const router = createBrowserRouter([
  { path: "/", element: <DashboardPage /> },
  { path: "/services/:slug", element: <ServiceDetailPage /> },
  { path: "/cost-sim", element: <CostSimPage /> },
  { path: "/admin", element: <ServicesAdminPage /> },
  { path: "/feedback", element: <FeedbackInboxPage /> },
]);

const pubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? "";
const app = <RouterProvider router={router} />;

/**
 * Clerk あり (本番/preview): サインインゲートで囲う。
 * 未ログインは <SignIn> を表示し、ログイン済のみ app を描画する。
 * これで「未ログインのまま DashboardPage が即 /api を叩いて 401」事故を防ぎ、
 * ログイン後は同一オリジンの __session cookie が API に送られ requireSeiji が通る。
 * Clerk なし (E2E/dev, route-mock): bare 描画 (認可本体は API 側 requireSeiji)。
 */
const gated = (
  <>
    <SignedIn>
      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 50 }}>
        <UserButton afterSignOutUrl="/" />
      </div>
      {app}
    </SignedIn>
    <SignedOut>
      <main
        style={{ display: "grid", placeItems: "center", minHeight: "100dvh" }}
      >
        <SignIn routing="hash" />
      </main>
    </SignedOut>
  </>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {pubKey ? (
      <ClerkProvider publishableKey={pubKey}>{gated}</ClerkProvider>
    ) : (
      app
    )}
  </StrictMode>,
);
