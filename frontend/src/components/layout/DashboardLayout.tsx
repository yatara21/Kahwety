import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { useAuth } from "@/contexts/AuthContext";

const routeToKey: Record<string, string> = {
  "/": "dashboard",
  "/users": "users",
  "/cafe-owners": "users",
  "/cafes": "cafes",
  "/suggested-cafes": "suggested-cafes",
  "/complaints": "complaints",
  "/admins": "admins",
  "/subscriptions": "subscriptions",
  "/products": "products",
  "/offers": "offers",
  "/events": "offers",
  "/notifications": "notifications",
};

const keyToRoute: Record<string, string> = {
  dashboard: "/",
  users: "/users",
  cafes: "/cafes",
  "suggested-cafes": "/suggested-cafes",
  complaints: "/complaints",
  admins: "/admins",
  subscriptions: "/subscriptions",
  products: "/products",
  offers: "/offers",
  notifications: "/notifications",
};

const pageTitles: Record<string, string> = {
  dashboard: "لوحة التحكم",
  users: "المستخدمين",
  cafes: "المقاهي",
  "suggested-cafes": "المقاهي المقترحة",
  complaints: "الشكاوي",
  admins: "المسؤولين",
  subscriptions: "إدارة الاشتراكات",
  products: "المنتجات والخدمات",
  offers: "العروض والفعاليات",
  notifications: "الإشعارات",
};

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeKey =
    routeToKey[location.pathname] ||
    (location.pathname.startsWith("/users/") ? "users" :
     location.pathname.startsWith("/cafes/") ? "cafes" :
     location.pathname.startsWith("/suggested-cafes/") ? "suggested-cafes" :
     location.pathname.startsWith("/complaints/") ? "complaints" :
     location.pathname.startsWith("/admins/") ? "admins" :
     "dashboard");

  const pageTitle = pageTitles[activeKey] || "لوحة التحكم";

  const handleChange = (key: string) => {
    const route = keyToRoute[key];
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FAF8F5] text-[#2F2D29]" dir="rtl">
      {/* Sidebar on Right side in RTL */}
      <Sidebar
        active={activeKey}
        onChange={handleChange}
        user={user}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-y-auto max-h-screen">
        <TopNav
          title={pageTitle}
          onMenuClick={() => setMobileOpen(true)}
        />

        <div className="mt-2">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
