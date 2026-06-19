import { useState } from "react";
import { Plus, Pencil, Trash2, Pause, Play } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useRecurringRules, useCreateRecurringRule, useUpdateRecurringRule, useDeleteRecurringRule } from "../hooks/useRecurringRules";
import { useCategories } from "../hooks/useCategories";
import { useAuthStore } from "../store/authStore";
import { SUPPORTED_CURRENCIES } from "../lib/currency";
import type { RecurringRule, TransactionType } from "../types";
import { cn } from "../lib/cn";

export function RecurringRules() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<RecurringRule | null>(null);

  const { data: rules = [], isLoading } = useRecurringRules();
  const toggleMutation = useUpdateRecurringRule();
  const deleteMutation = useDeleteRecurringRule();

  function openCreate() { setEditItem(null); setModalOpen(true); }
  function openEdit(r: RecurringRule) { setEditItem(r); setModalOpen(true); }

  return (
    <PageShell title="Повторяющиеся транзакции">
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={openCreate}>
          <Plus size={14} /> Правило
        </Button>
      </div>

      {isLoading && <div className="text-slate-400 text-center py-10">Загрузка…</div>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[640px]">
            <thead className="bg-slate-50">
              <tr>
                {["Описание", "Тип", "Сумма / Валюта", "День", "Следующий запуск", "Статус", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 border-b border-slate-100 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!isLoading && rules.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400 text-sm">Правила не найдены</td></tr>
              )}
              {rules.map((rule) => {
                const isIncome = rule.type === "income";
                return (
                  <tr key={rule.id} className={cn("border-b border-slate-50 hover:bg-slate-50/50 transition-colors", !rule.is_active && "opacity-55")}>
                    <td className="px-4 py-3 text-sm text-slate-700">{rule.description || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("badge", isIncome ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                        {isIncome ? "Доход" : "Расход"}
                      </span>
                    </td>
                    <td className={cn("px-4 py-3 text-sm font-semibold", isIncome ? "text-emerald-600" : "text-red-500")}>
                      {Number(rule.amount).toLocaleString("ru-RU")} {rule.currency}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{rule.day_of_month}-е число</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{rule.next_run_date}</td>
                    <td className="px-4 py-3">
                      <span className={cn("badge", rule.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                        {rule.is_active ? "Активно" : "Пауза"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mr-1"
                        onClick={() => toggleMutation.mutate({ id: rule.id, data: { is_active: !rule.is_active } })}
                      >
                        {rule.is_active ? <Pause size={13} /> : <Play size={13} />}
                      </Button>
                      <Button variant="ghost" size="sm" className="mr-1" onClick={() => openEdit(rule)}>
                        <Pencil size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => { if (confirm("Удалить правило?")) deleteMutation.mutate(rule.id); }}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Редактировать правило" : "Новое правило"}>
        <RuleForm initialValues={editItem} onClose={() => setModalOpen(false)} />
      </Modal>
    </PageShell>
  );
}

function RuleForm({ initialValues, onClose }: { initialValues: RecurringRule | null; onClose: () => void }) {
  const isEditing = !!initialValues;
  const baseCurrency = useAuthStore((s) => s.user?.base_currency ?? "RUB");
  const [type, setType] = useState<TransactionType>(initialValues?.type ?? "expense");
  const [categoryId, setCategoryId] = useState(initialValues?.category_id ?? "");
  const [amount, setAmount] = useState(initialValues?.amount ?? "");
  const [currency, setCurrency] = useState(initialValues?.currency ?? baseCurrency);
  const [dayOfMonth, setDayOfMonth] = useState(String(initialValues?.day_of_month ?? "1"));
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [error, setError] = useState<string | null>(null);

  const { data: categories = [] } = useCategories(type);
  const createMutation = useCreateRecurringRule();
  const updateMutation = useUpdateRecurringRule();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const filteredCategories = categories.filter((c) => c.type === type && !c.is_archived);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: initialValues.id, data: { amount, day_of_month: Number(dayOfMonth), description: description || undefined } });
      } else {
        if (!categoryId) { setError("Выберите категорию"); return; }
        await createMutation.mutateAsync({ category_id: categoryId, type, amount, currency, day_of_month: Number(dayOfMonth), description: description || undefined });
      }
      onClose();
    } catch {
      setError("Ошибка при сохранении");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEditing && (
        <div>
          <label className="label">Тип</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
            <option value="expense">Расход</option>
            <option value="income">Доход</option>
          </select>
        </div>
      )}
      {!isEditing && (
        <div>
          <label className="label">Категория</label>
          <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Выберите категорию</option>
            {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
      )}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="label">Сумма</label>
          <input type="number" min="0" step="0.01" placeholder="0.00" className="input" value={amount} onChange={(e) => { const v = e.target.value; if (/^\d*\.?\d{0,2}$/.test(v) || v === "") setAmount(v); }} required />
        </div>
        {!isEditing && (
          <div>
            <label className="label">Валюта</label>
            <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {SUPPORTED_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>
        )}
      </div>
      <div>
        <label className="label">День месяца (1–28)</label>
        <input type="number" min="1" max="28" placeholder="1" className="input" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} required />
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
