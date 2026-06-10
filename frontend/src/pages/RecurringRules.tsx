import { useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useRecurringRules, useCreateRecurringRule, useUpdateRecurringRule, useDeleteRecurringRule } from "../hooks/useRecurringRules";
import { useCategories } from "../hooks/useCategories";
import type { RecurringRule, TransactionType } from "../types";

const CURRENCIES = ["RUB", "USD", "EUR", "CNY", "GBP"];

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
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button onClick={openCreate}>+ Правило</Button>
      </div>

      {isLoading && <div style={{ color: "#9ca3af", textAlign: "center", padding: 32 }}>Загрузка…</div>}

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              {["Описание", "Тип", "Сумма / Валюта", "День", "Следующий запуск", "Статус", ""].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 12, color: "#6b7280", fontWeight: 500, borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!isLoading && rules.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}>Правила не найдены</td></tr>
            )}
            {rules.map((rule) => {
              const isIncome = rule.type === "income";
              return (
                <tr key={rule.id} style={{ borderBottom: "1px solid #f3f4f6", opacity: rule.is_active ? 1 : 0.55 }}>
                  <td style={td}>{rule.description || "—"}</td>
                  <td style={td}>
                    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: isIncome ? "#dcfce7" : "#fee2e2", color: isIncome ? "#16a34a" : "#dc2626" }}>
                      {isIncome ? "Доход" : "Расход"}
                    </span>
                  </td>
                  <td style={{ ...td, fontWeight: 600, color: isIncome ? "#16a34a" : "#dc2626" }}>
                    {Number(rule.amount).toLocaleString("ru-RU")} {rule.currency}
                  </td>
                  <td style={{ ...td, color: "#6b7280" }}>{rule.day_of_month}-е число</td>
                  <td style={{ ...td, color: "#6b7280" }}>{rule.next_run_date}</td>
                  <td style={td}>
                    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: rule.is_active ? "#dcfce7" : "#f3f4f6", color: rule.is_active ? "#16a34a" : "#6b7280" }}>
                      {rule.is_active ? "Активно" : "Пауза"}
                    </span>
                  </td>
                  <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      style={{ marginRight: 6 }}
                      onClick={() => toggleMutation.mutate({ id: rule.id, data: { is_active: !rule.is_active } })}
                    >
                      {rule.is_active ? "⏸" : "▶"}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => openEdit(rule)} style={{ marginRight: 6 }}>✏️</Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => { if (confirm("Удалить правило?")) deleteMutation.mutate(rule.id); }}
                    >🗑</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Редактировать правило" : "Новое правило"}>
        <RuleForm initialValues={editItem} onClose={() => setModalOpen(false)} />
      </Modal>
    </PageShell>
  );
}

function RuleForm({ initialValues, onClose }: { initialValues: RecurringRule | null; onClose: () => void }) {
  const isEditing = !!initialValues;
  const [type, setType] = useState<TransactionType>(initialValues?.type ?? "expense");
  const [categoryId, setCategoryId] = useState(initialValues?.category_id ?? "");
  const [amount, setAmount] = useState(initialValues?.amount ?? "");
  const [currency, setCurrency] = useState(initialValues?.currency ?? "RUB");
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
    <form onSubmit={handleSubmit}>
      {!isEditing && (
        <div style={fieldS}>
          <label style={labelS}>Тип</label>
          <select style={inputS} value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
            <option value="expense">Расход</option>
            <option value="income">Доход</option>
          </select>
        </div>
      )}
      {!isEditing && (
        <div style={fieldS}>
          <label style={labelS}>Категория</label>
          <select style={inputS} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Выберите категорию</option>
            {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={labelS}>Сумма</label>
          <input type="number" min="0" step="0.01" placeholder="0.00" style={inputS} value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        {!isEditing && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={labelS}>Валюта</label>
            <select style={inputS} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>
      <div style={fieldS}>
        <label style={labelS}>День месяца (1–28)</label>
        <input type="number" min="1" max="28" placeholder="1" style={inputS} value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} required />
      </div>
      <div style={fieldS}>
        <label style={labelS}>Описание</label>
        <input type="text" placeholder="Необязательно" style={inputS} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 8 }}>{error}</p>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Button variant="secondary" type="button" onClick={onClose}>Отмена</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? "Сохранение…" : "Сохранить"}</Button>
      </div>
    </form>
  );
}

const inputS: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };
const fieldS: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 };
const labelS: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "#374151" };
const td: React.CSSProperties = { padding: "12px 16px", fontSize: 14, color: "#111827" };
