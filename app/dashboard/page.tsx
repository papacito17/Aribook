"use client";

/**
 * Financial Overview — every number on this screen is derived live from
 * the double-entry journal under the globally selected reporting basis.
 */

import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpenCheck,
  DollarSign,
  Info,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useFinance } from "@/lib/store/finance-context";
import { getAccount } from "@/lib/ledger/chart-of-accounts";
import { cn, fmtDate, fmtUSD } from "@/lib/utils";

export default function DashboardPage() {
  const { basis, pnl, cash, series, entries } = useFinance();

  const metrics = [
    {
      label: "Net Income",
      value: pnl.netIncome,
      icon: TrendingUp,
      tone: pnl.netIncome >= 0 ? "positive" : "negative",
      note: `${basis === "cash" ? "Cash" : "Accrual"} basis · YTD`,
    },
    {
      label: "Total Revenue",
      value: pnl.revenue,
      icon: DollarSign,
      tone: "positive",
      note: "Income accounts 40000–49999",
    },
    {
      label: "Total Expenses",
      value: pnl.expenses,
      icon: ArrowDownRight,
      tone: "negative",
      note: "Expense accounts 50000–69999",
    },
    {
      label: "Cash on Hand",
      value: cash,
      icon: Wallet,
      tone: "neutral",
      note: "Accounts 10100–10300",
    },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Basis explainer */}
      <div className="flex items-center gap-2 rounded-xl border border-brand-500/25 bg-brand-50/60 px-4 py-2.5 text-xs font-medium text-brand-800 dark:bg-brand-900/15 dark:text-brand-300">
        <Info size={14} className="shrink-0" />
        {basis === "cash"
          ? "Cash basis: revenue and expenses are recognized only when money actually moves. Unpaid invoices and bills are excluded."
          : "Accrual basis (US GAAP): revenue and expenses are recognized when earned or incurred, including open invoices and unpaid bills."}
      </div>

      {/* Metric cards */}
      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, tone, note }) => (
          <div
            key={label}
            className="gradient-border group rounded-2xl bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {label}
              </span>
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110",
                  tone === "positive" &&
                    "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400",
                  tone === "negative" &&
                    "bg-red-50 text-red-500 dark:bg-red-900/25 dark:text-red-400",
                  tone === "neutral" &&
                    "bg-violet-50 text-violet-600 dark:bg-violet-900/25 dark:text-violet-400"
                )}
              >
                <Icon size={16} />
              </span>
            </div>
            <p
              className={cn(
                "mt-3 text-2xl font-extrabold tracking-tight tabular-nums",
                tone === "negative" && "text-red-600 dark:text-red-400"
              )}
            >
              {fmtUSD(value)}
            </p>
            <p className="mt-1 text-[11px] text-zinc-400">{note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* P&L chart */}
        <section className="gradient-border rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold">Profit &amp; Loss</h2>
              <p className="text-xs text-zinc-500">
                Trailing 6 months · {basis === "cash" ? "Cash" : "Accrual"} basis
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-brand-500" /> Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-zinc-300 dark:bg-zinc-600" />{" "}
                Expenses
              </span>
            </div>
          </div>
          <PnLChart series={series} />
        </section>

        {/* Recent journal entries — the double-entry system made visible */}
        <section className="gradient-border rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900 lg:col-span-2">
          <div className="flex items-center gap-2">
            <BookOpenCheck size={16} className="text-brand-600 dark:text-brand-400" />
            <h2 className="font-bold">General Journal</h2>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            Latest balanced entries posted to the ledger
          </p>
          <div className="mt-4 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 340 }}>
            {[...entries]
              .reverse()
              .slice(0, 6)
              .map((entry) => (
                <div
                  key={entry.id}
                  className="animate-fade-in rounded-xl border border-zinc-100 p-3 transition-colors hover:border-brand-500/40 dark:border-zinc-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold">{entry.memo}</p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        entry.settled
                          ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                      )}
                    >
                      {entry.settled ? "Settled" : "Accrued"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-zinc-400">
                    {entry.id} · {fmtDate(entry.date)}
                  </p>
                  <table className="mt-2 w-full text-[11px] tabular-nums">
                    <tbody>
                      {entry.lines.map((line, i) => (
                        <tr key={i} className="text-zinc-600 dark:text-zinc-400">
                          <td className={cn("py-0.5", line.credit > 0 && "pl-4")}>
                            <span className="font-mono text-zinc-400">
                              {line.accountCode}
                            </span>{" "}
                            {getAccount(line.accountCode).name}
                          </td>
                          <td className="w-20 text-right">
                            {line.debit > 0 ? fmtUSD(line.debit) : ""}
                          </td>
                          <td className="w-20 text-right">
                            {line.credit > 0 ? fmtUSD(line.credit) : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Pure-CSS grouped bar chart ──────────────────────────────

function PnLChart({
  series,
}: {
  series: { month: string; revenue: number; expenses: number }[];
}) {
  const max = Math.max(...series.map((m) => Math.max(m.revenue, m.expenses)), 1);

  return (
    <div className="mt-6 flex h-56 items-end gap-4">
      {series.map((m) => (
        <div key={m.month} className="group flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end justify-center gap-1.5">
            <div
              title={`Revenue ${fmtUSD(m.revenue)}`}
              className="w-full max-w-7 rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400 transition-all duration-500 group-hover:shadow-lg group-hover:shadow-brand-500/30"
              style={{ height: `${(m.revenue / max) * 100}%` }}
            />
            <div
              title={`Expenses ${fmtUSD(m.expenses)}`}
              className="w-full max-w-7 rounded-t-md bg-zinc-200 transition-all duration-500 dark:bg-zinc-700"
              style={{ height: `${(m.expenses / max) * 100}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-zinc-400 transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
            {m.month}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] font-semibold tabular-nums text-zinc-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {m.revenue - m.expenses >= 0 ? (
              <ArrowUpRight size={11} className="text-brand-500" />
            ) : (
              <ArrowDownRight size={11} className="text-red-500" />
            )}
            {fmtUSD(m.revenue - m.expenses)}
          </span>
        </div>
      ))}
    </div>
  );
}
