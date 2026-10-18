/**
 * Date and Time utilities formatted for Pakistan Standard Time (PKT, UTC+05:00).
 */

export const PK_TIMEZONE = 'Asia/Karachi';

/**
 * Returns the current date in Pakistan formatted as YYYY-MM-DD (safe for <input type="date">)
 */
export const getPKCurrentDate = (dateObj: Date = new Date()): string => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: PK_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(dateObj);
};

/**
 * Returns current time in Pakistan formatted as HH:mm (24hr, safe for <input type="time">)
 */
export const getPKCurrentTime = (dateObj: Date = new Date()): string => {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: PK_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(dateObj);
};

/**
 * Formats a timestamp into human-readable Pakistan Date (e.g. "05 Oct 2026" or "5/10/2026")
 */
export const formatPKDate = (
  dateVal?: string | Date | number | null,
  options?: { numericOnly?: boolean }
): string => {
  if (!dateVal) return 'N/A';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return 'N/A';

  if (options?.numericOnly) {
    return d.toLocaleDateString('en-GB', {
      timeZone: PK_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  return d.toLocaleDateString('en-GB', {
    timeZone: PK_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Formats a timestamp into 12-hour Pakistan Time with AM/PM (e.g. "12:36:08 AM")
 */
export const formatPKTime = (
  dateVal?: string | Date | number | null,
  includeSeconds = true
): string => {
  if (!dateVal) return 'N/A';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return 'N/A';

  return d.toLocaleTimeString('en-US', {
    timeZone: PK_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {}),
    hour12: true,
  });
};

/**
 * Combines date string (YYYY-MM-DD) and time string (HH:mm) assuming Pakistan timezone (+05:00)
 * and returns standard ISO 8601 string.
 */
export const toPKISOString = (dateStr: string, timeStr?: string): string => {
  if (!dateStr) return new Date().toISOString();
  const time = timeStr && timeStr.trim() ? timeStr.trim() : '12:00';
  const timeParts = time.split(':');
  const hh = (timeParts[0] || '12').padStart(2, '0');
  const mm = (timeParts[1] || '00').padStart(2, '0');
  const ss = (timeParts[2] || '00').padStart(2, '0');

  // Explicitly tie to Pakistan Standard Time (UTC+05:00)
  const d = new Date(`${dateStr}T${hh}:${mm}:${ss}+05:00`);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};
