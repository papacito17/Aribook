"use client";

/**
 * Settings — company profile, global reporting basis, integration
 * status (Plaid / Avalara / Stripe), and the full US GAAP Chart of
 * Accounts with live balances derived from the journal.
 */

import {
  Banknote,
  BadgePercent,
  Building2,
  Landmark,
  ScrollText,
} from "lucide-react";
import { CHART_OF_ACCOUNTS } from "@/lib/ledger/chart-of-accounts";
import { accountBalance } from "@/lib/ledger/reports";
import { useFinance } from "@/lib/store/finance-context";
import { BasisToggle } from "@/components/dashboard/basis-toggle";
import { cn, fmtUSD } from "@/lib/utils";

const INTEGRATIONS = [
  {
    icon: Landmark,
    name: "Plaid",
    role: "Bank Feeds",
    status: "Connected",
    detail: "Chase •••• 4821 · Amex •••• 1005",
  },
  {
    icon: BadgePercent,
    name: "Avalara AvaTax",
    role: "Sales Tax",
    status: "Connected",
    detail: "Nexus: NY · Auto-filing enabled",
  },
  {
    icon: Banknote,
    name: "Stripe",
    role: "Payments",
    status: "Connected",
    detail: "Card + ACH · Payouts daily",
  },
];

export default function SettingsPage() {
  const { basis, entries } = useFinance();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company + basis */}
        <section className="gradient-border rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <Building2 size={17} className="text-brand-600 dark:text-brand-400" />
            <h2 className="font-bold">Company</h2>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <SettingRow label="Legal name" value="Acme Studio LLC" />
            <SettingRow label="EIN" value="88-1234567" />
            <SettingRow label="Fiscal year" value="January – December" />
            <SettingRow label="Home state" value="New York (NY)" />
          </dl>

          <div className="mt-6 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold">Reporting basis</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Applies globally — every report recalculates instantly.
                </p>
              </div>
              <BasisToggle />
            </div>
            <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-[11px] leading-relaxed text-zinc-500 dark:bg-zinc-800/60">
              {basis === "cash"
                ? "Cash: recognize income/expense when money moves. Simpler; common for small businesses filing Schedule C."
                : "Accrual: recognize when earned/incurred (US GAAP). Required over $30M average gross receipts (IRC §448)."}
            </p>
          </div>
        </section>

        {/* Integrations */}
        <section className="gradient-border rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
          <h2 className="font-bold">Integrations</h2>
          <p className="text-xs text-zinc-500">API connections powering your ledger</p>
          <div className="mt-4 space-y-3">
            {INTEGRATIONS.map(({ icon: Icon, name, role, status, detail }) => (
              <div
                key={name}
                className="flex items-center gap-4 rounded-xl border border-zinc-100 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-md dark:border-zinc-800"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <Icon size={18} />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold">
                    {name}{" "}
                    <span className="font-normal text-zinc-400">· {role}</span>
                  </p>
                  <p className="text-xs text-zinc-500">{detail}</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-brand-100 px-2.5 py-1 text-[10px] font-bold uppercase text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
                  {status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Chart of Accounts */}
      <section className="gradient-border overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
        <div className="flex items-center gap-2 border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <ScrollText size={17} className="text-brand-600 dark:text-brand-400" />
          <div>
            <h2 className="font-bold">Chart of Accounts</h2>
            <p className="text-xs text-zinc-500">
              Standard US GAAP structure · balances derived live from the journal
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-[11px] font-bold uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Account</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Subtype</th>
                <th className="px-6 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
              {CHART_OF_ACCOUNTS.map((account) => {
                const balance = accountBalance(entries, account.code);
                return (
                  <tr
                    key={account.code}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                  >
                    <td className="px-6 py-2.5 font-mono text-xs font-semibold text-zinc-500">
                      {account.code}
                    </td>
                    <td className="px-6 py-2.5 font-medium">{account.name}</td>
                    <td className="px-6 py-2.5">
                      <TypeChip type={account.type} />
                    </td>
                    <td className="px-6 py-2.5 text-xs text-zinc-500">
                      {account.subtype}
                    </td>
                    <td
                      className={cn(
                        "px-6 py-2.5 text-right font-semibold tabular-nums",
                        balance === 0 && "text-zinc-300 dark:text-zinc-600"
                      )}
                    >
                      {fmtUSD(balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function TypeChip({ type }: { type: string }) {
  const styles: Record<string, string> = {
    Asset:
      "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Liability:
      "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    Equity:
      "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    Income:
      "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300",
    Expense:
      "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        styles[type]
      )}
    >
      {type}
    </span>
  );
}
