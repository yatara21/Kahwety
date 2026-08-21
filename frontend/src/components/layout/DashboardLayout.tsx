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
  "/products": "products",
  "/offers": "offers",
  "/events": "offers",
  "/complaints": "complaints",
  "/subscriptions": "subscriptions",
  "/notifications": "notifications",
  "/admins": "admins",
  "/suggested-cafes": "suggested-cafes",
  "/settings": "settings",
};

const keyToRoute: Record<string, string> = {
  dashboard: "/",
  users: "/users",
  cafes: "/cafes",
  products: "/products",
  offers: "/offers",
  complaints: "/complaints",
  subscriptions: "/subscriptions",
  notifications: "/notifications",
  admins: "/admins",
  "suggested-cafes": "/suggested-cafes",
  settings: "/settings",
};

const pageTitles: Record<string, string> = {
  dashboard: "لوحة التحكم",
  users: "المستخدمين",
  cafes: "المقاهي",
  products: "المنتجات والخدمات",
  offers: "العروض والفعاليات",
  complaints: "الشكاوى",
  subscriptions: "إدارة الاشتراكات",
  notifications: "الإشعارات",
  admins: "المسؤولون",
  "suggested-cafes": "المقاهي المقترحة",
  settings: "الإعدادات",
};

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeKey =
    routeToKey[location.pathname] ||
    (location.pathname.startsWith("/cafes/") ? "cafes" : "dashboard");

  const pageTitle = pageTitles[activeKey] || "لوحة التحكم";

  const handleChange = (key: string) => {
    const route = keyToRoute[key];
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f5f0e8]">
      <Sidebar
        active={activeKey}
        onChange={handleChange}
        user={user}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <main className="flex-1 min-w-0 p-4 sm:p-6">
        <TopNav
          title={pageTitle}
          onMenuClick={() => setMobileOpen(true)}
        />

        <div className="mt-5">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
