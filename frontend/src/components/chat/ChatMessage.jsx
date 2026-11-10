import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  User,
  Copy,
  Check,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import SourceCitation from './SourceCitation';
import { api } from '../../api/client';

export default function ChatMessage({ message, chatId, onRetry, isLastAssistant }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(message.feedback || null);
  const [isRetrying, setIsRetrying] = useState(false);
  // HIDDEN BY DEFAULT as requested: user can view when they click the button
  const [showSources, setShowSources] = useState(false);

  const isUser = message.sender === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (type) => {
    const newFeedback = feedback === type ? null : type;
    setFeedback(newFeedback);
    try {
      await api.setFeedback(chatId, message.id, newFeedback);
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  const handleRetry = async () => {
    if (isRetrying || !onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry(message.id);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className={`flex gap-3 my-3 text-left ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* AI Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-slate-900/80 border border-white/15 text-sky-400 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
          <Sparkles className="w-4 h-4 text-sky-400" />
        </div>
      )}

      {/* Message Content Container */}
      <div className={`max-w-[85%] rounded-2xl p-4 transition-all ${
        isUser
          ? 'bg-slate-800/90 text-white shadow-xl border border-white/20'
          : 'glass-panel text-slate-100 border border-white/10 shadow-xl'
      }`}>
        {/* Markdown rendering */}
        <div className="text-xs leading-relaxed prose prose-invert prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1.5 prose-li:my-0.5 max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Source Citations — Collapsed/Hidden by default */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-3 pt-2 border-t border-white/10">
            <button
              onClick={() => setShowSources(!showSources)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-slate-200 hover:text-white transition-all cursor-pointer border border-white/15 shadow-sm group"
              title={showSources ? "Click arrow to hide sources" : "Click arrow to view sources"}
            >
              <Bookmark className="w-3.5 h-3.5 text-sky-400" />
              <span>{showSources ? 'Hide Sources' : `View Sources (${message.citations.length})`}</span>
              <span className="p-0.5 rounded-full bg-white/10 group-hover:bg-white/25 transition-colors">
                {showSources ? (
                  <ChevronUp className="w-3.5 h-3.5 text-white" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-white" />
                )}
              </span>
            </button>

            {showSources && (
              <div className="flex flex-wrap gap-2 mt-2.5 pt-2 border-t border-white/10 animate-in fade-in duration-200">
                {message.citations.map((c, idx) => (
                  <SourceCitation key={idx} citation={c} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Toolbar for AI message */}
        {!isUser && (
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5 text-slate-400 text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              {isLastAssistant && (
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 disabled:opacity-40 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                  title="Retry response"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin text-sky-400' : ''}`} />
                  <span>Retry</span>
                </button>
              )}
            </div>

            {/* Thumbs up / down feedback */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleFeedback('up')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  feedback === 'up'
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'hover:text-slate-200 hover:bg-white/10'
                }`}
                title="Helpful response"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleFeedback('down')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  feedback === 'down'
                    ? 'text-rose-400 bg-rose-500/10'
                    : 'hover:text-slate-200 hover:bg-white/10'
                }`}
                title="Inaccurate response"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-slate-900 border border-white/15 flex items-center justify-center text-slate-300 shrink-0 mt-0.5 shadow-md">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
