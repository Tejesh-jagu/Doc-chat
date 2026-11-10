import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User, Sparkles, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal() {
  const { authModalOpen, setAuthModalOpen, authModalMode, setAuthModalMode, login, register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!authModalOpen) return null;

  const isLogin = authModalMode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      setAuthModalOpen(false);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-sm glass-panel p-6 rounded-3xl border border-white/20 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Icon & Heading */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-sky-400/40 p-[2px] shadow-lg shadow-sky-500/15 mx-auto mb-3 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-sky-400" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {isLogin ? 'Welcome back to DocChat' : 'Create your DocChat Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isLogin ? 'Sign in to access your private document workspace' : 'Get started with private AI document intelligence'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-white/10 mb-4 text-xs">
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('login');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              isLogin ? 'bg-white/15 text-white border border-white/20 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('register');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              !isLogin ? 'bg-white/15 text-white border border-white/20 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl classy-btn text-xs font-semibold shadow-lg transition-all mt-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
