import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuditLog } from "./pages/AuditLog";
import { Budgets } from "./pages/Budgets";
import { Categories } from "./pages/Categories";
import { Dashboard } from "./pages/Dashboard";
import { ImportExport } from "./pages/ImportExport";
import { Login } from "./pages/Login";
import { RecurringRules } from "./pages/RecurringRules";
import { Register } from "./pages/Register";
import { Transactions } from "./pages/Transactions";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/recurring-rules" element={<RecurringRules />} />
        <Route path="/import-export" element={<ImportExport />} />
        <Route path="/audit-log" element={<AuditLog />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
