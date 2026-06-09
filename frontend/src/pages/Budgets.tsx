import { useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { BudgetForm } from "../components/forms/BudgetForm";
import type { BudgetProgress } from "../types";

const mockProgress: BudgetProgress[] = [
  { budget_id: "1", category_id: "1", category_name: "🍕 Еда", budget_amount: "30000", spent_amount: "25000", remaining: "5000", percent_used: 83 },
  { budget_id: "2", category_id: "2", category_name: "🚗 Транспорт", budget_amount: "15000", spent_amount: "12000", remaining: "3000", percent_used: 80 },
  { budget_id: "3", category_id: "3", category_name: "🏠 ЖКХ", budget_amount: "10000", spent_amount: "5200", remaining: "4800", percent_used: 52 },
  { budget_id: "4", category_id: "4", category_name: "🎬 Развлечения", budget_amount: "8000", spent_amount: "9500", remaining: "-1500", percent_used: 119 },
  { budget_id: "5", category_id: "5", category_name: "💊 Здоровье", budget_amount: "5000", spent_amount: "1200", remaining: "3800", percent_used: 24 },
];

function barColor(pct: number) {
  if (pct >= 100) return "#dc2626";
  if (pct >= 80) return "#f97316";
  return "#16a34a";
}

export function Budgets() {
  const [yearMonth, setYearMonth] = useState("2026-06");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <PageShell title="Бюджеты">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <label style={{ fontSize: 13, color: "#6b7280" }}>Месяц:</label>
          <input
            type="month"
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
            style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" }}
          />
        </div>
        <Button onClick={() => { setEditId(null); setModalOpen(true); }}>+ Бюджет</Button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {mockProgress.map((bp) => {
          const pct = Math.min(bp.percent_used, 100);
          const color = barColor(bp.percent_used);
          const overBudget = bp.percent_used > 100;
          return (
            <div key={bp.budget_id} style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 15, color: "#111827" }}>{bp.category_name}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {overBudget && (
                    <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, background: "#fee2e2", padding: "2px 8px", borderRadius: 999 }}>Превышен!</span>
                  )}
                  <span style={{ fontSize: 13, color: "#6b7280" }}>
                    {Number(bp.spent_amount).toLocaleString("ru-RU")} / {Number(bp.budget_amount).toLocaleString("ru-RU")} ₽
                  </span>
                  <Button variant="secondary" size="sm" onClick={() => { setEditId(bp.budget_id); setModalOpen(true); }}>✏️</Button>
                  <Button variant="danger" size="sm">🗑</Button>
                </div>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 999, height: 10, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.3s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{bp.percent_used}%</span>
                <span style={{ fontSize: 12, color: Number(bp.remaining) < 0 ? "#dc2626" : "#16a34a", fontWeight: 500 }}>
                  Остаток: {Number(bp.remaining).toLocaleString("ru-RU")} ₽
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Редактировать бюджет" : "Новый бюджет"}>
        <BudgetForm onClose={() => setModalOpen(false)} />
      </Modal>
    </PageShell>
  );
}
