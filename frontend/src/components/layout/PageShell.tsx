import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface Props {
  children: ReactNode;
}

export function PageShell({ children }: Props) {
  return (
    <div>
      <Topbar />
      <div>
        <Sidebar />
        <main>{children}</main>
      </div>
    </div>
  );
}
