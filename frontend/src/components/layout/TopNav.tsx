import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface TopNavProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
}

export function TopNav({ title, subtitle, onMenuClick }: TopNavProps) {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Page title - right side in RTL */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-[#8a7a5c] hover:bg-[#f7f2e7] transition-colors"
        >
          <Menu size={22} />
        </button>
        <h1 className="text-xl font-bold text-[#2f2d29]">{title}</h1>
      </div>

      {/* User info - left side in RTL */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-[#2f2d29] leading-tight">
              {user?.full_name || "المدير"}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold bg-[#c8a44e]">
            {user?.full_name?.charAt(0) || "م"}
          </div>
        </div>
      </div>
    </div>
  );
}
