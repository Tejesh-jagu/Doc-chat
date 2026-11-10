import React, { useState } from 'react';
import {
  Settings,
  Image,
  Video,
  Lock,
  User,
  LogOut,
  Check,
  RefreshCw,
  Mountain,
  Waves,
  Sunset,
  Moon,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

export default function SettingsPage() {
  const {
    activeTheme,
    changeTheme,
    storageStats
  } = useApp();

  const { user, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState(null);

  const themeOptions = [
    {
      id: 'moon-walk',
      name: 'Moon Walk',
      desc: 'Atmospheric astronaut lunar horizon loop',
      type: 'video',
      icon: Video,
      videoSrc: '/backgrounds/moon-walk.mp4'
    },
    {
      id: 'purple-desert',
      name: 'Purple Desert',
      desc: 'Ambient moving desert animation',
      type: 'video',
      icon: Video,
      videoSrc: '/backgrounds/purple-desert.mp4'
    },
    {
      id: 'mountains',
      name: 'Alpine Mountains',
      desc: 'DocGPT signature daylight mountains',
      type: 'image',
      icon: Mountain,
      preview: '/backgrounds/mountains.jpg'
    },
    {
      id: 'ocean',
      name: 'Deep Ocean',
      desc: 'Azure ocean twilight scenery',
      type: 'image',
      icon: Waves,
      preview: '/backgrounds/ocean.jpg'
    },
    {
      id: 'sunset',
      name: 'Sunset Glow',
      desc: 'Warm alpine sunset lighting',
      type: 'image',
      icon: Sunset,
      preview: '/backgrounds/sunset.jpg'
    },
    {
      id: 'minimal',
      name: 'Minimal Dark',
      desc: 'Obsidian minimalist dark tone',
      type: 'image',
      icon: Moon,
      preview: '/backgrounds/minimal.jpg'
    }
  ];

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus(null);
    if (!currentPassword || !newPassword) return;

    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordStatus({ type: 'error', message: err.message || 'Failed to update password' });
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col p-6 overflow-y-auto glass-panel rounded-3xl border border-white/15 select-none shadow-2xl">
      <div className="max-w-4xl mx-auto w-full pb-10 space-y-8">
        {/* Header */}
        <div className="pb-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 text-white flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Settings & Workspace</h1>
              <p className="text-xs text-slate-300">Choose your live video or scenic background theme and manage credentials.</p>
            </div>
          </div>
        </div>

        {/* Section 1: Scenic & Video Background Selection */}
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight mb-1 flex items-center gap-2">
            <Image className="w-4 h-4 text-sky-400" />
            Background Themes (Live Videos & Scenic Landscapes)
          </h2>
          <p className="text-xs text-slate-300 mb-4">
            Select a live video loop or scenic mountain landscape. The entire application updates immediately.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {themeOptions.map((opt) => {
              const isActive = activeTheme === opt.id;
              const Icon = opt.icon;
              return (
                <div
                  key={opt.id}
                  onClick={() => changeTheme(opt.id)}
                  className={`group rounded-2xl overflow-hidden border cursor-pointer transition-all ${
                    isActive
                      ? 'border-white/80 ring-2 ring-white/50 shadow-2xl scale-[1.02]'
                      : 'border-white/15 hover:border-white/35 bg-black/20'
                  }`}
                >
                  <div className="h-28 w-full relative overflow-hidden bg-slate-950">
                    {opt.type === 'video' ? (
                      <video
                        src={opt.videoSrc}
                        muted
                        loop
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <img
                        src={opt.preview}
                        alt={opt.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}

                    {/* Badge */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] text-white flex items-center gap-1">
                      <Icon className="w-3 h-3 text-sky-300" />
                      <span>{opt.type === 'video' ? 'Live Video' : 'Scenic Photo'}</span>
                    </div>

                    {isActive && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-lg font-bold">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-black/40 backdrop-blur-md border-t border-white/10">
                    <h4 className="text-xs font-semibold text-white truncate">
                      {opt.name}
                    </h4>
                    <p className="text-[10px] text-slate-300 truncate mt-0.5">{opt.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Account & Security */}
        <div className="p-6 rounded-3xl bg-black/30 backdrop-blur-md border border-white/15">
          <h2 className="text-sm font-semibold text-white tracking-tight mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-sky-400" />
            Account & Security
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Profile */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Account Name</label>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white">
                  {user?.name || 'Demo User'}
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Email Address</label>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300">
                  {user?.email || 'demo@docchat.app'}
                </div>
              </div>

              <button
                onClick={logout}
                className="mt-2 px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>

            {/* Change Password */}
            <div>
              <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-sky-400" />
                Change Password
              </h3>
              <form onSubmit={handlePasswordChange} className="space-y-2.5">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-white/30"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-white/30"
                />
                {passwordStatus && (
                  <p
                    className={`text-xs ${
                      passwordStatus.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {passwordStatus.message}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={!currentPassword || !newPassword}
                  className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors border border-white/25 disabled:opacity-40 cursor-pointer shadow-sm"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
