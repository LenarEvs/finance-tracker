import { useState } from "react";
import { Upload, Download, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { importExportApi } from "../api/importExport";
import type { TransactionFilters } from "../api/transactions";
import { useCategories } from "../hooks/useCategories";

const MAPPING_FIELDS: { key: string; param: string; label: string; required: boolean }[] = [
  { key: "date",        param: "col_date",        label: "Дата",                  required: true },
  { key: "type",        param: "col_type",        label: "Тип (income/expense)",  required: true },
  { key: "amount",      param: "col_amount",      label: "Сумма",                 required: true },
  { key: "currency",    param: "col_currency",    label: "Валюта",                required: true },
  { key: "description", param: "col_description", label: "Описание (необяз.)",    required: false },
];

function parseCSVHeaders(text: string): string[] {
  const firstLine = text.split("\n")[0];
  return firstLine.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
}

export function ImportExport() {
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [exportType, setExportType] = useState("");
  const [exportCategory, setExportCategory] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [dryRun, setDryRun] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: unknown[] } | null>(null);
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
      const headers = parseCSVHeaders(text);
      setCsvHeaders(headers);
      const autoMapping: Record<string, string> = {};
      MAPPING_FIELDS.forEach(({ key }) => {
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
      const response = await importExportApi.exportCsv(params as TransactionFilters);
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
      const colMapping: Record<string, string> = {};
      MAPPING_FIELDS.forEach(({ key, param }) => {
        if (mapping[key]) colMapping[param] = mapping[key];
      });
      const res = await importExportApi.importCsv(file, dryRun, colMapping);
      setImportResult(res.data);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setImportError(detail ?? "Ошибка при импорте. Проверьте формат файла.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <PageShell title="Импорт / Экспорт">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Export */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Download size={16} className="text-indigo-600" />
            </div>
            <h2 className="text-base font-semibold text-slate-800">Экспорт</h2>
          </div>
          <p className="text-sm text-slate-500 mb-5 ml-12">Выгрузка отфильтрованных транзакций в CSV</p>

          <div className="space-y-3">
            <Field label="От"><input type="date" className="input" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} /></Field>
            <Field label="До"><input type="date" className="input" value={exportTo} onChange={(e) => setExportTo(e.target.value)} /></Field>
            <Field label="Тип">
              <select className="input" value={exportType} onChange={(e) => setExportType(e.target.value)}>
                <option value="">Все</option>
                <option value="income">Доходы</option>
                <option value="expense">Расходы</option>
              </select>
            </Field>
            <Field label="Категория">
              <select className="input" value={exportCategory} onChange={(e) => setExportCategory(e.target.value)}>
                <option value="">Все категории</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </Field>
          </div>

          <Button className="w-full justify-center mt-5" onClick={handleExport}>
            <Download size={14} /> Скачать CSV
          </Button>
        </div>

        {/* Import */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Upload size={16} className="text-emerald-600" />
            </div>
            <h2 className="text-base font-semibold text-slate-800">Импорт</h2>
          </div>
          <p className="text-sm text-slate-500 mb-5 ml-12">Загрузка транзакций из CSV с маппингом колонок</p>

          <label className="block cursor-pointer mb-4">
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
              <FileText size={28} className="mx-auto mb-2 text-slate-300" />
              <div className="text-sm text-slate-500">Перетащите CSV или нажмите для выбора</div>
              {file && (
                <div className="mt-2 text-sm text-indigo-600 font-medium flex items-center justify-center gap-1">
                  <CheckCircle2 size={14} /> {file.name}
                </div>
              )}
            </div>
            <input type="file" accept=".csv" hidden onChange={handleFileChange} />
          </label>

          {csvHeaders.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-semibold text-slate-600 mb-3">Маппинг колонок CSV → поля</div>
              <div className="space-y-2">
                {MAPPING_FIELDS.map(({ key, label, required }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 w-40 flex-shrink-0">
                      {label}{required && <span className="text-red-500"> *</span>}
                    </span>
                    <select
                      className="input"
                      value={mapping[key] ?? ""}
                      onChange={(e) => setMapping((m) => ({ ...m, [key]: e.target.value }))}
                    >
                      <option value="">— не выбрано —</option>
                      {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 mb-4 cursor-pointer text-sm text-slate-600">
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="rounded" />
            Тестовый режим (dry-run)
          </label>

          <Button
            className="w-full justify-center"
            disabled={
              !file ||
              importing ||
              (csvHeaders.length > 0 &&
                MAPPING_FIELDS.filter((f) => f.required).some((f) => !mapping[f.key]))
            }
            onClick={handleImport}
          >
            <Upload size={14} /> {importing ? "Загрузка…" : "Загрузить"}
          </Button>

          {importError && (
            <p className="text-red-500 text-xs mt-3 flex items-center gap-1">
              <AlertCircle size={12} /> {importError}
            </p>
          )}

          {importResult && (
            <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm space-y-1">
              <div className="font-semibold text-slate-700 mb-2">
                {dryRun ? "Результат тестового прогона:" : "Результат импорта:"}
              </div>
              <div className="text-emerald-600">✓ Создано: {importResult.created}</div>
              <div className="text-amber-600">⚠ Пропущено: {importResult.skipped}</div>
              {importResult.errors.length > 0 && (
                <div className="mt-2">
                  <div className="text-red-500 font-medium mb-1">Ошибки:</div>
                  {importResult.errors.map((err, i) => (
                    <div key={i} className="text-red-400 text-xs">{String(err)}</div>
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
    <div className="flex flex-col gap-1">
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
