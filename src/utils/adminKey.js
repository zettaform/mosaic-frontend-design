/**
 * NOTE: An "admin key" is not a secret if used from the browser.
 * This helper exists only to avoid shipping hardcoded default keys in the frontend bundle.
 */
export function getAdminKeyFromBrowser() {
  try {
    return (localStorage.getItem('admin_key') || window.ADMIN_KEY || '').trim();
  } catch {
    return String(window.ADMIN_KEY || '').trim();
  }
}




