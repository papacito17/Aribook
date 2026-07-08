"use client";

/**
 * Bills & Payables — accounts payable workflow.
 *
 * Recording a bill posts Dr Expense / Cr 20000 Accounts Payable (accrued).
 * Paying it posts Dr 20000 AP / Cr 10200 Cash and settles the original
 * entry, so the expense flips into the cash-basis P&L.
 */

import { useState } from "react";
import { CalendarClock, Check, CircleDollarSign, Loader2, Receipt } from "lucide-react";
import {
  buildBillEntry,
  buildBillPaymentEntry,
} from "@/lib/ledger/journal";
import { useFinance } from "@/lib/store/finance-context";
import { cn, fmtDate, fmtUSD } from "@/lib/utils";

interface Bill {
  id: number;
  vendor: string;
  memo: string;
  expenseAccount: string;
  expenseName: string;
  amount: number;
  billDate: string;
  dueDate: string;
  status: "unrecorded" | "open" | "paying" | "paid";
  entryId?: string;
}

const TODAY = "2026-07-08";

const INITIAL_BILLS: Bill[] = [
  { id: 1, vendor: "Meridian Insurance", memo: "Q3 general liability premium", expenseAccount: "62000", expenseName: "Insurance", amount: 2140, billDate: "2026-07-01", dueDate: "2026-07-31", status: "open" },
  { id: 2, vendor: "Hudson Legal LLP", memo: "Contract review — June retainer", expenseAccount: "61000", expenseName: "Professional fees", amount: 1500, billDate: "2026-07-05", dueDate: "2026-07-20", status: "unrecorded" },
  { id: 3, vendor: "Peak Office Supply", memo: "Standing desks (x2) + monitors", expenseAccount: "63000", expenseName: "Office Supplies", amount: 1864.4, billDate: "2026-07-06", dueDate: "2026-08-05", status: "unrecorded" },
  { id: 4, vendor: "Con Edison", memo: "July utilities", expenseAccount: "66000", expenseName: "Utilities", amount: 291.15, billDate: "2026-07-07", dueDate: "2026-07-25", status: "unrecorded" },
];

export default function BillsPage() {
  const { postEntry, markSettled } = useFinance();
  const [bills, setBills] = useState<Bill[]>(INITIAL_BILLS);

  const patch = (id: number, changes: Partial<Bill>) =>
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, ...changes } : b)));

  const record = (bill: Bill) => {
    const entry = postEntry(
      buildBillEntry({
        date: bill.billDate,
        vendor: bill.vendor,
        expenseAccount: bill.expenseAccount,
        amount: bill.amount,
      })
    );
    patch(bill.id, { status: "open", entryId: entry.id });
  };

  const pay = async (bill: Bill) => {
    patch(bill.id, { status: "paying" });
    await new Promise((r) => setTimeout(r, 900)); // simulated bank handoff
    postEntry(
      buildBillPaymentEntry({ date: TODAY, vendor: bill.vendor, amount: bill.amount })
    );
    if (bill.entryId) markSettled(bill.entryId, TODAY);
    patch(bill.id, { status: "paid" });
  };

  const openTotal = bills
    .filter((b) => b.status === "open")
    .reduce((s, b) => s + b.amount, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Summary strip */}
      <div className="stagger grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<Receipt size={16} />}
          label="Open payables (20000 A/P)"
          value={fmtUSD(openTotal)}
        />
        <SummaryCard
          icon={<CalendarClock size={16} />}
          label="Next due"
          value="Jul 20, 2026"
        />
        <SummaryCard
          icon={<CircleDollarSign size={16} />}
          label="Paid this month"
          value={fmtUSD(bills.filter((b) => b.status === "paid").reduce((s, b) => s + b.amount, 0))}
        />
      </div>

      {/* Bills table */}
      <section className="gradient-border overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
        <div className="border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <h2 className="font-bold">Vendor Bills</h2>
          <p className="text-xs text-zinc-500">
            Record accrues the expense · Pay settles it through 10200 Checking
          </p>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {bills.map((bill, i) => (
            <div
              key={bill.id}
              style={{ animationDelay: `${i * 60}ms` }}
              className="animate-fade-up flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{bill.vendor}</p>
                <p className="truncate text-xs text-zinc-500">
                  {bill.memo} · due {fmtDate(bill.dueDate)}
                </p>
              </div>

              <span className="w-fit rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                {bill.expenseAccount} · {bill.expenseName}
              </span>

              <StatusChip status={bill.status} />

              <span className="w-24 text-right text-sm font-bold tabular-nums">
                {fmtUSD(bill.amount)}
              </span>

              <div className="w-32 text-right">
                {bill.status === "unrecorded" && (
                  <ActionButton onClick={() => record(bill)} variant="ghost">
                    Record Bill
                  </ActionButton>
                )}
                {bill.status === "open" && (
                  <ActionButton onClick={() => pay(bill)} variant="solid">
                    Pay Now
                  </ActionButton>
                )}
                {bill.status === "paying" && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
                    <Loader2 size={13} className="animate-spin" /> Sending…
                  </span>
                )}
                {bill.status === "paid" && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400">
                    <Check size={14} strokeWidth={3} /> Paid
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="gradient-border rounded-2xl bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:bg-zinc-900">
      <div className="flex items-center gap-2 text-zinc-400">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-2.5 text-2xl font-extrabold tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}

function StatusChip({ status }: { status: Bill["status"] }) {
  const styles: Record<Bill["status"], string> = {
    unrecorded:
      "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
    open: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    paying:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    paid: "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300",
  };
  const labels: Record<Bill["status"], string> = {
    unrecorded: "Not recorded",
    open: "Open · Accrued",
    paying: "Processing",
    paid: "Paid",
  };
  return (
    <span
      className={cn(
        "w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors duration-300",
        styles[status]
      )}
    >
      {labels[status]}
    </span>
  );
}

function ActionButton({
  onClick,
  variant,
  children,
}: {
  onClick: () => void;
  variant: "solid" | "ghost";
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 text-xs font-bold transition-all duration-300 hover:-translate-y-0.5",
        variant === "solid"
          ? "bg-brand-600 text-white shadow-md shadow-brand-600/25 hover:bg-brand-500"
          : "border border-zinc-300 text-zinc-600 hover:border-brand-500 hover:text-brand-600 dark:border-zinc-700 dark:text-zinc-300"
      )}
    >
      {children}
    </button>
  );
}
