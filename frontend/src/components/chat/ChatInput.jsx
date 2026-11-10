import React, { useState, useRef } from 'react';
import { ArrowUp, Maximize2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ChatInput({ onSendMessage, disabled, isGenerating }) {
  const { selectedDocIds } = useApp();
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const hasDocuments = selectedDocIds.length > 0;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled || isGenerating || !hasDocuments) return;
    onSendMessage(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleInput = (e) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="w-full shrink-0 select-none">
      {/* Sleek Pill Input matching DocGPT Image 3 */}
      <div className={`relative rounded-2xl bg-black/40 backdrop-blur-xl border border-white/15 transition-all shadow-xl flex items-center px-4 py-2.5 ${
        hasDocuments
          ? 'focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/20'
          : 'opacity-70'
      }`}>
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled || !hasDocuments}
          placeholder="Ask anything in any language"
          className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none resize-none max-h-[100px] overflow-y-auto leading-relaxed py-1 pr-20"
        />

        {/* Right side controls matching DocGPT */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button
            type="button"
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            title="Expand"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Send Button inside circle */}
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || disabled || isGenerating || !hasDocuments}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center disabled:opacity-20 transition-all cursor-pointer border border-white/15 shadow-sm"
            title="Send"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
