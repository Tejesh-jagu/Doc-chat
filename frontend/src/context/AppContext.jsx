import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { user } = useAuth();

  // Navigation
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'documents' | 'help' | 'settings'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Documents
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [storageStats, setStorageStats] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // PDF Viewer
  const [activePdfDoc, setActivePdfDoc] = useState(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfTargetPage, setPdfTargetPage] = useState(1);
  const [pdfHighlightText, setPdfHighlightText] = useState('');
  const [viewLayout, setViewLayout] = useState('split'); // 'chat' | 'split' | 'pdf'

  // Chat
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  // System & Customization
  const [systemStatus, setSystemStatus] = useState(null);
  const [activeTheme, setActiveTheme] = useState(() => {
    const saved = localStorage.getItem('docchat_theme');
    return (saved && saved !== 'sea-storm') ? saved : 'mountains';
  });

  // Sync user's theme when loaded
  useEffect(() => {
    if (user?.background_theme && user.background_theme !== 'sea-storm') {
      setActiveTheme(user.background_theme);
      localStorage.setItem('docchat_theme', user.background_theme);
    }
  }, [user]);

  const fetchDocuments = useCallback(async (search = '', sortBy = 'date', sortOrder = 'desc', folderId = null) => {
    setLoadingDocs(true);
    try {
      const data = await api.listDocuments(search, sortBy, sortOrder, folderId);
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  const refreshStorage = useCallback(async () => {
    try {
      const stats = await api.getStorageStats();
      setStorageStats(stats);
    } catch (err) {
      console.error('Error fetching storage stats:', err);
    }
  }, []);

  const refreshSystemStatus = useCallback(async () => {
    try {
      const status = await api.getSystemStatus();
      setSystemStatus(status);
    } catch (err) {
      console.error('Error fetching system status:', err);
    }
  }, []);

  const fetchChats = useCallback(async () => {
    try {
      const data = await api.listChats();
      setChats(data);
    } catch (err) {
      console.error('Error fetching chats:', err);
    }
  }, []);

  // Initial load / re-sync when authenticated
  useEffect(() => {
    if (user) {
      fetchDocuments();
      refreshStorage();
      refreshSystemStatus();
      fetchChats();
    } else {
      setDocuments([]);
      setChats([]);
      setSelectedDocIds([]);
      setActiveChatId(null);
    }
  }, [user, fetchDocuments, refreshStorage, refreshSystemStatus, fetchChats]);

  const selectSingleDoc = (id) => {
    setSelectedDocIds(prev => (prev.length === 1 && prev[0] === id ? [] : [id]));
  };

  const toggleSelectDoc = (id) => {
    setSelectedDocIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const clearSelectedDocs = () => {
    setSelectedDocIds([]);
  };

  const openPdfViewer = (doc, page = 1, highlight = '') => {
    setActivePdfDoc(doc);
    setPdfTargetPage(page);
    setPdfHighlightText(highlight);
    setPdfViewerOpen(true);
    if (viewLayout === 'chat') {
      setViewLayout('split');
    }
  };

  const closePdfViewer = () => {
    setPdfViewerOpen(false);
    setActivePdfDoc(null);
  };

  const createNewChat = async (title = 'New Chat', docIds = null) => {
    const ids = docIds !== null ? docIds : selectedDocIds;
    try {
      const newChat = await api.createChat(title, ids);
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setActiveTab('home');
      return newChat;
    } catch (err) {
      console.error('Error creating chat:', err);
    }
  };

  const deleteChat = async (id) => {
    try {
      await api.deleteChat(id);
      setChats(prev => prev.filter(c => c.id !== id));
      if (activeChatId === id) {
        const remaining = chats.filter(c => c.id !== id);
        setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
    }
  };

  const changeTheme = async (newTheme) => {
    setActiveTheme(newTheme);
    localStorage.setItem('docchat_theme', newTheme);
    try {
      await api.updateSettings({ background_theme: newTheme });
    } catch (err) {
      console.error('Error updating theme setting:', err);
    }
  };

  return (
    <AppContext.Provider value={{
      activeTab,
      setActiveTab,
      mobileMenuOpen,
      setMobileMenuOpen,
      documents,
      loadingDocs,
      fetchDocuments,
      selectedDocIds,
      setSelectedDocIds,
      selectSingleDoc,
      toggleSelectDoc,
      clearSelectedDocs,
      storageStats,
      refreshStorage,
      uploadModalOpen,
      setUploadModalOpen,
      activePdfDoc,
      pdfViewerOpen,
      pdfTargetPage,
      pdfHighlightText,
      openPdfViewer,
      closePdfViewer,
      viewLayout,
      setViewLayout,
      chats,
      activeChatId,
      setActiveChatId,
      fetchChats,
      createNewChat,
      deleteChat,
      systemStatus,
      refreshSystemStatus,
      activeTheme,
      changeTheme
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

