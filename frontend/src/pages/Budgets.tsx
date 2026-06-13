import { useState } from "react";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { BudgetForm } from "../components/forms/BudgetForm";
import { useBudgetProgress, useDeleteBudget } from "../hooks/useBudgets";
import { useCategories } from "../hooks/useCategories";
import { CategoryIcon } from "../components/ui/CategoryIcon";
import { cn } from "../lib/cn";

interface EditState {
  budgetId: string;
  categoryId: string;
  yearMonth: string;
  amount: string;
}

function barColorClass(pct: number) {
  if (pct >= 100) return "bg-red-500";
  if (pct >= 80) return "bg-amber-500";
  return "bg-emerald-500";
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
    return categories.find((c) => c.id === categoryId)?.icon ?? "";
  }

  return (
    <PageShell title="Бюджеты">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500">Месяц:</label>
          <input
            type="month"
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
            className="input w-auto"
          />
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={14} /> Бюджет
        </Button>
      </div>

      {isLoading && <div className="text-slate-400 text-center py-10">Загрузка…</div>}

      {!isLoading && progress.length === 0 && (
        <div className="text-slate-400 text-center py-16">Бюджеты на этот месяц не найдены</div>
      )}

      <div className="space-y-3">
        {progress.map((bp) => {
          const pct = Math.min(bp.percent_used, 100);
          const overBudget = bp.percent_used > 100;
          return (
            <div key={bp.budget_id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <CategoryIcon name={getCategoryIcon(bp.category_id)} size={20} />
                  <span className="font-semibold text-slate-800">{bp.category_name}</span>
                  {overBudget && (
                    <span className="badge bg-red-50 text-red-600 gap-1">
                      <AlertCircle size={10} /> Превышен
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-slate-500">
                    {Number(bp.spent_amount).toLocaleString("ru-RU")} / {Number(bp.budget_amount).toLocaleString("ru-RU")} ₽
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(bp)}>
                    <Pencil size={13} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => { if (confirm("Удалить бюджет?")) deleteMutation.mutate(bp.budget_id); }}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>

              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", barColorClass(bp.percent_used))}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex justify-between mt-2">
                <span className="text-xs text-slate-400">{Math.round(bp.percent_used)}%</span>
                <span className={cn("text-xs font-medium", Number(bp.remaining) < 0 ? "text-red-500" : "text-emerald-600")}>
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
