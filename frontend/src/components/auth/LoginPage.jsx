import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  FileText,
  Key,
  ExternalLink,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import ScenicBackground from '../common/ScenicBackground';

export default function LoginPage() {
  const { login, register, loginWithGoogle, loginAsDemo } = useAuth();
  const { activeTheme, changeTheme } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Google OAuth Setup & Credentials State
  const [googleClientId, setGoogleClientId] = useState(
    () => import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('docchat_google_client_id') || ''
  );
  const [customClientIdInput, setCustomClientIdInput] = useState(googleClientId);
  const [showGoogleConfigModal, setShowGoogleConfigModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const googleBtnContainerRef = useRef(null);

  const isLogin = mode === 'login';

  // Initialize official Google Identity Services button when Client ID is available
  useEffect(() => {
    if (!googleClientId) return;

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.google?.accounts?.id) {
        clearInterval(interval);
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response) => {
              if (response?.credential) {
                handleGoogleCredential(response.credential);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              type: 'standard',
              theme: 'filled_black',
              size: 'large',
              text: isLogin ? 'signin_with' : 'signup_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: 384
            });
          }
        } catch (err) {
          console.error('Google Sign-In initialization failed:', err);
        }
      } else if (attempts > 25) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [googleClientId, isLogin]);

  // Handle authenticating with official Google ID token credential
  const handleGoogleCredential = async (credential) => {
    setGoogleLoading(true);
    setError(null);
    try {
      await loginWithGoogle({ credential });
    } catch (err) {
      setError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Trigger Google Sign-In prompt or setup modal
  const handleGoogleClick = () => {
    setError(null);
    if (!googleClientId) {
      setShowGoogleConfigModal(true);
      return;
    }

    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // If One Tap was skipped or suppressed, click the rendered button or notify
            const renderedBtn = googleBtnContainerRef.current?.querySelector('div[role=button]');
            if (renderedBtn) {
              renderedBtn.click();
            }
          }
        });
      } catch {
        setShowGoogleConfigModal(true);
      }
    } else {
      setShowGoogleConfigModal(true);
    }
  };

  // Save user-provided Google Client ID
  const handleSaveGoogleClientId = (e) => {
    e.preventDefault();
    const cleanId = customClientIdInput.trim();
    if (!cleanId) {
      setError('Please enter a valid Google Client ID.');
      return;
    }
    localStorage.setItem('docchat_google_client_id', cleanId);
    setGoogleClientId(cleanId);
    setShowGoogleConfigModal(false);
    setError(null);
  };

  const handleCopyOrigin = () => {
    const origin = window.location.origin;
    navigator.clipboard.writeText(origin);
    setCopiedOrigin(true);
    setTimeout(() => setCopiedOrigin(false), 2000);
  };

  // Email & password form submission
  const handleEmailSubmit = async (e) => {
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
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const themes = [
    { id: 'mountains', label: 'Mountains' },
    { id: 'moon-walk', label: 'Moon Walk' },
    { id: 'purple-desert', label: 'Desert' },
    { id: 'ocean', label: 'Ocean' },
    { id: 'sunset', label: 'Sunset' },
    { id: 'minimal', label: 'Dark' },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-between font-sans select-none text-slate-100">
      {/* 1. Full-Screen Scenic Background */}
      <ScenicBackground />

      {/* Top Bar with Brand & Scenic Theme Switcher */}
      <header className="relative z-30 flex items-center justify-between px-6 py-4 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-sky-400/50 p-0.5 shadow-md flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white drop-shadow-md">
              DocChat
            </span>
            <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-sky-300">
              AI Private Docs
            </span>
          </div>
        </div>

        {/* Scenic Theme Switcher Pill */}
        <div className="hidden sm:flex items-center gap-1 bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/10 text-xs">
          <span className="text-[11px] text-slate-400 px-2">Theme:</span>
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => changeTheme(t.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTheme === t.id
                  ? 'bg-white/20 text-white border border-white/20 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="relative z-20 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-sky-400/40 p-1 shadow-lg shadow-sky-500/20 mx-auto mb-3 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-sky-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
              {isLogin ? 'Welcome back to DocChat' : 'Create your DocChat Account'}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
              {isLogin
                ? 'Sign in to access your private documents and AI conversations'
                : 'Experience private, local document chat with verified source citations'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-white/10 mb-5 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer text-center ${
                isLogin
                  ? 'bg-white/20 text-white shadow-sm border border-white/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer text-center ${
                !isLogin
                  ? 'bg-white/20 text-white shadow-sm border border-white/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/20 border border-rose-500/35 text-rose-200 text-xs mb-4 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Official Google Single Sign-On Integration */}
          <div className="space-y-2 mb-4">
            {googleClientId ? (
              <div className="flex flex-col items-center">
                <div ref={googleBtnContainerRef} className="w-full flex justify-center min-h-[44px]" />
                <button
                  type="button"
                  onClick={() => setShowGoogleConfigModal(true)}
                  className="mt-1 text-[11px] text-slate-400 hover:text-sky-300 transition-colors cursor-pointer"
                >
                  Configure Google Client ID
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/35 text-white text-xs font-semibold shadow-md transition-all cursor-pointer group"
              >
                {/* Google Multi-Color SVG Logo */}
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isLogin ? 'Sign in with Google' : 'Sign up with Google'}</span>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="w-full border-t border-white/10" />
            <span className="absolute px-3 bg-slate-900/90 text-[11px] text-slate-400 uppercase tracking-wider rounded-full border border-white/10">
              or continue with email
            </span>
          </div>

          {/* 2. Email & Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {!isLogin && (
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required={!isLogin}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-slate-900/80 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-900/80 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900/80 border border-white/15 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl classy-btn text-xs font-semibold shadow-lg transition-all mt-3 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In to Workspace' : 'Create Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Mode Access */}
          <div className="mt-5 pt-4 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={loginAsDemo}
              className="text-xs text-sky-300 hover:text-sky-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5 mx-auto group"
            >
              <span>Explore demo workspace without logging in</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </main>

      {/* Google OAuth Client ID Configuration Modal */}
      {showGoogleConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-white/20 shadow-2xl relative">
            <button
              onClick={() => setShowGoogleConfigModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
                <Key className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Google Sign-In Credentials</h3>
                <p className="text-xs text-slate-300">Connect your Google OAuth 2.0 Client</p>
              </div>
            </div>

            {/* Instruction Steps */}
            <div className="space-y-2.5 text-xs text-slate-300 bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
              <div className="font-semibold text-white flex items-center justify-between">
                <span>Setup in 3 Quick Steps:</span>
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-300 hover:text-sky-200 flex items-center gap-1 text-[11px]"
                >
                  <span>Google Cloud Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                <span>Go to <strong>APIs & Services &rarr; Credentials</strong> &rarr; <strong>Create Credentials</strong> &rarr; <strong>OAuth client ID</strong>.</span>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                <div className="flex-1">
                  <span>Choose <strong>Web application</strong> and add this under <strong>Authorized JavaScript origins</strong>:</span>
                  <div className="flex items-center justify-between mt-1 px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 text-[11px] font-mono text-sky-300">
                    <span>{typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}</span>
                    <button
                      type="button"
                      onClick={handleCopyOrigin}
                      className="text-slate-400 hover:text-white cursor-pointer ml-2 flex items-center gap-1"
                    >
                      {copiedOrigin ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-[10px]">Copy</span>}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                <span>Copy your <strong>Client ID</strong> (ends in <code>.apps.googleusercontent.com</code>) and paste below:</span>
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSaveGoogleClientId} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Google OAuth Client ID
                </label>
                <input
                  type="text"
                  required
                  value={customClientIdInput}
                  onChange={(e) => setCustomClientIdInput(e.target.value)}
                  placeholder="xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com"
                  className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowGoogleConfigModal(false)}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 font-medium transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl classy-btn text-xs font-semibold shadow-lg transition-all cursor-pointer"
                >
                  Save & Enable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Feature Badges */}
      <footer className="relative z-30 py-3 px-6 bg-black/40 backdrop-blur-md border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Local Intelligence & Privacy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-sky-400" />
          <span>Multi-Format Document RAG</span>
        </div>
      </footer>
    </div>
  );
}
