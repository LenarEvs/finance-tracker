import { useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import type { Category, TransactionType } from "../types";

const mockCategories: Category[] = [
  { id: "1", user_id: "u1", name: "Еда", icon: "🍕", color: "#ef4444", type: "expense", is_archived: false, created_at: "" },
  { id: "2", user_id: "u1", name: "Транспорт", icon: "🚗", color: "#f97316", type: "expense", is_archived: false, created_at: "" },
  { id: "3", user_id: "u1", name: "ЖКХ", icon: "🏠", color: "#3b82f6", type: "expense", is_archived: false, created_at: "" },
  { id: "4", user_id: "u1", name: "Развлечения", icon: "🎬", color: "#8b5cf6", type: "expense", is_archived: false, created_at: "" },
  { id: "5", user_id: "u1", name: "Здоровье", icon: "💊", color: "#ec4899", type: "expense", is_archived: false, created_at: "" },
  { id: "6", user_id: "u1", name: "Одежда", icon: "👗", color: "#14b8a6", type: "expense", is_archived: false, created_at: "" },
  { id: "7", user_id: "u1", name: "Зарплата", icon: "💼", color: "#16a34a", type: "income", is_archived: false, created_at: "" },
  { id: "8", user_id: "u1", name: "Фриланс", icon: "💻", color: "#0ea5e9", type: "income", is_archived: false, created_at: "" },
  { id: "9", user_id: "u1", name: "Инвестиции", icon: "📈", color: "#a16207", type: "income", is_archived: false, created_at: "" },
];

type Filter = "all" | TransactionType;

export function Categories() {
  const [filter, setFilter] = useState<Filter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);

  const filtered = filter === "all" ? mockCategories : mockCategories.filter((c) => c.type === filter);

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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14 }}>
        {filtered.map((cat) => (
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
              <Button variant="danger" size="sm">🗑</Button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Редактировать категорию" : "Новая категория"}>
        <CategoryForm defaultValues={editItem} onClose={() => setModalOpen(false)} />
      </Modal>
    </PageShell>
  );
}

function CategoryForm({ defaultValues, onClose }: { defaultValues: Category | null; onClose: () => void }) {
  const inputS: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };
  const fieldS: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 };
  const labelS: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "#374151" };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <div style={fieldS}>
        <label style={labelS}>Название</label>
        <input type="text" defaultValue={defaultValues?.name} placeholder="Название категории" style={inputS} />
      </div>
      <div style={fieldS}>
        <label style={labelS}>Тип</label>
        <select defaultValue={defaultValues?.type ?? "expense"} style={inputS}>
          <option value="expense">Расход</option>
          <option value="income">Доход</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={labelS}>Иконка</label>
          <input type="text" defaultValue={defaultValues?.icon} placeholder="🏷️" maxLength={2} style={{ ...inputS, fontSize: 22, textAlign: "center" }} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={labelS}>Цвет</label>
          <input type="color" defaultValue={defaultValues?.color ?? "#4f46e5"} style={{ ...inputS, padding: 4, height: 40 }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Button variant="secondary" type="button" onClick={onClose}>Отмена</Button>
        <Button type="submit">Сохранить</Button>
      </div>
    </form>
  );
}
