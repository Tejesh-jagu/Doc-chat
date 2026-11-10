import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  History,
  Plus,
  Loader2,
  Columns,
  MessageSquare,
  BookOpen,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import PDFViewer from '../viewer/PDFViewer';
import ChatHistoryDrawer from './ChatHistoryDrawer';

export default function ChatWorkspace() {
  const {
    documents,
    selectedDocIds,
    setUploadModalOpen,
    activePdfDoc,
    openPdfViewer,
    closePdfViewer,
    pdfTargetPage,
    pdfHighlightText,
    viewLayout,
    setViewLayout,
    activeChatId,
    setActiveChatId,
    createNewChat,
    fetchChats
  } = useApp();

  const [chatDetails, setChatDetails] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  const messagesEndRef = useRef(null);

  // Single selected document as requested: "display only the selected document"
  const selectedDoc = documents.find(d => selectedDocIds.includes(d.id));

  // When selectedDoc changes, fetch conversations specifically for this document
  useEffect(() => {
    if (selectedDoc) {
      api.listChats(selectedDoc.id).then((chatsForDoc) => {
        if (chatsForDoc && chatsForDoc.length > 0) {
          setActiveChatId(chatsForDoc[0].id);
        } else {
          // Initialize a fresh chat for this document
          api.createChat(selectedDoc.original_filename, [selectedDoc.id]).then((newChat) => {
            setActiveChatId(newChat.id);
          });
        }
      }).catch(err => console.error('Error loading document chats:', err));
    } else {
      setActiveChatId(null);
      setChatDetails(null);
    }
  }, [selectedDoc?.id]);

  // Load chat messages when activeChatId changes
  useEffect(() => {
    if (!activeChatId) {
      setChatDetails(null);
      return;
    }

    let isMounted = true;
    setLoadingChat(true);

    api.getChat(activeChatId)
      .then((data) => {
        if (isMounted) {
          setChatDetails(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load chat details:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingChat(false);
      });

    return () => { isMounted = false; };
  }, [activeChatId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatDetails?.messages, isGenerating]);

  const handleSendMessage = async (content) => {
    if (!content.trim() || isGenerating) return;

    let currentChatId = activeChatId;

    if (!currentChatId && selectedDoc) {
      const newChat = await createNewChat(selectedDoc.original_filename, [selectedDoc.id]);
      if (newChat) {
        currentChatId = newChat.id;
      } else {
        return;
      }
    }

    const tempUserMsg = {
      id: Date.now(),
      conversation_id: currentChatId,
      sender: 'user',
      content,
      citations: [],
      feedback: null,
      created_at: new Date().toISOString()
    };

    setChatDetails(prev => ({
      ...prev,
      messages: [...(prev?.messages || []), tempUserMsg]
    }));

    setIsGenerating(true);

    try {
      const response = await api.sendMessage(currentChatId, content, selectedDoc ? [selectedDoc.id] : []);
      setChatDetails(prev => {
        const withoutTemp = (prev?.messages || []).filter(m => m.id !== tempUserMsg.id);
        return {
          ...prev,
          messages: [...withoutTemp, response.user_message, response.assistant_message]
        };
      });
      fetchChats();
    } catch (err) {
      console.error('Failed to send message:', err);
      const errorMsg = {
        id: Date.now() + 1,
        conversation_id: currentChatId,
        sender: 'assistant',
        content: `⚠️ Error generating answer: ${err.message}`,
        citations: [],
        feedback: null,
        created_at: new Date().toISOString()
      };
      setChatDetails(prev => ({
        ...prev,
        messages: [...(prev?.messages || []), errorMsg]
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetryMessage = async (messageId) => {
    if (!activeChatId) return;
    setIsGenerating(true);
    try {
      const updated = await api.retryMessage(activeChatId, messageId);
      setChatDetails(prev => ({
        ...prev,
        messages: (prev?.messages || []).map(m => m.id === messageId ? updated : m)
      }));
    } catch (err) {
      alert(`Retry failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col glass-panel rounded-3xl border border-white/15 overflow-hidden shadow-2xl relative select-none">
      {/* Top Header Bar matching DocGPT */}
      <header className="h-14 px-6 flex items-center justify-between border-b border-white/10 shrink-0 z-10">
        <div>
          {selectedDoc ? (
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-semibold text-white tracking-tight truncate max-w-sm sm:max-w-md">
                {selectedDoc.original_filename}
              </h2>
            </div>
          ) : (
            <h1 className="text-lg font-bold text-white tracking-tight">
              Welcome back!
            </h1>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          {selectedDoc && (
            <>
              {/* PDF Viewer Toggle */}
              <button
                onClick={() => {
                  if (activePdfDoc?.id === selectedDoc.id) {
                    closePdfViewer();
                    setViewLayout('chat');
                  } else {
                    openPdfViewer(selectedDoc);
                    setViewLayout('split');
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                  activePdfDoc?.id === selectedDoc.id
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-white/10 text-slate-300 hover:text-white border-white/10 hover:bg-white/15'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                <span>{activePdfDoc?.id === selectedDoc.id ? 'Close PDF' : 'Open PDF'}</span>
              </button>

              {/* New Chat for this document */}
              <button
                onClick={() => createNewChat(selectedDoc.original_filename, [selectedDoc.id])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition-all cursor-pointer"
                title="Start a new chat for this document"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Chat</span>
              </button>

              {/* Document Chat History Drawer */}
              <button
                onClick={() => setHistoryDrawerOpen(!historyDrawerOpen)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                title="Document Chat History"
              >
                <History className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4 relative">
        {/* Left Side: PDF Viewer (when open) */}
        {activePdfDoc && (viewLayout === 'split' || viewLayout === 'pdf') && (
          <div className={`${viewLayout === 'pdf' ? 'w-full' : 'w-1/2'} h-full transition-all duration-200`}>
            <PDFViewer
              document={activePdfDoc}
              initialPage={pdfTargetPage}
              highlightText={pdfHighlightText}
              onClose={() => {
                closePdfViewer();
                setViewLayout('chat');
              }}
            />
          </div>
        )}

        {/* Right Side: Chat or Welcome screen */}
        {viewLayout !== 'pdf' && (
          <div className="flex-1 h-full flex flex-col justify-between overflow-hidden relative">
            {/* Case A: Initial State (No document selected) — MATCHING DOCGPT SCREENSHOT IMAGE 3 EXACTLY */}
            {!selectedDoc ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 select-none">
                <p className="text-sm font-medium text-slate-300 mb-4">
                  Select one or multiple files.
                </p>

                {/* Elegant Translucent Upload Pill matching DocGPT */}
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="px-8 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold border border-white/25 shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  Upload
                </button>
              </div>
            ) : (
              /* Case B: Document is selected — Active Chat */
              <div className="flex-1 overflow-y-auto px-3 space-y-3 pb-3">
                {loadingChat ? (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin text-sky-400 mb-2" />
                    Loading conversation...
                  </div>
                ) : chatDetails?.messages && chatDetails.messages.length > 0 ? (
                  chatDetails.messages.map((msg, index) => {
                    const isLastAssistant =
                      msg.sender === 'assistant' &&
                      index === chatDetails.messages.length - 1;

                    return (
                      <ChatMessage
                        key={msg.id}
                        message={msg}
                        chatId={activeChatId}
                        onRetry={handleRetryMessage}
                        isLastAssistant={isLastAssistant}
                      />
                    );
                  })
                ) : (
                  <div className="text-center py-20 text-slate-400 text-xs">
                    <p className="font-medium text-slate-200 mb-1">
                      Ready to analyze "{selectedDoc.original_filename}"
                    </p>
                    <p className="text-slate-400">
                      Type your question below to ask anything about this document.
                    </p>
                  </div>
                )}

                {/* Shimmering AI Generating Indicator */}
                {isGenerating && (
                  <div className="flex gap-3 my-3 text-left justify-start animate-pulse">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-white/15 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-sky-400" />
                    </div>
                    <div className="glass-panel rounded-2xl p-3 border border-white/10 flex items-center gap-2.5 text-xs text-slate-300 shadow-lg">
                      <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                      <span>DocChat is analyzing document and generating answer...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Bottom Input matching DocGPT */}
            <div className="pt-2">
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={!selectedDoc}
                isGenerating={isGenerating}
              />
            </div>
          </div>
        )}
      </div>

      {/* Discrete Document Chat History Drawer */}
      <ChatHistoryDrawer
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        documentId={selectedDoc?.id}
      />
    </div>
  );
}
