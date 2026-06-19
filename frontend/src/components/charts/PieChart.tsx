import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import type { ExpenseByCategory } from "../../types";
import { formatAmount, getCurrencySymbol } from "../../lib/currency";

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6",
  "#ec4899", "#8b5cf6", "#14b8a6", "#f97316", "#06b6d4",
];

interface Props {
  data: ExpenseByCategory[];
  currency?: string;
}

export function PieChart({ data, currency = "RUB" }: Props) {
  const symbol = getCurrencySymbol(currency);
  const chartData = {
    labels: data.map((d) => d.category_name),
    datasets: [
      {
        data: data.map((d) => d.amount),
        backgroundColor: data.map((_, i) => COLORS[i % COLORS.length]),
        borderColor: "#ffffff",
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "55%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { boxWidth: 10, font: { size: 12 }, color: "#64748b", padding: 12 },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { label: string; parsed: number }) =>
            ` ${ctx.label}: ${formatAmount(ctx.parsed, currency)} ${symbol}`,
        },
      },
    },
  };

  return (
    <div style={{ height: 260 }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
