/**
 * US GAAP report calculations derived from the double-entry ledger.
 * Every figure is computed live from journal entries — there is no
 * stored "revenue" number anywhere in the app.
 */

import {
  activityFor,
  recognitionDate,
  type JournalEntry,
  type ReportingBasis,
} from "./journal";
import { getAccount } from "./chart-of-accounts";

export interface ProfitAndLoss {
  revenue: number;
  expenses: number;
  netIncome: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** P&L under the selected basis (cash recognizes only settled entries). */
export function profitAndLoss(
  entries: JournalEntry[],
  basis: ReportingBasis
): ProfitAndLoss {
  let revenue = 0;
  let expenses = 0;
  for (const entry of entries) {
    if (recognitionDate(entry, basis) === null) continue;
    revenue += activityFor(entry, "Income");
    expenses += activityFor(entry, "Expense");
  }
  return {
    revenue: round(revenue),
    expenses: round(expenses),
    netIncome: round(revenue - expenses),
  };
}

/** Balance of a single account across all entries (basis-independent). */
export function accountBalance(
  entries: JournalEntry[],
  accountCode: string
): number {
  const account = getAccount(accountCode);
  let balance = 0;
  for (const entry of entries) {
    for (const line of entry.lines) {
      if (line.accountCode !== accountCode) continue;
      balance +=
        account.normalBalance === "debit"
          ? line.debit - line.credit
          : line.credit - line.debit;
    }
  }
  return round(balance);
}

/** Total cash across bank + cash accounts. Cash is always cash. */
export function cashBalance(entries: JournalEntry[]): number {
  return round(
    ["10100", "10200", "10300"].reduce(
      (sum, code) => sum + accountBalance(entries, code),
      0
    )
  );
}

export interface MonthlyPnL {
  month: string; // e.g. "Feb"
  revenue: number;
  expenses: number;
  netIncome: number;
}

/** Trailing six-month P&L series for dashboard charts. */
export function monthlyPnLSeries(
  entries: JournalEntry[],
  basis: ReportingBasis,
  now: Date = new Date()
): MonthlyPnL[] {
  const months: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-US", { month: "short" }),
    });
  }

  const buckets = new Map(
    months.map((m) => [m.key, { revenue: 0, expenses: 0 }])
  );

  for (const entry of entries) {
    const date = recognitionDate(entry, basis);
    if (!date) continue;
    const key = date.slice(0, 7);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.revenue += activityFor(entry, "Income");
    bucket.expenses += activityFor(entry, "Expense");
  }

  return months.map((m) => {
    const b = buckets.get(m.key)!;
    return {
      month: m.label,
      revenue: round(b.revenue),
      expenses: round(b.expenses),
      netIncome: round(b.revenue - b.expenses),
    };
  });
}
