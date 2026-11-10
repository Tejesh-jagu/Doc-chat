import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, Calendar, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';

export default function ChatHistoryDrawer({ isOpen, onClose, documentId }) {
  const { activeChatId, setActiveChatId, createNewChat, deleteChat, documents } = useApp();
  const [docChats, setDocChats] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedDoc = documents.find(d => d.id === documentId);

  useEffect(() => {
    if (!isOpen || !documentId) return;
    setLoading(true);
    api.listChats(documentId)
      .then(data => setDocChats(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [isOpen, documentId, activeChatId]);

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleStartNew = async () => {
    if (selectedDoc) {
      const newChat = await createNewChat(selectedDoc.original_filename, [selectedDoc.id]);
      if (newChat) {
        setDocChats(prev => [newChat, ...prev]);
        onClose();
      }
    }
  };

  const handleDelete = async (chatId, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      await deleteChat(chatId);
      setDocChats(prev => prev.filter(c => c.id !== chatId));
    }
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 glass-panel border-l border-white/15 z-40 flex flex-col shadow-2xl p-4 animate-in slide-in-from-right duration-200 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-semibold text-white">Document History</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {selectedDoc && (
        <p className="text-[11px] text-slate-400 truncate mb-3 px-1">
          Chats for: <strong className="text-slate-200">{selectedDoc.original_filename}</strong>
        </p>
      )}

      {/* New Chat Button */}
      <button
        onClick={handleStartNew}
        className="w-full py-2 px-3 rounded-xl classy-btn text-xs font-medium flex items-center justify-center gap-2 mb-3 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>New Chat for this PDF</span>
      </button>

      {/* List of Conversations */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {loading ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            Loading history...
          </div>
        ) : docChats.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No previous chats for this document.
          </div>
        ) : (
          docChats.map((c) => {
            const isActive = activeChatId === c.id;
            return (
              <div
                key={c.id}
                onClick={() => {
                  setActiveChatId(c.id);
                  onClose();
                }}
                className={`p-3 rounded-2xl transition-all cursor-pointer group relative text-left ${
                  isActive
                    ? 'bg-white/15 border border-sky-400/50 text-white shadow-md'
                    : 'bg-black/20 hover:bg-white/10 border border-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-medium truncate" title={c.title}>
                      {c.title}
                    </h4>
                    {c.last_message && (
                      <p className="text-[10px] text-slate-400 truncate mt-1">
                        {c.last_message}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[9px] text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 text-sky-400" />
                        {formatDate(c.updated_at || c.created_at)}
                      </span>
                      {c.message_count > 0 && (
                        <span>• {c.message_count} messages</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDelete(c.id, e)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
