/**
 * Environment detection utilities
 */

/**
 * Check if code is running in a server environment
 * @returns true if running on server (Node.js), false otherwise
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Check if code is running in a browser environment
 * @returns true if running in browser, false otherwise
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Check if DOM APIs are available
 * Useful for SSR-compatible code that needs to access DOM
 * @returns true if DOM is accessible, false otherwise
 */
export function canUseDOM(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    window.document &&
    window.document.createElement
  );
}
