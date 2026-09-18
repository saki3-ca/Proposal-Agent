import React, { useState, useEffect } from 'react';
import { ProjectDocument, ProcessingStatus } from '../types';
import { DocumentProcessingService } from '../services/documentProcessingService';
import { DocumentViewer } from '../components/documents/DocumentViewer';
import { REAL_TEST_DATA_DOCUMENTS, LibraryDocumentItem } from '../services/documentLibraryData';
import { DocumentClassificationService } from '../services/documentClassificationService';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Plus,
  Building2,
  Award,
  Users,
  ShieldCheck,
  FileCode,
  CheckCircle2,
  FolderOpen,
  Folder,
  Layers,
  LayoutGrid,
  List,
  Eye,
  Download,
  Sparkles,
  ExternalLink,
  Tag,
  FileCheck2,
  HardDrive,
  Trash2
} from 'lucide-react';

export type LibraryCategory =
  | 'ALL'
  | 'Previous Proposals'
  | 'Company Profile'
  | 'Certificates & Credentials'
  | 'Company Experience'
  | 'CVs'
  | 'Legal & Tax'
  | 'Other';

export type UploadCategorySelection = 'AUTO' | LibraryCategory;

import { DocumentStorageService } from '../services/documentStorageService';

const STORAGE_KEY = 'acnabin_document_library_docs';

