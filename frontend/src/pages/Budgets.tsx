import { useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { BudgetForm } from "../components/forms/BudgetForm";
import { useBudgetProgress, useDeleteBudget } from "../hooks/useBudgets";
import { useCategories } from "../hooks/useCategories";

interface EditState {
  budgetId: string;
  categoryId: string;
  yearMonth: string;
  amount: string;
}

function barColor(pct: number) {
  if (pct >= 100) return "#dc2626";
  if (pct >= 80) return "#f97316";
  return "#16a34a";
}

export function Budgets() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [yearMonth, setYearMonth] = useState(currentMonth);
  const [modalOpen, setModalOpen] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);

  const { data: progress = [], isLoading } = useBudgetProgress(yearMonth);
  const { data: categories = [] } = useCategories("expense");
  const deleteMutation = useDeleteBudget();

  function openCreate() { setEditState(null); setModalOpen(true); }
  function openEdit(bp: typeof progress[number]) {
    setEditState({ budgetId: bp.budget_id, categoryId: bp.category_id, yearMonth, amount: String(bp.budget_amount) });
    setModalOpen(true);
  }

  function getCategoryIcon(categoryId: string) {
    const c = categories.find((c) => c.id === categoryId);
    return c?.icon ?? "";
  }

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
        <Button onClick={openCreate}>+ Бюджет</Button>
      </div>

      {isLoading && <div style={{ color: "#9ca3af", textAlign: "center", padding: 32 }}>Загрузка…</div>}

      {!isLoading && progress.length === 0 && (
        <div style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>Бюджеты на этот месяц не найдены</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {progress.map((bp) => {
          const pct = Math.min(bp.percent_used, 100);
          const color = barColor(bp.percent_used);
          const overBudget = bp.percent_used > 100;
          return (
            <div key={bp.budget_id} style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 15, color: "#111827" }}>
                  {getCategoryIcon(bp.category_id)} {bp.category_name}
                </span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {overBudget && (
                    <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, background: "#fee2e2", padding: "2px 8px", borderRadius: 999 }}>Превышен!</span>
                  )}
                  <span style={{ fontSize: 13, color: "#6b7280" }}>
                    {Number(bp.spent_amount).toLocaleString("ru-RU")} / {Number(bp.budget_amount).toLocaleString("ru-RU")} ₽
                  </span>
                  <Button variant="secondary" size="sm" onClick={() => openEdit(bp)}>✏️</Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => { if (confirm("Удалить бюджет?")) deleteMutation.mutate(bp.budget_id); }}
                  >🗑</Button>
                </div>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 999, height: 10, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.3s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{Math.round(bp.percent_used)}%</span>
                <span style={{ fontSize: 12, color: Number(bp.remaining) < 0 ? "#dc2626" : "#16a34a", fontWeight: 500 }}>
                  Остаток: {Number(bp.remaining).toLocaleString("ru-RU")} ₽
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editState ? "Редактировать бюджет" : "Новый бюджет"}>
        <BudgetForm
          budgetId={editState?.budgetId}
          defaultCategoryId={editState?.categoryId}
          defaultYearMonth={editState?.yearMonth ?? yearMonth}
          defaultAmount={editState?.amount}
          onClose={() => setModalOpen(false)}
        />
      </Modal>
    </PageShell>
  );
}
