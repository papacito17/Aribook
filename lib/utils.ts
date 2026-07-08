const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function fmtUSD(amount: number): string {
  return usd.format(amount);
}

export function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
