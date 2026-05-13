export function customerPrice(basePrice: number, profitPct: number, shopPrice?: number): number {
  const base = shopPrice && shopPrice > 0 ? shopPrice : basePrice;
  return Math.round((base + (base * profitPct) / 100) * 100) / 100;
}

export function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export function genToken(): string {
  return "EM-" + Math.random().toString(36).slice(2, 7).toUpperCase() + "-" + Date.now().toString(36).slice(-4).toUpperCase();
}

export function parseSpecs(raw: unknown): Record<string, string> {
  if (!raw) return {};
  if (typeof raw === "object") return raw as Record<string, string>;
  try { return JSON.parse(String(raw)); } catch { return {}; }
}
