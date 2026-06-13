import { useNavigate } from "react-router-dom";
import { LogOut, User, Menu } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../ui/Button";

interface Props {
  onMenuToggle: () => void;
}

export function Topbar({ onMenuToggle }: Props) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center px-4 gap-3 flex-shrink-0">
      <button
        onClick={onMenuToggle}
        className="text-slate-500 hover:text-slate-800 lg:hidden"
        aria-label="Открыть меню"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      {user && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
            <User size={14} className="text-indigo-600" />
          </div>
          <span className="hidden sm:block">{user.full_name || user.email}</span>
        </div>
      )}
      <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
        <LogOut size={14} />
        <span className="hidden sm:inline">Выйти</span>
      </Button>
    </header>
  );
}
