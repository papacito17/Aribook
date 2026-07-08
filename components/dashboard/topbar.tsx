"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BasisToggle } from "@/components/dashboard/basis-toggle";
import { createClient } from "@/lib/supabase/client";

const TITLES: Record<string, string> = {
  "/dashboard": "Financial Overview",
  "/dashboard/bank-feeds": "Bank Feeds",
  "/dashboard/invoicing": "Invoicing",
  "/dashboard/bills": "Bills & Payables",
  "/dashboard/settings": "Settings",
};

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const title = TITLES[pathname] ?? "Dashboard";

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-zinc-200 bg-white/80 px-6 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80">
      <h1 className="text-lg font-bold tracking-tight">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Search (visual shell) */}
        <div className="relative hidden lg:block">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            placeholder="Search transactions…"
            className="w-56 rounded-full border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-4 text-sm outline-none transition-all duration-300 placeholder:text-zinc-400 focus:w-72 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>

        <BasisToggle />

        <button
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-all duration-300 hover:scale-105 hover:text-brand-600 dark:border-zinc-800 dark:text-zinc-400"
        >
          <Bell size={16} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        <ThemeToggle />

        <button
          onClick={handleSignOut}
          aria-label="Sign out"
          title="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-all duration-300 hover:scale-105 hover:text-red-600 dark:border-zinc-800 dark:text-zinc-400"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
