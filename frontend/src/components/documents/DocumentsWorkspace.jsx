import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderArchive,
  Grid,
  List,
  Search,
  UploadCloud,
  FileText,
  Calendar,
  HardDrive,
  MoreVertical,
  Edit2,
  Trash2,
  Download,
  BookOpen,
  MessageSquare,
  CheckSquare,
  Square,
  FolderPlus,
  Folder as FolderIcon,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';

export default function DocumentsWorkspace({ onOpenRenameModal }) {
  const {
    documents,
    loadingDocs,
    fetchDocuments,
    selectedDocIds,
    toggleSelectDoc,
    clearSelectedDocs,
    setSelectedDocIds,
    openPdfViewer,
    setUploadModalOpen,
    createNewChat,
    setActiveTab,
    refreshStorage
  } = useApp();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'name' | 'size'
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [folders, setFolders] = useState([]);
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Load folders
  const loadFolders = async () => {
    try {
      const data = await api.listFolders();
      setFolders(data);
    } catch (err) {
      console.error('Error loading folders:', err);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await api.createFolder(newFolderName.trim());
      setNewFolderName('');
      setNewFolderModalOpen(false);
      loadFolders();
    } catch (err) {
      alert(`Error creating folder: ${err.message}`);
    }
  };

  const handleDeleteFolder = async (folderId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this folder? Documents inside will not be deleted.')) return;
    try {
      await api.deleteFolder(folderId);
      if (activeFolderId === folderId) setActiveFolderId(null);
      loadFolders();
      fetchDocuments();
    } catch (err) {
      alert(`Error deleting folder: ${err.message}`);
    }
  };

  // Filter & sort
  const filteredDocuments = useMemo(() => {
    let result = [...documents];

    if (activeFolderId !== null) {
      result = result.filter(d => d.folder_id === activeFolderId);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d => d.original_filename.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      if (sortBy === 'name') {
        const cmp = a.original_filename.localeCompare(b.original_filename);
        return sortOrder === 'asc' ? cmp : -cmp;
      } else if (sortBy === 'size') {
        const diff = (a.file_size || 0) - (b.file_size || 0);
        return sortOrder === 'asc' ? diff : -diff;
      } else {
        const diff = new Date(a.created_at) - new Date(b.created_at);
        return sortOrder === 'asc' ? diff : -diff;
      }
    });

    return result;
  }, [documents, search, sortBy, sortOrder, activeFolderId]);

  const handleSelectAll = () => {
    if (selectedDocIds.length === filteredDocuments.length) {
      clearSelectedDocs();
    } else {
      setSelectedDocIds(filteredDocuments.map(d => d.id));
    }
  };

  const handleBatchDelete = async () => {
    if (!window.confirm(`Delete ${selectedDocIds.length} selected document(s)?`)) return;
    try {
      for (const id of selectedDocIds) {
        await api.deleteDocument(id);
      }
      clearSelectedDocs();
      await fetchDocuments();
      await refreshStorage();
    } catch (err) {
      alert(`Error deleting documents: ${err.message}`);
    }
  };

  const handleStartChatWithSelected = () => {
    createNewChat('Multi-doc Chat', selectedDocIds);
    setActiveTab('home');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex-1 h-full flex flex-col p-5 overflow-y-auto glass-panel select-none">
      {/* Page Title & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-sky-400" />
            Documents Library
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your indexed PDF documents, folders, and multi-file collections.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setNewFolderModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-white/15 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <FolderPlus className="w-4 h-4 text-sky-400" />
            <span>New Folder</span>
          </button>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 rounded-xl classy-btn text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload PDFs</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5">
        {/* Left: Folder tabs & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* All Folder Button */}
          <button
            onClick={() => setActiveFolderId(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeFolderId === null
                ? 'bg-white/15 text-white border border-white/25 shadow-md shadow-black/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            All Files ({documents.length})
          </button>

          {/* Folder Pills with Glossy Finish */}
          {folders.map(f => (
            <div
              key={f.id}
              onClick={() => setActiveFolderId(f.id)}
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                activeFolderId === f.id
                  ? 'glossy-folder border-sky-400/50 text-white'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/10 hover:border-white/20'
              }`}
            >
              <FolderIcon className="w-3.5 h-3.5 text-sky-400" />
              <span>{f.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">({f.document_count || 0})</span>
              <button
                onClick={(e) => handleDeleteFolder(f.id, e)}
                className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Right: Search, Sorting, View toggles */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
              className="w-full bg-slate-900/70 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/30"
            />
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-900/70 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Batch Actions Bar (when documents are selected) */}
      {selectedDocIds.length > 0 && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-sky-400/40 text-xs mb-4 shadow-lg shadow-black/30">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{selectedDocIds.length}</span>
            <span className="text-slate-300">document(s) selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartChatWithSelected}
              className="px-3 py-1.5 rounded-lg classy-btn font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat with Selected</span>
            </button>
            <button
              onClick={handleBatchDelete}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
            <button
              onClick={clearSelectedDocs}
              className="text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Main Content: Grid or List */}
      <div className="flex-1 overflow-y-auto">
        {loadingDocs ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-sky-400 mb-2" />
            Loading documents...
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400 mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">No documents found</h3>
            <p className="text-xs text-slate-400 mb-4 max-w-xs">
              {search ? 'No documents match your search query.' : 'Upload PDFs to organize and chat with your documents.'}
            </p>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-4 py-2 rounded-xl classy-btn text-xs font-medium cursor-pointer"
            >
              Upload PDF
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View with Rich Glossy Texture */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredDocuments.map(doc => {
              const isSelected = selectedDocIds.includes(doc.id);
              const isMenuOpen = activeMenuId === doc.id;

              return (
                <div
                  key={doc.id}
                  onClick={() => toggleSelectDoc(doc.id)}
                  className={`p-4 rounded-2xl transition-all cursor-pointer relative group flex flex-col justify-between ${
                    isSelected
                      ? 'glossy-folder border-sky-400/60 shadow-lg shadow-sky-500/15'
                      : 'glass-panel-card hover:border-white/20'
                  }`}
                >
                  <div>
                    {/* Top row: Checkbox, PDF badge, Context menu */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectDoc(doc.id);
                          }}
                          className="text-slate-400 hover:text-sky-400 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-sky-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500" />
                          )}
                        </button>
                        <div className="w-8 h-8 rounded-lg bg-red-950/70 border border-red-500/30 flex items-center justify-center text-red-400 shadow-sm">
                          <FileText className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(isMenuOpen ? null : doc.id);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-7 w-36 bg-slate-900 border border-white/20 rounded-xl shadow-2xl p-1 z-30 text-xs"
                          >
                            <button
                              onClick={() => {
                                openPdfViewer(doc);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-white/10 hover:text-sky-300 cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              View PDF
                            </button>
                            <button
                              onClick={() => {
                                onOpenRenameModal?.(doc);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-white/10 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Rename
                            </button>
                            <button
                              onClick={() => {
                                const url = api.getDocumentFileUrl(doc.id);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = doc.original_filename;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-white/10 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </button>
                            <div className="border-t border-white/10 my-1" />
                            <button
                              onClick={async () => {
                                if (window.confirm(`Delete "${doc.original_filename}"?`)) {
                                  await api.deleteDocument(doc.id);
                                  await fetchDocuments();
                                  await refreshStorage();
                                }
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xs font-semibold text-white truncate mb-1" title={doc.original_filename}>
                      {doc.original_filename}
                    </h3>

                    {/* Status pill */}
                    <div className="flex items-center gap-1.5 text-[10px] mb-3">
                      {doc.status === 'indexed' && (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Indexed & Ready
                        </span>
                      )}
                      {doc.status === 'processing' && (
                        <span className="flex items-center gap-1 text-amber-400 font-medium">
                          <Loader2 className="w-3 h-3 animate-spin" /> Processing
                        </span>
                      )}
                      {doc.status === 'error' && (
                        <span className="flex items-center gap-1 text-rose-400 font-medium">
                          <AlertCircle className="w-3 h-3" /> Error
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata bottom row */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-3 border-t border-white/10">
                    <span>{formatFileSize(doc.file_size)}</span>
                    <span>{doc.num_pages > 0 ? `${doc.num_pages} pages` : formatDate(doc.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View with Glossy Sheen */
          <div className="rounded-2xl glass-panel border border-white/15 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 border-b border-white/10 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-3 w-10">
                    <button onClick={handleSelectAll} className="text-slate-400 hover:text-white cursor-pointer">
                      {selectedDocIds.length > 0 && selectedDocIds.length === filteredDocuments.length ? (
                        <CheckSquare className="w-4 h-4 text-sky-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3">Document Name</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Pages</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Uploaded</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredDocuments.map(doc => {
                  const isSelected = selectedDocIds.includes(doc.id);
                  return (
                    <tr
                      key={doc.id}
                      onClick={() => toggleSelectDoc(doc.id)}
                      className={`hover:bg-white/5 cursor-pointer transition-colors ${
                        isSelected ? 'bg-sky-950/20 border-l-2 border-sky-400' : ''
                      }`}
                    >
                      <td className="p-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectDoc(doc.id);
                          }}
                          className="cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-sky-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500" />
                          )}
                        </button>
                      </td>
                      <td className="p-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-red-400 shrink-0" />
                        <span className="font-medium text-white truncate max-w-xs">{doc.original_filename}</span>
                      </td>
                      <td className="p-3">
                        {doc.status === 'indexed' && (
                          <span className="text-emerald-400 font-medium text-[11px]">Indexed</span>
                        )}
                        {doc.status === 'processing' && (
                          <span className="text-amber-400 font-medium text-[11px]">Processing</span>
                        )}
                        {doc.status === 'error' && (
                          <span className="text-rose-400 font-medium text-[11px]">Error</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300 font-mono">{doc.num_pages || '-'}</td>
                      <td className="p-3 text-slate-300 font-mono">{formatFileSize(doc.file_size)}</td>
                      <td className="p-3 text-slate-400">{formatDate(doc.created_at)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openPdfViewer(doc)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                            title="View PDF"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenRenameModal?.(doc)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                            title="Rename"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm(`Delete "${doc.original_filename}"?`)) {
                                await api.deleteDocument(doc.id);
                                await fetchDocuments();
                                await refreshStorage();
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Folder Modal */}
      {newFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm glass-panel p-5 rounded-2xl border border-white/20 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-sky-400" />
              Create Document Folder
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter a name for your category folder (e.g. Research, Medical, Finances).
            </p>
            <form onSubmit={handleCreateFolder}>
              <input
                type="text"
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 mb-4"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewFolderModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-4 py-1.5 rounded-xl classy-btn text-xs font-medium disabled:opacity-40 cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
