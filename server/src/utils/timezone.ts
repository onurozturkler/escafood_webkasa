/**
 * TIMEZONE FIX: Convert date range filters from Turkey local day boundaries to UTC
 * 
 * When frontend sends "YYYY-MM-DD" for a date filter, it represents a day in Turkey timezone.
 * We need to convert:
 * - from: Turkey 00:00:00 -> UTC
 * - to: Turkey 23:59:59.999 -> UTC
 * 
 * This handles DST (Daylight Saving Time) correctly using date-fns-tz.
 */

import { zonedTimeToUtc, toZonedTime } from 'date-fns-tz';

const TURKEY_TIMEZONE = 'Europe/Istanbul';

/**
 * Convert a Turkey local date (YYYY-MM-DD) to UTC start of day
 * Example: "2025-12-22" -> UTC timestamp for 2025-12-22 00:00:00 in Turkey
 */
export function turkeyDateToUtcStart(dateStr: string): Date {
  // Parse as Turkey local date at 00:00:00
  const [year, month, day] = dateStr.split('-').map(Number);
  const turkeyLocalDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  
  // Convert to UTC using timezone
  return zonedTimeToUtc(turkeyLocalDate, TURKEY_TIMEZONE);
}

/**
 * Convert a Turkey local date (YYYY-MM-DD) to UTC end of day
 * Example: "2025-12-22" -> UTC timestamp for 2025-12-22 23:59:59.999 in Turkey
 */
export function turkeyDateToUtcEnd(dateStr: string): Date {
  // Parse as Turkey local date at 23:59:59.999
  const [year, month, day] = dateStr.split('-').map(Number);
  const turkeyLocalDate = new Date(year, month - 1, day, 23, 59, 59, 999);
  
  // Convert to UTC using timezone
  return zonedTimeToUtc(turkeyLocalDate, TURKEY_TIMEZONE);
}

/**
 * Get today's date in Turkey timezone as YYYY-MM-DD
 * This is used for default date values in queries
 * Uses Intl.DateTimeFormat for reliable timezone conversion
 */
export function getTodayTurkeyDate(): string {
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

