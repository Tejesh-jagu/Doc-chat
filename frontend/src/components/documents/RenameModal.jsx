import React, { useState, useEffect } from 'react';
import { Edit2, X } from 'lucide-react';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';

export default function RenameModal({ document: doc, isOpen, onClose }) {
  const { fetchDocuments } = useApp();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (doc) {
      setName(doc.original_filename || '');
      setError(null);
    }
  }, [doc]);

  if (!isOpen || !doc) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await api.renameDocument(doc.id, clean);
      await fetchDocuments();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to rename document');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-sm glass-panel p-5 rounded-2xl border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-white">Rename Document</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
              Document Name
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
            {error && <p className="text-[11px] text-rose-400 mt-1">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-4 py-1.5 rounded-xl classy-btn text-xs font-medium disabled:opacity-40 cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
