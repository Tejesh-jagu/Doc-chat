import React from 'react';
import { Bookmark, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function SourceCitation({ citation }) {
  const { documents, openPdfViewer } = useApp();

  const handleClick = () => {
    // Locate the matching document object
    const targetDoc = documents.find(d => d.id === citation.document_id) || {
      id: citation.document_id,
      original_filename: citation.document_name
    };

    openPdfViewer(targetDoc, citation.page_number, citation.excerpt);
  };

  return (
    <div
      onClick={handleClick}
      className="inline-flex flex-col p-2.5 rounded-xl glass-panel-card border hover:border-sky-400/40 cursor-pointer transition-all duration-200 group max-w-sm text-left shadow-sm select-none"
      title="Click to jump directly to this page in the PDF Viewer"
    >
      <div className="flex items-center justify-between gap-3 text-[11px] mb-1">
        <span className="flex items-center gap-1.5 font-medium text-slate-200 group-hover:text-sky-300 truncate">
          <Bookmark className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="truncate">{citation.document_name}</span>
        </span>
        <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-300 border border-sky-400/20 font-mono text-[10px] shrink-0 font-medium">
          Page {citation.page_number}
        </span>
      </div>

      {citation.excerpt && (
        <p className="text-[10px] text-slate-400 line-clamp-2 italic border-l-2 border-sky-400/30 pl-2 mt-1 group-hover:text-slate-300 transition-colors">
          "{citation.excerpt}"
        </p>
      )}

      <div className="flex items-center justify-end text-[9px] text-slate-500 group-hover:text-sky-300 mt-1.5 transition-colors">
        <span className="flex items-center gap-1 font-medium">
          View page <ExternalLink className="w-2.5 h-2.5" />
        </span>
      </div>
    </div>
  );
}
