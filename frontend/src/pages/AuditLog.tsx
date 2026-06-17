import { useState } from "react";
import { RotateCcw, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useAuditLog } from "../hooks/useAuditLog";
import type { AuditLog as AuditLogEntry } from "../types";
import { cn } from "../lib/cn";

const ACTION_BADGE: Record<string, string> = {
  CREATE: "bg-emerald-50 text-emerald-700",
  UPDATE: "bg-amber-50 text-amber-700",
  DELETE: "bg-red-50 text-red-700",
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

  const { data, isLoading } = useAuditLog(filters);
  const logs = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.pages ?? 1;

  function resetFilters() {
    setEntityType(""); setAction(""); setFromDate(""); setToDate(""); setPage(1);
  }

  return (
    <PageShell title="Журнал изменений">
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-end">
        <Field label="Тип объекта">
          <select className="input w-auto" value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }}>
            <option value="">Все</option>
            <option value="transaction">Транзакция</option>
            <option value="budget">Бюджет</option>
            <option value="category">Категория</option>
          </select>
        </Field>
        <Field label="Действие">
          <select className="input w-auto" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
            <option value="">Все</option>
            <option value="CREATE">Создание</option>
            <option value="UPDATE">Изменение</option>
            <option value="DELETE">Удаление</option>
          </select>
        </Field>
        <Field label="От">
          <input type="date" className="input w-auto" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} />
        </Field>
        <Field label="До">
          <input type="date" className="input w-auto" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} />
        </Field>
        <Button variant="secondary" size="sm" onClick={resetFilters}>
          <RotateCcw size={13} /> Сбросить
        </Button>
      </div>

      <div className="card overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[600px]">
            <thead className="bg-slate-50">
              <tr>
                {["#", "Время", "Тип объекта", "ID объекта", "Действие", "IP", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 border-b border-slate-100 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="text-center py-10 text-slate-400 text-sm">Загрузка…</td></tr>}
              {!isLoading && logs.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-slate-400 text-sm">Записей не найдено</td></tr>}
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{String(log.id).slice(0, 6)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(log.occurred_at).toLocaleString("ru-RU")}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{ENTITY_LABELS[log.entity_type] ?? log.entity_type}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{log.entity_id.slice(0, 8)}…</td>
                  <td className="px-4 py-3">
                    <span className={cn("badge", ACTION_BADGE[log.action] ?? "bg-slate-100 text-slate-600")}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{log.ip_address ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(log)}>
                      <Eye size={13} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mr-4">
        {!isLoading && `Всего: ${total}`}
      </div>
      <div className="flex items-center justify-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
          <ChevronLeft size={14} /> Пред
        </Button>
        <span className="px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg">
          Страница {page} из {totalPages}
        </span>
        <Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
          След <ChevronRight size={14} />
        </Button>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Детали изменения" width={560}>
        {selected && (
          <div>
            <div className="flex flex-wrap gap-4 text-sm mb-4">
              <div><span className="text-slate-500">Объект: </span><strong>{ENTITY_LABELS[selected.entity_type] ?? selected.entity_type}</strong></div>
              <div>
                <span className="text-slate-500">Действие: </span>
                <span className={cn("badge", ACTION_BADGE[selected.action] ?? "bg-slate-100 text-slate-600")}>{selected.action}</span>
              </div>
              <div><span className="text-slate-500">Время: </span><strong>{new Date(selected.occurred_at).toLocaleString("ru-RU")}</strong></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-2">ДО</div>
                <pre className="m-0 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs overflow-auto max-h-56 whitespace-pre-wrap">
                  {selected.before_data ? JSON.stringify(selected.before_data, null, 2) : "—"}
                </pre>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-2">ПОСЛЕ</div>
                <pre className="m-0 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs overflow-auto max-h-56 whitespace-pre-wrap">
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
    <div className="flex flex-col gap-1">
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
