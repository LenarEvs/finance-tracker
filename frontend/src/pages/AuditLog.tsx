import { useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useAuditLog } from "../hooks/useAuditLog";
import type { AuditLog as AuditLogEntry } from "../types";

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

const PAGE_SIZE = 50;

export function AuditLog() {
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const filters = {
    entity_type: entityType || undefined,
    action: action || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
    page,
    limit: PAGE_SIZE,
  };

  const { data: logs = [], isLoading } = useAuditLog(filters);

  function resetFilters() {
    setEntityType(""); setAction(""); setFromDate(""); setToDate(""); setPage(1);
  }

  return (
    <PageShell title="Журнал изменений">
      <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
        <Field label="Тип объекта">
          <select style={filterInput} value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }}>
            <option value="">Все</option>
            <option value="transaction">Транзакция</option>
            <option value="budget">Бюджет</option>
            <option value="category">Категория</option>
          </select>
        </Field>
        <Field label="Действие">
          <select style={filterInput} value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
            <option value="">Все</option>
            <option value="CREATE">Создание</option>
            <option value="UPDATE">Изменение</option>
            <option value="DELETE">Удаление</option>
          </select>
        </Field>
        <Field label="От"><input type="date" style={filterInput} value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} /></Field>
        <Field label="До"><input type="date" style={filterInput} value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} /></Field>
        <Button variant="secondary" onClick={resetFilters}>Сбросить</Button>
      </div>

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
            {isLoading && <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}>Загрузка…</td></tr>}
            {!isLoading && logs.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}>Записей не найдено</td></tr>}
            {logs.map((log) => {
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
                  <td style={{ ...td, fontSize: 12, color: "#9ca3af" }}>{log.ip_address ?? "—"}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <Button variant="secondary" size="sm" onClick={() => setSelected(log)}>Детали</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16, alignItems: "center" }}>
        <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Пред</Button>
        <span style={{ padding: "5px 12px", fontSize: 13, color: "#374151" }}>Страница {page}</span>
        <Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)} disabled={logs.length < PAGE_SIZE}>След →</Button>
      </div>

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
