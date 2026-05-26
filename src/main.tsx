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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={pubKey}>
      <RouterProvider router={router} />
    </ClerkProvider>
  </StrictMode>,
);
