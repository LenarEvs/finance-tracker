import { useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { TransactionForm } from "../components/forms/TransactionForm";

const mockTransactions = [
  { id: "1", date: "2026-06-08", type: "expense", category: "🍕 Еда", amount: "1250", currency: "RUB", description: "Супермаркет" },
  { id: "2", date: "2026-06-07", type: "income", category: "💼 Зарплата", amount: "120000", currency: "RUB", description: "Зарплата за май" },
  { id: "3", date: "2026-06-06", type: "expense", category: "🚗 Транспорт", amount: "450", currency: "RUB", description: "Метро" },
  { id: "4", date: "2026-06-05", type: "expense", category: "🎬 Развлечения", amount: "800", currency: "RUB", description: "Кино" },
  { id: "5", date: "2026-06-04", type: "expense", category: "🏠 ЖКХ", amount: "5200", currency: "RUB", description: "Квартплата" },
  { id: "6", date: "2026-06-03", type: "expense", category: "🍕 Еда", amount: "3200", currency: "RUB", description: "Ресторан" },
  { id: "7", date: "2026-06-02", type: "income", category: "💻 Фриланс", amount: "45000", currency: "USD", description: "Проект X" },
];

function typeBadge(type: string) {
  const isIncome = type === "income";
  return {
    display: "inline-block" as const,
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    background: isIncome ? "#dcfce7" : "#fee2e2",
    color: isIncome ? "#16a34a" : "#dc2626",
  };
}

export function Transactions() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  function openCreate() { setEditId(null); setModalOpen(true); }
  function openEdit(id: string) { setEditId(id); setModalOpen(true); }

  return (
    <PageShell title="Транзакции">
      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
        <Field label="От"><input type="date" style={input} /></Field>
        <Field label="До"><input type="date" style={input} /></Field>
        <Field label="Тип">
          <select style={input}>
            <option value="">Все</option>
            <option value="income">Доход</option>
            <option value="expense">Расход</option>
          </select>
        </Field>
        <Field label="Категория">
          <select style={input}>
            <option value="">Все</option>
            <option>Еда</option>
            <option>Транспорт</option>
            <option>ЖКХ</option>
            <option>Развлечения</option>
          </select>
        </Field>
        <Field label="Сумма от"><input type="number" placeholder="0" style={{ ...input, width: 90 }} /></Field>
        <Field label="Сумма до"><input type="number" placeholder="∞" style={{ ...input, width: 90 }} /></Field>
        <Button variant="secondary">Сбросить</Button>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "#6b7280" }}>Найдено: {mockTransactions.length} транзакций</span>
        <Button onClick={openCreate}>+ Добавить</Button>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              {["Дата", "Тип", "Категория", "Сумма", "Валюта", "Описание", ""].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 12, color: "#6b7280", fontWeight: 500, borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockTransactions.map((t) => (
              <tr key={t.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={td}>{t.date}</td>
                <td style={td}><span style={typeBadge(t.type)}>{t.type === "income" ? "Доход" : "Расход"}</span></td>
                <td style={td}>{t.category}</td>
                <td style={{ ...td, fontWeight: 600, color: t.type === "income" ? "#16a34a" : "#dc2626" }}>
                  {t.type === "income" ? "+" : "−"}{Number(t.amount).toLocaleString("ru-RU")}
                </td>
                <td style={{ ...td, color: "#6b7280" }}>{t.currency}</td>
                <td style={{ ...td, color: "#6b7280" }}>{t.description}</td>
                <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                  <Button variant="secondary" size="sm" onClick={() => openEdit(t.id)} style={{ marginRight: 6 }}>✏️</Button>
                  <Button variant="danger" size="sm">🗑</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16, alignItems: "center" }}>
        <Button variant="secondary" size="sm">← Пред</Button>
        <span style={{ padding: "5px 12px", fontSize: 13, color: "#374151" }}>Страница 1 из 4</span>
        <Button variant="secondary" size="sm">След →</Button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Редактировать транзакцию" : "Новая транзакция"}>
        <TransactionForm onClose={() => setModalOpen(false)} />
      </Modal>
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, color: "#6b7280" }}>{label}</label>
      {children}
    </div>
  );
}

const input: React.CSSProperties = { padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };
const td: React.CSSProperties = { padding: "12px 16px", fontSize: 14, color: "#111827" };
