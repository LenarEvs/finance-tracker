import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { MonthlyTrend } from "../../types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface Props {
  data: MonthlyTrend[];
}

export function LineChart({ data }: Props) {
  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: "Доходы",
        data: data.map((d) => d.income),
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.08)",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Расходы",
        data: data.map((d) => d.expense),
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.08)",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { boxWidth: 10, font: { size: 12 }, color: "#64748b" },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) =>
            `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toLocaleString("ru-RU")} ₽`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8", font: { size: 11 } },
        border: { display: false },
      },
      y: {
        grid: { color: "#f1f5f9" },
        ticks: {
          color: "#94a3b8",
          font: { size: 11 },
          callback: (v: string | number) => Number(v).toLocaleString("ru-RU"),
        },
        border: { display: false },
      },
    },
  };

  return (
    <div style={{ height: 260 }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
