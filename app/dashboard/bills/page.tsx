"use client";

/**
 * Bills & Payables — accounts payable workflow.
 *
 * Recording a bill posts Dr Expense / Cr 20000 Accounts Payable (accrued).
 * Paying it posts Dr 20000 AP / Cr 10200 Cash and settles the original
 * entry, so the expense flips into the cash-basis P&L.
 */

import { useState } from "react";
import {
  CalendarClock,
  Check,
  CircleDollarSign,
  Loader2,
  Plus,
  Receipt,
} from "lucide-react";
import { CHART_OF_ACCOUNTS } from "@/lib/ledger/chart-of-accounts";
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
  status: "open" | "paying" | "paid";
  entryId?: string;
}

const EXPENSE_ACCOUNTS = CHART_OF_ACCOUNTS.filter((a) => a.type === "Expense");

const today = () => new Date().toISOString().slice(0, 10);

export default function BillsPage() {
  const { postEntry, markSettled } = useFinance();
  const [bills, setBills] = useState<Bill[]>([]);
  const [nextId, setNextId] = useState(1);
  const [form, setForm] = useState({
    vendor: "",
    memo: "",
    expenseAccount: "63000",
    amount: "",
    dueDate: "",
  });

  const patch = (id: number, changes: Partial<Bill>) =>
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, ...changes } : b)));

  const amountValid = Number(form.amount) > 0;
  const formValid = form.vendor.trim().length > 1 && amountValid;

  /** Records the bill immediately: Dr Expense / Cr Accounts Payable. */
  const addBill = () => {
    const account = EXPENSE_ACCOUNTS.find((a) => a.code === form.expenseAccount)!;
    const billDate = today();
    const entry = postEntry(
      buildBillEntry({
        date: billDate,
        vendor: form.vendor.trim(),
        expenseAccount: account.code,
        amount: Number(form.amount),
      })
    );
    setBills((prev) => [
      ...prev,
      {
        id: nextId,
        vendor: form.vendor.trim(),
        memo: form.memo.trim(),
        expenseAccount: account.code,
        expenseName: account.name,
        amount: Number(form.amount),
        billDate,
        dueDate: form.dueDate || billDate,
        status: "open",
        entryId: entry.id,
      },
    ]);
    setNextId((n) => n + 1);
    setForm({ vendor: "", memo: "", expenseAccount: "63000", amount: "", dueDate: "" });
  };

  const pay = async (bill: Bill) => {
    patch(bill.id, { status: "paying" });
    await new Promise((r) => setTimeout(r, 900)); // simulated bank handoff
    postEntry(
      buildBillPaymentEntry({ date: today(), vendor: bill.vendor, amount: bill.amount })
    );
    if (bill.entryId) markSettled(bill.entryId, today());
    patch(bill.id, { status: "paid" });
  };

  const openBills = bills.filter((b) => b.status === "open");
  const openTotal = openBills.reduce((s, b) => s + b.amount, 0);
  const nextDue = openBills
    .map((b) => b.dueDate)
    .sort()[0];

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
          value={nextDue ? fmtDate(nextDue) : "—"}
        />
        <SummaryCard
          icon={<CircleDollarSign size={16} />}
          label="Paid this month"
          value={fmtUSD(bills.filter((b) => b.status === "paid").reduce((s, b) => s + b.amount, 0))}
        />
      </div>

      {/* New bill form */}
      <section className="gradient-border rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
        <h2 className="font-bold">Record a Bill</h2>
        <p className="text-xs text-zinc-500">
          Posts Dr Expense / Cr 20000 Accounts Payable on your ledger
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            placeholder="Vendor name"
            value={form.vendor}
            onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-zinc-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-zinc-700 dark:bg-zinc-800/60"
          />
          <input
            placeholder="Memo (optional)"
            value={form.memo}
            onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-zinc-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-zinc-700 dark:bg-zinc-800/60"
          />
          <select
            value={form.expenseAccount}
            onChange={(e) =>
              setForm((f) => ({ ...f, expenseAccount: e.target.value }))
            }
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-zinc-700 dark:bg-zinc-800/60"
          >
            {EXPENSE_ACCOUNTS.map((a) => (
              <option key={a.code} value={a.code}>
                {a.code} · {a.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-zinc-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-zinc-700 dark:bg-zinc-800/60"
          />
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-600 outline-none transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300"
          />
        </div>
        <button
          onClick={addBill}
          disabled={!formValid}
          className={cn(
            "mt-4 flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition-all duration-300",
            formValid
              ? "bg-brand-600 text-white shadow-md shadow-brand-600/25 hover:-translate-y-0.5 hover:bg-brand-500"
              : "cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
          )}
        >
          <Plus size={14} /> Record Bill
        </button>
      </section>

      {/* Bills table */}
      <section className="gradient-border overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
        <div className="border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <h2 className="font-bold">Vendor Bills</h2>
          <p className="text-xs text-zinc-500">
            Pay settles the accrued bill through 10200 Checking
          </p>
        </div>

        {bills.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-zinc-400">
            No bills yet. Record your first vendor bill above — it will post to
            your ledger as an accrued payable.
          </p>
        ) : (
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
                    {bill.memo ? `${bill.memo} · ` : ""}due {fmtDate(bill.dueDate)}
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
        )}
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
    open: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    paying:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    paid: "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300",
  };
  const labels: Record<Bill["status"], string> = {
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
