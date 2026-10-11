import React, { useState, useRef, useEffect } from 'react';
import { Requirement, Project, TorKnowledgeModel } from '../types';
import { DocumentProcessingService } from '../services/documentProcessingService';
import { TorAnalysisService, QuickTorAnalysisResult } from '../services/torAnalysisService';
import { ProposalDatabaseService } from '../services/proposalDatabaseService';
import { DocumentStorageService } from '../services/documentStorageService';
import {
  Zap,
  Upload,
  CheckCircle2,
  FileText,
  ArrowRight,
  X,
  AlertTriangle,
  AlertCircle,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Send,
  ShieldAlert,
  FileCheck2,
  Users,
  Copy,
  Check,
  Search,
  Layers,
  Sparkles,
  Info,
  RefreshCw,
  Download,
  Save,
  ExternalLink,
  BookOpen,
  Printer,
  FileCode,
  FolderOpen,
  Edit3,
  Eye,
  Trash2,
  HardDrive
} from 'lucide-react';

export interface ProcessedDocItem {
  file: File;
  markdown: string;
  pagesProcessed: number;
  method: 'markitdown' | 'markitdown + ocr';
  ocrCompleted: boolean;
  charCount: number;
  wordCount: number;
}

export interface QuickTorAnalyzerError {
  type: 'backend_unreachable' | 'extraction_failed' | 'analysis_failed' | 'validation_failed';
  title: string;
  stage?: string;
  reason: string;
}

export interface RecentConversionRecord {
  id: string;
  fileName: string;
  fileSizeMb?: number;
  convertedAt: string;
  markdown: string;
  analysis?: QuickTorAnalysisResult;
  pagesProcessed: number;
  charCount: number;
}

const RECENT_CONVERSIONS_KEY = 'acnabin_quick_tor_conversions_history';

interface QuickTorAnalyzerPageProps {
  onNavigate?: (path: string) => void;
  onConvertToProject?: (newProject: Project) => void;
  onOpenExistingProject?: (projectId: string) => void;
}

