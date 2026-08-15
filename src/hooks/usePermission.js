import { useAuth } from '../contexts/AuthContext';
import { hasAccess } from '../config/rbac';

/**
 * usePermission Hook
 * 
 * Custom hook to check if the current user has permission to access
 * a specific section and/or page.
 * 
 * @param {string} section - The section name (e.g., "Dashboard", "Crypto")
 * @param {string} page - Optional page name within the section (e.g., "Main", "Analytics")
 * @returns {boolean} - Whether the user has access
 * 
 * @example
 * const canAccessCrypto = usePermission('Crypto');
 * const canAccessPay = usePermission('Ecommerce', 'Pay');
 */
export const usePermission = (section, page = null) => {
  const { user } = useAuth();
  
  if (!user) {
    return false;
  }
  
  return hasAccess(user, section, page);
};

export default usePermission;

