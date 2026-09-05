import React from "react";
import {
  LayoutGrid,
  Users2,
  Coffee,
  Store,
  MessageSquareQuote,
  ShieldCheck,
  RotateCcw,
  Package,
  Sparkles,
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
    icon: <LayoutGrid size={19} />,
  },
  {
    key: "users",
    label: "المستخدمين",
    icon: <Users2 size={19} />,
    permission: "Customers",
  },
  {
    key: "cafes",
    label: "المقاهي",
    icon: <Coffee size={19} />,
    permission: "Cafes",
  },
  {
    key: "suggested-cafes",
    label: "المقاهي المقترحة",
    icon: <Store size={19} />,
    permission: "Suggested Cafes",
  },
  {
    key: "complaints",
    label: "الشكاوي",
    icon: <MessageSquareQuote size={19} />,
    permission: "Complaints",
  },
  {
    key: "admins",
    label: "المسؤولين",
    icon: <ShieldCheck size={19} />,
    permission: "Admins",
    roles: ["SUPER_ADMIN"],
  },
  {
    key: "subscriptions",
    label: "إدارة الاشتراكات",
    icon: <RotateCcw size={19} />,
    permission: "Subscriptions",
  },
  {
    key: "products",
    label: "المنتجات والخدمات",
    icon: <Package size={19} />,
    permission: "Products",
  },
  {
    key: "offers",
    label: "العروض والفعاليات",
    icon: <Sparkles size={19} />,
    permission: "Offers",
  },
];

function hasPermission(user: User | null, item: NavItem): boolean {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  if (item.roles && item.roles.length > 0) {
    return item.roles.includes(user.role);
  }
  return true;
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
        "flex flex-col h-full bg-white transition-all duration-300 border-l border-[#EAE6DF] relative overflow-hidden",
        collapsed ? "w-[80px]" : "w-[270px]"
      )}
      style={{
        backgroundImage: "url('/resources/pattern-2-PNG 1.png')",
        backgroundRepeat: "repeat-y",
        backgroundPosition: "bottom right",
        backgroundSize: "cover",
      }}
    >
      {/* Background overlay for soft watermark effect */}
      <div className="absolute inset-0 bg-white/92 pointer-events-none" />

      {/* Header / Logo */}
      <div
        className={cn(
          "relative z-10 flex items-center justify-center border-b border-[#F0ECE4] px-4 py-5",
          collapsed ? "py-4" : "py-5"
        )}
      >
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onChange("dashboard")}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center">
            <img
              src="/resources/Asset 50 1.png"
              alt="قهوتي"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
          {!collapsed && (
            <span className="text-2xl font-extrabold text-[#BA9B65] tracking-tight" style={{ fontFamily: "Almarai, sans-serif" }}>
              قهوتي
            </span>
          )}
        </div>
      </div>

      {/* Navigation list */}
      <nav className="relative z-10 flex-1 overflow-y-auto py-5 px-3.5 space-y-2.5">
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
                "w-full flex items-center rounded-[10px] text-sm font-semibold transition-all duration-200",
                collapsed ? "justify-center px-0 py-3" : "justify-between px-4 py-2.5",
                isActive
                  ? "bg-[#BA9B65] text-white shadow-sm border border-transparent font-bold"
                  : "bg-white text-[#2F2D29] border border-[#E5E0D8] hover:border-[#BA9B65] hover:bg-[#FAF8F5]"
              )}
            >
              {!collapsed && (
                <span className="truncate leading-none">
                  {item.label}
                </span>
              )}
              <span
                className={cn(
                  "flex-shrink-0 transition-colors",
                  isActive ? "text-white" : "text-[#73706B]"
                )}
              >
                {item.icon}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Collapse button */}
      <div className="relative z-10 px-3.5 py-3 border-t border-[#F0ECE4]">
        <button
          onClick={onToggleCollapse}
          className={cn(
            "w-full hidden lg:flex items-center justify-center rounded-[10px] py-2 text-[#8A7A5C] bg-white border border-[#E5E0D8] hover:bg-[#FAF8F5] transition-all text-xs font-medium",
            collapsed ? "px-0" : "gap-2 px-3"
          )}
        >
          {collapsed ? (
            <ChevronLeft size={16} />
          ) : (
            <>
              <span>طي القائمة</span>
              <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block sticky top-0 h-screen z-30 flex-shrink-0">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed top-0 right-0 h-full z-50 lg:hidden shadow-2xl">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
