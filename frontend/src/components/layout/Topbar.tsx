import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../ui/Button";

export function Topbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center px-6 gap-3 justify-end flex-shrink-0">
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
        Выйти
      </Button>
    </header>
  );
}
