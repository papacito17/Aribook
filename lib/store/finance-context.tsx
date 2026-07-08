"use client";

/**
 * Global financial state.
 *
 * Holds the journal (the single source of truth for every metric) and the
 * global Cash vs. Accrual reporting basis. Components post balanced
 * journal entries here; dashboards derive P&L, Net Income, and cash
 * balances live under the selected basis.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createEntry,
  type JournalEntry,
  type ReportingBasis,
} from "@/lib/ledger/journal";
import {
  cashBalance,
  monthlyPnLSeries,
  profitAndLoss,
  type MonthlyPnL,
  type ProfitAndLoss,
} from "@/lib/ledger/reports";

// ── Seed data: six months of realistic activity ──────────────

function seed(): JournalEntry[] {
  const entries: Omit<JournalEntry, "id">[] = [
    // Opening capital
    {
      date: "2026-01-05",
      memo: "Owner capital contribution",
      source: "manual",
      settled: true,
      settledDate: "2026-01-05",
      lines: [
        { accountCode: "10200", debit: 55000, credit: 0 },
        { accountCode: "30000", debit: 0, credit: 55000 },
      ],
    },
  ];

  // Monthly recurring revenue + expenses, Feb–Jul 2026
  const months = ["02", "03", "04", "05", "06", "07"];
  const revenues = [18400, 21150, 19800, 24600, 27350, 23900];
  const payrolls = [8200, 8200, 9400, 9400, 10600, 10600];

  months.forEach((mm, i) => {
    const settled = { settled: true, settledDate: `2026-${mm}-15` };
    entries.push(
      {
        date: `2026-${mm}-15`,
        memo: `Stripe payouts — 2026-${mm}`,
        source: "bank-feed",
        ...settled,
        lines: [
          { accountCode: "10200", debit: revenues[i], credit: 0 },
          { accountCode: "40000", debit: 0, credit: revenues[i] },
        ],
      },
      {
        date: `2026-${mm}-01`,
        memo: `Payroll — Gusto 2026-${mm}`,
        source: "bank-feed",
        settled: true,
        settledDate: `2026-${mm}-01`,
        lines: [
          { accountCode: "67000", debit: payrolls[i], credit: 0 },
          { accountCode: "10200", debit: 0, credit: payrolls[i] },
        ],
      },
      {
        date: `2026-${mm}-03`,
        memo: `Office rent — WeWork 2026-${mm}`,
        source: "bank-feed",
        settled: true,
        settledDate: `2026-${mm}-03`,
        lines: [
          { accountCode: "64000", debit: 1450, credit: 0 },
          { accountCode: "10200", debit: 0, credit: 1450 },
        ],
      }
    );
  });

  // Accrued (unpaid) invoices — visible under accrual, hidden under cash
  entries.push(
    {
      date: "2026-06-24",
      memo: "Invoice — Beacon Retail Group (INV-1042)",
      source: "invoice",
      settled: false,
      lines: [
        { accountCode: "11000", debit: 8662.5, credit: 0 },
        { accountCode: "40000", debit: 0, credit: 8000 },
        { accountCode: "22100", debit: 0, credit: 662.5 },
      ],
    },
    {
      date: "2026-07-02",
      memo: "Invoice — Harborview Clinics (INV-1043)",
      source: "invoice",
      settled: false,
      lines: [
        { accountCode: "11000", debit: 5411.25, credit: 0 },
        { accountCode: "40000", debit: 0, credit: 5000 },
        { accountCode: "22100", debit: 0, credit: 411.25 },
      ],
    },
    // Accrued unpaid bill
    {
      date: "2026-07-01",
      memo: "Bill — Meridian Insurance Q3 premium",
      source: "bill",
      settled: false,
      lines: [
        { accountCode: "62000", debit: 2140, credit: 0 },
        { accountCode: "20000", debit: 0, credit: 2140 },
      ],
    }
  );

  return entries.map(createEntry);
}

// ── Context ─────────────────────────────────────────────────

interface FinanceState {
  basis: ReportingBasis;
  setBasis: (b: ReportingBasis) => void;
  entries: JournalEntry[];
  postEntry: (entry: Omit<JournalEntry, "id">) => JournalEntry;
  markSettled: (entryId: string, settledDate: string) => void;
  pnl: ProfitAndLoss;
  cash: number;
  series: MonthlyPnL[];
}

const FinanceContext = createContext<FinanceState | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [basis, setBasis] = useState<ReportingBasis>("accrual");
  const [entries, setEntries] = useState<JournalEntry[]>(seed);

  const postEntry = useCallback((entry: Omit<JournalEntry, "id">) => {
    const posted = createEntry(entry);
    setEntries((prev) => [...prev, posted]);
    return posted;
  }, []);

  const markSettled = useCallback((entryId: string, settledDate: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId ? { ...e, settled: true, settledDate } : e
      )
    );
  }, []);

  const pnl = useMemo(() => profitAndLoss(entries, basis), [entries, basis]);
  const cash = useMemo(() => cashBalance(entries), [entries]);
  const series = useMemo(
    () => monthlyPnLSeries(entries, basis),
    [entries, basis]
  );

  const value = useMemo(
    () => ({ basis, setBasis, entries, postEntry, markSettled, pnl, cash, series }),
    [basis, entries, postEntry, markSettled, pnl, cash, series]
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance(): FinanceState {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
