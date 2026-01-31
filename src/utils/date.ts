const weekdays = ['pazar', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi'];

/**
 * TIMEZONE FIX: Get today's date in Turkey timezone as YYYY-MM-DD
 * This ensures the date matches what users see in Turkey, not UTC
 */
export function todayIso(): string {
  const now = new Date();
  // Use Intl.DateTimeFormat to get Turkey timezone date
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
}

/**
 * TIMEZONE FIX: Format a Date or ISO string to Turkish date format (DD.MM.YYYY)
 * Accepts both Date objects and ISO strings (UTC timestamps)
 * Always displays in Europe/Istanbul timezone
 */
export function formatTRDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(dateObj);
}

/**
 * TIMEZONE FIX: Format a Date or ISO string to Turkish datetime format (DD.MM.YYYY HH:mm)
 * Accepts both Date objects and ISO strings (UTC timestamps)
 * Always displays in Europe/Istanbul timezone
 */
export function formatTRDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(dateObj);
}

/**
 * TIMEZONE FIX: Convert ISO date string (YYYY-MM-DD) to display format (DD.MM.YYYY)
 * For date-only strings (no time), this is a simple format conversion
 * For datetime strings, use formatTRDate() instead
 */
export function isoToDisplay(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d.padStart(2, '0')}.${m.padStart(2, '0')}.${y}`;
}

export function displayToIso(display: string): string {
  const parts = display.split('.');
  if (parts.length !== 3) return display;
  const [d, m, y] = parts;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export function getWeekdayTr(iso: string): string {
  // TIMEZONE FIX: Parse ISO date as local date to avoid timezone issues
  // "2025-12-22" should be treated as local date, not UTC
  const [y, m, d] = iso.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return '';
  const date = new Date(y, m - 1, d); // Month is 0-indexed
  const day = date.getDay();
  return weekdays[day] || '';
}

export function diffInDays(fromIso: string, toIso: string): number {
  // TIMEZONE FIX: Parse ISO dates as local dates to avoid timezone issues
  const parseLocalDate = (iso: string): Date => {
    const [y, m, d] = iso.split('-').map(Number);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date(iso); // Fallback to default parsing
    return new Date(y, m - 1, d); // Month is 0-indexed
  };
  const from = parseLocalDate(fromIso);
  const to = parseLocalDate(toIso);
  const diff = to.getTime() - from.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map((part) => parseInt(part, 10));
  const baseYear = Number.isNaN(y) ? 1970 : y;
  const baseMonth = Number.isNaN(m) ? 0 : (m || 1) - 1;
  const day = Number.isNaN(d) ? 1 : d || 1;

  const totalMonths = baseMonth + months;
  const targetYear = baseYear + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;

  const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, daysInTargetMonth);

  const targetDate = new Date(Date.UTC(targetYear, targetMonth, clampedDay));
  return targetDate.toISOString().slice(0, 10);
}
