import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Lock, Globe, Check, AlertTriangle } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useAuthStore } from "../store/authStore";
import { usersApi } from "../api/users";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "../lib/currency";
import { cn } from "../lib/cn";

type Tab = "profile" | "security" | "currency";

export function Settings() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const currentCurrency = user?.base_currency ?? "RUB";

  // Currency change form
  const [pendingCurrency, setPendingCurrency] = useState<string | null>(null);
  const [conversionRate, setConversionRate] = useState("");
  const [currencyError, setCurrencyError] = useState("");

  // Profile form
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  function flash(msg: string, isError = false) {
    setSuccessMsg(isError ? "" : msg);
    setErrorMsg(isError ? msg : "");
    setTimeout(() => { setSuccessMsg(""); setErrorMsg(""); }, 3500);
  }

  const updateMutation = useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: (res) => {
      setUser(res.data);
      flash("Сохранено");
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      flash(err.response?.data?.detail ?? "Ошибка при сохранении", true);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: usersApi.changePassword,
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
      flash("Пароль изменён");
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      flash(err.response?.data?.detail ?? "Ошибка при смене пароля", true);
    },
  });

  function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate({ full_name: fullName || null, email });
  }

  function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("Пароли не совпадают");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Пароль должен быть не менее 6 символов");
      return;
    }
    setPasswordError("");
    passwordMutation.mutate({ current_password: currentPassword, new_password: newPassword });
  }

  const changeCurrencyMutation = useMutation({
    mutationFn: usersApi.changeCurrency,
    onSuccess: (res) => {
      setUser(res.data);
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
      setPendingCurrency(null);
      setConversionRate("");
      setCurrencyError("");
      flash("Валюта изменена, суммы пересчитаны");
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setCurrencyError(err.response?.data?.detail ?? "Ошибка при смене валюты");
    },
  });

  function handleCurrencyClick(code: string) {
    if (code === currentCurrency) return;
    setPendingCurrency(code);
    setConversionRate("");
    setCurrencyError("");
  }

  function handleCurrencyConfirm(e: React.FormEvent) {
    e.preventDefault();
    const rate = Number(conversionRate.replace(",", "."));
    if (!conversionRate || !(rate > 0)) {
      setCurrencyError("Введите курс больше нуля");
      return;
    }
    setCurrencyError("");
    changeCurrencyMutation.mutate({
      base_currency: pendingCurrency!,
      conversion_rate: conversionRate.replace(",", "."),
    });
  }

  const tabs = [
    { id: "profile" as Tab, label: "Профиль", icon: User },
    { id: "security" as Tab, label: "Безопасность", icon: Lock },
    { id: "currency" as Tab, label: "Валюта", icon: Globe },
  ];

  return (
    <PageShell title="Настройки">
      {/* Flash messages */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-700">
          <Check size={14} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="flex gap-6 flex-col sm:flex-row">
        {/* Tabs */}
        <aside className="sm:w-44 flex-shrink-0">
          <nav className="flex sm:flex-col gap-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left w-full",
                  activeTab === id
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100",
                )}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 card p-6 max-w-lg">
          {/* Profile tab */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSave} className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-800 mb-4">Профиль</h2>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Имя</label>
                <input
                  className="input w-full"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ваше имя"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Email</label>
                <input
                  type="email"
                  className="input w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Сохранение…" : "Сохранить"}
              </Button>
            </form>
          )}

          {/* Security tab */}
          {activeTab === "security" && (
            <form onSubmit={handlePasswordSave} className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-800 mb-4">Смена пароля</h2>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Текущий пароль</label>
                <input
                  type="password"
                  className="input w-full"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Новый пароль</label>
                <input
                  type="password"
                  className="input w-full"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Повторите новый пароль</label>
                <input
                  type="password"
                  className="input w-full"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {passwordError && (
                <p className="text-xs text-red-500">{passwordError}</p>
              )}
              <Button type="submit" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending ? "Сохранение…" : "Изменить пароль"}
              </Button>
            </form>
          )}

          {/* Currency tab */}
          {activeTab === "currency" && (
            <div>
              <h2 className="text-sm font-semibold text-slate-800 mb-1">Базовая валюта</h2>
              <p className="text-xs text-slate-400 mb-4">
                Применяется к Дашборду и Бюджетам. Транзакции остаются в своей исходной валюте.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SUPPORTED_CURRENCIES.map(({ code, symbol, name }) => {
                  const isActive = currentCurrency === code;
                  return (
                    <button
                      key={code}
                      onClick={() => handleCurrencyClick(code)}
                      disabled={changeCurrencyMutation.isPending}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-colors text-left",
                        isActive
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700",
                      )}
                    >
                      <span className="text-lg w-6 text-center">{symbol}</span>
                      <div>
                        <div className="font-medium leading-tight">{code}</div>
                        <div className="text-xs text-slate-400 leading-tight">{name}</div>
                      </div>
                      {isActive && <Check size={13} className="ml-auto text-indigo-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Currency change confirmation modal */}
      <Modal
        open={pendingCurrency !== null}
        onClose={() => { setPendingCurrency(null); setCurrencyError(""); }}
        title="Смена базовой валюты"
      >
        {pendingCurrency && (
          <form onSubmit={handleCurrencyConfirm} className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 border border-amber-200 px-3.5 py-3 text-xs text-amber-800">
              <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
              <span>
                Суммы во всех бюджетах и на дашборде будут пересчитаны по указанному курсу.
                Сами транзакции (сумма и валюта каждой операции) изменены не будут.
              </span>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Курс: 1 {pendingCurrency} ({getCurrencySymbol(pendingCurrency)}) = ? {currentCurrency} ({getCurrencySymbol(currentCurrency)})
              </label>
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                className="input w-full"
                placeholder="например, 73.36"
                value={conversionRate}
                onChange={(e) => setConversionRate(e.target.value)}
              />
            </div>
            {currencyError && <p className="text-xs text-red-500">{currencyError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="secondary"
                type="button"
                onClick={() => { setPendingCurrency(null); setCurrencyError(""); }}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={changeCurrencyMutation.isPending}>
                {changeCurrencyMutation.isPending ? "Применение…" : "Подтвердить"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </PageShell>
  );
}
