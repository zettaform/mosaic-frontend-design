import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { buildAvatarUrl, authApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import AvatarPickerModal from '../../components/AvatarPickerModal';
import toast from 'react-hot-toast';

function AccountPanel({ user }) {

  const [sync, setSync] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const { changeAvatar } = useAuth();

  const handleAvatarPicked = async (avatar, type) => {
    if (!avatar) return;
    
    setPicking(true);
    try {
      if (type === 'custom') {
        // For custom avatars, update both avatar and custom_avatar fields
        await authApi.updateAvatar(user.user_id, null, avatar.url);
        toast.success('Custom avatar updated successfully!');
      } else {
        // For DBZ avatars, update only the avatar field
        await authApi.updateAvatar(user.user_id, avatar.name, null);
        toast.success('Avatar updated successfully!');
      }
      
      // Refresh the user data
      window.location.reload();
    } catch (error) {
      console.error('Failed to update avatar:', error);
      toast.error('Failed to update avatar. Please try again.');
    } finally {
      setPicking(false);
    }
  };

  const getAvatarUrl = () => {
    if (user?.custom_avatar) {
      return user.custom_avatar;
    }
    if (user?.avatar) {
      return buildAvatarUrl(user.avatar);
    }
    return null;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    // Check if user has a password - if not, current password is optional
    const hasPassword = user?.has_password;

    if (!newPassword || !confirmPassword) {
      setPwError('Please fill in new password and confirmation');
      return;
    }

    // Only require current password if user already has one
    if (hasPassword && !currentPassword) {
      setPwError('Please enter your current password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters');
      return;
    }
    try {
      setPwLoading(true);
      await authApi.changePassword(currentPassword || '', newPassword);
      setPwSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPwForm(false);
    } catch (err) {
      setPwError(err.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="grow">
      {/* Panel body */}
      <div className="p-6 space-y-6">
        <h2 className="text-2xl text-slate-800 dark:text-slate-100 font-bold mb-5">My Account</h2>
        {/* Picture */}
        <section>
          <div className="flex items-center">
            <div className="mr-4 relative">
              {getAvatarUrl() ? (
                <img 
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600" 
                  src={getAvatarUrl()} 
                  width="80" 
                  height="80" 
                  alt="Avatar" 
                  onError={(e) => { 
                    e.currentTarget.onerror = null; 
                    e.currentTarget.src = '/fallback-avatar.svg'; 
                  }} 
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 text-xl font-medium border-2 border-slate-200 dark:border-slate-600">
                  {(user?.username || '?').slice(0, 1).toUpperCase()}
                </div>
              )}
              {/* Avatar type indicator */}
              {user?.custom_avatar && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">C</span>
                </div>
              )}
              {user?.avatar && !user?.custom_avatar && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">DBZ</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button 
                className="btn-sm bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50" 
                onClick={() => setPickerOpen(true)}
                disabled={picking}
              >
                {picking ? 'Updating...' : 'Change Avatar'}
              </button>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {user?.custom_avatar ? 'Custom Avatar' : user?.avatar ? 'Dragon Ball Z' : 'Default Avatar'}
              </div>
            </div>
          </div>
        </section>
        {/* Profile */}
        <section>
          <h2 className="text-xl leading-snug text-slate-800 dark:text-slate-100 font-bold mb-1">Profile</h2>
          <div className="text-sm text-slate-500 dark:text-slate-400">Your account details from the server.</div>
          <div className="sm:flex sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-5">
            <div className="sm:w-1/3">
              <label className="block text-sm font-medium mb-1" htmlFor="full_name">Full Name</label>
              <input id="full_name" className="form-input w-full" type="text" value={user?.full_name || ''} readOnly placeholder="(not set)" />
            </div>
            <div className="sm:w-1/3">
              <label className="block text-sm font-medium mb-1" htmlFor="username">Username</label>
              <input id="username" className="form-input w-full" type="text" value={user?.username || ''} readOnly />
            </div>
            <div className="sm:w-1/3">
              <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
              <input id="email" className="form-input w-full" type="email" value={user?.email || ''} readOnly />
            </div>
          </div>
        </section>
        {/* Email (display only) */}
        <section>
          <h2 className="text-xl leading-snug text-slate-800 dark:text-slate-100 font-bold mb-1">Email</h2>
          <div className="text-sm text-slate-500 dark:text-slate-400">Email associated with your account.</div>
          <div className="flex flex-wrap mt-5">
            <div className="mr-2">
              <label className="sr-only" htmlFor="email_display">Email</label>
              <input id="email_display" className="form-input" type="email" value={user?.email || ''} readOnly />
            </div>
          </div>
        </section>
        {/* Password */}
        <section>
          <h2 className="text-xl leading-snug text-slate-800 dark:text-slate-100 font-bold mb-1">Password</h2>
          <div className="text-sm">
            {user?.has_password
              ? 'Update your password to keep your account secure.'
              : 'Set a permanent password if you don\'t want to use temporary login codes.'
            }
          </div>
          {!showPwForm ? (
            <div className="mt-5 space-y-3">
              <button onClick={() => setShowPwForm(true)} className="btn border-slate-200 dark:border-slate-700 shadow-sm text-indigo-500">
                {user?.has_password ? 'Change Password' : 'Set Password'}
              </button>
              <div>
                <Link to="/reset-password" className="text-sm text-indigo-500 hover:text-indigo-600">
                  Forgot your password? Reset it here
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4 max-w-xl">
              {pwError && (
                <div className="text-sm text-rose-500">{pwError}</div>
              )}
              {pwSuccess && (
                <div className="text-sm text-emerald-500">{pwSuccess}</div>
              )}
              {user?.has_password && (
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="current_password">Current password</label>
                  <input id="current_password" className="form-input w-full" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
                </div>
              )}
              <div className="sm:flex sm:space-x-4 space-y-4 sm:space-y-0">
                <div className="sm:w-1/2">
                  <label className="block text-sm font-medium mb-1" htmlFor="new_password">New password</label>
                  <input id="new_password" className="form-input w-full" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
                </div>
                <div className="sm:w-1/2">
                  <label className="block text-sm font-medium mb-1" htmlFor="confirm_password">Confirm new password</label>
                  <input id="confirm_password" className="form-input w-full" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button type="submit" className="btn bg-indigo-500 hover:bg-indigo-600 text-white" disabled={pwLoading}>
                  {pwLoading ? 'Saving…' : (user?.has_password ? 'Update Password' : 'Set Password')}
                </button>
                <button type="button" className="btn dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300" onClick={() => { setShowPwForm(false); setPwError(''); setPwSuccess(''); }}>Cancel</button>
              </div>
            </form>
          )}
        </section>
        {/* Smart Sync */}
        <section>
          <h2 className="text-xl leading-snug text-slate-800 dark:text-slate-100 font-bold mb-1">Smart Sync update for Mac</h2>
          <div className="text-sm">With this update, online-only files will no longer appear to take up hard drive space.</div>
          <div className="flex items-center mt-5">
            <div className="form-switch">
              <input type="checkbox" id="toggle" className="sr-only" checked={sync} onChange={() => setSync(!sync)} />
              <label className="bg-slate-400 dark:bg-slate-700" htmlFor="toggle">
                <span className="bg-white shadow-sm" aria-hidden="true"></span>
                <span className="sr-only">Enable smart sync</span>
              </label>
            </div>
            <div className="text-sm text-slate-400 dark:text-slate-500 italic ml-2">{sync ? 'On' : 'Off'}</div>
          </div>
        </section>
      </div>
      {/* Panel footer */}
      <footer>
        <div className="flex flex-col px-6 py-5 border-t border-slate-200 dark:border-slate-700">
          <div className="flex self-end">
            <button className="btn dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300">Cancel</button>
            <button className="btn bg-indigo-500 hover:bg-indigo-600 text-white ml-3">Save Changes</button>
          </div>
        </div>
      </footer>
      
      {/* Avatar Picker Modal */}
      <AvatarPickerModal 
        open={pickerOpen} 
        setOpen={setPickerOpen} 
        onPicked={handleAvatarPicked} 
        picking={picking} 
      />
    </div>
  );
}

export default AccountPanel;