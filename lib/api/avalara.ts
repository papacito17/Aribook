/**
 * Sales Tax API shell (Avalara / TaxJar).
 *
 * Simulates `POST /api/v2/transactions/create` against Avalara AvaTax.
 * In production, swap `calculateSalesTax` for a real AvaTax client call —
 * the response shape below mirrors the fields the UI consumes.
 */

export interface TaxRequest {
  state: string; // two-letter US state code
  zip: string;
  amount: number; // taxable subtotal in USD
}

export interface TaxBreakdownLine {
  jurisdiction: string;
  rate: number;
}

export interface TaxResult {
  provider: "Avalara AvaTax (simulated)";
  state: string;
  zip: string;
  combinedRate: number;
  taxAmount: number;
  breakdown: TaxBreakdownLine[];
}

/** Representative combined state+avg-local rates for the simulation. */
const STATE_RATES: Record<string, { state: number; local: number }> = {
  AL: { state: 4.0, local: 5.29 },
  AK: { state: 0.0, local: 1.82 },
  AZ: { state: 5.6, local: 2.81 },
  AR: { state: 6.5, local: 2.94 },
  CA: { state: 7.25, local: 1.6 },
  CO: { state: 2.9, local: 4.91 },
  CT: { state: 6.35, local: 0.0 },
  DE: { state: 0.0, local: 0.0 },
  FL: { state: 6.0, local: 1.0 },
  GA: { state: 4.0, local: 3.39 },
  HI: { state: 4.0, local: 0.5 },
  ID: { state: 6.0, local: 0.03 },
  IL: { state: 6.25, local: 2.59 },
  IN: { state: 7.0, local: 0.0 },
  IA: { state: 6.0, local: 0.94 },
  KS: { state: 6.5, local: 2.25 },
  KY: { state: 6.0, local: 0.0 },
  LA: { state: 4.45, local: 5.1 },
  ME: { state: 5.5, local: 0.0 },
  MD: { state: 6.0, local: 0.0 },
  MA: { state: 6.25, local: 0.0 },
  MI: { state: 6.0, local: 0.0 },
  MN: { state: 6.88, local: 0.65 },
  MS: { state: 7.0, local: 0.06 },
  MO: { state: 4.23, local: 4.14 },
  MT: { state: 0.0, local: 0.0 },
  NE: { state: 5.5, local: 1.47 },
  NV: { state: 6.85, local: 1.39 },
  NH: { state: 0.0, local: 0.0 },
  NJ: { state: 6.63, local: 0.0 },
  NM: { state: 4.88, local: 2.73 },
  NY: { state: 4.0, local: 4.53 },
  NC: { state: 4.75, local: 2.25 },
  ND: { state: 5.0, local: 2.04 },
  OH: { state: 5.75, local: 1.49 },
  OK: { state: 4.5, local: 4.49 },
  OR: { state: 0.0, local: 0.0 },
  PA: { state: 6.0, local: 0.34 },
  RI: { state: 7.0, local: 0.0 },
  SC: { state: 6.0, local: 1.5 },
  SD: { state: 4.2, local: 1.91 },
  TN: { state: 7.0, local: 2.55 },
  TX: { state: 6.25, local: 1.95 },
  UT: { state: 6.1, local: 1.15 },
  VT: { state: 6.0, local: 0.36 },
  VA: { state: 5.3, local: 0.47 },
  WA: { state: 6.5, local: 2.88 },
  WV: { state: 6.0, local: 0.57 },
  WI: { state: 5.0, local: 0.7 },
  WY: { state: 4.0, local: 1.44 },
  DC: { state: 6.0, local: 0.0 },
};

export const US_STATES = Object.keys(STATE_RATES).sort();

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Simulated network latency so the UI shows a realistic loading state. */
const simulateLatency = () =>
  new Promise((resolve) => setTimeout(resolve, 650 + Math.random() * 450));

export async function calculateSalesTax(
  req: TaxRequest
): Promise<TaxResult> {
  await simulateLatency();

  const rates = STATE_RATES[req.state] ?? { state: 0, local: 0 };
  // Tiny deterministic zip-based jitter to mimic district-level rates.
  const zipDigit = Number(req.zip.replace(/\D/g, "").slice(-1) || 0);
  const districtRate = rates.local > 0 ? round2(zipDigit * 0.025) : 0;
  const combinedRate = round2(rates.state + rates.local + districtRate);

  const breakdown: TaxBreakdownLine[] = [
    { jurisdiction: `${req.state} State`, rate: rates.state },
  ];
  if (rates.local > 0) {
    breakdown.push({ jurisdiction: "County / City", rate: rates.local });
  }
  if (districtRate > 0) {
    breakdown.push({ jurisdiction: "Special District", rate: districtRate });
  }

  return {
    provider: "Avalara AvaTax (simulated)",
    state: req.state,
    zip: req.zip,
    combinedRate,
    taxAmount: round2((req.amount * combinedRate) / 100),
    breakdown,
  };
}
