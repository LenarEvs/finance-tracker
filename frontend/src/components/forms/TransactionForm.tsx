import { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { useCategories } from "../../hooks/useCategories";
import { useCreateTransaction, useUpdateTransaction } from "../../hooks/useTransactions";
import type { Transaction, TransactionType } from "../../types";

interface Props {
  initialValues?: Transaction;
  onClose?: () => void;
}

const CURRENCIES = ["RUB", "USD", "EUR", "CNY", "GBP"];
const today = new Date().toISOString().slice(0, 10);

export function TransactionForm({ initialValues, onClose }: Props) {
  const [type, setType] = useState<TransactionType>(initialValues?.type ?? "expense");
  const [date, setDate] = useState(initialValues?.date ?? today);
  const [categoryId, setCategoryId] = useState(initialValues?.category_id ?? "");
  const [amount, setAmount] = useState(initialValues?.amount ?? "");
  const [currency, setCurrency] = useState(initialValues?.currency ?? "RUB");
  const [exchangeRate, setExchangeRate] = useState(initialValues?.exchange_rate ?? "1");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [error, setError] = useState<string | null>(null);

  const { data: categories = [] } = useCategories();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const filteredCategories = categories.filter((c) => c.type === type && !c.is_archived);

  useEffect(() => {
    if (categoryId && !filteredCategories.find((c) => c.id === categoryId)) {
      setCategoryId("");
    }
  }, [type]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!categoryId) { setError("Выберите категорию"); return; }
    const payload = {
      type,
      date,
      category_id: categoryId,
      amount,
      currency,
      exchange_rate: exchangeRate,
      description: description || undefined,
    } as any;
    try {
      if (initialValues) {
        await updateMutation.mutateAsync({ id: initialValues.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose?.();
    } catch {
      setError("Ошибка при сохранении. Проверьте данные.");
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit}>
      <div style={field}>
        <label style={label}>Тип</label>
        <select style={input} value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
          <option value="expense">Расход</option>
          <option value="income">Доход</option>
        </select>
      </div>
      <div style={field}>
        <label style={label}>Дата</label>
        <input type="date" style={input} value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div style={field}>
        <label style={label}>Категория</label>
        <select style={input} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
          <option value="">Выберите категорию</option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={label}>Сумма</label>
          <input type="number" min="0.01" step="0.01" placeholder="0.00" style={input} value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={label}>Валюта</label>
          <select style={input} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div style={field}>
        <label style={label}>Курс к базовой валюте</label>
        <input type="number" step="0.000001" min="0.000001" style={input} value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} required />
      </div>
      <div style={field}>
        <label style={label}>Описание</label>
        <input type="text" placeholder="Необязательно" style={input} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 8 }}>{error}</p>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
        <Button variant="secondary" type="button" onClick={onClose}>Отмена</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? "Сохранение…" : "Сохранить"}</Button>
      </div>
    </form>
  );
}

const input: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };
const field: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 };
const label: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "#374151" };
