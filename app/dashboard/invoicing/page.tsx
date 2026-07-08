"use client";

/**
 * Invoicing — Avalara sales-tax shell + Stripe payments shell.
 *
 * The tax box simulates an AvaTax call keyed on the customer's US
 * state / ZIP and appends the exact sales tax to the invoice total.
 * Posting the invoice writes Dr 11000 AR / Cr 40000 Revenue /
 * Cr 22100 Sales Tax Payable. The Stripe mockup settles it:
 * Dr 10200 Cash / Cr 11000 AR, flipping the entry to cash-recognized.
 */

import { useCallback, useEffect, useState } from "react";
import {
  Banknote,
  BadgePercent,
  Check,
  CreditCard,
  FileText,
  Loader2,
  Lock,
  MapPin,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import {
  calculateSalesTax,
  US_STATES,
  type TaxResult,
} from "@/lib/api/avalara";
import { processPayment, type PaymentMethod } from "@/lib/api/stripe";
import { buildInvoiceEntry, buildPaymentEntry } from "@/lib/ledger/journal";
import { useFinance } from "@/lib/store/finance-context";
import { cn, fmtUSD } from "@/lib/utils";

interface LineItem {
  id: number;
  description: string;
  amount: number;
}

const TODAY = "2026-07-08";

export default function InvoicingPage() {
  const { postEntry, markSettled } = useFinance();

  const [customer, setCustomer] = useState("Beacon Retail Group");
  const [state, setState] = useState("NY");
  const [zip, setZip] = useState("10012");
  const [items, setItems] = useState<LineItem[]>([
    { id: 1, description: "Brand identity design", amount: 3200 },
    { id: 2, description: "Website development — phase 1", amount: 4800 },
  ]);

  const [tax, setTax] = useState<TaxResult | null>(null);
  const [taxLoading, setTaxLoading] = useState(false);

  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [paying, setPaying] = useState<PaymentMethod | null>(null);
  const [paid, setPaid] = useState(false);

  const subtotal = items.reduce((s, i) => s + (i.amount || 0), 0);
  const total = subtotal + (tax?.taxAmount ?? 0);

  // ── Avalara shell: recalculate whenever state / zip / subtotal change ──
  const recalcTax = useCallback(async () => {
    if (!zip || subtotal <= 0) {
      setTax(null);
      return;
    }
    setTaxLoading(true);
    const result = await calculateSalesTax({ state, zip, amount: subtotal });
    setTax(result);
    setTaxLoading(false);
  }, [state, zip, subtotal]);

  useEffect(() => {
    const t = setTimeout(recalcTax, 350); // debounce typing
    return () => clearTimeout(t);
  }, [recalcTax]);

  const setItem = (id: number, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { id: Math.max(0, ...prev.map((i) => i.id)) + 1, description: "", amount: 0 },
    ]);

  const removeItem = (id: number) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  // ── Post invoice to the double-entry ledger ──
  const sendInvoice = () => {
    const entry = postEntry(
      buildInvoiceEntry({
        date: TODAY,
        customer,
        subtotal,
        salesTax: tax?.taxAmount ?? 0,
      })
    );
    setInvoiceId(entry.id);
  };

  // ── Stripe shell: settle the invoice ──
  const pay = async (method: PaymentMethod) => {
    if (!invoiceId) return;
    setPaying(method);
    await processPayment(total, method);
    postEntry(
      buildPaymentEntry({ date: TODAY, customer, amount: total, method })
    );
    markSettled(invoiceId, TODAY); // cash basis now recognizes the revenue
    setPaying(null);
    setPaid(true);
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-5">
      {/* ── Builder ── */}
      <section className="gradient-border rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900 lg:col-span-3">
        <div className="flex items-center gap-2">
          <FileText size={17} className="text-brand-600 dark:text-brand-400" />
          <h2 className="font-bold">New Invoice</h2>
          <span className="ml-auto rounded-full bg-zinc-100 px-2.5 py-1 font-mono text-[11px] font-semibold text-zinc-500 dark:bg-zinc-800">
            INV-1044
          </span>
        </div>

        {/* Customer + nexus */}
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="sm:col-span-1">
            <span className="mb-1.5 block text-xs font-medium text-zinc-500">
              Customer
            </span>
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-zinc-700 dark:bg-zinc-800/60"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-zinc-500">
              State
            </span>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-zinc-700 dark:bg-zinc-800/60"
            >
              {US_STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-zinc-500">
              ZIP code
            </span>
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              maxLength={5}
              inputMode="numeric"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-zinc-700 dark:bg-zinc-800/60"
            />
          </label>
        </div>

        {/* Line items */}
        <div className="mt-6 space-y-2.5">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2.5">
              <input
                value={item.description}
                placeholder="Line item description"
                onChange={(e) => setItem(item.id, { description: e.target.value })}
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-zinc-700 dark:bg-zinc-800/60"
              />
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                  $
                </span>
                <input
                  type="number"
                  value={item.amount || ""}
                  min={0}
                  onChange={(e) =>
                    setItem(item.id, { amount: Number(e.target.value) })
                  }
                  className="w-32 rounded-xl border border-zinc-200 bg-white py-2.5 pl-7 pr-3 text-right text-sm tabular-nums outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-zinc-700 dark:bg-zinc-800/60"
                />
              </div>
              <button
                onClick={() => removeItem(item.id)}
                aria-label="Remove line"
                className="rounded-lg p-2 text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-zinc-600 dark:hover:bg-red-900/20"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            onClick={addItem}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20"
          >
            <Plus size={14} /> Add line item
          </button>
        </div>

        {/* ── Avalara tax box ── */}
        <div className="gradient-border mt-6 rounded-2xl bg-gradient-to-br from-zinc-50 to-white p-5 dark:from-zinc-800/50 dark:to-zinc-900">
          <div className="flex items-center gap-2">
            <BadgePercent size={16} className="text-amber-500" />
            <h3 className="text-sm font-bold">Automatic Sales Tax</h3>
            <span className="ml-auto flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
              <MapPin size={10} />
              Avalara AvaTax
            </span>
          </div>

          {taxLoading ? (
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-zinc-500">
              <Loader2 size={14} className="animate-spin text-amber-500" />
              Calculating rates for {state} {zip}…
            </div>
          ) : tax ? (
            <div className="mt-3 animate-fade-in space-y-1.5">
              {tax.breakdown.map((line) => (
                <div
                  key={line.jurisdiction}
                  className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400"
                >
                  <span>{line.jurisdiction}</span>
                  <span className="tabular-nums">{line.rate.toFixed(2)}%</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-zinc-200 pt-2 text-sm font-bold dark:border-zinc-700">
                <span>
                  Combined rate{" "}
                  <span className="font-normal text-zinc-400">
                    ({tax.combinedRate.toFixed(2)}%)
                  </span>
                </span>
                <span className="tabular-nums text-amber-600 dark:text-amber-400">
                  +{fmtUSD(tax.taxAmount)}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-zinc-400">
              Enter a ZIP code and at least one line item to calculate tax.
            </p>
          )}
        </div>

        {/* Totals */}
        <div className="mt-6 space-y-1.5 text-sm">
          <div className="flex justify-between text-zinc-500">
            <span>Subtotal</span>
            <span className="tabular-nums">{fmtUSD(subtotal)}</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>Sales tax</span>
            <span className="tabular-nums">{fmtUSD(tax?.taxAmount ?? 0)}</span>
          </div>
          <div className="flex justify-between border-t border-zinc-200 pt-2.5 text-lg font-extrabold tracking-tight dark:border-zinc-700">
            <span>Total due</span>
            <span className="tabular-nums text-brand-600 dark:text-brand-400">
              {fmtUSD(total)}
            </span>
          </div>
        </div>

        <button
          onClick={sendInvoice}
          disabled={!!invoiceId || subtotal <= 0 || taxLoading}
          className={cn(
            "mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all duration-300",
            invoiceId
              ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
              : "bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:-translate-y-0.5 hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {invoiceId ? (
            <>
              <Check size={16} strokeWidth={3} /> Posted to ledger as {invoiceId}
            </>
          ) : (
            <>
              <Send size={15} /> Send Invoice &amp; Post to Ledger
            </>
          )}
        </button>
        {invoiceId && (
          <p className="mt-2 text-center text-[11px] text-zinc-400">
            Dr 11000 Accounts Receivable · Cr 40000 Sales Revenue · Cr 22100
            Sales Tax Payable
          </p>
        )}
      </section>

      {/* ── Invoice preview + Stripe payment shell ── */}
      <section className="space-y-6 lg:col-span-2">
        <div className="gradient-border overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
          {/* Paper preview */}
          <div className="border-b border-zinc-100 p-6 dark:border-zinc-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Invoice
                </p>
                <p className="mt-1 font-mono text-sm font-bold">INV-1044</p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-emerald-700 text-xs font-black text-white">
                A
              </span>
            </div>
            <div className="mt-4 text-xs text-zinc-500">
              <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                {customer || "—"}
              </p>
              <p>
                {state} {zip} · Due Jul 22, 2026
              </p>
            </div>
            <p className="mt-4 text-3xl font-extrabold tracking-tight tabular-nums">
              {fmtUSD(total)}
            </p>
            <span
              className={cn(
                "mt-2 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                paid
                  ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                  : invoiceId
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
              )}
            >
              {paid ? "Paid" : invoiceId ? "Awaiting payment" : "Draft"}
            </span>
          </div>

          {/* Stripe elements mockup */}
          <div className="bg-zinc-50/60 p-6 dark:bg-zinc-800/30">
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
              Customer pays via
            </p>

            {paid ? (
              <div className="mt-4 flex animate-scale-in items-center gap-3 rounded-xl bg-brand-50 p-4 dark:bg-brand-900/20">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white">
                  <Check size={17} strokeWidth={3} />
                </span>
                <div>
                  <p className="text-sm font-bold text-brand-700 dark:text-brand-300">
                    Payment received
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Dr 10200 Cash · Cr 11000 A/R — revenue now cash-recognized
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                <PayButton
                  icon={<CreditCard size={16} />}
                  label="Pay via Credit Card"
                  note="Visa · MC · Amex"
                  loading={paying === "card"}
                  disabled={!invoiceId || paying !== null}
                  onClick={() => pay("card")}
                />
                <PayButton
                  icon={<Banknote size={16} />}
                  label="Pay via ACH Transfer"
                  note="0.8% capped at $5"
                  loading={paying === "ach"}
                  disabled={!invoiceId || paying !== null}
                  onClick={() => pay("ach")}
                />
                {!invoiceId && (
                  <p className="text-center text-[11px] text-zinc-400">
                    Send the invoice first to enable payment.
                  </p>
                )}
              </div>
            )}

            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
              <Lock size={11} /> Powered by <strong>Stripe</strong> · PCI-DSS
              Level 1
            </p>
          </div>
        </div>

        {/* Ledger cheat-sheet */}
        <div className="rounded-2xl border border-dashed border-zinc-300 p-5 text-xs leading-relaxed text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          <p className="font-bold text-zinc-700 dark:text-zinc-300">
            What happens underneath
          </p>
          <p className="mt-1.5">
            Sending posts an <em>accrual</em> entry (visible on the accrual
            P&amp;L immediately). Payment posts a cash entry and settles the
            invoice, so it appears on the <em>cash-basis</em> P&amp;L too. Flip
            the topbar toggle to watch Net Income change.
          </p>
        </div>
      </section>
    </div>
  );
}

function PayButton({
  icon,
  label,
  note,
  loading,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  note: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left transition-all duration-300 dark:bg-zinc-900",
        disabled
          ? "cursor-not-allowed border-zinc-200 opacity-50 dark:border-zinc-700"
          : "border-zinc-200 hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10 dark:border-zinc-700"
      )}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
        {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-bold">
          {loading ? "Processing…" : label}
        </span>
        <span className="block text-[11px] text-zinc-400">{note}</span>
      </span>
    </button>
  );
}
