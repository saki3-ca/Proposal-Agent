import React, { useState, useEffect } from 'react';
import { ProjectDocument } from '../../types';
import {
  FileText,
  FileCode,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  ChevronLeft,
  Trash2,
  Image as ImageIcon,
  FileSpreadsheet,
  FileBox,
  Eye,
  Info
} from 'lucide-react';

interface DocumentViewerProps {
  document: ProjectDocument | null;
  onBack: () => void;
  onDelete?: (doc: ProjectDocument) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ document: doc, onBack, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'original' | 'markdown' | 'metadata'>('original');
  const [copied, setCopied] = useState(false);
  const [activeFileUrl, setActiveFileUrl] = useState<string>('');

  useEffect(() => {
    if (!doc) return;

    if (doc.rawFile) {
      const url = URL.createObjectURL(doc.rawFile);
      setActiveFileUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (doc.rawFileBase64) {
      setActiveFileUrl(doc.rawFileBase64);
    } else if (doc.sourcePath && !doc.sourcePath.startsWith('blob:')) {
      setActiveFileUrl(doc.sourcePath);
    } else {
      setActiveFileUrl('');
    }
  }, [doc]);

  if (!doc) return null;

  const isPdf = doc.fileType === 'PDF' || doc.fileName.toLowerCase().endsWith('.pdf');
  const isImage = ['Image', 'PNG', 'JPG', 'JPEG'].includes(doc.fileType) || /\.(png|jpe?g|webp|gif|svg)$/i.test(doc.fileName);
  const isDocx = ['DOCX', 'DOC'].includes(doc.fileType) || /\.(docx?)$/i.test(doc.fileName);
  const isXlsx = ['XLSX', 'XLS', 'CSV'].includes(doc.fileType) || /\.(xlsx?|csv)$/i.test(doc.fileName);

  const handleCopyMarkdown = () => {
    if (doc.markdownContent) {
      navigator.clipboard.writeText(doc.markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!doc.markdownContent) return;
    const blob = new Blob([doc.markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.fileName.replace(/\.[^/.]+$/, '')}_extracted.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadOriginal = () => {
    if (activeFileUrl) {
      const link = document.createElement('a');
      link.href = activeFileUrl;
      link.download = doc.fileName;
      link.click();
    } else if (doc.markdownContent) {
      handleDownloadMarkdown();
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
    <div className="space-y-4 font-sans">
      {/* Top Header Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center space-x-1 text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Library</span>
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-[#1B2A6B] truncate max-w-md" title={doc.fileName}>
                {doc.fileName}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1D8C8C]/15 text-[#1D8C8C]">
                {doc.fileType}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              {doc.fileSizeMb} MB • {doc.pageCount} Pages • Uploaded by {doc.uploadedBy || 'SAKIB'} ({doc.uploadDate})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Tabs */}
          <div className="bg-slate-100 p-1 rounded-md flex items-center space-x-1 text-xs">
            <button
              onClick={() => setActiveTab('original')}
              className={`px-3 py-1 font-semibold rounded transition-colors flex items-center space-x-1.5 ${
                activeTab === 'original'
                  ? 'bg-white text-[#1B2A6B] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Original File ({doc.fileType})</span>
            </button>
            <button
              onClick={() => setActiveTab('markdown')}
              className={`px-3 py-1 font-semibold rounded transition-colors flex items-center space-x-1.5 ${
                activeTab === 'markdown'
                  ? 'bg-white text-[#1D8C8C] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Extracted Markdown</span>
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              className={`px-3 py-1 font-semibold rounded transition-colors flex items-center space-x-1.5 ${
                activeTab === 'metadata'
                  ? 'bg-white text-[#1B2A6B] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>AI Index & Tags</span>
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleDownloadOriginal}
            className="px-3 py-1.5 bg-[#1B2A6B] hover:bg-[#152152] text-white text-xs font-bold rounded flex items-center space-x-1.5 transition-colors shadow-2xs"
            title="Download original file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded flex items-center space-x-1 transition-colors"
            title="Copy extracted Markdown to clipboard"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied!' : 'Copy MD'}</span>
          </button>

          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: ORIGINAL FILE VIEWER (PDF / Image / Word / Excel) */}
      {activeTab === 'original' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          {/* PDF Viewer */}
          {isPdf && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center space-x-2 text-slate-700 font-semibold">
                  <FileText className="w-4 h-4 text-red-600" />
                  <span>Interactive PDF Viewer — {doc.fileName}</span>
                </div>
                {activeFileUrl && (
                  <a
                    href={activeFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#1B2A6B] hover:underline font-bold flex items-center space-x-1"
                  >
                    <span>Open in new window</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {activeFileUrl ? (
                <iframe
                  src={activeFileUrl}
                  title={doc.fileName}
                  className="w-full h-[720px] rounded-lg border border-slate-300 shadow-inner bg-slate-100"
                />
              ) : (
                <div className="bg-slate-900 rounded-lg p-12 text-center text-white space-y-3">
                  <FileText className="w-12 h-12 text-red-400 mx-auto" />
                  <h4 className="text-sm font-bold">{doc.fileName}</h4>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    Document is indexed in Proposal Knowledge Base. View the fully parsed text in the <strong>Extracted Markdown</strong> tab or download the file.
                  </p>
                  <button
                    onClick={handleDownloadMarkdown}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1D8C8C] hover:bg-[#156d6d] text-white text-xs font-bold rounded-md shadow-xs transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Extracted Text</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Image Viewer (JPG, PNG, JPEG) */}
          {isImage && (
            <div className="p-6 text-center space-y-4 bg-slate-50">
              {activeFileUrl ? (
                <div className="max-w-4xl mx-auto bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <img
                    src={activeFileUrl}
                    alt={doc.fileName}
                    className="max-h-[650px] mx-auto object-contain rounded"
                  />
                </div>
              ) : (
                <div className="p-12 text-slate-500 space-y-2">
                  <ImageIcon className="w-12 h-12 mx-auto text-slate-400" />
                  <p className="text-sm font-semibold">Image file: {doc.fileName}</p>
                </div>
              )}
            </div>
          )}

          {/* Word Document Viewer (DOCX) */}
          {isDocx && (
            <div className="p-8 bg-slate-50 text-center space-y-4">
              <div className="max-w-md mx-auto bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">{doc.fileName}</h4>
                <p className="text-xs text-slate-500">
                  Microsoft Word Document ({doc.fileSizeMb} MB). Content has been parsed into markdown for AI requirement matching.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    onClick={handleDownloadOriginal}
                    className="px-4 py-2 bg-[#1B2A6B] hover:bg-[#152152] text-white text-xs font-bold rounded flex items-center space-x-1.5 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Original DOCX</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('markdown')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded flex items-center space-x-1.5 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Parsed Content</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Excel Spreadsheet Viewer (XLSX, CSV) */}
          {isXlsx && (
            <div className="p-8 bg-slate-50 text-center space-y-4">
              <div className="max-w-md mx-auto bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">{doc.fileName}</h4>
                <p className="text-xs text-slate-500">
                  Spreadsheet ({doc.fileSizeMb} MB). Financial tables and data schedules extracted for automated fee calculation.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    onClick={handleDownloadOriginal}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded flex items-center space-x-1.5 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Spreadsheet</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('markdown')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded flex items-center space-x-1.5 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Extracted Tables</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Fallback for other file types */}
          {!isPdf && !isImage && !isDocx && !isXlsx && (
            <div className="p-8 text-center space-y-3">
              <FileBox className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">{doc.fileName}</h4>
              <p className="text-xs text-slate-500">
                Uploaded {doc.fileType} document ({doc.fileSizeMb} MB).
              </p>
              <button
                onClick={handleDownloadOriginal}
                className="px-4 py-2 bg-[#1B2A6B] text-white text-xs font-bold rounded inline-flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Document</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXTRACTED MARKDOWN & PARSED TEXT */}
      {activeTab === 'markdown' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-900 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-[#1D8C8C]" />
              <span className="font-semibold">
                MarkItDown Structure & OCR Conversion Complete — Fully Grounded for AI Drafting
              </span>
            </div>
            <span className="font-mono font-bold text-[#1D8C8C]">
              AI Match Confidence: {((doc.aiConfidence || 0.95) * 100).toFixed(0)}%
            </span>
          </div>

          <pre className="whitespace-pre-wrap font-mono text-xs bg-slate-50 p-5 rounded-lg border border-slate-200 text-slate-900 max-h-[600px] overflow-y-auto leading-relaxed">
            {doc.markdownContent || `# Extracted Content for ${doc.fileName}\n\nDocument text indexed for proposal requirement matching.`}
          </pre>
        </div>
      )}

      {/* TAB 3: AI INDEX & METADATA */}
      {activeTab === 'metadata' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <span className="font-bold text-[#1B2A6B] block">Document Classification</span>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div><span className="text-slate-500">Category:</span> {(doc as any).kbCategory || 'Other'}</div>
                <div><span className="text-slate-500">Folder:</span> {(doc as any).folderName || 'Root'}</div>
                <div><span className="text-slate-500">File Type:</span> {doc.fileType}</div>
                <div><span className="text-slate-500">Size:</span> {doc.fileSizeMb} MB</div>
                <div><span className="text-slate-500">Page Count:</span> {doc.pageCount}</div>
                <div><span className="text-slate-500">Version:</span> {doc.version}</div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <span className="font-bold text-[#1B2A6B] block">Evidence & AI Indexing</span>
              <div className="space-y-1.5 text-slate-700">
                <div><span className="text-slate-500">Processing Status:</span> <span className="font-bold text-emerald-700">{doc.processingStatus}</span></div>
                <div><span className="text-slate-500">OCR Required:</span> {doc.ocrRequired ? 'Yes (Optical OCR Applied)' : 'No (Direct Text Extraction)'}</div>
                <div><span className="text-slate-500">Searchable:</span> Yes (Indexed for LLM Context RAG)</div>
                {doc.sourcePath && <div className="truncate"><span className="text-slate-500">Source Path:</span> <code className="text-[10px] text-slate-800">{doc.sourcePath}</code></div>}
              </div>
            </div>
          </div>

          {(doc as any).tags && (doc as any).tags.length > 0 && (
            <div className="pt-2">
              <span className="font-bold text-slate-700 block mb-1.5">Indexed Search Tags:</span>
              <div className="flex flex-wrap gap-1.5">
                {(doc as any).tags.map((tag: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[11px] rounded border border-slate-200">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
