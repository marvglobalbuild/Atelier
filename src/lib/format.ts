const CURRENCY_LOCALES: Record<string, string> = {
  NGN: "en-NG",
  GHS: "en-GH",
  KES: "en-KE",
  ZAR: "en-ZA",
  GBP: "en-GB",
  USD: "en-US",
  EUR: "en-IE",
  CAD: "en-CA",
  AUD: "en-AU",
};

export function money(amount: number, currency = "NGN") {
  const locale = CURRENCY_LOCALES[currency] ?? "en";
  try {
    let formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(amount);

    if (currency === "NGN" && formatted.includes("NGN")) {
      formatted = formatted.replace(/NGN\s*/g, "₦");
    }
    return formatted;
  } catch {
    const symbol = currency === "NGN" ? "₦" : `${currency} `;
    return `${symbol}${amount.toLocaleString()}`;
  }
}

export function shortDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d.length === 10 ? d + "T00:00:00" : d) : d;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function longDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d.length === 10 ? d + "T00:00:00" : d) : d;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function isoDay(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const CURRENCIES = ["NGN", "GHS", "KES", "ZAR", "XOF", "USD", "GBP", "EUR"];
