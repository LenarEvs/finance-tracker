import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "📊 Дашборд" },
  { to: "/transactions", label: "💳 Транзакции" },
  { to: "/categories", label: "🏷️ Категории" },
  { to: "/budgets", label: "📅 Бюджеты" },
  { to: "/recurring-rules", label: "🔄 Повторяющиеся" },
  { to: "/import-export", label: "📁 Импорт / Экспорт" },
  { to: "/audit-log", label: "📋 Журнал" },
];

export function Sidebar() {
  return (
    <aside style={{ width: 220, minHeight: "100vh", background: "#111827", color: "#e5e7eb", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "20px 16px 16px", fontSize: 16, fontWeight: 700, color: "#fff", borderBottom: "1px solid #1f2937", letterSpacing: "-0.3px" }}>
        💰 Finance Tracker
      </div>
      <nav style={{ flex: 1, padding: "10px 8px" }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: "block",
              padding: "9px 12px",
              borderRadius: 8,
              marginBottom: 2,
              color: isActive ? "#fff" : "#9ca3af",
              background: isActive ? "#4f46e5" : "transparent",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
