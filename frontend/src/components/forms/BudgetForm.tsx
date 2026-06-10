import { useState } from "react";
import { Button } from "../ui/Button";
import { useCategories } from "../../hooks/useCategories";
import { useCreateBudget, useUpdateBudget } from "../../hooks/useBudgets";

interface Props {
  budgetId?: string;
  defaultCategoryId?: string;
  defaultYearMonth?: string;
  defaultAmount?: string;
  onClose?: () => void;
}

export function BudgetForm({ budgetId, defaultCategoryId, defaultYearMonth, defaultAmount, onClose }: Props) {
  const isEditing = !!budgetId;
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [yearMonth, setYearMonth] = useState(defaultYearMonth ?? currentMonth);
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? "");
  const [amount, setAmount] = useState(defaultAmount ?? "");
  const [error, setError] = useState<string | null>(null);

  const { data: categories = [] } = useCategories("expense");
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: budgetId!, amount });
      } else {
        if (!categoryId) { setError("Выберите категорию"); return; }
        await createMutation.mutateAsync({ category_id: categoryId, year_month: yearMonth, amount });
      }
      onClose?.();
    } catch {
      setError("Ошибка при сохранении");
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEditing && (
        <div>
          <label className="label">Месяц</label>
          <input type="month" className="input" value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} required />
        </div>
      )}
      {!isEditing && (
        <div>
          <label className="label">Категория (расходы)</label>
          <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Выберите категорию</option>
            {categories.filter((c) => !c.is_archived).map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="label">Лимит (в базовой валюте)</label>
        <input type="number" min="0.01" step="0.01" placeholder="0.00" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" type="button" onClick={onClose}>Отмена</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? "Сохранение…" : "Сохранить"}</Button>
      </div>
    </form>
  );
}
