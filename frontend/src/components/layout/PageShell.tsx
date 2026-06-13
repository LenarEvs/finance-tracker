import { useState } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface Props {
  children: ReactNode;
  title?: string;
}

export function PageShell({ children, title }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {title && (
            <h1 className="text-xl font-bold text-slate-900 mb-5">{title}</h1>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
