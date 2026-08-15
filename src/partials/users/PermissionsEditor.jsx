import React, { useState, useEffect } from 'react';
import { getAllSectionsAndPages, getDefaultPermissionsForRole } from '../../config/rbac';

/**
 * PermissionsEditor Component
 * 
 * Allows admin to configure user permissions by selecting which sections
 * and pages a user can access. When role is 'admin', all permissions are
 * automatically granted and the UI is disabled.
 * 
 * @param {Object} props
 * @param {string} props.role - User role (admin, dev, user)
 * @param {Object} props.permissions - Current permissions object
 * @param {Function} props.onPermissionsChange - Callback when permissions change
 */
function PermissionsEditor({ role, permissions = {}, onPermissionsChange }) {
  const [localPermissions, setLocalPermissions] = useState(permissions || {});
  const sectionsAndPages = getAllSectionsAndPages();
  const isAdmin = role === 'admin';

  // Initialize permissions based on role
  useEffect(() => {
    if (isAdmin) {
      // Admin gets all permissions automatically
      const adminPermissions = getDefaultPermissionsForRole('admin');
      setLocalPermissions(adminPermissions);
      onPermissionsChange(adminPermissions);
    } else if (Object.keys(permissions).length === 0 && role) {
      // Initialize with role defaults if no permissions set
      const defaultPermissions = getDefaultPermissionsForRole(role);
      setLocalPermissions(defaultPermissions);
      onPermissionsChange(defaultPermissions);
    } else if (Object.keys(permissions).length > 0) {
      setLocalPermissions(permissions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]); // Only re-run when role changes

  // Update local permissions when prop changes (for edit mode)
  useEffect(() => {
    if (Object.keys(permissions).length > 0) {
      setLocalPermissions(permissions);
    }
  }, [permissions]);

  const toggleSection = (section) => {
    if (isAdmin) return; // Admin permissions can't be changed
    
    const currentPages = localPermissions[section] || [];
    const allPages = sectionsAndPages.find(s => s.section === section)?.pages || [];
    
    // If section is fully checked, uncheck it; otherwise check all pages
    const newPages = currentPages.length === allPages.length ? [] : allPages;
    
    const updated = {
      ...localPermissions,
      [section]: newPages
    };
    
    setLocalPermissions(updated);
    onPermissionsChange(updated);
  };

  const togglePage = (section, page) => {
    if (isAdmin) return; // Admin permissions can't be changed
    
    const currentPages = localPermissions[section] || [];
    const isChecked = currentPages.includes(page);
    
    const newPages = isChecked
      ? currentPages.filter(p => p !== page)
      : [...currentPages, page];
    
    const updated = {
      ...localPermissions,
      [section]: newPages
    };
    
    setLocalPermissions(updated);
    onPermissionsChange(updated);
  };

  const isSectionChecked = (section) => {
    const sectionPages = sectionsAndPages.find(s => s.section === section)?.pages || [];
    const currentPages = localPermissions[section] || [];
    return sectionPages.length > 0 && currentPages.length === sectionPages.length;
  };

  const isSectionIndeterminate = (section) => {
    const sectionPages = sectionsAndPages.find(s => s.section === section)?.pages || [];
    const currentPages = localPermissions[section] || [];
    return currentPages.length > 0 && currentPages.length < sectionPages.length;
  };

  const isPageChecked = (section, page) => {
    const currentPages = localPermissions[section] || [];
    return currentPages.includes(page);
  };

  return (
    <div className="space-y-4">
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 max-h-96 overflow-y-auto">
        {sectionsAndPages.map(({ section, pages }) => {
          const sectionChecked = isSectionChecked(section);
          const sectionIndeterminate = isSectionIndeterminate(section);
          
          return (
            <div key={section} className="mb-4 last:mb-0">
              {/* Section Header */}
              <label className="flex items-center cursor-pointer select-none mb-2">
                <input
                  type="checkbox"
                  checked={sectionChecked}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = sectionIndeterminate;
                    }
                  }}
                  onChange={() => toggleSection(section)}
                  disabled={isAdmin}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-600 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className={`ml-2 font-semibold ${isAdmin ? 'text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {section}
                </span>
              </label>
              
              {/* Pages under section */}
              <div className="ml-6 space-y-1">
                {pages.map((page) => {
                  const pageChecked = isPageChecked(section, page);
                  
                  return (
                    <label
                      key={page}
                      className="flex items-center cursor-pointer select-none py-1"
                    >
                      <input
                        type="checkbox"
                        checked={pageChecked}
                        onChange={() => togglePage(section, page)}
                        disabled={isAdmin}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-600 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className={`ml-2 text-sm ${isAdmin ? 'text-slate-400' : 'text-slate-600 dark:text-slate-400'}`}>
                        {page}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {isAdmin && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-700 dark:text-blue-300">
          ℹ️ Admin users have access to all sections and pages. Permissions cannot be modified.
        </div>
      )}
    </div>
  );
}

export default PermissionsEditor;

