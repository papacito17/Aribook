"use client";

/**
 * Dashboard shell: sidebar navigation + topbar with the global
 * Cash vs. Accrual reporting-basis toggle. Everything under /dashboard
 * shares one FinanceProvider, so posting an entry on any screen
 * updates every metric app-wide in real time.
 */

import { FinanceProvider } from "@/lib/store/finance-context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FinanceProvider>
      <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </FinanceProvider>
  );
}
