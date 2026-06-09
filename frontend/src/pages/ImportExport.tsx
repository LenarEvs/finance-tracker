import { useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";

const COLUMN_FIELDS = ["Дата", "Тип", "Сумма", "Валюта", "Категория", "Описание"];

export function ImportExport() {
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(true);

  return (
    <PageShell title="Импорт / Экспорт">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>

        {/* Export */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>📤</span>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>Экспорт</h2>
          </div>
          <p style={{ margin: "4px 0 20px", fontSize: 13, color: "#6b7280" }}>Выгрузка отфильтрованных транзакций в CSV</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="От"><input type="date" style={inputStyle} /></Field>
            <Field label="До"><input type="date" style={inputStyle} /></Field>
            <Field label="Тип">
              <select style={inputStyle}>
                <option value="">Все</option>
                <option value="income">Доходы</option>
                <option value="expense">Расходы</option>
              </select>
            </Field>
            <Field label="Категория">
              <select style={inputStyle}>
                <option value="">Все категории</option>
                <option>Еда</option>
                <option>Транспорт</option>
                <option>ЖКХ</option>
              </select>
            </Field>
          </div>

          <Button style={{ marginTop: 20, width: "100%", justifyContent: "center" }}>
            ⬇️ Скачать CSV
          </Button>
        </div>

        {/* Import */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>📥</span>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>Импорт</h2>
          </div>
          <p style={{ margin: "4px 0 20px", fontSize: 13, color: "#6b7280" }}>Загрузка транзакций из CSV с маппингом колонок</p>

          <label style={{ display: "block" }}>
            <div
              style={{ border: "2px dashed #d1d5db", borderRadius: 10, padding: "28px 20px", textAlign: "center", cursor: "pointer", background: "#f9fafb", marginBottom: 16 }}
              onDragOver={(e) => e.preventDefault()}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
              <div style={{ fontSize: 14, color: "#6b7280" }}>Перетащите CSV или нажмите для выбора</div>
              {file && <div style={{ marginTop: 8, fontSize: 13, color: "#4f46e5", fontWeight: 500 }}>✅ {file.name}</div>}
            </div>
            <input type="file" accept=".csv" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>Маппинг колонок</div>
            {COLUMN_FIELDS.map((label) => (
              <div key={label} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "#6b7280", width: 80, flexShrink: 0 }}>{label}</span>
                <select style={{ ...inputStyle, flex: 1 }}>
                  <option value="">— не выбрано —</option>
                  <option>Колонка A</option>
                  <option>Колонка B</option>
                  <option>Колонка C</option>
                  <option>Колонка D</option>
                  <option>Колонка E</option>
                </select>
              </div>
            ))}
          </div>

          <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, cursor: "pointer", fontSize: 13, color: "#374151" }}>
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
            Тестовый режим (dry-run) — просмотр без сохранения
          </label>

          <Button style={{ width: "100%", justifyContent: "center" }} disabled={!file}>
            ⬆️ Загрузить
          </Button>
        </div>
      </div>
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

const inputStyle: React.CSSProperties = { padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", width: "100%" };
