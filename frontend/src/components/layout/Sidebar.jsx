import React from 'react';
import {
  Sparkles,
  Home,
  Folder,
  HelpCircle,
  Settings,
  LogOut,
  User
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { activeTab, setActiveTab } = useApp();
  const { user, logout, setAuthModalOpen, setAuthModalMode } = useAuth();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'documents', label: 'Documents', icon: Folder },
    { id: 'help', label: 'Help', icon: HelpCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-[180px] h-full flex flex-col justify-between py-6 px-4 select-none shrink-0 z-20">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-2 mb-8 px-1">
          <span className="font-bold text-xl tracking-tight text-white font-sans drop-shadow-md">
            DocChat
          </span>
        </div>

        {/* Navigation Items (clean, floating, minimal like DocGPT) */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 group text-left cursor-pointer ${
                  isActive
                    ? 'text-white bg-white/15 backdrop-blur-md shadow-sm border border-white/20'
                    : 'text-slate-200/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                  }`}
                />
                <span className="drop-shadow-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom section: Clean DocChat Plan & User Action (matching DocGPT Image 3) */}
      <div className="space-y-2 px-1">
        <div className="text-[11px] font-medium text-slate-200/90 drop-shadow-sm">
          DocChat Free
        </div>

        {user ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('settings')}
              className="flex-1 py-1.5 px-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-medium border border-white/25 transition-all text-center cursor-pointer shadow-sm truncate"
            >
              {user.name || 'Manage'}
            </button>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-500/30 text-slate-200 hover:text-white border border-white/15 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setAuthModalMode('login');
              setAuthModalOpen(true);
            }}
            className="w-full py-1.5 px-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-medium border border-white/25 transition-all text-center cursor-pointer shadow-sm"
          >
            Sign In
          </button>
        )}
      </div>
    </aside>
  );
}
