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
    const payload: Omit<Transaction, "id" | "user_id" | "is_recurring_instance" | "recurring_rule_id" | "created_at" | "updated_at"> = { type, date, category_id: categoryId, amount: String(amount), currency, exchange_rate: String(exchangeRate), description: description || null };
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Тип</label>
        <select className="input" value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
          <option value="expense">Расход</option>
          <option value="income">Доход</option>
        </select>
      </div>
      <div>
        <label className="label">Дата</label>
        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div>
        <label className="label">Категория</label>
        <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
          <option value="">Выберите категорию</option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="label">Сумма</label>
          <input type="number" min="0.01" step="0.01" placeholder="0.00" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <label className="label">Валюта</label>
          <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Курс к базовой валюте</label>
        <input type="number" step="0.000001" min="0.000001" className="input" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} required />
      </div>
      <div>
        <label className="label">Описание</label>
        <input type="text" placeholder="Необязательно" className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" type="button" onClick={onClose}>Отмена</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? "Сохранение…" : "Сохранить"}</Button>
      </div>
    </form>
  );
}
