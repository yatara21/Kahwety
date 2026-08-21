import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const DashboardLayout = lazy(() =>
  import("@/components/layout/DashboardLayout").then((m) => ({
    default: m.DashboardLayout,
  }))
);
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const UsersPage = lazy(() => import("@/pages/UsersPage"));
const CafeOwnersPage = lazy(() => import("@/pages/CafeOwnersPage"));
const CafesPage = lazy(() => import("@/pages/CafesPage"));
const CafeCreatePage = lazy(() => import("@/pages/CafeCreatePage"));
const CafeDetailsPage = lazy(() => import("@/pages/CafeDetailsPage"));
const ProductsPage = lazy(() => import("@/pages/ProductsPage"));
const OffersPage = lazy(() => import("@/pages/OffersPage"));
const EventsPage = lazy(() => import("@/pages/EventsPage"));
const ComplaintsPage = lazy(() => import("@/pages/ComplaintsPage"));
const SubscriptionsPage = lazy(() => import("@/pages/SubscriptionsPage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const AdminsPage = lazy(() => import("@/pages/AdminsPage"));
const SuggestedCafesPage = lazy(() => import("@/pages/SuggestedCafesPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm animate-pulse"
          style={{ background: "linear-gradient(135deg, #c8a44e, #a07c28)" }}
        >
          ق
        </div>
        <span className="text-sm text-[#8a7a5c]">جاري التحميل...</span>
      </div>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/cafe-owners" element={<CafeOwnersPage />} />
            <Route path="/cafes" element={<CafesPage />} />
            <Route path="/cafes/new" element={<CafeCreatePage />} />
            <Route path="/cafes/:id" element={<CafeDetailsPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/complaints" element={<ComplaintsPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route
              path="/admins"
              element={<AdminsPage />}
            />
            <Route path="/suggested-cafes" element={<SuggestedCafesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
