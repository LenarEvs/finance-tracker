import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface Props {
  children: ReactNode;
  title?: string;
}

export function PageShell({ children, title }: Props) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar />
        <main style={{ flex: 1, padding: 24, overflowY: "auto" }}>
          {title && (
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 20px" }}>
              {title}
            </h1>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
