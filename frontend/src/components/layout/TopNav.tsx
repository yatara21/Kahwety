import { Menu, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopNavProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
}

export function TopNav({ title, onMenuClick }: TopNavProps) {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between py-2.5 px-4 mb-3 border-b border-[#ECE8E1] bg-white/70 backdrop-blur-md rounded-2xl">
      {/* Menu burger for mobile */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-[#8a7a5c] hover:bg-[#F5F0E8] transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* User profile dropdown - left side in RTL */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-[#F5F0E8]/70 transition-all outline-none">
              <span className="text-sm font-bold text-[#2F2D29]">
                {user?.full_name || "أحمد محمد"}
              </span>
              <div className="w-9 h-9 rounded-full overflow-hidden border border-[#E5E0D8] bg-[#BA9B65] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {user?.profile_image ? (
                  <img
                    src={user.profile_image}
                    alt={user.full_name || "Avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user?.full_name?.charAt(0) || "أ"}</span>
                )}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-white border border-[#E5E0D8] rounded-xl shadow-lg p-1.5 text-right">
            <div className="px-3 py-2 border-b border-[#F0ECE4] mb-1">
              <p className="text-xs font-bold text-[#2F2D29] truncate">{user?.full_name || "المسؤول"}</p>
              <p className="text-[11px] text-[#8A7A5C] truncate">{user?.email}</p>
            </div>
            <DropdownMenuItem
              onClick={() => logout()}
              className="flex items-center justify-between text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer px-3 py-2"
            >
              <span>تسجيل الخروج</span>
              <LogOut size={14} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
