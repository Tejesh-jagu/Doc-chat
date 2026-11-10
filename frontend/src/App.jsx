import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import ScenicBackground from './components/common/ScenicBackground';
import Sidebar from './components/layout/Sidebar';
import FilePanel from './components/layout/FilePanel';
import ChatWorkspace from './components/chat/ChatWorkspace';
import DocumentsWorkspace from './components/documents/DocumentsWorkspace';
import HelpPage from './components/help/HelpPage';
import SettingsPage from './components/settings/SettingsPage';
import UploadModal from './components/documents/UploadModal';
import RenameModal from './components/documents/RenameModal';
import AuthModal from './components/auth/AuthModal';
import LoginPage from './components/auth/LoginPage';
import { Menu, X, Sparkles, Loader2 } from 'lucide-react';

function MainLayout() {
  const { user, loading } = useAuth();
  const { activeTab, uploadModalOpen, setUploadModalOpen } = useApp();
  const [renamingDoc, setRenamingDoc] = useState(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileFilePanelOpen, setMobileFilePanelOpen] = useState(false);
  const [showBottomBanner, setShowBottomBanner] = useState(true);

  const handleOpenRename = (doc) => {
    setRenamingDoc(doc);
    setRenameModalOpen(true);
  };

  // If session is checking: show minimal glass loader
  if (loading) {
    return (
      <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center font-sans select-none text-slate-100">
        <ScenicBackground />
        <div className="glass-panel p-6 rounded-3xl border border-white/15 flex items-center gap-3 text-xs shadow-2xl backdrop-blur-2xl">
          <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
          <span>Loading DocChat...</span>
        </div>
      </div>
    );
  }

  // If user is not authenticated: render dedicated scenic Login Gate
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-between font-sans select-none text-slate-100">
      {/* 1. Full-Screen Scenic / Video Background */}
      <ScenicBackground />

      {/* Mobile Top Navigation Bar (hidden on desktop) */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10 z-30 backdrop-blur-md">
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-white" />}
        </button>

        <div className="flex items-center gap-2">
          <span className="font-bold text-base text-white">DocChat</span>
        </div>

        {activeTab === 'home' && (
          <button
            onClick={() => setMobileFilePanelOpen(!mobileFilePanelOpen)}
            className="text-xs px-2.5 py-1 rounded-lg bg-white/15 text-white border border-white/20 font-medium cursor-pointer"
          >
            Files
          </button>
        )}
      </div>

      {/* 2. Floating Centered Dashboard Layout — Sized gracefully to show the scenic/video theme around it */}
      <div className="flex-1 w-full max-w-[1200px] h-[calc(100vh-68px)] my-auto mx-auto px-3 sm:px-6 py-4 flex overflow-hidden relative gap-4">
        {/* Section 1: Floating Left Sidebar */}
        <div
          className={`h-full z-40 transition-transform duration-300 md:translate-x-0 ${
            mobileSidebarOpen ? 'translate-x-0 fixed inset-y-0 left-0 bg-black/80 backdrop-blur-xl p-4' : '-translate-x-full md:relative'
          }`}
        >
          <Sidebar />
        </div>

        {/* Section 2: Floating Middle File Panel */}
        {activeTab === 'home' && (
          <div
            className={`h-full z-30 transition-transform duration-300 md:translate-x-0 ${
              mobileFilePanelOpen ? 'translate-x-0 fixed inset-y-0 left-0 z-50 p-4' : '-translate-x-full md:relative'
            }`}
          >
            <FilePanel onOpenRenameModal={handleOpenRename} />
          </div>
        )}

        {/* Section 3: Floating Main Workspace Card */}
        <main className="flex-1 h-full overflow-hidden flex flex-col relative z-10">
          {activeTab === 'home' && <ChatWorkspace />}
          {activeTab === 'documents' && <DocumentsWorkspace onOpenRenameModal={handleOpenRename} />}
          {activeTab === 'help' && <HelpPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Bottom Status Ribbon matching DocGPT Image 3 */}
      {showBottomBanner && (
        <div className="w-full bg-black/60 backdrop-blur-md border-t border-white/10 py-1 px-4 text-center text-xs text-slate-300 flex items-center justify-center gap-3 z-30 shrink-0 select-none">
          <span>
            DocChat AI — Private Document Intelligence powered by local <strong className="text-white font-medium">Qwen2.5 3B</strong>
          </span>
          <button
            onClick={() => setShowBottomBanner(false)}
            className="text-slate-400 hover:text-white text-xs p-0.5 cursor-pointer"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Global Modals */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />

      <RenameModal
        document={renamingDoc}
        isOpen={renameModalOpen}
        onClose={() => {
          setRenameModalOpen(false);
          setRenamingDoc(null);
        }}
      />

      <AuthModal />
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('DocChat caught render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center font-sans text-slate-100 bg-slate-950 p-4">
          <ScenicBackground />
          <div className="relative z-10 max-w-md w-full p-6 rounded-2xl border border-rose-500/30 bg-black/75 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center">
            <h2 className="text-lg font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-xs text-slate-300 mb-4">
              {this.state.error?.message || 'An unexpected error occurred while loading the interface.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs shadow-lg transition-all cursor-pointer"
            >
              Reload DocChat
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <MainLayout />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
