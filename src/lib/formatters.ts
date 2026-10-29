import { CurrencyCode } from '../types/plan';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

/**
 * Formats a number in the specified currency.
 * For INR, uses 'en-IN' standard locale (e.g. ₹5,00,000).
 */
export function formatCurrency(amount: number, currency: CurrencyCode = 'INR', compact: boolean = false): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '₹';
  const validAmount = Number.isFinite(amount) ? Math.round(amount) : 0;

  if (compact && Math.abs(validAmount) >= 1000) {
    if (currency === 'INR') {
      if (Math.abs(validAmount) >= 10000000) {
        return `${symbol}${(validAmount / 10000000).toFixed(2)} Cr`;
      }
      if (Math.abs(validAmount) >= 100000) {
        return `${symbol}${(validAmount / 100000).toFixed(2)} L`;
      }
      return `${symbol}${(validAmount / 1000).toFixed(1)}k`;
    } else {
      if (Math.abs(validAmount) >= 1000000) {
        return `${symbol}${(validAmount / 1000000).toFixed(1)}M`;
      }
      return `${symbol}${(validAmount / 1000).toFixed(1)}k`;
    }
  }

  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(validAmount);

  return `${symbol}${formatted}`;
}

/**
 * Calculates days remaining from today until target date.
 */
export function getDaysLeft(targetDateStr: string): number {
  if (!targetDateStr) return 0;
  const target = new Date(targetDateStr);
  const now = new Date();
  // Normalize both to start of day in local time
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffTime = targetMidnight - todayMidnight;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Human friendly date string (e.g. 14 Nov 2026)
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
