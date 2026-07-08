"use client";

/**
 * Bank Feeds — Plaid integration shell.
 *
 * Flow: "Connect Bank" (animated) → simulated Plaid Link handshake →
 * raw transaction stream from Chase / Amex → one-click "Match" posts a
 * balanced journal entry (Dr Expense / Cr Bank, or Dr Bank / Cr Income).
 */

import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  CreditCard,
  Landmark,
  Link2,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import {
  connectBank,
  fetchTransactions,
  INSTITUTIONS,
  type BankInstitution,
  type FeedTransaction,
} from "@/lib/api/plaid";
import { buildBankFeedEntry } from "@/lib/ledger/journal";
import { useFinance } from "@/lib/store/finance-context";
import { cn, fmtDate, fmtUSD } from "@/lib/utils";

type ConnectionState = "idle" | "connecting" | "connected";

export default function BankFeedsPage() {
  const { postEntry } = useFinance();
  const [state, setState] = useState<ConnectionState>("idle");
  const [progress, setProgress] = useState("");
  const [institutions, setInstitutions] = useState<BankInstitution[]>([]);
  const [transactions, setTransactions] = useState<FeedTransaction[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());

  const connect = async () => {
    setState("connecting");
    const banks = await connectBank(setProgress);
    setInstitutions(banks);
    setTransactions(await fetchTransactions());
    setState("connected");
  };

  const match = (txn: FeedTransaction) => {
    const institution = institutions.find((i) => i.id === txn.institutionId)!;
    postEntry(
      buildBankFeedEntry({
        date: txn.date,
        description: txn.description,
        amount: txn.amount,
        categoryAccount: txn.suggestedAccount,
        bankAccount: institution.ledgerAccount,
      })
    );
    setMatched((prev) => new Set(prev).add(txn.id));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {state !== "connected" && (
        <ConnectPanel state={state} progress={progress} onConnect={connect} />
      )}

      {state === "connected" && (
        <>
          {/* Connected institutions */}
          <div className="stagger grid gap-4 sm:grid-cols-2">
            {institutions.map((bank) => (
              <div
                key={bank.id}
                className="gradient-border flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-zinc-900"
              >
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md",
                    bank.type === "checking"
                      ? "bg-gradient-to-br from-blue-500 to-blue-700"
                      : "bg-gradient-to-br from-zinc-600 to-zinc-800"
                  )}
                >
                  {bank.type === "checking" ? (
                    <Landmark size={19} />
                  ) : (
                    <CreditCard size={19} />
                  )}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold">{bank.name}</p>
                  <p className="text-xs text-zinc-500">
                    •••• {bank.mask} · posts to {bank.ledgerAccount}
                  </p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-brand-100 px-2.5 py-1 text-[10px] font-bold uppercase text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
                  Live via Plaid
                </span>
              </div>
            ))}
          </div>

          {/* Transaction stream */}
          <section className="gradient-border overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
              <div>
                <h2 className="font-bold">Transactions to Review</h2>
                <p className="text-xs text-zinc-500">
                  {transactions.length - matched.size} awaiting one-click match ·
                  categories suggested automatically
                </p>
              </div>
              <Sparkles size={18} className="text-brand-500" />
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {transactions.map((txn, i) => {
                const isMatched = matched.has(txn.id);
                const bank = INSTITUTIONS.find((b) => b.id === txn.institutionId)!;
                return (
                  <div
                    key={txn.id}
                    style={{ animationDelay: `${i * 60}ms` }}
                    className={cn(
                      "animate-fade-up flex flex-col gap-3 px-6 py-4 transition-all duration-300 sm:flex-row sm:items-center",
                      isMatched
                        ? "bg-brand-50/50 dark:bg-brand-900/10"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        txn.amount >= 0
                          ? "bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      )}
                    >
                      {txn.amount >= 0 ? (
                        <ArrowDownLeft size={16} />
                      ) : (
                        <ArrowUpRight size={16} />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {txn.description}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {fmtDate(txn.date)} · {bank.name}
                      </p>
                    </div>

                    {/* Suggested category chip */}
                    <span className="w-fit rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:border-violet-800 dark:bg-violet-900/25 dark:text-violet-300">
                      {txn.suggestedAccount} · {txn.suggestedAccountName}
                      <span className="ml-1.5 text-violet-400">
                        {Math.round(txn.confidence * 100)}%
                      </span>
                    </span>

                    <span
                      className={cn(
                        "w-24 text-right text-sm font-bold tabular-nums",
                        txn.amount >= 0
                          ? "text-brand-600 dark:text-brand-400"
                          : "text-zinc-700 dark:text-zinc-300"
                      )}
                    >
                      {txn.amount >= 0 ? "+" : ""}
                      {fmtUSD(txn.amount)}
                    </span>

                    <button
                      onClick={() => match(txn)}
                      disabled={isMatched}
                      className={cn(
                        "flex w-28 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold transition-all duration-300",
                        isMatched
                          ? "bg-brand-500 text-white"
                          : "border border-zinc-300 text-zinc-600 hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-brand-900/20"
                      )}
                    >
                      {isMatched ? (
                        <>
                          <Check size={13} strokeWidth={3} /> Posted
                        </>
                      ) : (
                        "Match"
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

// ── Connect panel ───────────────────────────────────────────

function ConnectPanel({
  state,
  progress,
  onConnect,
}: {
  state: ConnectionState;
  progress: string;
  onConnect: () => void;
}) {
  return (
    <div className="gradient-border flex flex-col items-center rounded-3xl bg-white px-8 py-16 text-center shadow-sm dark:bg-zinc-900">
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-700 text-white shadow-xl shadow-brand-500/30",
          state === "idle" && "animate-pulse-ring"
        )}
      >
        {state === "connecting" ? (
          <Loader2 size={28} className="animate-spin" />
        ) : (
          <Link2 size={28} />
        )}
      </div>

      <h2 className="mt-6 text-2xl font-extrabold tracking-tight">
        {state === "connecting" ? "Connecting via Plaid…" : "Connect your bank"}
      </h2>

      <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
        {state === "connecting" ? (
          <span className="flex items-center justify-center gap-2 font-medium text-brand-600 dark:text-brand-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
            {progress}
          </span>
        ) : (
          "Securely link Chase, Amex, and 12,000+ US institutions. Transactions stream into your ledger automatically — read-only, encrypted, revocable anytime."
        )}
      </p>

      {state === "idle" && (
        <>
          <button
            onClick={onConnect}
            className="group mt-8 flex items-center gap-2 rounded-full bg-brand-600 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-600/30 transition-all duration-300 hover:-translate-y-1 hover:bg-brand-500 hover:shadow-2xl hover:shadow-brand-500/40"
          >
            <Landmark size={16} />
            Connect Bank
          </button>
          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-zinc-400">
            <Lock size={11} /> Secured by Plaid · Ari Books never sees your
            credentials
          </p>
        </>
      )}

      {state === "connecting" && (
        <div className="mt-8 h-1.5 w-64 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div className="h-full w-full animate-shimmer rounded-full bg-gradient-to-r from-brand-500 via-emerald-300 to-brand-500 bg-[length:200%_100%]" />
        </div>
      )}
    </div>
  );
}
