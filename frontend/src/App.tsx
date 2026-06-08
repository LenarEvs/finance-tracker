import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { AuditLog } from "./pages/AuditLog";
import { Budgets } from "./pages/Budgets";
import { Categories } from "./pages/Categories";
import { Dashboard } from "./pages/Dashboard";
import { ImportExport } from "./pages/ImportExport";
import { Login } from "./pages/Login";
import { RecurringRules } from "./pages/RecurringRules";
import { Register } from "./pages/Register";
import { Transactions } from "./pages/Transactions";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  if (!accessToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/transactions"
          element={
            <RequireAuth>
              <Transactions />
            </RequireAuth>
          }
        />
        <Route
          path="/categories"
          element={
            <RequireAuth>
              <Categories />
            </RequireAuth>
          }
        />
        <Route
          path="/budgets"
          element={
            <RequireAuth>
              <Budgets />
            </RequireAuth>
          }
        />
        <Route
          path="/recurring-rules"
          element={
            <RequireAuth>
              <RecurringRules />
            </RequireAuth>
          }
        />
        <Route
          path="/import-export"
          element={
            <RequireAuth>
              <ImportExport />
            </RequireAuth>
          }
        />
        <Route
          path="/audit-log"
          element={
            <RequireAuth>
              <AuditLog />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
