import { useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { importExportApi } from "../api/importExport";
import { useCategories } from "../hooks/useCategories";

const REQUIRED_FIELDS: { key: string; label: string; required: boolean }[] = [
  { key: "date", label: "Дата", required: true },
  { key: "type", label: "Тип (income/expense)", required: true },
  { key: "amount", label: "Сумма", required: true },
  { key: "currency", label: "Валюта", required: true },
  { key: "category_id", label: "ID категории", required: true },
  { key: "exchange_rate", label: "Курс (необяз.)", required: false },
  { key: "description", label: "Описание (необяз.)", required: false },
];

function parseCSVHeaders(text: string): string[] {
  const firstLine = text.split("\n")[0];
  return firstLine.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
}

function remapCSV(originalText: string, headers: string[], mapping: Record<string, string>): string {
  const lines = originalText.split("\n").filter((l) => l.trim());
  const dataRows = lines.slice(1);

  const fieldKeys = REQUIRED_FIELDS.map((f) => f.key);
  const newHeader = fieldKeys.join(",");

  const newRows = dataRows.map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    return fieldKeys.map((field) => {
      const csvCol = mapping[field];
      if (!csvCol) return "";
      const idx = headers.indexOf(csvCol);
      return idx >= 0 ? cols[idx] ?? "" : "";
    }).join(",");
  });

  return [newHeader, ...newRows].join("\n");
}

export function ImportExport() {
  // Export state
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [exportType, setExportType] = useState("");
  const [exportCategory, setExportCategory] = useState("");

  // Import state
  const [file, setFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [dryRun, setDryRun] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: { row: number; error: string }[] } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const { data: categories = [] } = useCategories();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setImportResult(null);
    setImportError(null);
    if (!f) { setCsvHeaders([]); setMapping({}); return; }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setFileText(text);
      const headers = parseCSVHeaders(text);
      setCsvHeaders(headers);
      const autoMapping: Record<string, string> = {};
      REQUIRED_FIELDS.forEach(({ key }) => {
        const match = headers.find((h) => h.toLowerCase() === key.toLowerCase());
        if (match) autoMapping[key] = match;
      });
      setMapping(autoMapping);
    };
    reader.readAsText(f);
  }

  async function handleExport() {
    const params: Record<string, string> = {};
    if (exportFrom) params.from = exportFrom;
    if (exportTo) params.to = exportTo;
    if (exportType) params.type = exportType;
    if (exportCategory) params.category_id = exportCategory;

    try {
      const response = await importExportApi.exportCsv(params as any);
      const url = URL.createObjectURL(response.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "transactions.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Ошибка при экспорте");
    }
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      let csvContent: string;
      const hasMapping = Object.values(mapping).some(Boolean);
      if (hasMapping) {
        csvContent = remapCSV(fileText, csvHeaders, mapping);
        const blob = new Blob([csvContent], { type: "text/csv" });
        const remappedFile = new File([blob], "import.csv", { type: "text/csv" });
        const res = await importExportApi.importCsv(remappedFile, dryRun);
        setImportResult(res.data);
      } else {
        const res = await importExportApi.importCsv(file, dryRun);
        setImportResult(res.data);
      }
    } catch {
      setImportError("Ошибка при импорте. Проверьте формат файла.");
    } finally {
      setImporting(false);
    }
  }

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
            <Field label="От"><input type="date" style={inputStyle} value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} /></Field>
            <Field label="До"><input type="date" style={inputStyle} value={exportTo} onChange={(e) => setExportTo(e.target.value)} /></Field>
            <Field label="Тип">
              <select style={inputStyle} value={exportType} onChange={(e) => setExportType(e.target.value)}>
                <option value="">Все</option>
                <option value="income">Доходы</option>
                <option value="expense">Расходы</option>
              </select>
            </Field>
            <Field label="Категория">
              <select style={inputStyle} value={exportCategory} onChange={(e) => setExportCategory(e.target.value)}>
                <option value="">Все категории</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </Field>
          </div>

          <Button style={{ marginTop: 20, width: "100%", justifyContent: "center" }} onClick={handleExport}>
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
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
              <div style={{ fontSize: 14, color: "#6b7280" }}>Перетащите CSV или нажмите для выбора</div>
              {file && <div style={{ marginTop: 8, fontSize: 13, color: "#4f46e5", fontWeight: 500 }}>✅ {file.name}</div>}
            </div>
            <input type="file" accept=".csv" hidden onChange={handleFileChange} />
          </label>

          {csvHeaders.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>Маппинг колонок CSV → поля</div>
              {REQUIRED_FIELDS.map(({ key, label, required }) => (
                <div key={key} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: required ? "#374151" : "#6b7280", width: 160, flexShrink: 0 }}>
                    {label}{required && <span style={{ color: "#dc2626" }}> *</span>}
                  </span>
                  <select
                    style={{ ...inputStyle, flex: 1 }}
                    value={mapping[key] ?? ""}
                    onChange={(e) => setMapping((m) => ({ ...m, [key]: e.target.value }))}
                  >
                    <option value="">— не выбрано —</option>
                    {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}

          {csvHeaders.length === 0 && file && (
            <div style={{ marginBottom: 16, fontSize: 13, color: "#6b7280" }}>
              Ожидаемые колонки: id, date, type, amount, currency, exchange_rate, category_id, description
            </div>
          )}

          <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, cursor: "pointer", fontSize: 13, color: "#374151" }}>
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
            Тестовый режим (dry-run) — просмотр без сохранения
          </label>

          <Button style={{ width: "100%", justifyContent: "center" }} disabled={!file || importing} onClick={handleImport}>
            {importing ? "Загрузка…" : "⬆️ Загрузить"}
          </Button>

          {importError && <p style={{ color: "#dc2626", fontSize: 13, marginTop: 10 }}>{importError}</p>}

          {importResult && (
            <div style={{ marginTop: 16, padding: 14, background: "#f9fafb", borderRadius: 8, fontSize: 13 }}>
              <div style={{ fontWeight: 600, marginBottom: 6, color: "#111827" }}>
                {dryRun ? "Результат тестового прогона:" : "Результат импорта:"}
              </div>
              <div style={{ color: "#16a34a" }}>✅ Создано/будет создано: {importResult.created}</div>
              <div style={{ color: "#f97316" }}>⚠️ Пропущено: {importResult.skipped}</div>
              {importResult.errors.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ color: "#dc2626", fontWeight: 500, marginBottom: 4 }}>Ошибки:</div>
                  {importResult.errors.map((err, i) => (
                    <div key={i} style={{ color: "#dc2626", fontSize: 12 }}>Строка {err.row}: {err.error}</div>
                  ))}
                </div>
              )}
            </div>
          )}
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
