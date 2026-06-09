import { Button } from "../ui/Button";

interface Props {
  onClose?: () => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb",
  borderRadius: 8, fontSize: 14, outline: "none",
};
const field: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 };
const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "#374151" };

export function BudgetForm({ onClose }: Props) {
  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <div style={field}>
        <label style={labelStyle}>Месяц</label>
        <input type="month" style={inputStyle} />
      </div>
      <div style={field}>
        <label style={labelStyle}>Категория</label>
        <select style={inputStyle}>
          <option value="">Выберите категорию</option>
          <option>Еда</option>
          <option>Транспорт</option>
          <option>ЖКХ</option>
          <option>Развлечения</option>
        </select>
      </div>
      <div style={field}>
        <label style={labelStyle}>Лимит (в базовой валюте)</label>
        <input type="number" min="0" step="0.01" placeholder="0.00" style={inputStyle} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
        <Button variant="secondary" type="button" onClick={onClose}>Отмена</Button>
        <Button type="submit">Сохранить</Button>
      </div>
    </form>
  );
}
