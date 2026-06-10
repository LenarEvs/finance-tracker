import { useState } from "react";
import { Plus, RotateCcw, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { TransactionForm } from "../components/forms/TransactionForm";
import { useTransactions, useDeleteTransaction } from "../hooks/useTransactions";
import { useCategories } from "../hooks/useCategories";
import type { Transaction, TransactionType } from "../types";
import { cn } from "../lib/cn";

const PAGE_SIZE = 50;

export function Transactions() {
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Transaction | null>(null);

  const filters = {
    from: fromDate || undefined,
    to: toDate || undefined,
    type: (typeFilter as TransactionType) || undefined,
    category_id: categoryFilter || undefined,
    page,
    limit: PAGE_SIZE,
  };

  const { data: transactions = [], isLoading } = useTransactions(filters);
  const { data: categories = [] } = useCategories();
  const deleteMutation = useDeleteTransaction();

  const displayed = transactions.filter((t) => {
    if (amountMin && Number(t.amount) < Number(amountMin)) return false;
    if (amountMax && Number(t.amount) > Number(amountMax)) return false;
    return true;
  });

  function openCreate() { setEditItem(null); setModalOpen(true); }
  function openEdit(t: Transaction) { setEditItem(t); setModalOpen(true); }

  function resetFilters() {
    setFromDate(""); setToDate(""); setTypeFilter(""); setCategoryFilter("");
    setAmountMin(""); setAmountMax(""); setPage(1);
  }

  function getCategoryName(id: string) {
    const c = categories.find((c) => c.id === id);
    return c ? `${c.icon} ${c.name}` : id.slice(0, 8);
  }

  return (
    <PageShell title="Транзакции">
      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-end">
        <Field label="От">
          <input type="date" className="input w-auto" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} />
        </Field>
        <Field label="До">
          <input type="date" className="input w-auto" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} />
        </Field>
        <Field label="Тип">
          <select className="input w-auto" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">Все</option>
            <option value="income">Доход</option>
            <option value="expense">Расход</option>
          </select>
        </Field>
        <Field label="Категория">
          <select className="input w-auto" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
            <option value="">Все</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </Field>
        <Field label="Сумма от">
          <input type="number" placeholder="0" className="input w-24" value={amountMin} onChange={(e) => setAmountMin(e.target.value)} />
        </Field>
        <Field label="Сумма до">
          <input type="number" placeholder="∞" className="input w-24" value={amountMax} onChange={(e) => setAmountMax(e.target.value)} />
        </Field>
        <Button variant="secondary" size="sm" onClick={resetFilters}>
          <RotateCcw size={13} /> Сбросить
        </Button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-500">
          {isLoading ? "Загрузка…" : `Найдено: ${displayed.length} транзакций`}
        </span>
        <Button size="sm" onClick={openCreate}>
          <Plus size={14} /> Добавить
        </Button>
      </div>

      <div className="card overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[600px]">
            <thead className="bg-slate-50">
              <tr>
                {["Дата", "Тип", "Категория", "Сумма", "Валюта", "Описание", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 border-b border-slate-100 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-sm">Транзакции не найдены</td>
                </tr>
              )}
              {displayed.map((t) => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-700">{t.date}</td>
                  <td className="px-4 py-3">
                    <span className={cn("badge", t.type === "income" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                      {t.type === "income" ? "Доход" : "Расход"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{getCategoryName(t.category_id)}</td>
                  <td className={cn("px-4 py-3 text-sm font-semibold", t.type === "income" ? "text-emerald-600" : "text-red-500")}>
                    {t.type === "income" ? "+" : "−"}{Number(t.amount).toLocaleString("ru-RU")}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{t.currency}</td>
                  <td className="px-4 py-3 text-sm text-slate-400 max-w-[160px] truncate">{t.description || "—"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(t)} className="mr-1">
                      <Pencil size={13} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => { if (confirm("Удалить транзакцию?")) deleteMutation.mutate(t.id); }}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
          <ChevronLeft size={14} /> Пред
        </Button>
        <span className="px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg">
          Страница {page}
        </span>
        <Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)} disabled={transactions.length < PAGE_SIZE}>
          След <ChevronRight size={14} />
        </Button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Редактировать транзакцию" : "Новая транзакция"}>
        <TransactionForm initialValues={editItem ?? undefined} onClose={() => setModalOpen(false)} />
      </Modal>
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-500">{label}</label>
      {children}
    </div>
  );
}
