import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  MoreVertical,
  ExternalLink,
  Edit2,
  Trash2,
  Download,
  CheckCircle2,
  Loader2,
  AlertCircle,
  CheckSquare,
  Square
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';

export default function FilePanel({ onOpenRenameModal }) {
  const {
    documents,
    loadingDocs,
    fetchDocuments,
    selectedDocIds,
    selectSingleDoc,
    toggleSelectDoc,
    openPdfViewer,
    setActiveTab,
    storageStats,
    refreshStorage
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuDocId, setActiveMenuDocId] = useState(null);

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter(doc =>
      doc.original_filename.toLowerCase().includes(q)
    );
  }, [documents, searchQuery]);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDelete = async (doc, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${doc.original_filename}"?`)) return;
    try {
      await api.deleteDocument(doc.id);
      await fetchDocuments();
      await refreshStorage();
    } catch (err) {
      alert(`Failed to delete document: ${err.message}`);
    } finally {
      setActiveMenuDocId(null);
    }
  };

  const handleDownload = (doc, e) => {
    e.stopPropagation();
    const url = api.getDocumentFileUrl(doc.id);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.original_filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setActiveMenuDocId(null);
  };

  return (
    <div className="w-[300px] lg:w-[320px] h-full flex flex-col justify-between glass-panel rounded-3xl border border-white/15 select-none shrink-0 overflow-hidden shadow-2xl">
      {/* Top Header & Search */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white tracking-tight">Files</h2>
            {documents.length > 0 && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                {documents.length}
              </span>
            )}
          </div>

          <button
            onClick={() => setActiveTab('documents')}
            className="text-xs px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all cursor-pointer border border-white/10"
          >
            See all
          </button>
        </div>

        {/* Search Bar matching DocGPT pill input */}
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full bg-black/25 border border-white/10 rounded-full pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-white/30 transition-all"
          />
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1.5 py-1">
        {loadingDocs ? (
          <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-sky-400 mb-2" />
            Loading documents...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-center p-4">
            {/* White outline PDF icon matching DocGPT Image 3 */}
            <div className="w-14 h-16 rounded-lg border-2 border-white/40 flex flex-col items-center justify-center text-white mb-4 relative shadow-sm">
              <span className="text-[12px] font-bold tracking-wider uppercase text-white/90">pdf</span>
              <div className="absolute top-0 right-0 w-3 h-3 border-b-2 border-l-2 border-white/40 bg-transparent" />
            </div>
            <p className="text-xs font-normal text-slate-300/80 mb-1">
              {searchQuery ? 'No matching documents' : 'No Files available yet.'}
            </p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isSelected = selectedDocIds.includes(doc.id);
            const isMenuOpen = activeMenuDocId === doc.id;

            return (
              <div
                key={doc.id}
                onClick={() => selectSingleDoc(doc.id)}
                className={`group relative p-2.5 rounded-2xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white/15 border border-sky-400/50 shadow-md'
                    : 'bg-black/20 hover:bg-white/10 border border-white/5'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Select Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      selectSingleDoc(doc.id);
                    }}
                    className="mt-0.5 text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-sky-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
                    )}
                  </button>

                  {/* PDF Icon */}
                  <div className="w-8 h-8 rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 shadow-sm">
                    <FileText className="w-4 h-4" />
                  </div>

                  {/* Document Info */}
                  <div className="flex-1 min-w-0 pr-6">
                    <h3
                      className={`text-xs font-medium truncate ${
                        isSelected ? 'text-white font-semibold' : 'text-slate-200'
                      }`}
                      title={doc.original_filename}
                    >
                      {doc.original_filename}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>•</span>
                      <span>{doc.num_pages > 0 ? `${doc.num_pages} pgs` : ''}</span>
                      {doc.status === 'indexed' && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400 font-medium">Ready</span>
                        </>
                      )}
                      {doc.status === 'processing' && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400 animate-pulse font-medium">Indexing</span>
                        </>
                      )}
                      {doc.status === 'error' && (
                        <>
                          <span>•</span>
                          <span className="text-rose-400 font-medium">Error</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Context Menu Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuDocId(isMenuOpen ? null : doc.id);
                    }}
                    className="absolute right-2 top-2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Context Menu Dropdown */}
                {isMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-2 top-8 w-36 bg-slate-900 border border-white/20 rounded-xl shadow-2xl p-1 z-30 space-y-0.5"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openPdfViewer(doc);
                        setActiveMenuDocId(null);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-white/10 hover:text-sky-300 transition-colors text-left cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Viewer
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRenameModal?.(doc);
                        setActiveMenuDocId(null);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-white/10 transition-colors text-left cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Rename
                    </button>
                    <button
                      onClick={(e) => handleDownload(doc, e)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-white/10 transition-colors text-left cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                    <div className="border-t border-white/10 my-1" />
                    <button
                      onClick={(e) => handleDelete(doc, e)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Clean Bottom storage line matching DocGPT: "0 MB of 2,000 GB used" */}
      <div className="px-5 py-3 border-t border-white/10">
        <p className="text-[11px] text-slate-300/80 font-sans tracking-wide">
          {storageStats ? `${storageStats.formatted_used} of ${storageStats.formatted_total} used` : '0 MB of 2,000 GB used'}
        </p>
      </div>
    </div>
  );
}
