import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  Tag,
  PiggyBank,
  RefreshCw,
  FolderInput,
  ScrollText,
  Settings,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "../../lib/cn";

const navItems = [
  { to: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { to: "/transactions", label: "Транзакции", icon: CreditCard },
  { to: "/categories", label: "Категории", icon: Tag },
  { to: "/budgets", label: "Бюджеты", icon: PiggyBank },
  { to: "/recurring-rules", label: "Повторяющиеся", icon: RefreshCw },
  { to: "/import-export", label: "Импорт / Экспорт", icon: FolderInput },
  { to: "/audit-log", label: "Журнал", icon: ScrollText },
  { to: "/settings", label: "Настройки", icon: Settings },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: Props) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-56 bg-slate-900 flex flex-col flex-shrink-0 transition-transform duration-200",
          "lg:static lg:translate-x-0 lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2.5 px-4 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Wallet size={16} className="text-white" />
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">Finance Tracker</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white lg:hidden"
            aria-label="Закрыть меню"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800",
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
