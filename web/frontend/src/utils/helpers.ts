/**
 * Utility functions for common operations
 */

/**
 * Delays execution for a specified number of milliseconds
 */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Capitalizes the first letter of a string
 */
export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Checks if a value is not null and not undefined
 */
export const isNotNullish = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Safely parses JSON string, returns null if parsing fails
 */
export const safeJsonParse = (str: string): any | null => {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

/**
 * Formats a number with commas as thousands separators
 */
export const formatNumber = (num: number): string => num.toLocaleString();

/**
 * Truncates a string to a specified length and adds ellipsis
 */
export const truncate = (str: string, length: number): string =>
  str.length > length ? `${str.substring(0, length)}...` : str;
