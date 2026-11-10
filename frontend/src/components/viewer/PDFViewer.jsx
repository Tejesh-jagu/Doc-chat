import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  X,
  Search,
  RotateCw,
  Loader2,
  FileText,
  BookmarkCheck,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';

// Set up worker locally
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
} catch (e) {
  console.warn('Worker configuration notice:', e);
}

export default function PDFViewer({ document: doc, initialPage = 1, highlightText = '', onClose }) {
  const { setPdfTargetPage } = useApp();
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(initialPage || 1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [citationNotice, setCitationNotice] = useState(highlightText ? `Navigated to citation on Page ${initialPage}` : null);

  // In-PDF Search states
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]); // array of page numbers with matches
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  // Sync initialPage changes from citations
  useEffect(() => {
    if (initialPage && initialPage !== currentPage) {
      setCurrentPage(initialPage);
      setCitationNotice(`Navigated to citation on Page ${initialPage}`);
      const timer = setTimeout(() => setCitationNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [initialPage]);

  // Load PDF document
  useEffect(() => {
    if (!doc?.id) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setSearchResults([]);
    setCurrentResultIndex(-1);
    setSearchTerm('');

    const pdfUrl = api.getDocumentFileUrl(doc.id);

    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      withCredentials: true
    });

    loadingTask.promise
      .then((loadedPdf) => {
        if (!isMounted) return;
        setPdfDoc(loadedPdf);
        setNumPages(loadedPdf.numPages);
        setCurrentPage(Math.min(initialPage || 1, loadedPdf.numPages));
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('PDF load error:', err);
        setError('Failed to load PDF file. Please ensure it is accessible.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [doc?.id]);

  // Render current page onto canvas
  const renderPage = useCallback(async (pageNum) => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;
      await renderTask.promise;
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Page render error:', err);
      }
    }
  }, [pdfDoc, scale]);

  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale, renderPage]);

  // Perform PDF text search
  const handleSearch = async (term) => {
    if (!pdfDoc || !term.trim()) {
      setSearchResults([]);
      setCurrentResultIndex(-1);
      return;
    }

    setIsSearching(true);
    const cleanTerm = term.toLowerCase().trim();
    const matchingPages = [];

    try {
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ').toLowerCase();
        if (pageText.includes(cleanTerm)) {
          matchingPages.push(i);
        }
      }

      setSearchResults(matchingPages);
      if (matchingPages.length > 0) {
        // If current page matches, keep it, else jump to first match
        const existingIdx = matchingPages.indexOf(currentPage);
        const targetIdx = existingIdx !== -1 ? existingIdx : 0;
        setCurrentResultIndex(targetIdx);
        setCurrentPage(matchingPages[targetIdx]);
      } else {
        setCurrentResultIndex(-1);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleNextSearchMatch = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (currentResultIndex + 1) % searchResults.length;
    setCurrentResultIndex(nextIdx);
    setCurrentPage(searchResults[nextIdx]);
  };

  const handlePrevSearchMatch = () => {
    if (searchResults.length === 0) return;
    const prevIdx = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentResultIndex(prevIdx);
    setCurrentPage(searchResults[prevIdx]);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(p => p - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(p => p + 1);
    }
  };

  const handleZoomIn = () => {
    setScale(s => Math.min(s + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setScale(s => Math.max(s - 0.2, 0.6));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    const url = api.getDocumentFileUrl(doc.id);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.original_filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      ref={containerRef}
      className={`h-full flex flex-col glass-panel rounded-2xl border border-white/10 overflow-hidden relative ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-slate-950' : ''
      }`}
    >
      {/* Top Controls Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/80 border-b border-white/10 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-200 truncate max-w-[150px] sm:max-w-[200px]" title={doc?.original_filename}>
            {doc?.original_filename}
          </span>
        </div>

        {/* Page Navigation & Zoom Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Search Toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              searchOpen || searchTerm
                ? 'bg-sky-500/20 text-sky-200 border-sky-400/40'
                : 'bg-slate-800/80 text-slate-300 border-white/5 hover:text-white hover:bg-white/10'
            }`}
            title="Search inside PDF"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Page Navigator */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-xl border border-white/5 text-xs text-slate-300">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-xs px-1">
              {currentPage} / {numPages || 1}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= numPages}
              className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-white/10 mx-0.5" />

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 bg-slate-800/80 p-0.5 rounded-xl border border-white/5">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-slate-400">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Download & Fullscreen */}
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-xl bg-slate-800/80 border border-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Download PDF"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-slate-800/80 border border-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800/80 border border-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
              title="Close PDF Viewer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* In-PDF Search Toolbar (expandable) */}
      {searchOpen && (
        <div className="px-3.5 py-2 bg-slate-900/95 border-b border-white/10 flex items-center justify-between gap-2 z-20">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleSearch(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNextSearchMatch();
              }}
              placeholder="Search keyword in PDF..."
              className="w-full bg-slate-800/80 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0 text-xs text-slate-300">
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
            ) : searchTerm ? (
              <span className="font-mono text-[11px] px-1.5 text-slate-400">
                {searchResults.length > 0 ? `${currentResultIndex + 1} of ${searchResults.length}` : 'No matches'}
              </span>
            ) : null}

            {searchResults.length > 0 && (
              <>
                <button
                  onClick={handlePrevSearchMatch}
                  className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  title="Previous match"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={handleNextSearchMatch}
                  className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  title="Next match"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </>
            )}

            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchTerm('');
                setSearchResults([]);
              }}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Citation Toast Notice */}
      {citationNotice && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-sky-400/50 text-white text-xs font-medium shadow-xl shadow-black/50 flex items-center gap-2 animate-bounce">
          <BookmarkCheck className="w-4 h-4 text-sky-400" />
          <span>{citationNotice}</span>
        </div>
      )}

      {/* Main PDF Canvas Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-950/40 relative">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
            Loading PDF pages...
          </div>
        )}

        {error && (
          <div className="text-center p-6 max-w-sm">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-3">
              <X className="w-5 h-5" />
            </div>
            <p className="text-xs text-rose-300 font-medium mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Reload Viewer
            </button>
          </div>
        )}

        <div className={`shadow-2xl rounded-lg overflow-hidden border border-white/10 bg-white ${loading || error ? 'hidden' : 'block'}`}>
          <canvas ref={canvasRef} className="block max-w-full" />
        </div>
      </div>
    </div>
  );
}
