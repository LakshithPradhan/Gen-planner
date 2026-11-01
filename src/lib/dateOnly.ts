import { isValidDateOnly } from '../types/plan';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export function getLocalDateOnly(date: Date = new Date()): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysToDateOnly(dateOnly: string, days: number): string {
  if (!isValidDateOnly(dateOnly) || !Number.isInteger(days)) return '';
  const [year, month, day] = dateOnly.split('-').map(Number);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day + days);
  if (date.getUTCFullYear() < 1 || date.getUTCFullYear() > 9999) return '';
  return [
    String(date.getUTCFullYear()).padStart(4, '0'),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

export function daysBetweenDateOnly(startDate: string, endDate: string): number | null {
  if (!isValidDateOnly(startDate) || !isValidDateOnly(endDate)) return null;
  const toUtcDay = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(0);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCFullYear(year, month - 1, day);
    return date.getTime();
  };
  return Math.round((toUtcDay(endDate) - toUtcDay(startDate)) / DAY_IN_MILLISECONDS);
}

export function formatDateOnly(dateOnly: string, locale = 'en-US'): string {
  if (!isValidDateOnly(dateOnly)) return dateOnly;
  const [year, month, day] = dateOnly.split('-').map(Number);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
