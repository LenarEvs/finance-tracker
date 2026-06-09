import { useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import type { RecurringRule } from "../types";

const mockRules: RecurringRule[] = [
  { id: "1", user_id: "u1", category_id: "4", type: "expense", amount: "899", currency: "RUB", description: "Netflix", day_of_month: 5, is_active: true, next_run_date: "2026-07-05", created_at: "" },
  { id: "2", user_id: "u1", category_id: "7", type: "income", amount: "120000", currency: "RUB", description: "Зарплата", day_of_month: 10, is_active: true, next_run_date: "2026-07-10", created_at: "" },
  { id: "3", user_id: "u1", category_id: "2", type: "expense", amount: "5000", currency: "RUB", description: "Абонемент в спортзал", day_of_month: 1, is_active: false, next_run_date: "2026-07-01", created_at: "" },
  { id: "4", user_id: "u1", category_id: "3", type: "expense", amount: "8500", currency: "RUB", description: "Аренда", day_of_month: 15, is_active: true, next_run_date: "2026-07-15", created_at: "" },
];

export function RecurringRules() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <PageShell title="Повторяющиеся транзакции">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button onClick={() => { setEditId(null); setModalOpen(true); }}>+ Правило</Button>
      </div>

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
            {mockRules.map((rule) => {
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
                    <Button variant="secondary" size="sm" style={{ marginRight: 6 }}>
                      {rule.is_active ? "⏸" : "▶"}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => { setEditId(rule.id); setModalOpen(true); }} style={{ marginRight: 6 }}>✏️</Button>
                    <Button variant="danger" size="sm">🗑</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Редактировать правило" : "Новое правило"}>
        <RuleForm onClose={() => setModalOpen(false)} />
      </Modal>
    </PageShell>
  );
}

function RuleForm({ onClose }: { onClose: () => void }) {
  const inputS: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };
  const fieldS: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 };
  const labelS: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "#374151" };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <div style={fieldS}>
        <label style={labelS}>Тип</label>
        <select style={inputS}>
          <option value="expense">Расход</option>
          <option value="income">Доход</option>
        </select>
      </div>
      <div style={fieldS}>
        <label style={labelS}>Категория</label>
        <select style={inputS}>
          <option value="">Выберите категорию</option>
          <option>Еда</option>
          <option>Транспорт</option>
          <option>ЖКХ</option>
          <option>Зарплата</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={labelS}>Сумма</label>
          <input type="number" min="0" step="0.01" placeholder="0.00" style={inputS} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={labelS}>Валюта</label>
          <select style={inputS}>
            <option>RUB</option>
            <option>USD</option>
            <option>EUR</option>
          </select>
        </div>
      </div>
      <div style={fieldS}>
        <label style={labelS}>День месяца (1–28)</label>
        <input type="number" min="1" max="28" placeholder="1" style={inputS} />
      </div>
      <div style={fieldS}>
        <label style={labelS}>Описание</label>
        <input type="text" placeholder="Необязательно" style={inputS} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Button variant="secondary" type="button" onClick={onClose}>Отмена</Button>
        <Button type="submit">Сохранить</Button>
      </div>
    </form>
  );
}

const td: React.CSSProperties = { padding: "12px 16px", fontSize: 14, color: "#111827" };
