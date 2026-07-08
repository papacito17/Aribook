# Ari Books — Modern Cloud Accounting SaaS

A production-ready codebase template for a US-market cloud accounting platform:
premium marketing landing page, compliance-gated onboarding, a full dashboard
shell, simulated API integrations (Plaid / Avalara / Stripe), and a real
double-entry ledger engine underneath every screen.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Lucide React
· CSS-transition animations · Dark/Light mode.

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Project structure

```
app/
  page.tsx                     Landing page (hero, value props, pricing, CTA)
  layout.tsx                   Root layout + no-flash theme script
  globals.css                  Tailwind v4 theme, animations, gradient borders
  dashboard/
    layout.tsx                 Sidebar + topbar shell, wraps FinanceProvider
    page.tsx                   Financial Overview (live P&L, journal viewer)
    bank-feeds/page.tsx        Plaid shell: connect flow + one-click matching
    invoicing/page.tsx         Avalara tax box + Stripe payment mockup
    bills/page.tsx             A/P workflow (record → accrue → pay → settle)
    settings/page.tsx          Company, basis toggle, integrations, full COA
components/
  auth/registration-modal.tsx  Multi-step signup w/ compliance checklist gate
  dashboard/                   Sidebar, topbar, Cash/Accrual basis toggle
  theme-toggle.tsx             Dark/light switch (persisted to localStorage)
lib/
  ledger/
    chart-of-accounts.ts       Standard US COA with numeric codes (10100 Cash…)
    journal.ts                 Double-entry engine + transaction builders
    reports.ts                 P&L, balances, monthly series (cash vs accrual)
  api/
    plaid.ts                   Bank Feeds API shell (simulated Link + sync)
    avalara.ts                 Sales Tax API shell (state/ZIP rate engine)
    stripe.ts                  Payments API shell (card / ACH)
  store/finance-context.tsx    Global journal + reporting-basis state
  utils.ts                     Currency/date formatting, class helper
```

## Architecture notes

### Double-entry core (US GAAP)

Every user action posts a **balanced journal entry** — the UI never stores
standalone amounts:

| Action                | Debit                     | Credit                              |
| --------------------- | ------------------------- | ----------------------------------- |
| Send invoice          | 11000 Accounts Receivable | 40000 Revenue + 22100 Sales Tax Pay |
| Receive payment       | 10200 Checking            | 11000 Accounts Receivable           |
| Record bill           | 6xxxx Expense             | 20000 Accounts Payable              |
| Pay bill              | 20000 Accounts Payable    | 10200 Checking                      |
| Match bank txn (out)  | 6xxxx Expense             | 10200 / 21000 Bank or Card          |
| Match bank txn (in)   | 10200 Checking            | 40000 Revenue                       |

`assertBalanced()` rejects any entry where debits ≠ credits.

### Cash vs. Accrual toggle

Each entry carries `date` (economic/accrual date) and optional
`settled/settledDate` (when cash moved). The global topbar toggle switches the
recognition rule in `lib/ledger/reports.ts`; Net Income, P&L, and the chart
recompute instantly. Try it: send an invoice, watch accrual Net Income jump,
flip to Cash — it disappears until the invoice is paid via the Stripe mockup.

### Swapping the API shells for real integrations

Each shell in `lib/api/` mirrors the real provider's response shape:

- **Plaid** — replace `connectBank` with Link token exchange and
  `fetchTransactions` with server-side `/transactions/sync`.
- **Avalara** — replace `calculateSalesTax` with an AvaTax
  `transactions/create` call; the breakdown/rate fields map 1:1.
- **Stripe** — replace `processPayment` with a server-created PaymentIntent
  confirmed by Stripe Elements.

The UI and ledger builders stay unchanged.
