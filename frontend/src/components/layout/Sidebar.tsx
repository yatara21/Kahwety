import React from "react";
import {
  LayoutDashboard,
  Users,
  Coffee,
  Package,
  Tag,
  Calendar,
  MessageSquare,
  CreditCard,
  Bell,
  Shield,
  Store,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

interface SidebarProps {
  active: string;
  onChange: (route: string) => void;
  user: User | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  permission?: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    key: "dashboard",
    label: "لوحة التحكم",
    icon: <LayoutDashboard size={20} />,
  },
  {
    key: "users",
    label: "المستخدمين",
    icon: <Users size={20} />,
    permission: "users",
  },
  {
    key: "cafes",
    label: "المقاهي",
    icon: <Coffee size={20} />,
    permission: "cafes",
  },
  {
    key: "complaints",
    label: "الشكاوى",
    icon: <MessageSquare size={20} />,
    permission: "complaints",
  },
  {
    key: "suggested-cafes",
    label: "المقاهي المقترحة",
    icon: <Store size={20} />,
    permission: "suggested-cafes",
  },
  {
    key: "admins",
    label: "المسؤولون",
    icon: <Shield size={20} />,
    roles: ["SUPER_ADMIN"],
  },
  {
    key: "subscriptions",
    label: "إدارة الاشتراكات",
    icon: <CreditCard size={20} />,
    permission: "subscriptions",
  },
  {
    key: "products",
    label: "المنتجات والخدمات",
    icon: <Package size={20} />,
    permission: "products",
  },
  {
    key: "offers",
    label: "العروض والفعاليات",
    icon: <Tag size={20} />,
    permission: "offers",
  },
  {
    key: "notifications",
    label: "الإشعارات",
    icon: <Bell size={20} />,
    permission: "notifications",
  },
];

function hasPermission(user: User | null, item: NavItem): boolean {
  if (!user) return false;
  if (item.roles && item.roles.length > 0) {
    return item.roles.includes(user.role);
  }
  if (!item.permission) return true;
  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") return true;
  return false;
}

export function Sidebar({
  active,
  onChange,
  user,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const filteredItems = navItems.filter((item) => hasPermission(user, item));

  const sidebarContent = (
    <div
      className={cn(
        "flex flex-col h-full transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
      style={{
        background: "linear-gradient(180deg, #fefcf7 0%, #f7f2e7 100%)",
      }}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center border-b border-[#e8dcc8]/50 px-4",
          collapsed ? "justify-center py-5" : "gap-3 py-5"
        )}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
          style={{ background: "linear-gradient(135deg, #c8a44e, #a07c28)" }}
        >
          ق
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span
              className="text-xl font-bold leading-tight"
              style={{ color: "#b8942e" }}
            >
              قهوي
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
        {filteredItems.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                onChange(item.key);
                onMobileClose();
              }}
              title={collapsed ? item.label : undefined}
              className={cn(
                "w-full flex items-center rounded-xl transition-all duration-200",
                collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3",
                isActive
                  ? "text-white shadow-md"
                  : "text-[#4a3f2f] hover:bg-[#ede5d3]/60"
              )}
              style={
                isActive
                  ? {
                      background:
                        "linear-gradient(135deg, #c8a44e, #a07c28)",
                    }
                  : undefined
              }
            >
              <span
                className={cn(
                  "flex-shrink-0",
                  isActive
                    ? "text-white"
                    : "text-[#8a7a5c]"
                )}
              >
                {item.icon}
              </span>
              {!collapsed && (
                <span className="text-sm font-medium truncate">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-3 border-t border-[#e8dcc8]/50">
        <button
          onClick={onToggleCollapse}
          className={cn(
            "w-full hidden lg:flex items-center rounded-xl transition-all duration-200",
            collapsed ? "justify-center px-0 py-2" : "gap-3 px-4 py-2",
            "text-[#8a7a5c] hover:bg-[#ede5d3]/60"
          )}
        >
          {collapsed ? (
            <ChevronRight size={18} />
          ) : (
            <>
              <ChevronLeft size={18} />
              <span className="text-xs">طي القائمة</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block sticky top-0 h-screen z-30">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed top-0 right-0 h-full z-50 lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
