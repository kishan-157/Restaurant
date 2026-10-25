/**
 * Indian Standard Time (IST / Asia/Kolkata) & INR Formatting Utilities
 */

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Formats a Date or ISO timestamp into Indian Standard Time (e.g. "07:30 PM IST")
 */
export function formatISTTime(dateInput: Date | string | number = new Date()): string {
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) {
      return new Date().toLocaleTimeString('en-IN', {
        timeZone: IST_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }) + ' IST';
    }
    const timeStr = date.toLocaleTimeString('en-IN', {
      timeZone: IST_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${timeStr.toUpperCase()} IST`;
  } catch {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST';
  }
}

/**
 * Formats a Date or ISO timestamp into full Indian Standard Date & Time (e.g. "25 Oct 2026, 07:30 PM IST")
 */
export function formatISTDateTime(dateInput: Date | string | number = new Date()): string {
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);
    const formatted = date.toLocaleString('en-IN', {
      timeZone: IST_TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${formatted} IST`;
  } catch {
    return new Date(dateInput).toLocaleString() + ' IST';
  }
}

/**
 * Returns YYYY-MM-DD date string in Indian Standard Time (Asia/Kolkata)
 * Ideal for <input type="date" /> default values
 */
export function getISTDateInputString(offsetDays = 0): string {
  try {
    const target = new Date(Date.now() + offsetDays * 86400000);
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: IST_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(target);

    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;
    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Fallback
  }
  return new Date(Date.now() + offsetDays * 86400000).toISOString().split('T')[0];
}

/**
 * Returns the current day name in Indian Standard Time (e.g. "Monday", "Sunday")
 */
export function getISTDayName(dateInput: Date | string | number = new Date()): string {
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return date.toLocaleDateString('en-US', {
      timeZone: IST_TIMEZONE,
      weekday: 'long',
    });
  } catch {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }
}
