/**
 * Reusable DateTime utility for timezone conversions and formatting.
 * Supports DST (Daylight Saving Time) automatically via JavaScript native Date and Intl API.
 */

/**
 * Detects the system timezone.
 * @returns Timezone string, e.g. "Asia/Kolkata", "America/New_York", etc.
 */
export function getSystemTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch (error) {
    return 'UTC';
  }
}

/**
 * Converts a UTC datetime (string, Date, or timestamp) to a local Date object.
 * Automatically handles strings without timezone offset indicators, assuming they are UTC.
 * Automatically respects DST because the resulting local Date object query methods
 * (e.g. getHours(), toLocaleString()) are executed in system local time which respects DST.
 */
export function convertUTCToLocal(utcValue: string | Date | number | null | undefined): Date {
  if (utcValue === null || utcValue === undefined) {
    return new Date();
  }
  if (utcValue instanceof Date) {
    return utcValue;
  }
  if (typeof utcValue === 'number') {
    return new Date(utcValue);
  }

  let normalized = utcValue.trim();
  if (!normalized) {
    return new Date();
  }

  // Replace space with T to make it ISO-8601 compliant
  normalized = normalized.replace(' ', 'T');

  // If there is no timezone designator (no 'Z', '+', or '-' offset), treat as UTC
  const hasTimezone = normalized.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(normalized);
  if (!hasTimezone) {
    normalized = normalized + 'Z';
  }

  return new Date(normalized);
}

/**
 * Converts a local datetime representation to UTC.
 * Returns a standard Date object representing the UTC point in time.
 * When sending a date to the API, you can convert the date returned by this function
 * to an ISO string (.toISOString()) which will represent it in UTC.
 */
export function convertLocalToUTC(localValue: string | Date | number | null | undefined): Date {
  if (localValue === null || localValue === undefined) {
    return new Date();
  }
  // In JavaScript, Date objects represent a specific instant in time (UTC internally).
  // Thus, converting any representation to a standard Date object parses it in local/specified timezone,
  // and its internal representation is already in UTC epoch.
  return new Date(localValue);
}

/**
 * Formats a date to local date-only string in the user's local timezone.
 * Automatically supports DST.
 */
export function formatDate(
  date: string | Date | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (date === null || date === undefined) return 'N/A';
  const localDate = convertUTCToLocal(date);
  if (isNaN(localDate.getTime())) {
    // If the input date was already a formatted string that failed to parse (e.g., DD/MM/YYYY), return it
    if (typeof date === 'string') {
      const lower = date.toLowerCase();
      if (lower.includes('invalid') || lower.includes('null') || lower.includes('undefined')) {
        return 'N/A';
      }
      return date;
    }
    return 'N/A';
  }

  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  };

  try {
    return new Intl.DateTimeFormat(undefined, defaultOptions).format(localDate);
  } catch (error) {
    return localDate.toLocaleDateString(undefined, defaultOptions);
  }
}

/**
 * Formats a date to local date and time string in the user's local timezone.
 * Automatically supports DST.
 */
export function formatDateTime(
  date: string | Date | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (date === null || date === undefined) return 'N/A';
  const localDate = convertUTCToLocal(date);
  if (isNaN(localDate.getTime())) {
    if (typeof date === 'string') {
      const lower = date.toLowerCase();
      if (lower.includes('invalid') || lower.includes('null') || lower.includes('undefined')) {
        return 'N/A';
      }
      return date;
    }
    return 'N/A';
  }

  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };

  try {
    return new Intl.DateTimeFormat(undefined, defaultOptions).format(localDate);
  } catch (error) {
    return localDate.toLocaleString(undefined, defaultOptions);
  }
}

/**
 * Formats a date to local time-only string in the user's local timezone.
 * Automatically supports DST.
 */
export function formatTime(
  date: string | Date | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (date === null || date === undefined) return 'N/A';
  const localDate = convertUTCToLocal(date);
  if (isNaN(localDate.getTime())) return 'N/A';

  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };

  try {
    return new Intl.DateTimeFormat(undefined, defaultOptions).format(localDate);
  } catch (error) {
    return localDate.toLocaleTimeString(undefined, defaultOptions);
  }
}
