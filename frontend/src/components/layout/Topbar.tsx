import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export function Topbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header style={{ height: 52, background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 20px", gap: 12, justifyContent: "flex-end", flexShrink: 0 }}>
      {user && (
        <span style={{ fontSize: 13, color: "#6b7280" }}>
          {user.full_name || user.email}
        </span>
      )}
      <button
        onClick={handleLogout}
        style={{ padding: "5px 14px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13, color: "#374151" }}
      >
        Выйти
      </button>
    </header>
  );
}
