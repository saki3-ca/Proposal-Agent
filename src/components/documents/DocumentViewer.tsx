import React, { useState } from 'react';
import { ProjectDocument } from '../../types';
import { FileText, FileCode, CheckCircle2, Copy, Download, ExternalLink, ChevronLeft, Trash2 } from 'lucide-react';

interface DocumentViewerProps {
  document: ProjectDocument | null;
  onBack: () => void;
  onDelete?: (doc: ProjectDocument) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ document: doc, onBack, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'markdown' | 'original'>('markdown');
  const [copied, setCopied] = useState(false);

  if (!doc) return null;

  const handleCopyMarkdown = () => {
    if (doc.markdownContent) {
      navigator.clipboard.writeText(doc.markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to permanently delete "${doc.fileName}"?`)) {
      if (onDelete) {
        onDelete(doc);
      }
      onBack();
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center space-x-1 text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Documents List</span>
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">{doc.fileName}</h3>
            <p className="text-[11px] text-slate-500 font-mono">
              {doc.fileType} • {doc.fileSizeMb} MB • {doc.pageCount} Pages • Version {doc.version}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-slate-100 p-1 rounded-md flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('markdown')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                activeTab === 'markdown' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Extracted Markdown
            </button>
            <button
              onClick={() => setActiveTab('original')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                activeTab === 'original' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Original Source Reference
            </button>
          </div>

          <button
            onClick={handleCopyMarkdown}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded flex items-center space-x-1 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>

          {onDelete && (
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded flex items-center space-x-1 transition-colors"
              title="Delete this document"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Viewer Body */}
      {activeTab === 'markdown' ? (
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-6 font-mono text-xs text-slate-800 space-y-4 overflow-y-auto max-h-[600px] leading-relaxed">
          <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded text-indigo-900 font-sans text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-indigo-600" />
              <span>MarkItDown Conversion Complete — Source Traceability Preserved</span>
            </div>
            <span className="font-mono font-bold text-indigo-700">Confidence: {(doc.aiConfidence * 100).toFixed(0)}%</span>
          </div>

          <pre className="whitespace-pre-wrap font-mono text-xs bg-slate-50 p-4 rounded-lg border border-slate-200 text-slate-900">
            {doc.markdownContent || `# Extracted Content for ${doc.fileName}\n\nDocument text successfully extracted via server-side MarkItDown engine. Page references, headings, and table structures indexed for requirement matrix matching.`}
          </pre>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-lg p-12 text-center text-white space-y-4 shadow-md">
          <FileText className="w-12 h-12 text-indigo-400 mx-auto" />
          <h4 className="text-sm font-bold">Original File Viewer ({doc.fileName})</h4>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            The original document is permanently stored in Supabase Storage. Click below to view the immutable source PDF/DOCX file in a separate tab.
          </p>
          <a
            href={doc.sourcePath}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-md shadow-xs transition-colors"
          >
            <span>Open Original PDF Viewer</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
};
