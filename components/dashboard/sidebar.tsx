"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Landmark,
  LayoutDashboard,
  Receipt,
  Settings,
  FileText,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/bank-feeds", label: "Bank Feeds", icon: Landmark },
  { href: "/dashboard/invoicing", label: "Invoicing", icon: FileText },
  { href: "/dashboard/bills", label: "Bills", icon: Receipt },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:flex">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-zinc-200 px-5 dark:border-zinc-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-emerald-700 text-sm font-black text-white shadow-md shadow-brand-500/30">
            A
          </span>
          <span className="text-base font-bold tracking-tight">
            Ari<span className="text-brand-600 dark:text-brand-400">Books</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === href
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-brand-50 text-brand-700 shadow-sm dark:bg-brand-900/25 dark:text-brand-300"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              )}
            >
              <Icon
                size={17}
                className={cn(
                  "transition-transform duration-200 group-hover:scale-110",
                  active && "text-brand-600 dark:text-brand-400"
                )}
              />
              {label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User card */}
      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <div className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
            AR
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Alex Rivera</p>
            <p className="truncate text-xs text-zinc-500">Acme Studio LLC</p>
          </div>
          <Link
            href="/"
            aria-label="Sign out"
            className="text-zinc-400 transition-colors hover:text-red-500"
          >
            <LogOut size={15} />
          </Link>
        </div>
      </div>
    </aside>
  );
}
