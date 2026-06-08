// ── Auth ──────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// ── User ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  base_currency: string;
  is_active: boolean;
  created_at: string;
}

// ── Category ──────────────────────────────────────────────────────────────────

export type TransactionType = "income" | "expense";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  is_archived: boolean;
  created_at: string;
}

// ── Transaction ───────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  type: TransactionType;
  amount: string;
  currency: string;
  exchange_rate: string;
  date: string;
  description: string | null;
  is_recurring_instance: boolean;
  recurring_rule_id: string | null;
  created_at: string;
  updated_at: string;
}

// ── RecurringRule ─────────────────────────────────────────────────────────────

export interface RecurringRule {
  id: string;
  user_id: string;
  category_id: string;
  type: TransactionType;
  amount: string;
  currency: string;
  description: string | null;
  day_of_month: number;
  is_active: boolean;
  next_run_date: string;
  created_at: string;
}

// ── Budget ────────────────────────────────────────────────────────────────────

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  year_month: string;
  amount: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetProgress {
  budget_id: string;
  category_id: string;
  category_name: string;
  budget_amount: string;
  spent_amount: string;
  remaining: string;
  percent_used: number;
}

// ── ExchangeRate ──────────────────────────────────────────────────────────────

export interface ExchangeRate {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: string;
  date: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  year_month: string;
  total_income: string;
  total_expense: string;
  balance: string;
}

export interface ExpenseByCategory {
  category_id: string;
  category_name: string;
  amount: string;
  percent: number;
}

export interface MonthlyTrend {
  month: string;
  income: string;
  expense: string;
}

export interface TopCategory {
  category_id: string;
  category_name: string;
  amount: string;
  rank: number;
}

// ── AuditLog ──────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: number;
  user_id: string;
  entity_type: string;
  entity_id: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  ip_address: string | null;
  occurred_at: string;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
}
