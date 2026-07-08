"use client";

/**
 * Global "Reporting Basis" toggle — Cash vs. Accrual.
 * Flipping it recomputes Net Income, P&L, and every chart instantly,
 * because all metrics are derived from the journal under the selected
 * basis (see lib/ledger/reports.ts).
 */

import { useFinance } from "@/lib/store/finance-context";
import { cn } from "@/lib/utils";
import type { ReportingBasis } from "@/lib/ledger/journal";

const OPTIONS: { value: ReportingBasis; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "accrual", label: "Accrual" },
];

export function BasisToggle() {
  const { basis, setBasis } = useFinance();

  return (
    <div
      className="relative flex rounded-full border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800"
      role="radiogroup"
      aria-label="Reporting basis"
    >
      {/* Sliding thumb */}
      <span
        className={cn(
          "absolute inset-y-0.5 w-[calc(50%-2px)] rounded-full bg-white shadow-md transition-transform duration-300 ease-out dark:bg-zinc-600",
          basis === "accrual" && "translate-x-full"
        )}
      />
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          role="radio"
          aria-checked={basis === opt.value}
          onClick={() => setBasis(opt.value)}
          className={cn(
            "relative z-10 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-300",
            basis === opt.value
              ? "text-zinc-900 dark:text-white"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
