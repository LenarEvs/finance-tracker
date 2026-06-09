import { useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import type { AuditLog as AuditLogEntry } from "../types";

const mockLogs: AuditLogEntry[] = [
  { id: 1, user_id: "u1", entity_type: "transaction", entity_id: "aaaa-1111", action: "CREATE", before_data: null, after_data: { amount: "1250", type: "expense", category: "Еда" }, ip_address: "127.0.0.1", occurred_at: "2026-06-08T14:22:00Z" },
  { id: 2, user_id: "u1", entity_type: "transaction", entity_id: "aaaa-1111", action: "UPDATE", before_data: { amount: "1250" }, after_data: { amount: "1500" }, ip_address: "127.0.0.1", occurred_at: "2026-06-08T15:10:00Z" },
  { id: 3, user_id: "u1", entity_type: "budget", entity_id: "bbbb-2222", action: "CREATE", before_data: null, after_data: { amount: "30000", category_id: "1" }, ip_address: "127.0.0.1", occurred_at: "2026-06-07T09:00:00Z" },
  { id: 4, user_id: "u1", entity_type: "transaction", entity_id: "cccc-3333", action: "DELETE", before_data: { amount: "500", type: "expense" }, after_data: null, ip_address: "127.0.0.1", occurred_at: "2026-06-06T11:30:00Z" },
  { id: 5, user_id: "u1", entity_type: "category", entity_id: "dddd-4444", action: "UPDATE", before_data: { name: "Еда" }, after_data: { name: "Продукты" }, ip_address: "192.168.1.1", occurred_at: "2026-06-05T18:45:00Z" },
];

const ACTION_STYLE: Record<string, { bg: string; color: string }> = {
  CREATE: { bg: "#dcfce7", color: "#16a34a" },
  UPDATE: { bg: "#fef9c3", color: "#ca8a04" },
  DELETE: { bg: "#fee2e2", color: "#dc2626" },
};

const ENTITY_LABELS: Record<string, string> = {
  transaction: "Транзакция",
  budget: "Бюджет",
  category: "Категория",
  recurring_rule: "Правило",
};

export function AuditLog() {
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  return (
    <PageShell title="Журнал изменений">
      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
        <Field label="Тип объекта">
          <select style={filterInput}>
            <option value="">Все</option>
            <option value="transaction">Транзакция</option>
            <option value="budget">Бюджет</option>
            <option value="category">Категория</option>
          </select>
        </Field>
        <Field label="Действие">
          <select style={filterInput}>
            <option value="">Все</option>
            <option value="CREATE">Создание</option>
            <option value="UPDATE">Изменение</option>
            <option value="DELETE">Удаление</option>
          </select>
        </Field>
        <Field label="От"><input type="date" style={filterInput} /></Field>
        <Field label="До"><input type="date" style={filterInput} /></Field>
        <Button variant="secondary">Сбросить</Button>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              {["#", "Время", "Тип объекта", "ID объекта", "Действие", "IP", ""].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 12, color: "#6b7280", fontWeight: 500, borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockLogs.map((log) => {
              const as = ACTION_STYLE[log.action];
              return (
                <tr key={log.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ ...td, color: "#9ca3af" }}>{log.id}</td>
                  <td style={{ ...td, color: "#6b7280", fontSize: 12, whiteSpace: "nowrap" }}>
                    {new Date(log.occurred_at).toLocaleString("ru-RU")}
                  </td>
                  <td style={td}>{ENTITY_LABELS[log.entity_type] ?? log.entity_type}</td>
                  <td style={{ ...td, fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>
                    {log.entity_id.slice(0, 8)}…
                  </td>
                  <td style={td}>
                    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600, ...as }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ ...td, fontSize: 12, color: "#9ca3af" }}>{log.ip_address}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <Button variant="secondary" size="sm" onClick={() => setSelected(log)}>Детали</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16, alignItems: "center" }}>
        <Button variant="secondary" size="sm">← Пред</Button>
        <span style={{ padding: "5px 12px", fontSize: 13, color: "#374151" }}>Страница 1 из 1</span>
        <Button variant="secondary" size="sm">След →</Button>
      </div>

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Детали изменения" width={560}>
        {selected && (
          <div>
            <div style={{ display: "flex", gap: 16, fontSize: 13, marginBottom: 16, flexWrap: "wrap" }}>
              <div><span style={{ color: "#6b7280" }}>Объект: </span><strong>{ENTITY_LABELS[selected.entity_type] ?? selected.entity_type}</strong></div>
              <div>
                <span style={{ color: "#6b7280" }}>Действие: </span>
                <span style={{ fontWeight: 700, ...ACTION_STYLE[selected.action], padding: "1px 6px", borderRadius: 6 }}>{selected.action}</span>
              </div>
              <div><span style={{ color: "#6b7280" }}>Время: </span><strong>{new Date(selected.occurred_at).toLocaleString("ru-RU")}</strong></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>ДО</div>
                <pre style={{ margin: 0, background: "#f3f4f6", borderRadius: 8, padding: 12, fontSize: 12, overflow: "auto", maxHeight: 220, whiteSpace: "pre-wrap" }}>
                  {selected.before_data ? JSON.stringify(selected.before_data, null, 2) : "—"}
                </pre>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>ПОСЛЕ</div>
                <pre style={{ margin: 0, background: "#f3f4f6", borderRadius: 8, padding: 12, fontSize: 12, overflow: "auto", maxHeight: 220, whiteSpace: "pre-wrap" }}>
                  {selected.after_data ? JSON.stringify(selected.after_data, null, 2) : "—"}
                </pre>
              </div>
            </div>
          </div>
        )}
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

const td: React.CSSProperties = { padding: "12px 16px", fontSize: 14, color: "#111827" };
const filterInput: React.CSSProperties = { padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };
