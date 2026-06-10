import { useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useCategories, useCreateCategory, useUpdateCategory, useArchiveCategory } from "../hooks/useCategories";
import type { Category, TransactionType } from "../types";

type Filter = "all" | TransactionType;

export function Categories() {
  const [filter, setFilter] = useState<Filter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);

  const { data: categories = [], isLoading } = useCategories();
  const archiveMutation = useArchiveCategory();

  const filtered = filter === "all" ? categories : categories.filter((c) => c.type === filter);
  const active = filtered.filter((c) => !c.is_archived);

  function openCreate() { setEditItem(null); setModalOpen(true); }
  function openEdit(c: Category) { setEditItem(c); setModalOpen(true); }

  return (
    <PageShell title="Категории">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {(["all", "expense", "income"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{ padding: "6px 16px", borderRadius: 999, border: "1px solid #e5e7eb", background: filter === f ? "#4f46e5" : "#fff", color: filter === f ? "#fff" : "#374151", cursor: "pointer", fontSize: 13, fontWeight: 500 }}
            >
              {f === "all" ? "Все" : f === "expense" ? "Расходы" : "Доходы"}
            </button>
          ))}
        </div>
        <Button onClick={openCreate}>+ Категория</Button>
      </div>

      {isLoading && <div style={{ color: "#9ca3af", textAlign: "center", padding: 32 }}>Загрузка…</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14 }}>
        {active.map((cat) => (
          <div key={cat.id} style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: cat.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                {cat.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{cat.name}</div>
                <div style={{ fontSize: 12, marginTop: 2, color: cat.type === "income" ? "#16a34a" : "#dc2626" }}>
                  {cat.type === "income" ? "Доход" : "Расход"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <Button variant="secondary" size="sm" onClick={() => openEdit(cat)}>✏️</Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => { if (confirm(`Архивировать категорию "${cat.name}"?`)) archiveMutation.mutate(cat.id); }}
              >🗑</Button>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && active.length === 0 && (
        <div style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>Категорий не найдено</div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Редактировать категорию" : "Новая категория"}>
        <CategoryForm defaultValues={editItem} onClose={() => setModalOpen(false)} />
      </Modal>
    </PageShell>
  );
}

function CategoryForm({ defaultValues, onClose }: { defaultValues: Category | null; onClose: () => void }) {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [type, setType] = useState<TransactionType>(defaultValues?.type ?? "expense");
  const [icon, setIcon] = useState(defaultValues?.icon ?? "🏷️");
  const [color, setColor] = useState(defaultValues?.color ?? "#4f46e5");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (defaultValues) {
        await updateMutation.mutateAsync({ id: defaultValues.id, data: { name, icon, color } });
      } else {
        await createMutation.mutateAsync({ name, icon, color, type });
      }
      onClose();
    } catch {
      setError("Ошибка при сохранении");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={fieldS}>
        <label style={labelS}>Название</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Название категории" style={inputS} required />
      </div>
      {!defaultValues && (
        <div style={fieldS}>
          <label style={labelS}>Тип</label>
          <select value={type} onChange={(e) => setType(e.target.value as TransactionType)} style={inputS}>
            <option value="expense">Расход</option>
            <option value="income">Доход</option>
          </select>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={labelS}>Иконка</label>
          <input type="text" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🏷️" maxLength={4} style={{ ...inputS, fontSize: 22, textAlign: "center" }} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={labelS}>Цвет</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ ...inputS, padding: 4, height: 40 }} />
        </div>
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
