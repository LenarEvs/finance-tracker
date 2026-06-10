import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  Tag,
  PiggyBank,
  RefreshCw,
  FolderInput,
  ScrollText,
  Wallet,
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
];

export function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-slate-900 flex flex-col flex-shrink-0">
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
          <Wallet size={16} className="text-white" />
        </div>
        <span className="text-white font-semibold text-sm tracking-tight">Finance Tracker</span>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
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
  );
}
