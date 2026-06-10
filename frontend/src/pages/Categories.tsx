import { useState } from "react";
import { Plus, Pencil, Archive } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useCategories, useCreateCategory, useUpdateCategory, useArchiveCategory } from "../hooks/useCategories";
import type { Category, TransactionType } from "../types";
import { cn } from "../lib/cn";

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

  const filterLabels: Record<Filter, string> = { all: "Все", expense: "Расходы", income: "Доходы" };

  return (
    <PageShell title="Категории">
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1.5">
          {(["all", "expense", "income"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
                filter === f
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300",
              )}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={14} /> Категория
        </Button>
      </div>

      {isLoading && <div className="text-slate-400 text-center py-10">Загрузка…</div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {active.map((cat) => (
          <div key={cat.id} className="card p-4 group">
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: cat.color + "22" }}
              >
                {cat.icon}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-slate-800 truncate">{cat.name}</div>
                <div className={cn("text-xs mt-0.5 font-medium", cat.type === "income" ? "text-emerald-600" : "text-red-500")}>
                  {cat.type === "income" ? "Доход" : "Расход"}
                </div>
              </div>
            </div>
            <div className="flex gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
                <Pencil size={12} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-600 hover:bg-red-50"
                onClick={() => { if (confirm(`Архивировать "${cat.name}"?`)) archiveMutation.mutate(cat.id); }}
              >
                <Archive size={12} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && active.length === 0 && (
        <div className="text-slate-400 text-center py-16">Категорий не найдено</div>
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Название</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Название категории" className="input" required />
      </div>
      {!defaultValues && (
        <div>
          <label className="label">Тип</label>
          <select value={type} onChange={(e) => setType(e.target.value as TransactionType)} className="input">
            <option value="expense">Расход</option>
            <option value="income">Доход</option>
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Иконка</label>
          <input type="text" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🏷️" maxLength={4} className="input text-center text-xl" />
        </div>
        <div>
          <label className="label">Цвет</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="input h-10 p-1 cursor-pointer" />
        </div>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" type="button" onClick={onClose}>Отмена</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? "Сохранение…" : "Сохранить"}</Button>
      </div>
    </form>
  );
}
