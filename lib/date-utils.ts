/**
 * Utility to format dates consistently using Africa/Lagos timezone (UTC+1).
 * This ensures Admin reports, Manager history, and Approval actions all align.
 */
export function toLagosDateString(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  
  // Format to YYYY-MM-DD in Lagos timezone
  return new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Africa/Lagos', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).format(date);
}

/**
 * Utility to format dates consistently to YYYY-MM-DD using a specified timezone.
 */
export function toTimeZoneDateString(dateInput: Date | string | number, timeZone: string): string {
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-CA', { 
    timeZone, 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).format(date);
}

/**
 * Formats a date for display using Lagos timezone.
 */
export function toLagosDisplayDate(dateInput: Date | string | number, showTime: boolean = false): string {
  const date = new Date(dateInput);
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  };

  if (showTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = true;
  }

  return new Intl.DateTimeFormat('en-US', options).format(date);
}
