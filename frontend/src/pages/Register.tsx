import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import apiClient from "../api/client";
import type { User } from "../types";

export function Register() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await authApi.register(email, password, fullName || undefined);
      setTokens(data.access_token, data.refresh_token);
      const { data: user } = await apiClient.get<User>("/users/me");
      setUser(user);
      navigate("/dashboard");
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status;
      setError(status === 409 ? "Email уже зарегистрирован" : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: "80px auto", padding: "0 16px" }}>
      <h1>Регистрация</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="text"
          placeholder="Имя (необязательно)"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={{ padding: 8, fontSize: 16 }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 8, fontSize: 16 }}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{ padding: 8, fontSize: 16 }}
        />
        {error && <p style={{ color: "red", margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: 10, fontSize: 16, cursor: "pointer" }}>
          {loading ? "Загрузка…" : "Зарегистрироваться"}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </main>
  );
}
