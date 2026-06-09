import { PageShell } from "../components/layout/PageShell";
import { PieChart } from "../components/charts/PieChart";
import { LineChart } from "../components/charts/LineChart";
import type { ExpenseByCategory, MonthlyTrend, TopCategory } from "../types";

const mockPie: ExpenseByCategory[] = [
  { category_id: "1", category_name: "Еда", amount: "25000", percent: 35 },
  { category_id: "2", category_name: "Транспорт", amount: "12000", percent: 17 },
  { category_id: "3", category_name: "ЖКХ", amount: "8000", percent: 11 },
  { category_id: "4", category_name: "Развлечения", amount: "15000", percent: 21 },
  { category_id: "5", category_name: "Прочее", amount: "11000", percent: 16 },
];

const mockTrend: MonthlyTrend[] = [
  { month: "Янв", income: "120000", expense: "85000" },
  { month: "Фев", income: "120000", expense: "91000" },
  { month: "Мар", income: "135000", expense: "78000" },
  { month: "Апр", income: "120000", expense: "95000" },
  { month: "Май", income: "140000", expense: "88000" },
  { month: "Июн", income: "120000", expense: "71000" },
];

const mockTop: TopCategory[] = [
  { category_id: "1", category_name: "🍕 Еда", amount: "25000", rank: 1 },
  { category_id: "4", category_name: "🎬 Развлечения", amount: "15000", rank: 2 },
  { category_id: "2", category_name: "🚗 Транспорт", amount: "12000", rank: 3 },
  { category_id: "5", category_name: "📦 Прочее", amount: "11000", rank: 4 },
  { category_id: "3", category_name: "🏠 ЖКХ", amount: "8000", rank: 5 },
];

const SUMMARY_CARDS = [
  { label: "Доходы", value: "120 000 ₽", color: "#16a34a" },
  { label: "Расходы", value: "71 000 ₽", color: "#dc2626" },
  { label: "Баланс", value: "49 000 ₽", color: "#4f46e5" },
];

export function Dashboard() {
  return (
    <PageShell title="Дашборд">
      {/* Month selector */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: "#6b7280" }}>Период:</label>
        <input
          type="month"
          defaultValue="2026-06"
          style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" }}
        />
      </div>

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        {SUMMARY_CARDS.map(({ label, value, color }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", flex: "0 0 auto" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 600, color: "#111827" }}>Расходы по категориям</h3>
          <PieChart data={mockPie} />
        </div>
        <div style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", flex: 1, minWidth: 280 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 600, color: "#111827" }}>Динамика за 6 месяцев</h3>
          <LineChart data={mockTrend} />
        </div>
      </div>

      {/* Top-5 categories */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 600, color: "#111827" }}>Топ-5 категорий расходов</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th style={th}>#</th>
              <th style={th}>Категория</th>
              <th style={{ ...th, textAlign: "right" }}>Сумма</th>
            </tr>
          </thead>
          <tbody>
            {mockTop.map((item) => (
              <tr key={item.category_id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ ...td, color: "#9ca3af" }}>{item.rank}</td>
                <td style={{ ...td, fontWeight: 500 }}>{item.category_name}</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 600, color: "#dc2626" }}>
                  {Number(item.amount).toLocaleString("ru-RU")} ₽
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontSize: 12, color: "#6b7280", fontWeight: 500 };
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 14, color: "#111827" };