export const QuickTorAnalyzerPage: React.FC<QuickTorAnalyzerPageProps> = ({
  onNavigate,
  onConvertToProject,
  onOpenExistingProject
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [processedDocs, setProcessedDocs] = useState<ProcessedDocItem[]>([]);
  const [selectedDocIndex, setSelectedDocIndex] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [errorState, setErrorState] = useState<QuickTorAnalyzerError | null>(null);
  const [analysisResult, setAnalysisResult] = useState<QuickTorAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'markdown' | 'overview' | 'requirements' | 'compliance' | 'sections'>('markdown');
  const [markdownViewMode, setMarkdownViewMode] = useState<'raw' | 'preview'>('raw');
  const [editableMarkdown, setEditableMarkdown] = useState<string>('');
  const [copiedMd, setCopiedMd] = useState(false);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);
  const [reqFilter, setReqFilter] = useState<'all' | 'mandatory' | 'optional'>('all');
  const [reqSearch, setReqSearch] = useState('');
  const [extractionMethod, setExtractionMethod] = useState<'markitdown' | 'markitdown + ocr'>('markitdown');
  const [pagesProcessed, setPagesProcessed] = useState<number>(1);
  const [ocrCompleted, setOcrCompleted] = useState<boolean>(false);
  const [existingDuplicate, setExistingDuplicate] = useState<Project | null>(null);
  const [recentConversions, setRecentConversions] = useState<RecentConversionRecord[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load recent conversions history
  useEffect(() => {
    loadRecentConversions();
    // Also load latest analysis if available
    const latest = ProposalDatabaseService.getLatestQuickTorAnalysis();
    if (latest && !analysisResult) {
      setAnalysisResult(latest);
      const md = latest.normalization?.normalizedMarkdown || '';
      setEditableMarkdown(md);
    }
  }, []);

  const loadRecentConversions = () => {
    try {
      const stored = localStorage.getItem(RECENT_CONVERSIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentConversions(parsed.slice(0, 10));
        }
      }
    } catch (e) {
      console.warn('Failed to load recent conversions:', e);
    }
  };

  const saveRecentConversion = (item: RecentConversionRecord) => {
    try {
      const stored = localStorage.getItem(RECENT_CONVERSIONS_KEY);
      const existing: RecentConversionRecord[] = stored ? JSON.parse(stored) : [];
      const filtered = existing.filter((c) => c.fileName !== item.fileName);
      const updated = [item, ...filtered].slice(0, 15);
      localStorage.setItem(RECENT_CONVERSIONS_KEY, JSON.stringify(updated));
      setRecentConversions(updated);
    } catch (e) {
      console.warn('Failed to save recent conversion:', e);
    }
  };

  useEffect(() => {
    if (analysisResult?.overview?.assignment) {
      checkForDuplicates(analysisResult.overview.assignment);
    }
  }, [analysisResult]);

  const checkForDuplicates = async (title: string) => {
    try {
      const projects = await ProposalDatabaseService.fetchProposals();
      const normTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = projects.find((p) => {
        const pTitle = (p.assignmentTitle || p.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return (
          pTitle.includes(normTitle) ||
          normTitle.includes(pTitle) ||
          (normTitle.includes('assetquality') && pTitle.includes('assetquality')) ||
          (normTitle.includes('governance') && pTitle.includes('governance'))
        );
      });
      setExistingDuplicate(match || null);
    } catch {
      setExistingDuplicate(null);
    }
  };

  const handleFileUpload = async (filesInput: File | File[] | FileList) => {
    const fileArray: File[] = Array.isArray(filesInput)
      ? filesInput
      : filesInput instanceof FileList
      ? Array.from(filesInput)
      : [filesInput];

    if (fileArray.length === 0) return;

    const allowed = ['pdf', 'docx', 'doc', 'xlsx', 'pptx', 'txt'];
    for (const f of fileArray) {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      if (!allowed.includes(ext)) {
        setErrorState({
          type: 'validation_failed',
          title: 'Unsupported File Format',
          reason: `File "${f.name}" has unsupported format (.${ext}). Supported formats: ${allowed.join(', ')}.`
        });
        return;
      }

      if (f.size > 50 * 1024 * 1024) {
        setErrorState({
          type: 'validation_failed',
          title: 'File Size Exceeded',
          reason: `File "${f.name}" exceeds maximum limit of 50 MB.`
        });
        return;
      }
    }

    setFiles(fileArray);
    setProcessedDocs([]);
    setSelectedDocIndex(0);
    setErrorState(null);
    setAnalysisResult(null);
    setExistingDuplicate(null);
    setSavedBanner(null);
    setIsProcessing(true);
    setExtractionMethod('markitdown');
    setPagesProcessed(1);
    setOcrCompleted(false);

    try {
      const extractedItems: ProcessedDocItem[] = [];
      let totalPages = 0;
      let hasOcr = false;

      // Process each file sequentially
      for (let i = 0; i < fileArray.length; i++) {
        const currentFile = fileArray[i];
        setProcessingStage(
          fileArray.length > 1
            ? `Converting document ${i + 1} of ${fileArray.length}: ${currentFile.name}...`
            : `Converting document to Markdown with Microsoft MarkItDown...`
        );

        const processRes = await DocumentProcessingService.processDocument(currentFile);

        if (!processRes.success || !processRes.document) {
          if (processRes.error?.code === 'BACKEND_UNREACHABLE') {
            setErrorState({
              type: 'backend_unreachable',
              title: 'Cannot connect to Proposal Agent backend server.',
              reason: 'Ensure the FastAPI backend server is running on http://127.0.0.1:8000'
            });
            return;
          }

          setErrorState({
            type: 'extraction_failed',
            title: `Conversion failed for ${currentFile.name}`,
            stage: processRes.error?.stage || 'Microsoft MarkItDown',
            reason: processRes.error?.message || 'Document conversion to markdown failed.'
          });
          return;
        }

        const rawMarkdown = processRes.document.markdown || '';
        const method = (processRes.document.source || 'markitdown') as 'markitdown' | 'markitdown + ocr';
        const numPages = (processRes.document as any).pagesProcessed || 1;
        const wasOcr = Boolean(processRes.document.ocrCompleted || method.includes('ocr'));
        const charCount = rawMarkdown.length;
        const wordCount = rawMarkdown.trim() ? rawMarkdown.trim().split(/\s+/).length : 0;

        totalPages += numPages;
        if (wasOcr) hasOcr = true;

        if (rawMarkdown.trim().length === 0) {
          setErrorState({
            type: 'extraction_failed',
            title: `Zero text extracted from ${currentFile.name}`,
            stage: wasOcr ? 'RapidOCR Fallback' : 'Microsoft MarkItDown',
            reason: 'Document yielded zero text. The file may be empty or password-protected.'
          });
          return;
        }

        extractedItems.push({
          file: currentFile,
          markdown: rawMarkdown,
          pagesProcessed: numPages,
          method,
          ocrCompleted: wasOcr,
          charCount,
          wordCount
        });
      }

      setProcessedDocs(extractedItems);
      setPagesProcessed(totalPages);
      setExtractionMethod(hasOcr ? 'markitdown + ocr' : 'markitdown');
      setOcrCompleted(hasOcr);

      // Combine markdown
      const combinedMarkdown =
        extractedItems.length === 1
          ? extractedItems[0].markdown
          : extractedItems
              .map(
                (item, idx) =>
                  `# DOCUMENT ${idx + 1}: ${item.file.name}\n\n${item.markdown}\n\n---\n`
              )
              .join('\n');

      setEditableMarkdown(combinedMarkdown);

      const primaryFileName = extractedItems[0].file.name;
      const totalSizeMb = Number(
        (fileArray.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)
      );

      // Analyze TOR Markdown
      setProcessingStage('Normalizing Markdown & extracting TOR procurement clauses...');
      const analysis = await TorAnalysisService.analyzeTorMarkdown(combinedMarkdown, primaryFileName, totalSizeMb);

      // Save to latest store & history
      ProposalDatabaseService.saveQuickTorAnalysis({
        ...analysis,
        extractionMethod: hasOcr ? 'markitdown + ocr' : 'markitdown',
        pagesProcessed: totalPages,
        ocrCompleted: hasOcr
      });

      saveRecentConversion({
        id: `conv_${Date.now()}`,
        fileName: primaryFileName,
        fileSizeMb: totalSizeMb,
        convertedAt: new Date().toISOString(),
        markdown: combinedMarkdown,
        analysis,
        pagesProcessed: totalPages,
        charCount: combinedMarkdown.length
      });

      setAnalysisResult(analysis);
      setSavedBanner('Document successfully converted to Markdown & analyzed!');
      setTimeout(() => setSavedBanner(null), 4000);
    } catch (err: any) {
      console.error('Quick TOR Analyzer & Converter failed:', err);
      const isFetchErr = err?.message && (err.message.includes('fetch') || err.message.includes('NetworkError'));
      if (isFetchErr) {
        setErrorState({
          type: 'backend_unreachable',
          title: 'Cannot connect to Proposal Agent server.',
          reason: 'Make sure the FastAPI backend is running on http://127.0.0.1:8000.'
        });
      } else {
        setErrorState({
          type: 'analysis_failed',
          title: 'Document conversion & analysis failed',
          stage: err?.stage || 'TOR Analysis',
          reason: err?.message || 'Failed to process document into markdown.'
        });
      }
      setAnalysisResult(null);
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  };

  const handleDownloadSourceMarkdown = (targetDoc?: ProcessedDocItem) => {
    const docToDownload = targetDoc || (processedDocs[selectedDocIndex] ?? null);
    const content = docToDownload ? docToDownload.markdown : editableMarkdown;
    const baseName = docToDownload ? docToDownload.file.name : (analysisResult?.fileName || 'document.pdf');
    const cleanFileName = `${baseName.replace(/\.[^/.]+$/, '')}.md`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = cleanFileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllMarkdownFiles = () => {
    if (processedDocs.length === 0) {
      handleDownloadSourceMarkdown();
      return;
    }
    processedDocs.forEach((doc, idx) => {
      setTimeout(() => {
        handleDownloadSourceMarkdown(doc);
      }, idx * 250);
    });
  };

  const handleDownloadCombinedMarkdown = () => {
    const primaryName = files[0]?.name || analysisResult?.fileName || 'converted_document.pdf';
    const cleanFileName = `${primaryName.replace(/\.[^/.]+$/, '')}_combined.md`;

    const blob = new Blob([editableMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = cleanFileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAnalysisReport = () => {
    if (!analysisResult) return;
    const { overview, keyRequirements, requirements, fileName, validationStatus } = analysisResult;
    const cleanAssignment = (overview.assignment || 'Document').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 40);

    const docListStr =
      files.length > 1
        ? files.map((f, i) => `${f.name} (${processedDocs[i]?.pagesProcessed || 1} pages)`).join(', ')
        : `${fileName} (${pagesProcessed} page${pagesProcessed > 1 ? 's' : ''})`;

    const mdContent = `# TOR ANALYSIS & SCOPING REPORT

**Source Documents:** ${docListStr}
**Conversion Timestamp:** ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
**Extraction Pipeline:** ${extractionMethod === 'markitdown + ocr' ? 'Microsoft MarkItDown + RapidOCR Fallback' : 'Microsoft MarkItDown'} (${pagesProcessed} total pages across ${files.length || 1} file${files.length > 1 ? 's' : ''})
**Validation Grounding:** ${validationStatus?.isValidated ? `Validated (${validationStatus.groundedFieldsCount}/${validationStatus.totalEvaluatedFields} factual points verified against source)` : 'Extracted from Source'}

---

## 1. Assignment & Client Overview
* **Client / Organization:** ${overview.client || '[To be confirmed by User]'}
* **Assignment Title:** ${overview.assignment}
* **Submission Deadline:** ${overview.deadline || '[To be confirmed by User]'}
* **Estimated Duration:** ${overview.duration || 'Not specified in TOR'}
* **Location / Duty Station:** ${overview.location || 'Not specified in TOR'}
* **Submission Method:** ${overview.submissionMethod || 'Not specified in TOR'}
* **Submission Address:** ${overview.submissionAddress || 'Not specified in TOR'}
* **Submission Email:** ${overview.submissionEmail || 'Not specified in TOR'}
* **Contact Person / Query Point:** ${overview.contactPerson || 'Not specified in TOR'}

---

## 2. Key Objectives & Scope of Work
### Objectives
${keyRequirements.objectives.length > 0 ? keyRequirements.objectives.map((o) => `* ${o}`).join('\n') : '* No explicit objectives clause extracted from document.'}

### Scope of Work
${keyRequirements.scopeSummary.length > 0 ? keyRequirements.scopeSummary.map((s) => `* ${s}`).join('\n') : '* No explicit scope list extracted from document.'}

${keyRequirements.outOfScope.length > 0 ? `### Out of Scope / Exclusions\n${keyRequirements.outOfScope.map((ex) => `* ${ex}`).join('\n')}\n` : ''}
---

## 3. Identified Deliverables
${keyRequirements.deliverables.length > 0 ? keyRequirements.deliverables.map((d, i) => `${i + 1}. ${d}`).join('\n') : '* No explicit deliverables schedule extracted from document.'}

---

## 4. Key Team & Firm Qualifications
### Team Composition
${keyRequirements.teamComposition.length > 0 ? keyRequirements.teamComposition.map((t) => `* ${t}`).join('\n') : '* No explicit team composition list extracted from document.'}

### Firm Qualifications
${keyRequirements.qualifications.length > 0 ? keyRequirements.qualifications.map((q) => `* ${q}`).join('\n') : '* As per general procurement terms.'}

---

## 5. Submission Documents & Prescribed Forms
### Required Documents
${keyRequirements.requiredDocuments.length > 0 ? keyRequirements.requiredDocuments.map((d) => `* ${d}`).join('\n') : '* Explicit supporting documents not specified in TOR.'}

### Prescribed Forms
${keyRequirements.prescribedForms.length > 0 ? keyRequirements.prescribedForms.map((f) => `* ${f}`).join('\n') : '* Standard proposal forms as per tender instructions.'}

---

## 6. Extracted Requirements Matrix (${requirements.length} Items)

| SL | Category | Source Clause | Requirement Text | Mandatory |
|---|---|---|---|---|
${requirements.map((r, i) => `| ${i + 1} | ${r.category || 'Technical'} | ${r.sourceSection || r.sourceClause || 'TOR'} | ${(r.requirementText || '').replace(/\|/g, '-')} | ${r.mandatory ? 'YES' : 'NO'} |`).join('\n')}

---
*Report generated by Quick TOR Analyzer & Document Converter.*
`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = `TOR_Analysis_Report_${cleanAssignment}.md`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = () => {
    const targetText = editableMarkdown || analysisResult?.normalization.normalizedMarkdown || '';
    if (!targetText) return;
    navigator.clipboard.writeText(targetText);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleSaveToDocumentLibrary = async () => {
    if (!editableMarkdown) return;
    const primaryName = files[0]?.name || analysisResult?.fileName || 'Converted_TOR.pdf';
    const sizeMb = files[0]?.size ? files[0].size / (1024 * 1024) : 0.5;

    const newDocItem: any = {
      id: `lib_doc_${Date.now()}`,
      fileName: primaryName,
      fileSizeMb: Number(sizeMb.toFixed(2)),
      fileType: (primaryName.split('.').pop() || 'pdf').toUpperCase(),
      category: 'Previous Proposals',
      kbCategory: 'Previous Proposals',
      folderName: 'Quick Analyzed TORs',
      sourceFileRelativePath: `test_data/${primaryName}`,
      uploadedBy: 'Quick TOR Analyzer',
      uploadDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      uploadedAt: new Date().toISOString(),
      markdown: editableMarkdown,
      markdownContent: editableMarkdown,
      processingStatus: 'markdown_converted',
      ocrRequired: false,
      ocrCompleted: true,
      isSearchable: true,
      status: 'Indexed',
      pageCount: pagesProcessed || 1,
      aiConfidence: 0.98,
      tags: ['Converted MD', 'TOR Analysis', 'Quick Analyzer'],
      description: `Document converted to Markdown via Microsoft MarkItDown. Extracted: ${analysisResult?.overview?.assignment || primaryName}`
    };

    try {
      const existing = await DocumentStorageService.loadLibraryDocuments();
      const updated = [newDocItem, ...existing];
      await DocumentStorageService.saveLibraryDocuments(updated);
      setSavedBanner('Saved to Document Library successfully!');
      setTimeout(() => setSavedBanner(null), 3000);
    } catch (e) {
      console.warn('Failed to save to library:', e);
    }
  };

  const handleConvertToProjectAction = async () => {
    if (!analysisResult) return;

    const primaryFileName = files[0]?.name || analysisResult.fileName;
    const totalSizeMb = files[0]?.size ? Number((files[0].size / (1024 * 1024)).toFixed(2)) : 0.5;

    const projectId = `p-${Date.now()}`;
    const cleanAssignment = analysisResult.overview.assignment || primaryFileName.replace(/\.[^/.]+$/, '');
    const deadlineStr = analysisResult.overview.deadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    const fullRequirements: Requirement[] = (analysisResult.requirements || []).map((r, idx) => ({
      id: r.id || `req-${projectId}-${idx + 1}`,
      projectId,
      category: r.category || 'Technical',
      subcategory: r.subcategory,
      requirementText: r.requirementText || '',
      mandatory: r.mandatory ?? true,
      sourceFile: r.sourceFile || primaryFileName,
      sourcePage: r.sourcePage || 1,
      sourceSection: r.sourceSection || 'TOR Section',
      sourceClause: r.sourceClause,
      sourceQuote: r.sourceQuote,
      status: r.status || 'READY',
      aiInterpretation: r.aiInterpretation || `Requirement mapped to ${r.category || 'Technical'} section.`,
      evidenceFound: r.evidenceFound || [],
      evidenceStatus: r.evidenceStatus || 'Missing',
      aiConfidence: r.aiConfidence || 0.95,
      isVerified: r.isVerified || false
    }));

    const newProject: Project = {
      id: projectId,
      name: cleanAssignment,
      assignmentTitle: cleanAssignment,
      client: analysisResult.overview.client || '[Action Required: Confirm Client]',
      tenderType: 'Consultancy',
      refNumber: analysisResult.torModel.assignmentContext?.refNumber || `REF-${Date.now().toString().slice(-4)}`,
      receiveDate: new Date().toISOString().split('T')[0],
      submissionDeadline: deadlineStr,
      daysLeft: ProposalDatabaseService.calculateDaysLeft(deadlineStr) || 14,
      assignedTo: 'SAKIB',
      issuingOrg: analysisResult.overview.client || '[Action Required: Confirm Client]',
      manager: 'SAKIB',
      status: 'In Progress',
      remarks: `Created via Quick TOR Analyzer & MD Converter (${extractionMethod})`,
      completionPercentage: 35,
      mandatoryUnresolvedCount: 0,
      activeStep: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    ProposalDatabaseService.saveProjectTorSource(projectId, {
      fileName: primaryFileName,
      originalSize: files[0]?.size,
      markdownContent: editableMarkdown,
      quality: analysisResult.torModel.metadata?.markitdownQuality,
      extractedAt: new Date().toISOString(),
      version: '1.0'
    });

    ProposalDatabaseService.saveProjectTorModel(projectId, analysisResult.torModel);
    ProposalDatabaseService.saveProjectRequirements(projectId, fullRequirements);

    if (onConvertToProject) {
      onConvertToProject(newProject);
    } else if (onNavigate) {
      onNavigate(`/projects/${projectId}`);
    }
  };

  const handleLoadRecentRecord = (record: RecentConversionRecord) => {
    setEditableMarkdown(record.markdown);
    if (record.analysis) {
      setAnalysisResult(record.analysis);
      setPagesProcessed(record.pagesProcessed || 1);
    }
    setSelectedDocIndex(0);
    setProcessedDocs([
      {
        file: new File([], record.fileName),
        markdown: record.markdown,
        pagesProcessed: record.pagesProcessed || 1,
        method: 'markitdown',
        ocrCompleted: false,
        charCount: record.charCount || record.markdown.length,
        wordCount: record.markdown.trim().split(/\s+/).length
      }
    ]);
  };

  const filteredRequirements = (analysisResult?.requirements || []).filter((req) => {
    if (reqFilter === 'mandatory' && !req.mandatory) return false;
    if (reqFilter === 'optional' && req.mandatory) return false;
    if (reqSearch) {
      const q = reqSearch.toLowerCase();
      const text = (req.requirementText || '').toLowerCase();
      const cat = (req.category || '').toLowerCase();
      const sec = (req.sourceSection || '').toLowerCase();
      return text.includes(q) || cat.includes(q) || sec.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* Page Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1B2A6B] flex items-center gap-2">
                Quick Analyze TOR & Document Converter
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-teal-100 text-teal-800 border border-teal-200 uppercase">
                  MarkItDown Ingestion
                </span>
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Convert any document (PDF, Word DOCX, Excel XLSX, PPTX, TXT) into clean Markdown (.md), extract structured TOR clauses, and download instantly.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        {analysisResult && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleDownloadSourceMarkdown()}
              className="px-3 py-2 bg-[#1B2A6B] hover:bg-[#152152] text-white text-xs font-bold rounded-md flex items-center space-x-1.5 shadow-2xs transition-colors"
              title="Download clean converted Markdown file (.md)"
            >
              <Download className="w-4 h-4" />
              <span>Download .md</span>
            </button>

            <button
              onClick={handleDownloadAnalysisReport}
              className="px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-md flex items-center space-x-1.5 shadow-2xs transition-colors"
              title="Download full structured TOR Analysis Scoping Report (.md)"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Download Report (.md)</span>
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md flex items-center space-x-1 border border-slate-200 transition-colors"
              title="Copy converted markdown to clipboard"
            >
              {copiedMd ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedMd ? 'Copied!' : 'Copy MD'}</span>
            </button>

            <button
              onClick={handleConvertToProjectAction}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-md flex items-center space-x-1.5 shadow-xs transition-colors"
              title="Turn this analysis into an Active Proposal Project"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>Convert to Project</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Alert Notifications Banner */}
      {savedBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs flex items-center space-x-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedBanner}</span>
        </div>
      )}

      {/* Duplicate Project Warning */}
      {existingDuplicate && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-md text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Existing proposal match found: <strong>{existingDuplicate.assignmentTitle || existingDuplicate.name}</strong> (Status: {existingDuplicate.status}).
            </span>
          </div>
          {onOpenExistingProject && (
            <button
              onClick={() => onOpenExistingProject(existingDuplicate.id)}
              className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded text-xs transition-colors inline-flex items-center space-x-1"
            >
              <span>Open Project</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Error Display */}
      {errorState && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-900 text-xs space-y-2">
          <div className="flex items-center space-x-2 font-bold text-red-800 text-sm">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{errorState.title}</span>
          </div>
          <p className="text-red-700">{errorState.reason}</p>
          {errorState.stage && (
            <div className="font-mono text-[10px] text-red-500">Failed Stage: {errorState.stage}</div>
          )}
          {errorState.type === 'backend_unreachable' && (
            <div className="pt-2">
              <span className="font-semibold">Local Backend Help:</span> Run <code className="bg-red-100 px-1.5 py-0.5 rounded text-red-900 font-mono">python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000</code> or <code className="bg-red-100 px-1.5 py-0.5 rounded text-red-900 font-mono">npm run dev</code>.
            </div>
          )}
        </div>
      )}

      {/* Ingestion & Conversion Drag & Drop Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
        }}
        className={`bg-white rounded-lg border-2 border-dashed transition-all p-6 text-center ${
          isDragging ? 'border-[#1D8C8C] bg-teal-50/50' : 'border-[#CBD5E1] hover:border-[#1B2A6B]'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".pdf,.docx,.doc,.xlsx,.pptx,.txt"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFileUpload(e.target.files);
          }}
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-[#1B2A6B] flex items-center justify-center mx-auto border border-slate-200">
            {isProcessing ? (
              <RefreshCw className="w-6 h-6 animate-spin text-[#1D8C8C]" />
            ) : (
              <Upload className="w-6 h-6 text-[#1B2A6B]" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#1B2A6B]">
              {isProcessing ? 'Converting & Processing Document...' : 'Upload Document to Convert into Markdown & Analyze'}
            </h3>
            <p className="text-xs text-slate-500">
              Drag and drop your TOR, RFP, EOI, or Tender Document here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[#1D8C8C] font-bold hover:underline"
              >
                browse files
              </button>
            </p>
          </div>

          {/* Supported Formats */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[10px] font-mono text-slate-500">
            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">PDF (.pdf)</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">Word (.docx, .doc)</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">Excel (.xlsx)</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">PowerPoint (.pptx)</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">Text (.txt)</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">Up to 50MB</span>
          </div>

          {/* Live Progress Stage */}
          {isProcessing && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-md text-teal-800 text-xs space-y-1.5 text-left font-sans">
              <div className="flex items-center space-x-2 font-semibold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1D8C8C]" />
                <span>{processingStage}</span>
              </div>
              <div className="w-full bg-teal-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#1D8C8C] h-full rounded-full animate-pulse w-3/4"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Results Workspace */}
      {analysisResult && (
        <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-2xs overflow-hidden">
          {/* Document Package Bar */}
          <div className="bg-[#1B2A6B] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <FileCode className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs font-bold tracking-tight">
                  {analysisResult.overview.assignment || analysisResult.fileName}
                </div>
                <div className="text-[10px] text-slate-300 font-mono flex items-center space-x-2 mt-0.5">
                  <span>File: {analysisResult.fileName}</span>
                  <span>•</span>
                  <span>Pages: {pagesProcessed}</span>
                  <span>•</span>
                  <span>Pipeline: {extractionMethod}</span>
                  <span>•</span>
                  <span className="text-emerald-300 font-bold">✓ Validated Grounding</span>
                </div>
              </div>
            </div>

            {/* Quick Multi-Doc Switcher (if multiple files uploaded) */}
            {processedDocs.length > 1 && (
              <div className="flex items-center space-x-1 text-xs">
                <span className="text-slate-300 text-[11px]">Documents:</span>
                {processedDocs.map((doc, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDocIndex(idx);
                      setEditableMarkdown(doc.markdown);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      selectedDocIndex === idx
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-[#152152] text-slate-200 hover:bg-[#152152]/80'
                    }`}
                  >
                    Doc {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-[#E2E8F0] bg-slate-50 px-4 flex items-center justify-between overflow-x-auto">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('markdown')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'markdown'
                    ? 'border-[#1D8C8C] text-[#1B2A6B] bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Converted Markdown (.md)</span>
              </button>

              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'overview'
                    ? 'border-[#1D8C8C] text-[#1B2A6B] bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>TOR Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('requirements')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'requirements'
                    ? 'border-[#1D8C8C] text-[#1B2A6B] bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Key Scope & Deliverables</span>
              </button>

              <button
                onClick={() => setActiveTab('compliance')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'compliance'
                    ? 'border-[#1D8C8C] text-[#1B2A6B] bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Compliance & Risk Snapshot</span>
              </button>

              <button
                onClick={() => setActiveTab('sections')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'sections'
                    ? 'border-[#1D8C8C] text-[#1B2A6B] bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Granular Clauses ({analysisResult.requirements.length})</span>
              </button>
            </div>

            {/* Quick Tab Actions */}
            <div className="flex items-center space-x-2 py-1.5">
              <button
                onClick={handleSaveToDocumentLibrary}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-[#1B2A6B] bg-white hover:bg-slate-100 rounded border border-slate-200 transition-colors flex items-center space-x-1"
                title="Save this converted markdown into Document Library"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save to Library</span>
              </button>
            </div>
          </div>

          {/* Tab Content 1: CONVERTED MARKDOWN (.MD) */}
          {activeTab === 'markdown' && (
            <div className="p-4 space-y-3">
              {/* Markdown Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 rounded border border-slate-200 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-700">Display:</span>
                  <button
                    onClick={() => setMarkdownViewMode('raw')}
                    className={`px-2.5 py-1 rounded font-semibold text-[11px] transition-colors flex items-center space-x-1 ${
                      markdownViewMode === 'raw'
                        ? 'bg-[#1B2A6B] text-white font-bold'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <FileCode className="w-3 h-3" />
                    <span>Raw Markdown / Editor</span>
                  </button>

                  <button
                    onClick={() => setMarkdownViewMode('preview')}
                    className={`px-2.5 py-1 rounded font-semibold text-[11px] transition-colors flex items-center space-x-1 ${
                      markdownViewMode === 'preview'
                        ? 'bg-[#1B2A6B] text-white font-bold'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Formatted Preview</span>
                  </button>
                </div>

                {/* Markdown stats & Downloads */}
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {editableMarkdown.length.toLocaleString()} characters •{' '}
                    {editableMarkdown.trim().split(/\s+/).length.toLocaleString()} words
                  </span>

                  <button
                    onClick={() => handleDownloadSourceMarkdown()}
                    className="px-2.5 py-1 bg-[#1D8C8C] hover:bg-[#156d6d] text-white text-[11px] font-bold rounded flex items-center space-x-1 transition-colors"
                    title="Download this markdown document (.md)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .md</span>
                  </button>

                  {processedDocs.length > 1 && (
                    <button
                      onClick={handleDownloadCombinedMarkdown}
                      className="px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold rounded flex items-center space-x-1 transition-colors"
                      title="Download combined markdown package (.md)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Combined .md</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Editor / Raw View */}
              {markdownViewMode === 'raw' ? (
                <div className="relative">
                  <textarea
                    value={editableMarkdown}
                    onChange={(e) => setEditableMarkdown(e.target.value)}
                    rows={22}
                    className="w-full font-mono text-xs p-3.5 bg-slate-950 text-slate-100 rounded-md border border-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed resize-y selection:bg-teal-700"
                    placeholder="Extracted Markdown content..."
                  />
                  <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-700">
                    Editable • Changes reflect in downloads
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-white rounded border border-slate-200 text-xs text-slate-800 space-y-4 max-h-[600px] overflow-y-auto leading-relaxed prose prose-sm max-w-none">
                  {editableMarkdown.split('\n\n').map((para, i) => {
                    if (para.startsWith('# ')) {
                      return <h1 key={i} className="text-lg font-bold text-[#1B2A6B] border-b pb-1">{para.replace('# ', '')}</h1>;
                    }
                    if (para.startsWith('## ')) {
                      return <h2 key={i} className="text-sm font-bold text-teal-800 pt-2 border-b pb-0.5">{para.replace('## ', '')}</h2>;
                    }
                    if (para.startsWith('### ')) {
                      return <h3 key={i} className="text-xs font-bold text-slate-900 pt-1">{para.replace('### ', '')}</h3>;
                    }
                    if (para.startsWith('* ') || para.startsWith('- ')) {
                      return (
                        <ul key={i} className="list-disc pl-5 space-y-1">
                          {para.split('\n').map((li, j) => (
                            <li key={j}>{li.replace(/^[-*]\s*/, '')}</li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={i} className="text-slate-700">{para}</p>;
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab Content 2: TOR OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold text-[#1B2A6B] uppercase font-mono tracking-wider">
                    Core Procurement Information
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Client / Contracting Entity:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {analysisResult.overview.client || (
                          <span className="text-amber-700 italic">Not stated in TOR (Action Required)</span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Assignment Title:</span>
                      <span className="font-semibold text-slate-800">{analysisResult.overview.assignment}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Submission Deadline:</span>
                      <span className="font-bold text-red-700">
                        {analysisResult.overview.deadline || 'To be specified'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold text-[#1B2A6B] uppercase font-mono tracking-wider">
                    Contract & Submission Logistics
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Duration / Timeline:</span>
                      <span className="font-semibold text-slate-800">{analysisResult.overview.duration}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Duty Station / Location:</span>
                      <span className="font-semibold text-slate-800">{analysisResult.overview.location}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Submission Method:</span>
                      <span className="font-semibold text-slate-800">{analysisResult.overview.submissionMethod}</span>
                    </div>
                    {analysisResult.overview.submissionEmail && (
                      <div>
                        <span className="text-slate-500 block text-[11px]">Submission Email:</span>
                        <span className="font-mono text-teal-800 font-bold">{analysisResult.overview.submissionEmail}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 3: KEY SCOPE & DELIVERABLES */}
          {activeTab === 'requirements' && (
            <div className="p-5 space-y-5">
              {/* Objectives */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <h3 className="text-xs font-bold text-[#1B2A6B] uppercase font-mono tracking-wider">
                  Assignment Objectives
                </h3>
                {analysisResult.keyRequirements.objectives.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
                    {analysisResult.keyRequirements.objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">No explicit objectives clause extracted.</p>
                )}
              </div>

              {/* Scope Components */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <h3 className="text-xs font-bold text-[#1B2A6B] uppercase font-mono tracking-wider">
                  Scope of Work Summary
                </h3>
                {analysisResult.keyRequirements.scopeSummary.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
                    {analysisResult.keyRequirements.scopeSummary.map((scope, i) => (
                      <li key={i}>{scope}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">No explicit scope items extracted.</p>
                )}
              </div>

              {/* Deliverables */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <h3 className="text-xs font-bold text-[#1B2A6B] uppercase font-mono tracking-wider">
                  Identified Deliverables Schedule
                </h3>
                {analysisResult.keyRequirements.deliverables.length > 0 ? (
                  <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-700">
                    {analysisResult.keyRequirements.deliverables.map((deliv, i) => (
                      <li key={i} className="font-medium text-slate-900">{deliv}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-xs text-slate-500 italic">No explicit deliverables schedule extracted.</p>
                )}
              </div>

              {/* Out of Scope */}
              {analysisResult.keyRequirements.outOfScope.length > 0 && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200 space-y-2">
                  <h3 className="text-xs font-bold text-red-800 uppercase font-mono tracking-wider">
                    Out of Scope / Explicit Exclusions
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-red-700">
                    {analysisResult.keyRequirements.outOfScope.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Tab Content 4: COMPLIANCE & RISK SNAPSHOT */}
          {activeTab === 'compliance' && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-red-50/70 rounded-lg border border-red-200 space-y-2">
                  <h3 className="text-xs font-bold text-red-800 uppercase font-mono">
                    Mandatory Requirements ({analysisResult.complianceSnapshot.mandatoryRequirements.length})
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-red-900">
                    {analysisResult.complianceSnapshot.mandatoryRequirements.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-amber-50/70 rounded-lg border border-amber-200 space-y-2">
                  <h3 className="text-xs font-bold text-amber-800 uppercase font-mono">
                    User Info / Inputs Required ({analysisResult.complianceSnapshot.userInfoRequired.length})
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-amber-900">
                    {analysisResult.complianceSnapshot.userInfoRequired.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 5: GRANULAR CLAUSES MATRIX */}
          {activeTab === 'sections' && (
            <div className="p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search clauses or requirements..."
                    value={reqSearch}
                    onChange={(e) => setReqSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="flex items-center space-x-1 text-xs">
                  <button
                    onClick={() => setReqFilter('all')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                      reqFilter === 'all' ? 'bg-[#1B2A6B] text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    All ({analysisResult.requirements.length})
                  </button>
                  <button
                    onClick={() => setReqFilter('mandatory')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                      reqFilter === 'mandatory' ? 'bg-red-700 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Mandatory
                  </button>
                  <button
                    onClick={() => setReqFilter('optional')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                      reqFilter === 'optional' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Optional
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#1B2A6B] text-white font-bold text-[11px]">
                    <tr>
                      <th className="p-2 w-12 text-center">#</th>
                      <th className="p-2 w-28">Category</th>
                      <th className="p-2 w-36">Source Section</th>
                      <th className="p-2">Requirement Text</th>
                      <th className="p-2 w-24 text-center">Mandatory</th>
                      <th className="p-2 w-20 text-center">Grounding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredRequirements.map((req, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2 text-center font-mono text-slate-500">{i + 1}</td>
                        <td className="p-2 font-semibold text-teal-800">{req.category || 'General'}</td>
                        <td className="p-2 text-slate-600 font-mono text-[11px]">{req.sourceSection || 'TOR'}</td>
                        <td className="p-2 text-slate-800">{req.requirementText}</td>
                        <td className="p-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              req.mandatory ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {req.mandatory ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <span className="text-[10px] text-emerald-700 font-bold">✓ Verified</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Conversions History */}
      {recentConversions.length > 0 && (
        <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-2xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#1B2A6B] uppercase font-mono tracking-wider flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Recent Document Conversions</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">{recentConversions.length} saved</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentConversions.map((rec) => (
              <div
                key={rec.id}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-all flex flex-col justify-between space-y-2"
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900 truncate" title={rec.fileName}>
                    {rec.fileName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {new Date(rec.convertedAt).toLocaleDateString()} • {rec.pagesProcessed || 1} page(s) • {(rec.charCount / 1000).toFixed(1)}k chars
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <button
                    onClick={() => handleLoadRecentRecord(rec)}
                    className="text-[11px] font-bold text-[#1D8C8C] hover:underline flex items-center space-x-1"
                  >
                    <span>Load & View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => {
                      const cleanName = `${rec.fileName.replace(/\.[^/.]+$/, '')}.md`;
                      const blob = new Blob([rec.markdown], { type: 'text/markdown;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = cleanName;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    }}
                    className="p-1 text-slate-600 hover:text-slate-900 rounded"
                    title="Download .md directly"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
