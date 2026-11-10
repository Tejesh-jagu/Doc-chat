import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';

export default function UploadModal({ isOpen, onClose }) {
  const { fetchDocuments, refreshStorage, toggleSelectDoc } = useApp();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFiles = (files) => {
    const pdfFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    if (pdfFiles.length < files.length) {
      setUploadError('Only PDF files are supported.');
    } else {
      setUploadError(null);
    }
    setSelectedFiles(prev => [...prev, ...pdfFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0 || isUploading) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const uploaded = await api.uploadDocuments(selectedFiles);
      await fetchDocuments();
      await refreshStorage();

      if (uploaded && uploaded.length > 0) {
        uploaded.forEach(doc => toggleSelectDoc(doc.id));
      }

      setSelectedFiles([]);
      onClose();
    } catch (err) {
      setUploadError(err.message || 'Failed to upload documents');
    } finally {
      setIsUploading(false);
    }
  };

  const formatSize = (bytes) => {
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-white/20 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-sky-400/30 text-sky-400 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Upload PDF Documents</h2>
              <p className="text-[11px] text-slate-400">Add documents to index into DocChat's local vector engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drag and Drop Box */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center mb-4 ${
            dragActive
              ? 'border-sky-400 bg-sky-950/20'
              : 'border-white/15 hover:border-sky-400/50 bg-slate-900/60 hover:bg-slate-900/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
            }}
          />
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 text-sky-400 flex items-center justify-center mx-auto mb-2">
            <FileText className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-white mb-1">
            Choose PDFs or drag & drop files here
          </p>
          <p className="text-[11px] text-slate-400">Supports multiple PDF files</p>
        </div>

        {/* Selected files preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-4">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Files to upload ({selectedFiles.length})
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {selectedFiles.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/70 border border-white/5 text-xs text-slate-200"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="truncate" title={file.name}>{file.name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">({formatSize(file.size)})</span>
                  </div>
                  <button
                    onClick={() => removeFile(i)}
                    disabled={isUploading}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error message */}
        {uploadError && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedFiles.length === 0 || isUploading}
            className="px-5 py-2 rounded-xl classy-btn text-xs font-semibold disabled:opacity-40 transition-all flex items-center gap-2 cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing & Indexing...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload & Index {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
