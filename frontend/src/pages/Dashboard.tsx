import { useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import { PieChart } from "../components/charts/PieChart";
import { LineChart } from "../components/charts/LineChart";
import { useDashboardSummary, useExpensesByCategory, useTrend, useTopCategories } from "../hooks/useDashboard";

function currentYearMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function Dashboard() {
  const [yearMonth, setYearMonth] = useState(currentYearMonth());

  const { data: summary } = useDashboardSummary(yearMonth);
  const { data: pieData = [] } = useExpensesByCategory(yearMonth);
  const { data: trendData = [] } = useTrend();
  const { data: topData = [] } = useTopCategories(yearMonth);

  const fmt = (v: string | number | undefined) =>
    v !== undefined ? Number(v).toLocaleString("ru-RU") : "—";

  const summaryCards = [
    { label: "Доходы", value: `${fmt(summary?.total_income)} ₽`, color: "#16a34a" },
    { label: "Расходы", value: `${fmt(summary?.total_expense)} ₽`, color: "#dc2626" },
    { label: "Баланс", value: `${fmt(summary?.balance)} ₽`, color: Number(summary?.balance) >= 0 ? "#4f46e5" : "#dc2626" },
  ];

  return (
    <PageShell title="Дашборд">
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: "#6b7280" }}>Период:</label>
        <input
          type="month"
          value={yearMonth}
          onChange={(e) => setYearMonth(e.target.value)}
          style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" }}
        />
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        {summaryCards.map(({ label, value, color }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", flex: "0 0 auto" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 600, color: "#111827" }}>Расходы по категориям</h3>
          {pieData.length === 0
            ? <div style={{ color: "#9ca3af", fontSize: 13, padding: "20px 0" }}>Нет данных</div>
            : <PieChart data={pieData} />}
        </div>
        <div style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", flex: 1, minWidth: 280 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 600, color: "#111827" }}>Динамика за 6 месяцев</h3>
          {trendData.length === 0
            ? <div style={{ color: "#9ca3af", fontSize: 13, padding: "20px 0" }}>Нет данных</div>
            : <LineChart data={trendData} />}
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 600, color: "#111827" }}>Топ-5 категорий расходов</h3>
        {topData.length === 0 ? (
          <div style={{ color: "#9ca3af", fontSize: 13 }}>Нет данных за выбранный период</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <th style={th}>#</th>
                <th style={th}>Категория</th>
                <th style={{ ...th, textAlign: "right" }}>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {topData.map((item) => (
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
        )}
      </div>
    </PageShell>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontSize: 12, color: "#6b7280", fontWeight: 500 };
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 14, color: "#111827" };
