/**
 * Double-entry journal engine.
 *
 * Every economic event in the app — an invoice, a bill, a matched bank
 * transaction, a payment — is recorded as a balanced JournalEntry.
 * The UI never stores standalone amounts; all dashboard metrics are
 * derived from these entries.
 */

import { getAccount, type AccountType } from "./chart-of-accounts";

export interface JournalLine {
  accountCode: string;
  debit: number;
  credit: number;
}

export type EntrySource =
  | "invoice"
  | "payment"
  | "bill"
  | "bank-feed"
  | "manual";

export interface JournalEntry {
  id: string;
  /** Economic (accrual) date — when the obligation was incurred. */
  date: string;
  memo: string;
  source: EntrySource;
  lines: JournalLine[];
  /**
   * Cash-basis recognition. `settled` is true once cash actually moved;
   * `settledDate` is when. Cash-basis reports recognize income/expense
   * on settledDate; accrual reports recognize on `date`.
   */
  settled: boolean;
  settledDate?: string;
}

export type ReportingBasis = "cash" | "accrual";

let seq = 1000;
export function nextEntryId(): string {
  seq += 1;
  return `JE-${seq}`;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** A journal entry is valid only when total debits equal total credits. */
export function assertBalanced(lines: JournalLine[]): void {
  const debits = round(lines.reduce((s, l) => s + l.debit, 0));
  const credits = round(lines.reduce((s, l) => s + l.credit, 0));
  if (debits !== credits) {
    throw new Error(
      `Unbalanced journal entry: debits ${debits} != credits ${credits}`
    );
  }
}

export function createEntry(
  entry: Omit<JournalEntry, "id">
): JournalEntry {
  assertBalanced(entry.lines);
  return { ...entry, id: nextEntryId() };
}

/**
 * Signed activity for an account type within an entry.
 * Income/Liability/Equity are credit-normal; Assets/Expenses debit-normal.
 */
export function activityFor(entry: JournalEntry, type: AccountType): number {
  return round(
    entry.lines.reduce((sum, line) => {
      const account = getAccount(line.accountCode);
      if (account.type !== type) return sum;
      return account.normalBalance === "credit"
        ? sum + line.credit - line.debit
        : sum + line.debit - line.credit;
    }, 0)
  );
}

/**
 * The date on which an entry is recognized under the given basis,
 * or null if it is not recognized at all (cash basis, not yet settled).
 */
export function recognitionDate(
  entry: JournalEntry,
  basis: ReportingBasis
): string | null {
  if (basis === "accrual") return entry.date;
  return entry.settled ? entry.settledDate ?? entry.date : null;
}

// ── Transaction builders ─────────────────────────────────────

/** Invoice: Dr Accounts Receivable / Cr Revenue / Cr Sales Tax Payable. */
export function buildInvoiceEntry(opts: {
  date: string;
  customer: string;
  subtotal: number;
  salesTax: number;
}): Omit<JournalEntry, "id"> {
  const { date, customer, subtotal, salesTax } = opts;
  const lines: JournalLine[] = [
    { accountCode: "11000", debit: round(subtotal + salesTax), credit: 0 },
    { accountCode: "40000", debit: 0, credit: round(subtotal) },
  ];
  if (salesTax > 0) {
    lines.push({ accountCode: "22100", debit: 0, credit: round(salesTax) });
  }
  return {
    date,
    memo: `Invoice — ${customer}`,
    source: "invoice",
    lines,
    settled: false,
  };
}

/** Customer payment: Dr Cash / Cr Accounts Receivable. */
export function buildPaymentEntry(opts: {
  date: string;
  customer: string;
  amount: number;
  method: "card" | "ach";
}): Omit<JournalEntry, "id"> {
  return {
    date: opts.date,
    memo: `Payment received — ${opts.customer} (${opts.method.toUpperCase()})`,
    source: "payment",
    lines: [
      { accountCode: "10200", debit: round(opts.amount), credit: 0 },
      { accountCode: "11000", debit: 0, credit: round(opts.amount) },
    ],
    settled: true,
    settledDate: opts.date,
  };
}

/** Vendor bill: Dr Expense / Cr Accounts Payable (accrued, unpaid). */
export function buildBillEntry(opts: {
  date: string;
  vendor: string;
  expenseAccount: string;
  amount: number;
}): Omit<JournalEntry, "id"> {
  return {
    date: opts.date,
    memo: `Bill — ${opts.vendor}`,
    source: "bill",
    lines: [
      { accountCode: opts.expenseAccount, debit: round(opts.amount), credit: 0 },
      { accountCode: "20000", debit: 0, credit: round(opts.amount) },
    ],
    settled: false,
  };
}

/** Bill payment: Dr Accounts Payable / Cr Cash. */
export function buildBillPaymentEntry(opts: {
  date: string;
  vendor: string;
  amount: number;
}): Omit<JournalEntry, "id"> {
  return {
    date: opts.date,
    memo: `Bill paid — ${opts.vendor}`,
    source: "payment",
    lines: [
      { accountCode: "20000", debit: round(opts.amount), credit: 0 },
      { accountCode: "10200", debit: 0, credit: round(opts.amount) },
    ],
    settled: true,
    settledDate: opts.date,
  };
}

/**
 * Matched bank-feed transaction. Outflows: Dr Expense / Cr Bank.
 * Inflows: Dr Bank / Cr Income.
 */
export function buildBankFeedEntry(opts: {
  date: string;
  description: string;
  amount: number; // negative = money out
  categoryAccount: string;
  bankAccount: string;
}): Omit<JournalEntry, "id"> {
  const amount = round(Math.abs(opts.amount));
  const lines: JournalLine[] =
    opts.amount < 0
      ? [
          { accountCode: opts.categoryAccount, debit: amount, credit: 0 },
          { accountCode: opts.bankAccount, debit: 0, credit: amount },
        ]
      : [
          { accountCode: opts.bankAccount, debit: amount, credit: 0 },
          { accountCode: opts.categoryAccount, debit: 0, credit: amount },
        ];
  return {
    date: opts.date,
    memo: opts.description,
    source: "bank-feed",
    lines,
    settled: true,
    settledDate: opts.date,
  };
}
