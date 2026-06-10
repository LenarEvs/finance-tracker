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
    <form onSubmit={handleSubmit}>
      {!isEditing && (
        <div style={fieldS}>
          <label style={labelS}>Месяц</label>
          <input type="month" style={inputS} value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} required />
        </div>
      )}
      {!isEditing && (
        <div style={fieldS}>
          <label style={labelS}>Категория (расходы)</label>
          <select style={inputS} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Выберите категорию</option>
            {categories.filter((c) => !c.is_archived).map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
      )}
      <div style={fieldS}>
        <label style={labelS}>Лимит (в базовой валюте)</label>
        <input type="number" min="0.01" step="0.01" placeholder="0.00" style={inputS} value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </div>
      {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 8 }}>{error}</p>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
        <Button variant="secondary" type="button" onClick={onClose}>Отмена</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? "Сохранение…" : "Сохранить"}</Button>
      </div>
    </form>
  );
}

const inputS: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };
const fieldS: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 };
const labelS: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "#374151" };
