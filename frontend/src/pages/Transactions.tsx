import { useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { TransactionForm } from "../components/forms/TransactionForm";
import { useTransactions, useDeleteTransaction } from "../hooks/useTransactions";
import { useCategories } from "../hooks/useCategories";
import type { Transaction, TransactionType } from "../types";

const PAGE_SIZE = 50;

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
      <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
        <Field label="От"><input type="date" style={inputS} value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} /></Field>
        <Field label="До"><input type="date" style={inputS} value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} /></Field>
        <Field label="Тип">
          <select style={inputS} value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">Все</option>
            <option value="income">Доход</option>
            <option value="expense">Расход</option>
          </select>
        </Field>
        <Field label="Категория">
          <select style={inputS} value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
            <option value="">Все</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </Field>
        <Field label="Сумма от"><input type="number" placeholder="0" style={{ ...inputS, width: 90 }} value={amountMin} onChange={(e) => setAmountMin(e.target.value)} /></Field>
        <Field label="Сумма до"><input type="number" placeholder="∞" style={{ ...inputS, width: 90 }} value={amountMax} onChange={(e) => setAmountMax(e.target.value)} /></Field>
        <Button variant="secondary" onClick={resetFilters}>Сбросить</Button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "#6b7280" }}>
          {isLoading ? "Загрузка…" : `Найдено: ${displayed.length} транзакций`}
        </span>
        <Button onClick={openCreate}>+ Добавить</Button>
      </div>

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
            {displayed.length === 0 && !isLoading && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}>Транзакции не найдены</td></tr>
            )}
            {displayed.map((t) => (
              <tr key={t.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={td}>{t.date}</td>
                <td style={td}><span style={typeBadge(t.type)}>{t.type === "income" ? "Доход" : "Расход"}</span></td>
                <td style={td}>{getCategoryName(t.category_id)}</td>
                <td style={{ ...td, fontWeight: 600, color: t.type === "income" ? "#16a34a" : "#dc2626" }}>
                  {t.type === "income" ? "+" : "−"}{Number(t.amount).toLocaleString("ru-RU")}
                </td>
                <td style={{ ...td, color: "#6b7280" }}>{t.currency}</td>
                <td style={{ ...td, color: "#6b7280" }}>{t.description || "—"}</td>
                <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                  <Button variant="secondary" size="sm" onClick={() => openEdit(t)} style={{ marginRight: 6 }}>✏️</Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => { if (confirm("Удалить транзакцию?")) deleteMutation.mutate(t.id); }}
                  >🗑</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16, alignItems: "center" }}>
        <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Пред</Button>
        <span style={{ padding: "5px 12px", fontSize: 13, color: "#374151" }}>Страница {page}</span>
        <Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)} disabled={transactions.length < PAGE_SIZE}>След →</Button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Редактировать транзакцию" : "Новая транзакция"}>
        <TransactionForm
          initialValues={editItem ?? undefined}
          onClose={() => setModalOpen(false)}
        />
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

const inputS: React.CSSProperties = { padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };
const td: React.CSSProperties = { padding: "12px 16px", fontSize: 14, color: "#111827" };
