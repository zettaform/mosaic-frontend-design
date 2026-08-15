/**
 * RBAC Template Matcher Utility
 * 
 * Provides functions to match user permissions with RBAC templates
 * and determine if a user's permissions match a template or are manually configured.
 */

/**
 * Deep comparison of two permissions objects
 * @param {Object} permissions1 - First permissions object
 * @param {Object} permissions2 - Second permissions object
 * @returns {boolean} - True if permissions match exactly
 */
export const permissionsMatch = (permissions1, permissions2) => {
  // Handle null/undefined cases
  if (!permissions1 && !permissions2) return true;
  if (!permissions1 || !permissions2) return false;
  
  // Get all unique keys from both objects
  const allKeys = new Set([
    ...Object.keys(permissions1),
    ...Object.keys(permissions2)
  ]);
  
  // Check each key
  for (const key of allKeys) {
    const val1 = permissions1[key];
    const val2 = permissions2[key];
    
    // If one is undefined/null and the other isn't, they don't match
    if ((val1 === undefined || val1 === null) && (val2 !== undefined && val2 !== null)) {
      return false;
    }
    if ((val2 === undefined || val2 === null) && (val1 !== undefined && val1 !== null)) {
      return false;
    }
    
    // If both are arrays, compare them (order-independent)
    if (Array.isArray(val1) && Array.isArray(val2)) {
      const sorted1 = [...val1].sort();
      const sorted2 = [...val2].sort();
      if (sorted1.length !== sorted2.length) return false;
      for (let i = 0; i < sorted1.length; i++) {
        if (sorted1[i] !== sorted2[i]) return false;
      }
    } else if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
      // Recursive comparison for nested objects
      if (!permissionsMatch(val1, val2)) return false;
    } else {
      // Direct comparison for primitives
      if (val1 !== val2) return false;
    }
  }
  
  return true;
};

/**
 * Find which template matches the user's permissions
 * @param {Object} userPermissions - User's permissions object
 * @param {Array} templates - Array of RBAC templates
 * @returns {Object|null} - Matching template or null if no match
 */
export const findMatchingTemplate = (userPermissions, templates) => {
  if (!userPermissions || !templates || !Array.isArray(templates)) {
    return null;
  }
  
  // Normalize empty permissions
  const normalizedUserPerms = Object.keys(userPermissions).length === 0 ? {} : userPermissions;
  
  // If user has empty permissions, check if there's a template with empty permissions
  if (Object.keys(normalizedUserPerms).length === 0) {
    const emptyTemplate = templates.find(t => 
      !t.permissions || 
      Object.keys(t.permissions).length === 0
    );
    if (emptyTemplate) return emptyTemplate;
  }
  
  // Compare with each template
  for (const template of templates) {
    if (!template.permissions) continue;
    
    const templatePerms = template.permissions;
    
    // Normalize template permissions
    const normalizedTemplatePerms = Object.keys(templatePerms).length === 0 ? {} : templatePerms;
    
    // Compare permissions
    if (permissionsMatch(normalizedUserPerms, normalizedTemplatePerms)) {
      return template;
    }
  }
  
  return null;
};

/**
 * Check if user has manual configuration (not matching any template)
 * @param {Object} userPermissions - User's permissions object
 * @param {Array} templates - Array of RBAC templates
 * @returns {boolean} - True if permissions don't match any template
 */
export const isManualConfiguration = (userPermissions, templates) => {
  const matchingTemplate = findMatchingTemplate(userPermissions, templates);
  return matchingTemplate === null;
};

