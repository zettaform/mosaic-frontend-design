import React, { useEffect, useState, useRef } from 'react';
import { authApi } from '../services/api';
import ModalBasic from './ModalBasic';
import { 
  PhotoIcon, 
  CloudArrowUpIcon, 
  XMarkIcon,
  SparklesIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const AvatarPickerModal = ({ open, setOpen, onPicked, picking = false }) => {
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [activeTab, setActiveTab] = useState('dbz'); // 'dbz' or 'custom'
  const fileInputRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      if (!open) return;
      setError('');
      setLoading(true);
      try {
        const list = await authApi.getAvatars();
        setAvatars(list || []);
      } catch (e) {
        console.error('Failed to load avatars', e);
        setError(e?.message || 'Failed to load avatars');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const uploadedAvatar = await authApi.uploadAvatar(file);
      onPicked?.(uploadedAvatar, 'custom');
      setOpen(false);
    } catch (e) {
      console.error('Failed to upload avatar', e);
      setUploadError(e?.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarClick = (avatar) => {
    onPicked?.(avatar, avatar.type);
    setOpen(false);
  };

  const dbzAvatars = avatars.filter(avatar => avatar.type === 'dbz');
  const customAvatars = avatars.filter(avatar => avatar.type === 'custom');

  const avatarGrid = (avatarList) => (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-64 overflow-y-auto">
      {avatarList.map((avatar) => (
        <button
          key={avatar.name}
          disabled={picking}
          onClick={() => handleAvatarClick(avatar)}
          className="group border rounded-lg p-2 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 hover:scale-105"
          title={avatar.name.replace(/\.(png|jpg|jpeg|gif|webp)$/i, '')}
        >
          <div className="relative">
            <img 
              src={avatar.url} 
              alt={avatar.name} 
              className="w-16 h-16 object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.src = '/fallback-avatar.svg';
              }}
            />
            {avatar.type === 'dbz' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                <SparklesIcon className="w-2 h-2 text-white" />
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <ModalBasic id="avatar-picker" modalOpen={open} setModalOpen={setOpen} title="Choose your avatar">
      <div className="px-5 py-4">
        {error && <div className="text-sm text-rose-500 mb-3">{error}</div>}
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-4 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('dbz')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
              activeTab === 'dbz'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <SparklesIcon className="w-4 h-4" />
              Dragon Ball Z
            </div>
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
              activeTab === 'custom'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserIcon className="w-4 h-4" />
              Custom
            </div>
          </button>
        </div>

        {loading ? (
          <div className="text-slate-500 text-center py-8">Loading avatars…</div>
        ) : activeTab === 'dbz' ? (
          dbzAvatars.length ? (
            avatarGrid(dbzAvatars)
          ) : (
            <div className="text-slate-500 text-center py-8">No Dragon Ball Z avatars available.</div>
          )
        ) : (
          <div className="space-y-4">
            {/* Upload Section */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center">
              <CloudArrowUpIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Upload your own avatar image
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Choose File'}
              </button>
              <div className="text-xs text-slate-500 mt-2">
                PNG, JPG, GIF up to 5MB
              </div>
            </div>

            {uploadError && (
              <div className="text-sm text-rose-500 text-center">{uploadError}</div>
            )}

            {/* Custom Avatars Grid */}
            {customAvatars.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Your Custom Avatars
                </h4>
                {avatarGrid(customAvatars)}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
        <button
          className="btn dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300"
          onClick={() => setOpen(false)}
        >
          Close
        </button>
      </div>
    </ModalBasic>
  );
};

export default AvatarPickerModal;
