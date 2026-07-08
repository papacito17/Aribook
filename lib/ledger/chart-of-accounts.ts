/**
 * Standard US Chart of Accounts (US GAAP oriented).
 *
 * Numbering convention:
 *   10000–19999  Assets
 *   20000–29999  Liabilities
 *   30000–39999  Equity
 *   40000–49999  Income
 *   50000–69999  Expenses (5xxxx = COGS, 6xxxx = Operating)
 */

export type AccountType =
  | "Asset"
  | "Liability"
  | "Equity"
  | "Income"
  | "Expense";

export interface Account {
  /** Numeric US accounting code, e.g. "10100" */
  code: string;
  name: string;
  type: AccountType;
  subtype: string;
  /** Debit-normal accounts increase with debits (Assets, Expenses). */
  normalBalance: "debit" | "credit";
}

const debitNormal = new Set<AccountType>(["Asset", "Expense"]);

function acct(
  code: string,
  name: string,
  type: AccountType,
  subtype: string
): Account {
  return {
    code,
    name,
    type,
    subtype,
    normalBalance: debitNormal.has(type) ? "debit" : "credit",
  };
}

export const CHART_OF_ACCOUNTS: Account[] = [
  // ── Assets ────────────────────────────────────────────────
  acct("10100", "Cash on Hand", "Asset", "Current Asset"),
  acct("10200", "Checking Account — Chase", "Asset", "Bank"),
  acct("10300", "Savings Account", "Asset", "Bank"),
  acct("11000", "Accounts Receivable", "Asset", "Receivable"),
  acct("12000", "Prepaid Expenses", "Asset", "Current Asset"),
  acct("13000", "Inventory", "Asset", "Current Asset"),
  acct("15000", "Equipment", "Asset", "Fixed Asset"),
  acct("15900", "Accumulated Depreciation", "Asset", "Fixed Asset (Contra)"),

  // ── Liabilities ───────────────────────────────────────────
  acct("20000", "Accounts Payable", "Liability", "Payable"),
  acct("21000", "Credit Card — Amex", "Liability", "Credit Card"),
  acct("22100", "Sales Tax Payable", "Liability", "Current Liability"),
  acct("23000", "Payroll Liabilities", "Liability", "Current Liability"),
  acct("24000", "Deferred Revenue", "Liability", "Current Liability"),
  acct("25000", "Notes Payable", "Liability", "Long-Term Liability"),

  // ── Equity ────────────────────────────────────────────────
  acct("30000", "Owner's Equity", "Equity", "Equity"),
  acct("31000", "Retained Earnings", "Equity", "Equity"),
  acct("32000", "Owner Draws", "Equity", "Equity (Contra)"),

  // ── Income ────────────────────────────────────────────────
  acct("40000", "Sales Revenue", "Income", "Operating Income"),
  acct("41000", "Service Revenue", "Income", "Operating Income"),
  acct("49000", "Other Income", "Income", "Other Income"),

  // ── Expenses ──────────────────────────────────────────────
  acct("50000", "Cost of Goods Sold", "Expense", "COGS"),
  acct("60000", "Advertising & Marketing", "Expense", "Operating Expense"),
  acct("61000", "Bank Fees & Charges", "Expense", "Operating Expense"),
  acct("62000", "Insurance", "Expense", "Operating Expense"),
  acct("63000", "Office Supplies", "Expense", "Operating Expense"),
  acct("64000", "Rent & Lease", "Expense", "Operating Expense"),
  acct("65000", "Software & Subscriptions", "Expense", "Operating Expense"),
  acct("66000", "Utilities", "Expense", "Operating Expense"),
  acct("67000", "Payroll Expense", "Expense", "Operating Expense"),
  acct("68000", "Travel", "Expense", "Operating Expense"),
  acct("69000", "Meals & Entertainment", "Expense", "Operating Expense"),
];

const byCode = new Map(CHART_OF_ACCOUNTS.map((a) => [a.code, a]));

export function getAccount(code: string): Account {
  const account = byCode.get(code);
  if (!account) throw new Error(`Unknown account code: ${code}`);
  return account;
}
