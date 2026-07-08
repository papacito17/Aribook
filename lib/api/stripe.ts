/**
 * Payments API shell (Stripe).
 *
 * Simulates creating a PaymentIntent and confirming a card / ACH payment.
 * In production, replace with `stripe.paymentIntents.create` on the server
 * and Stripe Elements confirmation on the client.
 */

export type PaymentMethod = "card" | "ach";

export interface PaymentResult {
  id: string;
  status: "succeeded";
  method: PaymentMethod;
  amount: number;
  /** Simulated Stripe processing fee (2.9% + 30¢ card, 0.8% capped ACH). */
  fee: number;
  receiptUrl: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function processPayment(
  amount: number,
  method: PaymentMethod
): Promise<PaymentResult> {
  await delay(1200 + Math.random() * 600);
  const fee =
    method === "card"
      ? round2(amount * 0.029 + 0.3)
      : Math.min(round2(amount * 0.008), 5);
  const id = `pi_${Math.random().toString(36).slice(2, 12)}`;
  return {
    id,
    status: "succeeded",
    method,
    amount: round2(amount),
    fee,
    receiptUrl: `https://pay.stripe.com/receipts/${id}`,
  };
}
