export function Sidebar() {
  return (
    <aside>
      <nav>
        <ul>
          <li><a href="/dashboard">Dashboard</a></li>
          <li><a href="/transactions">Transactions</a></li>
          <li><a href="/categories">Categories</a></li>
          <li><a href="/budgets">Budgets</a></li>
          <li><a href="/recurring-rules">Recurring Rules</a></li>
          <li><a href="/import-export">Import / Export</a></li>
          <li><a href="/audit-log">Audit Log</a></li>
        </ul>
      </nav>
    </aside>
  );
}
