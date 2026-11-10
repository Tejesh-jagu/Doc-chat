import React, { useState } from 'react';
import {
  HelpCircle,
  UploadCloud,
  MessageSquare,
  Bookmark,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Cpu,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function HelpPage() {
  const { setActiveTab } = useApp();
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const guides = [
    {
      title: '1. Uploading Documents',
      icon: UploadCloud,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      description: 'Add your PDF documents through the left sidebar or the central upload zone. DocChat extracts text, segments it into semantic passages, and prepares it for retrieval.'
    },
    {
      title: '2. Selecting Documents to Query',
      icon: BookOpen,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      description: 'You can check one or multiple documents simultaneously in the left files panel. DocChat will cross-reference across all chosen files to answer complex questions.'
    },
    {
      title: '3. Interactive AI Chat with Qwen2.5',
      icon: MessageSquare,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      description: 'Type questions into the chat bar. DocChat retrieves relevant snippets and instructs Ollama Qwen2.5 3B to craft precise, grounded answers.'
    },
    {
      title: '4. Source Citations & PDF Viewer',
      icon: Bookmark,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'Every answer links back to exact page numbers. Click on any citation card to immediately jump the integrated PDF viewer directly to that page!'
    }
  ];

  const faqs = [
    {
      q: 'Which AI model powers DocChat?',
      a: 'DocChat is natively configured to run Ollama with the state-of-the-art Qwen2.5 3B model locally. You can also configure or select alternative installed models (like Llama 3.2 3B) through the Settings panel.'
    },
    {
      q: 'Are my documents sent to external third-party servers?',
      a: 'No. All document parsing, vector indexing, and inference queries run 100% locally on your machine via Ollama and your local backend. Your private documents never leave your system.'
    },
    {
      q: 'Can I query multiple PDF files simultaneously?',
      a: 'Yes! Simply check the checkboxes next to any number of documents in the Files panel. DocChat will search across all selected documents and provide page citations for each one.'
    },
    {
      q: 'How do the page-level citations work?',
      a: 'When you upload a PDF, DocChat preserves precise page numbers for every extracted chunk. When the AI answers, it cites the exact document title and page number. Clicking a citation card automatically navigates the PDF viewer to that exact page.'
    },
    {
      q: 'What should I do if Ollama shows "Offline"?',
      a: 'Ensure the Ollama application or CLI is running (e.g. `ollama serve`). You can also verify that the `qwen2.5:3b` model is downloaded (`ollama pull qwen2.5:3b`). Once active, DocChat detects it immediately.'
    }
  ];

  return (
    <div className="flex-1 h-full flex flex-col p-6 overflow-y-auto glass-panel select-none">
      <div className="max-w-4xl mx-auto w-full pb-8">
        {/* Header */}
        <div className="mb-8 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-sky-400/30 text-sky-400 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Help & Documentation</h1>
          </div>
          <p className="text-xs text-slate-400">
            Learn how to make the most of DocChat's local AI document analysis workflow.
          </p>
        </div>

        {/* Quickstart Flow Cards */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-white tracking-tight mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            Getting Started Walkthrough
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guides.map((g, idx) => {
              const Icon = g.icon;
              return (
                <div key={idx} className="p-4 rounded-2xl glass-panel-card border">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${g.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-semibold text-white">{g.title}</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{g.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ Accordion */}
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-2.5">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl glass-panel-card border overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left text-xs font-semibold text-white hover:text-sky-300 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-white/5 bg-slate-950/20">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
