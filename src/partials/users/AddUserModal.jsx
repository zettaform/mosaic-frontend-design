import React, { useEffect, useState } from 'react';
import s3AvatarService from '../../services/s3AvatarService';
import PermissionsEditor from './PermissionsEditor';
import rbacTemplateService from '../../services/rbacTemplateService';

function AddUserModal({ open, setOpen, onCreated, onExternalCreated, creating, adminKey }) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    status: 'active',
    avatar_url: ''
  });
  const [permissions, setPermissions] = useState({});
  const [errors, setErrors] = useState({});
  const [availableAvatars, setAvailableAvatars] = useState([]);
  const [selectedAvatarName, setSelectedAvatarName] = useState('');
  const [loadingAvatars, setLoadingAvatars] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [permissionMode, setPermissionMode] = useState('template');

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoadingAvatars(true);
    Promise.all([s3AvatarService.listAvatars(), rbacTemplateService.listTemplates()])
      .then(([avatarResult, templatesResult]) => {
        if (!mounted) return;
        const avatars = (avatarResult?.avatars || []).map((a) => ({
          name: a.name,
          displayName: a.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          url: a.url
        }));
        setAvailableAvatars(avatars);
        setTemplates(templatesResult?.templates || []);
      })
      .finally(() => mounted && setLoadingAvatars(false));
    return () => {
      mounted = false;
    };
  }, [open]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const hasPermissionsSelected = (perm = {}) => {
    if (!perm || typeof perm !== 'object') return false;
    return Object.values(perm).some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      if (value && typeof value === 'object') return hasPermissionsSelected(value);
      return Boolean(value);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (permissionMode === 'template' && !selectedTemplate) {
      newErrors.permissions = 'Select an RBAC template or switch to manual mode';
    }
    if (permissionMode === 'manual' && !hasPermissionsSelected(permissions)) {
      newErrors.permissions = 'Configure at least one manual permission';
    }
    if (!formData.avatar_url) newErrors.avatar_url = 'Please select an avatar';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      username: formData.username.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      role: formData.role,
      permissions: permissionMode === 'manual' ? permissions : {},
      rbac_template_id: permissionMode === 'template' ? selectedTemplate : '',
      status: formData.status,
      avatar_url: formData.avatar_url
    };

    if (adminKey && onExternalCreated) await onExternalCreated(payload);
    else await onCreated(payload);

    if (!creating) {
      setFormData({ username: '', email: '', password: '', role: 'user', status: 'active', avatar_url: '' });
      setPermissions({});
      setSelectedAvatarName('');
      setSelectedTemplate('');
      setPermissionMode('template');
    }
  };

  if (!open) return null;

  const avatarChoices = alphabet.map((letter, index) => {
    const source = availableAvatars[index % Math.max(availableAvatars.length, 1)] || {};
    return {
      letter,
      name: `${source.name || 'avatar'}-${letter.toLowerCase()}`,
      displayName: `${source.displayName || 'Dragon Ball'} (${letter})`,
      url: source.url || '/fallback-avatar.svg',
      fallbackName: source.name || 'goku'
    };
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Add Customer</h3>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label htmlFor="add-user-username" className="block text-sm font-medium mb-1">Username *</label>
            <input id="add-user-username" type="text" className={`form-input w-full ${errors.username ? 'border-rose-500' : ''}`} value={formData.username} onChange={(e) => handleInputChange('username', e.target.value)} />
            {errors.username && <p className="text-xs text-rose-500 mt-1">{errors.username}</p>}
          </div>
          <div>
            <label htmlFor="add-user-email" className="block text-sm font-medium mb-1">Email *</label>
            <input id="add-user-email" type="text" className={`form-input w-full ${errors.email ? 'border-rose-500' : ''}`} value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} />
            {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="add-user-password" className="block text-sm font-medium mb-1">Password *</label>
            <input id="add-user-password" type="password" className={`form-input w-full ${errors.password ? 'border-rose-500' : ''}`} value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} />
            {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select className="form-select w-full" value={formData.role} onChange={(e) => {
              handleInputChange('role', e.target.value);
              if (permissionMode === 'manual') setPermissions({});
            }}>
              <option value="user">User</option>
              <option value="dev">Dev</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Access Controls and Permissions</label>
            <div className="mb-3 flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="permissionMode" checked={permissionMode === 'template'} onChange={() => setPermissionMode('template')} />
                Use Template
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="permissionMode" checked={permissionMode === 'manual'} onChange={() => {
                  setPermissionMode('manual');
                  setSelectedTemplate('');
                }} />
                Manual Pages
              </label>
            </div>
            {permissionMode === 'template' && (
              <select className="form-select w-full" value={selectedTemplate} onChange={(e) => {
                setSelectedTemplate(e.target.value);
                if (errors.permissions) setErrors((prev) => ({ ...prev, permissions: '' }));
              }}>
                <option value="">-- Select RBAC template --</option>
                {templates.map((template) => <option key={template.template_id} value={template.template_id}>{template.name} ({template.role})</option>)}
              </select>
            )}
            {permissionMode === 'manual' && (
              <div className="border border-slate-200 dark:border-slate-700 rounded-md p-3">
                <PermissionsEditor role={formData.role} permissions={permissions} onPermissionsChange={setPermissions} />
              </div>
            )}
            {errors.permissions && <p className="text-xs text-rose-500 mt-1">{errors.permissions}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <button type="button" className={`inline-flex items-center h-8 w-16 rounded-full ${formData.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} onClick={() => handleInputChange('status', formData.status === 'active' ? 'inactive' : 'active')}>
              <span className={`h-6 w-6 rounded-full bg-white transform transition-transform ${formData.status === 'active' ? 'translate-x-9' : 'translate-x-1'}`} />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Avatar * (A-Z)</label>
            {loadingAvatars ? (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-square rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse" />)}</div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {avatarChoices.map((avatar) => (
                  <button key={avatar.name} type="button" className={`relative h-12 w-12 rounded-md border overflow-hidden transition-colors ${selectedAvatarName === avatar.name ? 'border-indigo-500 ring-1 ring-indigo-300' : 'border-slate-200 dark:border-slate-700'}`} onClick={() => {
                    setSelectedAvatarName(avatar.name);
                    handleInputChange('avatar_url', avatar.url);
                  }}>
                    <img src={avatar.url} alt={avatar.displayName} className="w-full h-full object-cover" onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `/avatars/dbz/${avatar.fallbackName}.svg`;
                    }} />
                    <span className="absolute bottom-0 right-0 h-4 w-4 rounded-tl-md bg-black/65 text-white text-[10px] leading-4 font-semibold text-center">
                      {avatar.letter}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {errors.avatar_url && <p className="text-xs text-rose-500 mt-1">{errors.avatar_url}</p>}
            {formData.avatar_url && <img src={formData.avatar_url} alt="Selected avatar" className="mt-2 w-10 h-10 rounded-md object-cover border border-slate-200" />}
          </div>
        </form>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button type="button" className="btn border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300" onClick={() => setOpen(false)} disabled={creating}>Cancel</button>
          <button type="submit" className="btn bg-indigo-500 hover:bg-indigo-600 text-white" onClick={handleSubmit} disabled={creating}>{creating ? 'Creating...' : 'Create User'}</button>
        </div>
      </div>
    </div>
  );
}

export default AddUserModal;
