import { useState } from "react";
import { TrendingUp, TrendingDown, Scale, Trophy } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { PieChart } from "../components/charts/PieChart";
import { LineChart } from "../components/charts/LineChart";
import { useDashboardSummary, useExpensesByCategory, useTrend, useTopCategories } from "../hooks/useDashboard";
import { cn } from "../lib/cn";

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

  const balance = Number(summary?.balance ?? 0);

  const summaryCards = [
    {
      label: "Доходы",
      value: `${fmt(summary?.total_income)} ₽`,
      icon: TrendingUp,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      valueColor: "text-emerald-600",
    },
    {
      label: "Расходы",
      value: `${fmt(summary?.total_expense)} ₽`,
      icon: TrendingDown,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      valueColor: "text-red-600",
    },
    {
      label: "Баланс",
      value: `${fmt(summary?.balance)} ₽`,
      icon: Scale,
      iconBg: balance >= 0 ? "bg-indigo-50" : "bg-red-50",
      iconColor: balance >= 0 ? "text-indigo-600" : "text-red-600",
      valueColor: balance >= 0 ? "text-indigo-600" : "text-red-600",
    },
  ];

  return (
    <PageShell title="Дашборд">
      {/* Period selector */}
      <div className="flex items-center gap-2 mb-6">
        <label className="text-sm text-slate-500">Период:</label>
        <input
          type="month"
          value={yearMonth}
          onChange={(e) => setYearMonth(e.target.value)}
          className="input w-auto"
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {summaryCards.map(({ label, value, icon: Icon, iconBg, iconColor, valueColor }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", iconBg)}>
              <Icon size={20} className={iconColor} />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-0.5">{label}</div>
              <div className={cn("text-2xl font-bold", valueColor)}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Расходы по категориям</h3>
          {pieData.length === 0
            ? <div className="text-slate-400 text-sm py-16 text-center">Нет данных</div>
            : <PieChart data={pieData} />}
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Динамика за 6 месяцев</h3>
          {trendData.length === 0
            ? <div className="text-slate-400 text-sm py-16 text-center">Нет данных</div>
            : <LineChart data={trendData} />}
        </div>
      </div>

      {/* Top categories */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={16} className="text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-800">Топ-5 категорий расходов</h3>
        </div>
        {topData.length === 0 ? (
          <div className="text-slate-400 text-sm text-center py-6">Нет данных за выбранный период</div>
        ) : (
          <div className="space-y-2">
            {topData.map((item) => (
              <div key={item.category_id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                    {item.rank}
                  </span>
                  <span className="text-sm font-medium text-slate-700">{item.category_name}</span>
                </div>
                <span className="text-sm font-semibold text-red-500">
                  {Number(item.amount).toLocaleString("ru-RU")} ₽
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
