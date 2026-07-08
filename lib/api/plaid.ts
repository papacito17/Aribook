/**
 * Bank Feeds API shell (Plaid).
 *
 * Simulates Plaid Link + `/transactions/sync`. In production, replace
 * `connectBank` with the Plaid Link token exchange and `fetchTransactions`
 * with a call to your server-side `/transactions/sync` endpoint.
 */

export interface BankInstitution {
  id: string;
  name: string;
  mask: string; // last four of the account number
  type: "checking" | "credit";
  /** Ledger account this feed posts against. */
  ledgerAccount: string;
}

export interface FeedTransaction {
  id: string;
  institutionId: string;
  date: string;
  description: string;
  amount: number; // negative = outflow
  /** Suggested ledger category from the (simulated) enrichment model. */
  suggestedAccount: string;
  suggestedAccountName: string;
  confidence: number; // 0–1
}

export const INSTITUTIONS: BankInstitution[] = [
  {
    id: "chase",
    name: "Chase Business Complete",
    mask: "4821",
    type: "checking",
    ledgerAccount: "10200",
  },
  {
    id: "amex",
    name: "Amex Business Gold",
    mask: "1005",
    type: "credit",
    ledgerAccount: "21000",
  },
];

const RAW_FEED: Omit<FeedTransaction, "id">[] = [
  { institutionId: "chase", date: "2026-07-06", description: "STRIPE PAYOUT — ST-9284", amount: 4820.0, suggestedAccount: "40000", suggestedAccountName: "Sales Revenue", confidence: 0.98 },
  { institutionId: "chase", date: "2026-07-05", description: "WEWORK #0421 NEW YORK NY", amount: -1450.0, suggestedAccount: "64000", suggestedAccountName: "Rent & Lease", confidence: 0.94 },
  { institutionId: "amex", date: "2026-07-05", description: "GOOGLE ADS — 8837261", amount: -862.4, suggestedAccount: "60000", suggestedAccountName: "Advertising & Marketing", confidence: 0.97 },
  { institutionId: "chase", date: "2026-07-03", description: "GUSTO PAYROLL 260703", amount: -6240.0, suggestedAccount: "67000", suggestedAccountName: "Payroll Expense", confidence: 0.99 },
  { institutionId: "amex", date: "2026-07-02", description: "AWS EMEA — 4412007", amount: -318.72, suggestedAccount: "65000", suggestedAccountName: "Software & Subscriptions", confidence: 0.96 },
  { institutionId: "amex", date: "2026-07-01", description: "DELTA AIR 0062419537", amount: -534.6, suggestedAccount: "68000", suggestedAccountName: "Travel", confidence: 0.91 },
  { institutionId: "chase", date: "2026-06-30", description: "STRIPE PAYOUT — ST-9151", amount: 3610.5, suggestedAccount: "40000", suggestedAccountName: "Sales Revenue", confidence: 0.98 },
  { institutionId: "amex", date: "2026-06-29", description: "SQ *BLUE BOTTLE COFFEE", amount: -42.85, suggestedAccount: "69000", suggestedAccountName: "Meals & Entertainment", confidence: 0.83 },
  { institutionId: "chase", date: "2026-06-28", description: "CON EDISON BILL PAY", amount: -284.31, suggestedAccount: "66000", suggestedAccountName: "Utilities", confidence: 0.95 },
  { institutionId: "amex", date: "2026-06-27", description: "FIGMA MONTHLY RENEWAL", amount: -75.0, suggestedAccount: "65000", suggestedAccountName: "Software & Subscriptions", confidence: 0.97 },
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Simulates the Plaid Link handshake (~2.4s of staged progress). */
export async function connectBank(
  onProgress: (step: string) => void
): Promise<BankInstitution[]> {
  onProgress("Opening secure Plaid Link…");
  await delay(700);
  onProgress("Authenticating with institution…");
  await delay(900);
  onProgress("Encrypting credentials (AES-256)…");
  await delay(500);
  onProgress("Syncing transaction history…");
  await delay(600);
  return INSTITUTIONS;
}

export async function fetchTransactions(): Promise<FeedTransaction[]> {
  await delay(400);
  return RAW_FEED.map((t, i) => ({ ...t, id: `txn_${i + 1}` }));
}