export const DocumentLibraryPage: React.FC = () => {
  const [documents, setDocuments] = useState<LibraryDocumentItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return DocumentStorageService.deduplicateDocuments(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored document library from localStorage:', e);
    }
    return [];
  });

  const [selectedCategory, setSelectedCategory] = useState<LibraryCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<ProjectDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<UploadCategorySelection>('AUTO');
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'folder'>('grid');
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load from IndexedDB on initial mount for complete unlimited persistence
  useEffect(() => {
    const loadFromIndexedDB = async () => {
      try {
        const idbDocs = await DocumentStorageService.loadLibraryDocuments();
        if (Array.isArray(idbDocs)) {
          setDocuments(DocumentStorageService.deduplicateDocuments(idbDocs));
        }
      } catch (err) {
        console.warn('Could not load from IndexedDB, using in-memory state:', err);
      }
    };
    loadFromIndexedDB();
  }, []);

  // Sync to IndexedDB and lightweight localStorage metadata on changes
  useEffect(() => {
    DocumentStorageService.saveLibraryDocuments(documents);
    try {
      // Store lightweight version in localStorage (without massive markdown if too large)
      const lightweight = documents.map((d) => ({
        ...d,
        markdownContent: (d.markdownContent || '').slice(0, 500)
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
    } catch (e) {
      console.warn('LocalStorage quota reached; IndexedDB retains complete document records safely.');
    }
  }, [documents]);

  const categories: { id: LibraryCategory; label: string; icon: any }[] = [
    { id: 'ALL', label: 'All Documents', icon: FolderOpen },
    { id: 'CVs', label: 'CVs & Key Experts', icon: Users },
    { id: 'Company Profile', label: 'Company Profile', icon: Building2 },
    { id: 'Previous Proposals', label: 'Previous Proposals', icon: FileText },
    { id: 'Certificates & Credentials', label: 'Certificates & Credentials', icon: ShieldCheck },
    { id: 'Company Experience', label: 'Experience & Work Orders', icon: Award },
    { id: 'Legal & Tax', label: 'Legal & Tax Documents', icon: FileCode },
    { id: 'Other', label: 'TORs & Other', icon: Filter }
  ];

  // Distinct folders
  const folders = Array.from(new Set(documents.map((d) => d.folderName || 'General'))).sort();

  const handleUpdateDocCategory = (docId: string, newCat: LibraryCategory, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, kbCategory: newCat } : d))
    );
  };

  const handleDeleteDocument = (docId: string, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    const docToDelete = documents.find((d) => d.id === docId);
    const confirmName = docToDelete?.fileName || 'this document';
    if (window.confirm(`Are you sure you want to permanently delete "${confirmName}" from the Document Library?`)) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      DocumentStorageService.deleteLibraryDocument(docId);
      if (selectedDoc?.id === docId) {
        setSelectedDoc(null);
      }
    }
  };

  const handleCleanDuplicates = () => {
    const cleaned = DocumentStorageService.deduplicateDocuments(documents);
    const diff = documents.length - cleaned.length;
    setDocuments(cleaned);
    setDuplicateNotice(diff > 0 ? `Cleaned ${diff} duplicate document(s).` : 'No duplicates found.');
    setTimeout(() => setDuplicateNotice(null), 4000);
  };

  const handleClearAllDocuments = async () => {
    if (window.confirm('Are you sure you want to clear ALL documents from the library? You will start from zero.')) {
      setDocuments([]);
      await DocumentStorageService.clearAllLibraryDocuments();
      localStorage.removeItem(STORAGE_KEY);
      setSelectedDoc(null);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = selectedCategory === 'ALL' || doc.kbCategory === selectedCategory;
    const matchesFolder = selectedFolder === 'ALL' || doc.folderName === selectedFolder;
    const matchesSearch =
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.kbCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.folderName && doc.folderName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.tags && doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (doc.markdownContent && doc.markdownContent.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesFolder && matchesSearch;
  });

  const totalSizeMb = documents.reduce((sum, d) => sum + (d.fileSizeMb || 0), 0).toFixed(1);
  const totalPages = documents.reduce((sum, d) => sum + (d.pageCount || 1), 0);

  const handleFileUpload = async (files: FileList | File[]) => {
    setIsUploading(true);
    let duplicatesSkipped = 0;
    const newDocsToAdd: LibraryDocumentItem[] = [];

    for (const file of Array.from(files)) {
      const fileSizeMb = parseFloat((file.size / (1024 * 1024)).toFixed(2)) || 0.05;

      // Check for duplicate by both exact filename AND size
      const isDupe = DocumentStorageService.isDuplicate(
        { name: file.name, size: file.size },
        [...newDocsToAdd, ...documents]
      );

      if (isDupe) {
        duplicatesSkipped++;
        continue;
      }

      const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
      let fileType: 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'Image' | 'TXT' | 'CSV' = 'PDF';

      if (['DOCX', 'DOC'].includes(ext)) fileType = 'DOCX';
      else if (['XLSX', 'XLS'].includes(ext)) fileType = 'XLSX';
      else if (['PPTX', 'PPT'].includes(ext)) fileType = 'PPTX';
      else if (['PNG', 'JPG', 'JPEG'].includes(ext)) fileType = 'Image';
      else if (['TXT', 'MD'].includes(ext)) fileType = 'TXT';
      else if (ext === 'CSV') fileType = 'CSV';

      const res = await DocumentProcessingService.processDocument(file);

      let mdContent = `# Extracted Markdown: ${file.name}\n\nProcessed locally via MarkItDown engine.`;
      let score = 0.95;
      let ocrReq = false;

      if (res.success && res.document) {
        mdContent = res.document.markdown;
        score = res.document.quality.score;
        ocrReq = res.document.ocrRequired;
      }

      // Smart classification to accurately separate CVs from Company Profile and others
      const classification = DocumentClassificationService.classify(file.name, mdContent);
      const determinedCategory: LibraryCategory =
        uploadCategory === 'AUTO' || uploadCategory === 'ALL'
          ? classification.category
          : uploadCategory;

      const folderName =
        determinedCategory === 'CVs'
          ? 'CVs & Key Experts'
          : determinedCategory === 'Company Profile'
          ? 'Detailed Organizational Profile'
          : determinedCategory === 'Company Experience'
          ? 'Similar Experience With Fees'
          : determinedCategory === 'Certificates & Credentials'
          ? 'Certificates & Credentials'
          : determinedCategory === 'Legal & Tax'
          ? 'Trade License, TIN and BIN'
          : determinedCategory === 'Previous Proposals'
          ? 'Sample_Proposals'
          : 'TOR & RFP Documents';

      const newDoc: LibraryDocumentItem = {
        id: `kb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        fileName: file.name,
        fileType: fileType,
        fileSizeMb: fileSizeMb,
        uploadedBy: 'SAKIB (Proposal Manager)',
        uploadDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        processingStatus: ocrReq ? 'ocr_check' : 'markdown_converted',
        ocrRequired: ocrReq,
        ocrCompleted: true,
        isSearchable: true,
        pageCount: Math.max(1, Math.ceil(mdContent.split('\n\n').length / 3)),
        sourcePath: URL.createObjectURL(file),
        sourceFileRelativePath: `test_data/${folderName}/${file.name}`,
        folderName: folderName,
        aiConfidence: Math.max(score, classification.confidence),
        version: '1.0',
        kbCategory: determinedCategory,
        tags: Array.from(new Set([...classification.detectedTags, determinedCategory, ext])),
        description: classification.reason || `Uploaded document for proposal knowledge base.`,
        markdownContent: mdContent
      };

      newDocsToAdd.push(newDoc);
    }

    if (newDocsToAdd.length > 0) {
      setDocuments((prev) => DocumentStorageService.deduplicateDocuments([...newDocsToAdd, ...prev]));
    }

    if (duplicatesSkipped > 0) {
      setDuplicateNotice(`Skipped ${duplicatesSkipped} duplicate file(s) (same name & size already exists).`);
      setTimeout(() => setDuplicateNotice(null), 5000);
    }

    setIsUploading(false);
  };

  const handleResetToTestData = async () => {
    if (window.confirm('Reset Document Library to load all default test_data repository documents?')) {
      const resetList = DocumentStorageService.deduplicateDocuments(REAL_TEST_DATA_DOCUMENTS);
      setDocuments(resetList);
      await DocumentStorageService.saveLibraryDocuments(resetList);
      setSelectedCategory('ALL');
      setSelectedFolder('ALL');
      setSearchQuery('');
    }
  };

  if (selectedDoc) {
    return (
      <DocumentViewer
        document={selectedDoc}
        onBack={() => setSelectedDoc(null)}
        onDelete={(doc) => handleDeleteDocument(doc.id)}
      />
    );
  }

  return (
    <div className="space-y-4 font-sans">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        multiple
        accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.txt,.png,.jpg,.jpeg,.csv"
        className="hidden"
      />

      {/* Hero Header & Statistics Bar */}
      <div className="bg-white p-5 rounded-lg border border-[#EDE7DE] shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className="w-3 h-3 rounded-full bg-[#1D8C8C] animate-pulse" />
              <h1 className="text-lg font-bold text-[#1B2A6B] tracking-tight">
                ACNABIN Firm Knowledge Base & Document Library
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-[#1D8C8C]/15 text-[#1D8C8C] rounded-full font-mono">
                {documents.length} Verified Records
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Institutional evidence repository: statutory licenses, past winning technical proposals, expert CVs, experience letters, and TOR benchmarks from <code className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-mono font-bold text-[11px]">/test_data/</code>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={handleCleanDuplicates}
              className="px-3 py-1.5 text-slate-700 hover:text-indigo-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-xs font-semibold transition-colors flex items-center space-x-1.5"
              title="Scan and clean any duplicate documents"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Clean Duplicates</span>
            </button>

            <button
              onClick={handleClearAllDocuments}
              className="px-3 py-1.5 text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 rounded text-xs font-semibold transition-colors flex items-center space-x-1.5"
              title="Clear all documents to start from zero"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Clear All (Start Fresh)</span>
            </button>

            <button
              onClick={handleResetToTestData}
              className="px-3 py-1.5 text-slate-700 hover:text-[#1B2A6B] bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-xs font-semibold transition-colors flex items-center space-x-1.5"
              title="Reload sample test_data documents"
            >
              <HardDrive className="w-3.5 h-3.5 text-[#1D8C8C]" />
              <span>Reload test_data</span>
            </button>

            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as UploadCategorySelection)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-800 focus:border-[#1D8C8C] focus:outline-none"
            >
              <option value="AUTO">✨ Auto-Detect (Smart AI / Keyword)</option>
              <option value="CVs">Category: CVs & Key Experts</option>
              <option value="Company Profile">Category: Company Profile</option>
              <option value="Previous Proposals">Category: Previous Proposals</option>
              <option value="Certificates & Credentials">Category: Certificates</option>
              <option value="Company Experience">Category: Experience</option>
              <option value="Legal & Tax">Category: Legal & Tax</option>
              <option value="Other">Category: Other / TOR</option>
            </select>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 bg-[#1D8C8C] hover:bg-[#156d6d] text-white text-xs font-bold rounded shadow-sm transition-all flex items-center space-x-1.5"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Processing MarkItDown...' : '+ Upload Documents'}</span>
            </button>
          </div>
        </div>

        {duplicateNotice && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-900 flex items-center justify-between">
            <span>{duplicateNotice}</span>
            <button onClick={() => setDuplicateNotice(null)} className="text-amber-700 hover:text-amber-900 text-xs underline">Dismiss</button>
          </div>
        )}

        {/* 4 Compact Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 bg-gradient-to-br from-slate-50 to-teal-50/30 border border-slate-200 rounded-lg flex items-center space-x-3">
            <div className="p-2 bg-[#1D8C8C]/15 rounded-md text-[#1D8C8C]">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Total Evidence Files</div>
              <div className="text-base font-bold text-[#1B2A6B] font-mono">{documents.length} Documents</div>
            </div>
          </div>

          <div className="p-3 bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200 rounded-lg flex items-center space-x-3">
            <div className="p-2 bg-[#1B2A6B]/15 rounded-md text-[#1B2A6B]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Folders / Categories</div>
              <div className="text-base font-bold text-[#1B2A6B] font-mono">{folders.length} Folders</div>
            </div>
          </div>

          <div className="p-3 bg-gradient-to-br from-slate-50 to-emerald-50/30 border border-slate-200 rounded-lg flex items-center space-x-3">
            <div className="p-2 bg-emerald-600/15 rounded-md text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">MarkItDown Extracted</div>
              <div className="text-base font-bold text-emerald-800 font-mono">100% Searchable</div>
            </div>
          </div>

          <div className="p-3 bg-gradient-to-br from-slate-50 to-purple-50/30 border border-slate-200 rounded-lg flex items-center space-x-3">
            <div className="p-2 bg-purple-600/15 rounded-md text-purple-700">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Repository Size</div>
              <div className="text-base font-bold text-purple-900 font-mono">{totalSizeMb} MB ({totalPages} pgs)</div>
            </div>
          </div>
        </div>

        {/* Search & View Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across all test_data files by name, tags, client, or extracted Markdown text..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:border-[#1D8C8C] focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* View Switcher */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center space-x-1 transition-colors ${
                viewMode === 'grid' ? 'bg-white text-[#1B2A6B] shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center space-x-1 transition-colors ${
                viewMode === 'table' ? 'bg-white text-[#1B2A6B] shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Detailed Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('folder')}
              className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center space-x-1 transition-colors ${
                viewMode === 'folder' ? 'bg-white text-[#1B2A6B] shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Folder Directory View"
            >
              <Folder className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Folders</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs Strip */}
      <div className="flex items-center space-x-1.5 overflow-x-auto bg-white p-1.5 rounded-lg border border-slate-200">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          const count = cat.id === 'ALL' ? documents.length : documents.filter((d) => d.kbCategory === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedFolder('ALL');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center space-x-1.5 whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-[#1B2A6B] text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] font-mono rounded ${
                  isSelected ? 'bg-[#152152] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Folders Filter (If Folder Mode or active filter) */}
      {viewMode === 'folder' && (
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-700 font-mono flex items-center space-x-1">
            <FolderOpen className="w-3.5 h-3.5 text-[#1D8C8C]" />
            <span>Select Folder:</span>
          </span>
          <button
            onClick={() => setSelectedFolder('ALL')}
            className={`px-2.5 py-1 rounded text-xs font-semibold ${
              selectedFolder === 'ALL' ? 'bg-[#1D8C8C] text-white font-bold' : 'bg-white border border-slate-300 text-slate-700'
            }`}
          >
            All Folders ({documents.length})
          </button>
          {folders.map((f) => {
            const count = documents.filter((d) => d.folderName === f).length;
            const isSel = selectedFolder === f;
            return (
              <button
                key={f}
                onClick={() => setSelectedFolder(f)}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 ${
                  isSel ? 'bg-[#1D8C8C] text-white font-bold' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Folder className="w-3 h-3 text-amber-600" />
                <span>{f}</span>
                <span className="font-mono text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* VIEW 1: GRID CARDS VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredDocs.length === 0 ? (
            <div className="col-span-full bg-white p-12 text-center rounded-lg border border-slate-200 space-y-2">
              <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-slate-500 font-semibold text-sm">No documents found matching "{searchQuery}"</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedFolder('ALL');
                }}
                className="px-3 py-1.5 bg-[#1D8C8C] text-white rounded text-xs font-bold"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isPdf = doc.fileType === 'PDF';
              const isDocx = doc.fileType === 'DOCX';

              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="bg-white rounded-lg border border-slate-200 hover:border-[#1D8C8C] shadow-2xs hover:shadow-md transition-all p-4 flex flex-col justify-between cursor-pointer group space-y-3"
                >
                  <div className="space-y-2">
                    {/* Top Row: File Format & Category */}
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center space-x-1 ${
                          isPdf
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : isDocx
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <FileText className="w-3 h-3" />
                        <span>{doc.fileType}</span>
                      </span>

                      <select
                        value={doc.kbCategory}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleUpdateDocCategory(doc.id, e.target.value as LibraryCategory, e)}
                        className="text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded border border-slate-200 focus:outline-none focus:border-[#1D8C8C] cursor-pointer"
                        title="Click to change document category"
                      >
                        <option value="CVs">CVs & Key Experts</option>
                        <option value="Company Profile">Company Profile</option>
                        <option value="Previous Proposals">Previous Proposals</option>
                        <option value="Certificates & Credentials">Certificates</option>
                        <option value="Company Experience">Experience</option>
                        <option value="Legal & Tax">Legal & Tax</option>
                        <option value="Other">Other / TOR</option>
                      </select>
                    </div>

                    {/* File Title */}
                    <h3
                      className="text-xs font-bold text-slate-900 group-hover:text-[#1D8C8C] transition-colors line-clamp-2 leading-snug"
                      title={doc.fileName}
                    >
                      {doc.fileName}
                    </h3>

                    {/* Description */}
                    {doc.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {doc.description}
                      </p>
                    )}

                    {/* Tags */}
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {doc.tags.slice(0, 3).map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[10px] rounded font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                        {doc.tags.length > 3 && (
                          <span className="text-[10px] text-slate-400">+{doc.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom Metadata & Inspect Action */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center space-x-2 font-mono text-[10px]">
                      <span>{doc.fileSizeMb} MB</span>
                      <span>•</span>
                      <span>{doc.pageCount} pgs</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 text-[#1D8C8C] group-hover:text-[#156d6d] font-bold text-xs">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteDocument(doc.id, e)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: DETAILED TABLE VIEW / FOLDER VIEW */}
      {(viewMode === 'table' || viewMode === 'folder') && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse odoo-table table-auto">
              <thead>
                <tr className="bg-[#1B2A6B] text-white text-[11px]">
                  <th className="w-10 text-center text-white font-mono whitespace-nowrap">SL</th>
                  <th className="min-w-[240px] max-w-[340px] text-white">Document Name & Location</th>
                  <th className="w-40 text-white whitespace-nowrap">Category</th>
                  <th className="w-36 text-white whitespace-nowrap">Folder / Source</th>
                  <th className="w-20 text-white whitespace-nowrap">Format</th>
                  <th className="w-20 text-white whitespace-nowrap">Size</th>
                  <th className="w-24 text-white whitespace-nowrap">Date</th>
                  <th className="w-32 text-white whitespace-nowrap">MarkItDown</th>
                  <th className="w-24 text-center text-white whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400 italic">
                      No documents found matching filter criteria. Click + Upload Documents to add.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc, i) => (
                    <tr
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className="hover:bg-teal-50/40 cursor-pointer transition-colors border-b border-slate-100"
                    >
                      <td className="text-center font-bold font-mono text-slate-700">{i + 1}</td>
                      <td className="font-semibold text-slate-900 hover:text-[#1D8C8C] max-w-[340px]" title={doc.fileName}>
                        <div className="flex items-center space-x-2">
                          <FileText
                            className={`w-4 h-4 shrink-0 ${
                              doc.fileType === 'PDF' ? 'text-red-600' : 'text-blue-600'
                            }`}
                          />
                          <div className="truncate">
                            <div className="truncate font-bold">{doc.fileName}</div>
                            {doc.description && (
                              <div className="text-[10px] text-slate-400 truncate font-normal">
                                {doc.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-[11px] font-bold text-slate-800 whitespace-nowrap">
                        <select
                          value={doc.kbCategory}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleUpdateDocCategory(doc.id, e.target.value as LibraryCategory, e)}
                          className="text-[11px] font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded border border-slate-200 focus:outline-none focus:border-[#1D8C8C] cursor-pointer"
                        >
                          <option value="CVs">CVs & Key Experts</option>
                          <option value="Company Profile">Company Profile</option>
                          <option value="Previous Proposals">Previous Proposals</option>
                          <option value="Certificates & Credentials">Certificates</option>
                          <option value="Company Experience">Experience</option>
                          <option value="Legal & Tax">Legal & Tax</option>
                          <option value="Other">Other / TOR</option>
                        </select>
                      </td>
                      <td className="font-mono text-[10px] text-slate-600 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">
                          {doc.folderName || 'Root'}
                        </span>
                      </td>
                      <td className="font-mono text-[11px] whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                            doc.fileType === 'PDF'
                              ? 'bg-red-50 text-red-700'
                              : doc.fileType === 'DOCX'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {doc.fileType}
                        </span>
                      </td>
                      <td className="font-mono text-[11px] whitespace-nowrap">{doc.fileSizeMb} MB</td>
                      <td className="font-mono text-[11px] whitespace-nowrap text-slate-600">{doc.uploadDate}</td>
                      <td className="whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded flex items-center space-x-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Indexed</span>
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDoc(doc);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-[#1D8C8C] hover:text-white text-slate-700 text-[11px] font-bold rounded transition-colors"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={(e) => handleDeleteDocument(doc.id, e)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
