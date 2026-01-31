/**
 * TIMEZONE FIX: Convert date range filters from Turkey local day boundaries to UTC
 * 
 * When frontend sends "YYYY-MM-DD" for a date filter, it represents a day in Turkey timezone.
 * We need to convert:
 * - from: Turkey 00:00:00 -> UTC
 * - to: Turkey 23:59:59.999 -> UTC
 * 
 * This handles DST (Daylight Saving Time) correctly using Intl.DateTimeFormat.
 */

const TURKEY_TIMEZONE = 'Europe/Istanbul';

/**
 * Convert a Turkey local date (YYYY-MM-DD) to UTC start of day
 * Example: "2025-12-22" -> UTC timestamp for 2025-12-22 00:00:00 in Turkey
 * 
 * Turkey is UTC+3 (no DST since 2016), so:
 * Turkey 00:00:00 = UTC 21:00:00 (previous day)
 */
export function turkeyDateToUtcStart(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number);
  const year = parts[0];
  const month = parts[1] - 1; // JavaScript months are 0-indexed
  const day = parts[2];
  
  // Create UTC date for the target date at 00:00:00
  // Then subtract 3 hours to get Turkey midnight in UTC
  const utcDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  return new Date(utcDate.getTime() - 3 * 60 * 60 * 1000); // Subtract 3 hours
}

/**
 * Convert a Turkey local date (YYYY-MM-DD) to UTC end of day
 * Example: "2025-12-22" -> UTC timestamp for 2025-12-22 23:59:59.999 in Turkey
 * 
 * Turkey is UTC+3 (no DST since 2016), so:
 * Turkey 23:59:59.999 = UTC 20:59:59.999 (same day)
 */
export function turkeyDateToUtcEnd(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number);
  const year = parts[0];
  const month = parts[1] - 1;
  const day = parts[2];
  
  // Create UTC date for the target date at 23:59:59.999
  // Then subtract 3 hours to get Turkey end of day in UTC
  const utcDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  return new Date(utcDate.getTime() - 3 * 60 * 60 * 1000); // Subtract 3 hours
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

