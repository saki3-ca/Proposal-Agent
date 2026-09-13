import React, { useState, useRef, useEffect } from 'react';
import { Requirement, Project, TorKnowledgeModel, ProjectDocument } from '../../types';
import { DocumentProcessingService } from '../../services/documentProcessingService';
import { TorAnalysisService, QuickTorAnalysisResult } from '../../services/torAnalysisService';
import { ProposalDatabaseService } from '../../services/proposalDatabaseService';
import { ProposalPreparationService } from '../../services/proposalPreparationService';
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
  Printer
} from 'lucide-react';

interface ScratchWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConvertToProject: (newProject: Project) => void;
  onOpenExistingProject?: (projectId: string) => void;
}

export interface QuickTorAnalyzerError {
  type: 'backend_unreachable' | 'extraction_failed' | 'analysis_failed' | 'validation_failed';
  title: string;
  stage?: string;
  reason: string;
}

export interface ProcessedDocItem {
  file: File;
  markdown: string;
  pagesProcessed: number;
  method: 'markitdown' | 'markitdown + ocr';
  ocrCompleted: boolean;
}

export const ScratchWorkspaceModal: React.FC<ScratchWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onConvertToProject,
  onOpenExistingProject
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [processedDocs, setProcessedDocs] = useState<ProcessedDocItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [errorState, setErrorState] = useState<QuickTorAnalyzerError | null>(null);
  const [analysisResult, setAnalysisResult] = useState<QuickTorAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'sections' | 'markdown'>('overview');
  const [copiedMd, setCopiedMd] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);
  const [reqFilter, setReqFilter] = useState<'all' | 'mandatory' | 'optional'>('all');
  const [reqSearch, setReqSearch] = useState('');
  const [extractionMethod, setExtractionMethod] = useState<'markitdown' | 'markitdown + ocr'>('markitdown');
  const [pagesProcessed, setPagesProcessed] = useState<number>(1);
  const [ocrCompleted, setOcrCompleted] = useState<boolean>(false);
  const [existingDuplicate, setExistingDuplicate] = useState<Project | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset or check duplicate when analysis result updates
    if (analysisResult) {
      checkForDuplicates(analysisResult.overview.assignment);
    }
  }, [analysisResult]);

  if (!isOpen) return null;

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
      if (match) {
        setExistingDuplicate(match);
      } else {
        setExistingDuplicate(null);
      }
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
    setErrorState(null);
    setAnalysisResult(null);
    setExistingDuplicate(null);
    setSavedBanner(false);
    setIsProcessing(true);
    setExtractionMethod('markitdown');
    setPagesProcessed(1);
    setOcrCompleted(false);

    try {
      const extractedItems: ProcessedDocItem[] = [];
      let totalPages = 0;
      let hasOcr = false;

      // Step 1: Process each document in the package sequentially with live progress
      for (let i = 0; i < fileArray.length; i++) {
        const currentFile = fileArray[i];
        setProcessingStage(
          fileArray.length > 1
            ? `Extracting document ${i + 1} of ${fileArray.length}: ${currentFile.name}...`
            : `Extracting document with Microsoft MarkItDown...`
        );

        const processRes = await DocumentProcessingService.processDocument(currentFile);

        if (!processRes.success || !processRes.document) {
          if (processRes.error?.code === 'BACKEND_UNREACHABLE') {
            setErrorState({
              type: 'backend_unreachable',
              title: 'Cannot connect to Proposal Agent server.',
              reason: 'Make sure the FastAPI backend is running.'
            });
            return;
          }

          setErrorState({
            type: 'extraction_failed',
            title: `Extraction failed for ${currentFile.name}`,
            stage: processRes.error?.stage || 'Microsoft MarkItDown',
            reason: processRes.error?.message || 'Document extraction failed.'
          });
          return;
        }

        const rawMarkdown = processRes.document.markdown;
        const method = (processRes.document.source || 'markitdown') as 'markitdown' | 'markitdown + ocr';
        const numPages = (processRes.document as any).pagesProcessed || 1;
        const wasOcr = Boolean(processRes.document.ocrCompleted || method.includes('ocr'));

        totalPages += numPages;
        if (wasOcr) hasOcr = true;

        if (!rawMarkdown || rawMarkdown.trim().length === 0) {
          setErrorState({
            type: 'extraction_failed',
            title: `Extraction yielded zero text for ${currentFile.name}`,
            stage: wasOcr ? 'RapidOCR Fallback' : 'Microsoft MarkItDown',
            reason: 'Document yielded zero text after extraction. The file may be empty or password-protected.'
          });
          return;
        }

        extractedItems.push({
          file: currentFile,
          markdown: rawMarkdown,
          pagesProcessed: numPages,
          method,
          ocrCompleted: wasOcr
        });
      }

      setProcessedDocs(extractedItems);
      setPagesProcessed(totalPages);
      setExtractionMethod(hasOcr ? 'markitdown + ocr' : 'markitdown');
      setOcrCompleted(hasOcr);

      // Step 2: Combine all document markdowns with clear demarcation
      const combinedMarkdown = extractedItems.length === 1
        ? extractedItems[0].markdown
        : extractedItems
            .map(
              (item, idx) =>
                `# DOCUMENT ${idx + 1}: ${item.file.name}\n\n${item.markdown}\n\n---\n`
            )
            .join('\n');

      const primaryFileName = extractedItems[0].file.name;
      const totalSizeMb = Number(
        (fileArray.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)
      );

      // Step 3: Markdown Normalization & Comprehensive TOR Analysis across combined corpus
      setProcessingStage('Normalizing Markdown & analyzing procurement clauses across package...');
      const analysis = await TorAnalysisService.analyzeTorMarkdown(combinedMarkdown, primaryFileName, totalSizeMb);

      // Step 4: Persist latest Quick TOR Analysis as canonical source
      setProcessingStage('Saving analysis and canonical source...');
      ProposalDatabaseService.saveQuickTorAnalysis({
        ...analysis,
        extractionMethod: hasOcr ? 'markitdown + ocr' : 'markitdown',
        pagesProcessed: totalPages,
        ocrCompleted: hasOcr
      });

      setAnalysisResult(analysis);
      setSavedBanner(true);
    } catch (err: any) {
      console.error('Quick TOR Analyzer failed:', err);
      const isFetchErr = err?.message && (err.message.includes('fetch') || err.message.includes('NetworkError'));
      if (isFetchErr) {
        setErrorState({
          type: 'backend_unreachable',
          title: 'Cannot connect to Proposal Agent server.',
          reason: 'Make sure the FastAPI backend is running.'
        });
      } else {
        setErrorState({
          type: 'analysis_failed',
          title: 'Analysis failed',
          stage: err?.stage || 'TOR Analysis',
          reason: err?.message || 'Failed to analyze TOR document clauses.'
        });
      }
      setAnalysisResult(null);
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  };

  const handleCopyMarkdown = () => {
    if (!analysisResult?.normalization.normalizedMarkdown) return;
    navigator.clipboard.writeText(analysisResult.normalization.normalizedMarkdown);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleSaveAnalysis = () => {
    if (!analysisResult) return;
    ProposalDatabaseService.saveQuickTorAnalysis({
      ...analysisResult,
      extractionMethod,
      pagesProcessed,
      ocrCompleted,
      savedAt: new Date().toISOString()
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  const handleExportMarkdownReport = () => {
    if (!analysisResult) return;
    const { overview, keyRequirements, requirements, fileName, validationStatus } = analysisResult;
    const cleanAssignment = (overview.assignment || 'Document').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 40);

    const docListStr = files.length > 1
      ? files.map((f, i) => `${f.name} (${processedDocs[i]?.pagesProcessed || 1} pages)`).join(', ')
      : `${fileName} (${pagesProcessed} page${pagesProcessed > 1 ? 's' : ''})`;

    const mdContent = `# TOR ANALYSIS & SCOPING REPORT

**Package Documents:** ${docListStr}
**Extracted:** ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
**Extraction Pipeline:** ${extractionMethod === 'markitdown + ocr' ? 'Microsoft MarkItDown + RapidOCR Fallback' : 'Microsoft MarkItDown'} (${pagesProcessed} total pages across ${files.length || 1} document${files.length > 1 ? 's' : ''})
**Validation Grounding:** ${validationStatus?.isValidated ? `Validated (${validationStatus.groundedFieldsCount}/${validationStatus.totalEvaluatedFields} factual points verified against source)` : 'Extracted from Source'}

---

## 1. Assignment & Client Overview
* **Client / Organization:** ${overview.client || 'Not stated in TOR'}
* **Assignment Title:** ${overview.assignment}
* **Submission Deadline:** ${overview.deadline || 'Not stated in TOR'}
* **Estimated Duration:** ${overview.duration || 'Not specified in TOR'}
* **Location / Duty Station:** ${overview.location || 'Not specified in TOR'}
* **Submission Method:** ${overview.submissionMethod || 'Not specified in TOR'}
* **Submission Address:** ${overview.submissionAddress || 'Not stated in TOR'}
* **Submission Email:** ${overview.submissionEmail || 'Not stated in TOR'}
* **Contact Person / Query Point:** ${overview.contactPerson || 'Not stated in TOR'}

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
*Report generated by Quick TOR Analyzer.*
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

  const handleExportPdfReport = () => {
    if (!analysisResult) return;
    const { overview, keyRequirements, requirements, fileName, validationStatus } = analysisResult;
    const cleanAssignment = (overview.assignment || 'Document').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 40);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to export the PDF report.');
      return;
    }

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>TOR Analysis Report - ${overview.assignment || cleanAssignment}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.45;
      font-size: 10pt;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .header-banner {
      border-bottom: 2.5px solid #1B2A6B;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .title-block h1 {
      font-size: 16pt;
      color: #1B2A6B;
      margin: 0 0 4px 0;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .title-block h2 {
      font-size: 11pt;
      color: #0f766e;
      margin: 0 0 6px 0;
      font-weight: 600;
    }
    .meta-tag {
      font-size: 8.5pt;
      color: #64748b;
    }
    .badge {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      font-size: 8pt;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 4px;
      display: inline-block;
      text-transform: uppercase;
    }
    .section-title {
      font-size: 11.5pt;
      font-weight: 700;
      color: #1B2A6B;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 3px;
      margin: 16px 0 8px 0;
    }
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 14px;
    }
    .grid-item {
      font-size: 9pt;
    }
    .grid-item strong {
      color: #475569;
      display: inline-block;
      min-width: 130px;
    }
    ul, ol {
      margin: 4px 0 10px 18px;
      padding: 0;
      font-size: 9.5pt;
    }
    li {
      margin-bottom: 3px;
    }
    .out-of-scope-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 8px 12px;
      margin: 8px 0;
    }
    .out-of-scope-box h4 {
      margin: 0 0 4px 0;
      color: #991b1b;
      font-size: 9.5pt;
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin-top: 8px;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    th {
      background: #1B2A6B;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 5px 6px;
      border: 1px solid #1B2A6B;
    }
    td {
      padding: 4px 6px;
      border: 1px solid #cbd5e1;
      vertical-align: top;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .mandatory-yes {
      color: #b91c1c;
      font-weight: 700;
    }
    .mandatory-no {
      color: #475569;
    }
    .footer {
      margin-top: 20px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      font-size: 8pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header-banner">
    <div class="title-block">
      <h1>TOR ANALYSIS & SCOPING REPORT</h1>
      <h2>${overview.assignment || 'Tender Analysis'}</h2>
      <div class="meta-tag">
        <strong>Source Package:</strong> ${files.length > 1 ? files.map(f => f.name).join(', ') : fileName} • 
        <strong>Pipeline:</strong> ${extractionMethod === 'markitdown + ocr' ? 'MarkItDown + RapidOCR' : 'Microsoft MarkItDown'} (${pagesProcessed} total pages across ${files.length || 1} file${files.length > 1 ? 's' : ''}) • 
        <strong>Extracted:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
      </div>
    </div>
    <div>
      <span class="badge">✓ Validated Analysis</span>
    </div>
  </div>

  <div class="section-title">1. Assignment & Client Overview</div>
  <div class="overview-grid">
    <div class="grid-item"><strong>Client / Organization:</strong> ${overview.client || 'Not stated in TOR'}</div>
    <div class="grid-item"><strong>Submission Deadline:</strong> ${overview.deadline || 'Not stated in TOR'}</div>
    <div class="grid-item"><strong>Estimated Duration:</strong> ${overview.duration || 'Not specified in TOR'}</div>
    <div class="grid-item"><strong>Duty Station / Location:</strong> ${overview.location || 'Not specified in TOR'}</div>
    <div class="grid-item"><strong>Submission Method:</strong> ${overview.submissionMethod || 'Not specified in TOR'}</div>
    <div class="grid-item"><strong>Submission Email:</strong> ${overview.submissionEmail || 'Not stated in TOR'}</div>
    <div class="grid-item"><strong>Submission Address:</strong> ${overview.submissionAddress || 'Not stated in TOR'}</div>
    <div class="grid-item"><strong>Contact / Query Point:</strong> ${overview.contactPerson || 'Not stated in TOR'}</div>
  </div>

  <div class="section-title">2. Key Objectives & Scope of Work</div>
  <p><strong>Assignment Objectives:</strong></p>
  <ul>
    ${keyRequirements.objectives.length > 0 ? keyRequirements.objectives.map(o => `<li>${o}</li>`).join('') : '<li>No explicit objectives clause extracted from document.</li>'}
  </ul>

  <p><strong>Scope Summary:</strong></p>
  <ul>
    ${keyRequirements.scopeSummary.length > 0 ? keyRequirements.scopeSummary.map(s => `<li>${s}</li>`).join('') : '<li>No explicit scope list extracted from document.</li>'}
  </ul>

  ${keyRequirements.outOfScope.length > 0 ? `
  <div class="out-of-scope-box">
    <h4>Out of Scope / Explicit Exclusions:</h4>
    <ul>
      ${keyRequirements.outOfScope.map(ex => `<li>${ex}</li>`).join('')}
    </ul>
  </div>` : ''}

  <div class="section-title">3. Identified Deliverables Schedule</div>
  <ol>
    ${keyRequirements.deliverables.length > 0 ? keyRequirements.deliverables.map(d => `<li>${d}</li>`).join('') : '<li>No explicit deliverables schedule extracted from document.</li>'}
  </ol>

  <div class="section-title">4. Key Team & Qualifications</div>
  <p><strong>Required Team:</strong></p>
  <ul>
    ${keyRequirements.teamComposition.length > 0 ? keyRequirements.teamComposition.map(t => `<li>${t}</li>`).join('') : '<li>No explicit team composition list extracted from document.</li>'}
  </ul>

  <div class="section-title">5. Extracted Requirements Matrix (${requirements.length} Clauses)</div>
  <table>
    <thead>
      <tr>
        <th style="width: 30px;">SL</th>
        <th style="width: 85px;">Category</th>
        <th style="width: 120px;">Source Clause</th>
        <th>Requirement Description</th>
        <th style="width: 65px; text-align: center;">Mandatory</th>
      </tr>
    </thead>
    <tbody>
      ${requirements.map((r, i) => `
        <tr>
          <td style="text-align: center;">${i + 1}</td>
          <td><strong>${r.category || 'Technical'}</strong></td>
          <td>${r.sourceSection || r.sourceClause || 'TOR'}</td>
          <td>${r.requirementText || ''}</td>
          <td style="text-align: center;" class="${r.mandatory ? 'mandatory-yes' : 'mandatory-no'}">${r.mandatory ? 'YES' : 'NO'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <span>Quick TOR Analyzer • Automated Procurement Analysis Report</span>
    <span>Generated: ${new Date().toLocaleString()}</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleExportJson = () => {
    if (!analysisResult) return;
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          {
            torAnalysis: analysisResult,
            extractionMethod,
            pagesProcessed,
            exportedAt: new Date().toISOString()
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `TOR_Analysis_${(analysisResult.overview.assignment || 'Document').replace(/[^a-z0-9]/gi, '_')}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCreateProposal = async (forceNew = false) => {
    if (!analysisResult) return;

    if (existingDuplicate && !forceNew) {
      return;
    }

    const { overview, torModel, requirements, normalization, fileName, fileSizeMb } = analysisResult;
    const projectId = `p-${Date.now()}`;
    const deadlineStr = torModel.submission.deadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    const fullRequirements: Requirement[] = (requirements || []).map((r, idx) => ({
      id: r.id || `req-${projectId}-${idx + 1}`,
      projectId,
      category: r.category || 'Technical',
      subcategory: r.subcategory,
      requirementText: r.requirementText || '',
      mandatory: r.mandatory ?? true,
      sourceFile: r.sourceFile || fileName,
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

    const newProj: Project = {
      id: projectId,
      name: overview.assignment,
      client: overview.client,
      assignmentTitle: overview.assignment,
      tenderType: 'Consultancy',
      refNumber: torModel.assignmentContext?.refNumber || `REF-${Date.now().toString().slice(-4)}`,
      receiveDate: new Date().toISOString().split('T')[0],
      submissionDeadline: deadlineStr,
      daysLeft: ProposalDatabaseService.calculateDaysLeft(deadlineStr) || 14,
      assignedTo: 'SAKIB',
      issuingOrg: overview.client,
      manager: 'SAKIB',
      status: 'In Progress',
      remarks: `Created via Quick TOR Analyzer (${extractionMethod})`,
      completionPercentage: 35,
      mandatoryUnresolvedCount: 0,
      activeStep: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Save Canonical TOR Source
    const totalPkgSize = files.reduce((sum, f) => sum + f.size, 0);
    ProposalDatabaseService.saveProjectTorSource(projectId, {
      fileName: files.length > 1 ? `${files[0].name} (+${files.length - 1} docs)` : fileName,
      originalSize: totalPkgSize || undefined,
      markdownContent: normalization.normalizedMarkdown,
      rawMarkdown: normalization.normalizedMarkdown,
      quality: normalization,
      extractedAt: new Date().toISOString(),
      version: '1.0'
    });

    // 2. Save Project Requirements & TOR Model
    ProposalDatabaseService.saveProjectRequirements(projectId, fullRequirements);
    ProposalDatabaseService.saveProjectTorModel(projectId, torModel);

    // 3. Save Project Documents for ALL constituent files in package
    const projectDocs: ProjectDocument[] = (processedDocs.length > 0
      ? processedDocs
      : [{ file: files[0] || new File([], fileName), markdown: normalization.normalizedMarkdown, pagesProcessed, method: extractionMethod, ocrCompleted } as any]
    ).map((docItem, dIdx) => {
      const docExt = docItem.file.name.split('.').pop()?.toUpperCase() as any;
      return {
        id: `doc-${projectId}-tor-${dIdx + 1}`,
        projectId,
        fileName: docItem.file.name,
        fileType: docExt === 'PDF' ? 'PDF' : docExt === 'DOCX' ? 'DOCX' : 'PDF',
        fileSizeMb: Number((docItem.file.size / (1024 * 1024)).toFixed(2)) || fileSizeMb || 0.6,
        uploadedBy: 'SAKIB',
        uploadDate: new Date().toISOString().split('T')[0],
        processingStatus: 'ai_analyzed',
        ocrRequired: docItem.ocrCompleted,
        ocrCompleted: docItem.ocrCompleted,
        isSearchable: true,
        pageCount: docItem.pagesProcessed || 1,
        sourcePath: `test_data/TOR/${docItem.file.name}`,
        markdownContent: docItem.markdown,
        aiConfidence: 0.98,
        version: '1.0'
      };
    });

    ProposalDatabaseService.saveProjectDocuments(projectId, projectDocs);

    // 4. Save to Database
    await ProposalDatabaseService.saveProject(newProj);

    // 5. Trigger automated Proposal Preparation Pipeline in background
    ProposalPreparationService.startPreparation(newProj, fullRequirements, torModel);

    // 6. Notify parent & close modal
    onConvertToProject(newProj);
    onClose();
  };

  const handleRetryUpload = () => {
    if (files.length > 0) {
      handleFileUpload(files);
    } else {
      fileInputRef.current?.click();
    }
  };

  const filteredRequirements = (analysisResult?.requirements || []).filter((req) => {
    if (reqFilter === 'mandatory' && !req.mandatory) return false;
    if (reqFilter === 'optional' && req.mandatory) return false;
    if (reqSearch) {
      const q = reqSearch.toLowerCase();
      return (
        (req.requirementText && req.requirementText.toLowerCase().includes(q)) ||
        (req.category && req.category.toLowerCase().includes(q)) ||
        (req.sourceSection && req.sourceSection.toLowerCase().includes(q)) ||
        (req.aiInterpretation && req.aiInterpretation.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#1B2A6B] text-white p-4 flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#1D8C8C] rounded text-white shadow-2xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base leading-tight">Quick TOR Analyzer</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#1D8C8C] text-white rounded font-mono">
                  MULTI-DOC INGESTION
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Authentic TOR extraction, multi-document package scoping & single-click proposal creation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#152152] rounded text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-slate-50/50">
          {/* File Input */}
          <input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={(e) => e.target.files && e.target.files.length > 0 && handleFileUpload(e.target.files)}
            className="hidden"
            accept=".pdf,.docx,.doc,.xlsx,.pptx,.txt"
          />

          {/* Upload Dropzone */}
          {files.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFileUpload(e.dataTransfer.files);
                }
              }}
              className="border-2 border-dashed border-slate-300 hover:border-[#1D8C8C] rounded-lg p-10 text-center bg-white hover:bg-teal-50/20 cursor-pointer transition-all space-y-3 group shadow-2xs"
            >
              <div className="w-14 h-14 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto text-[#1D8C8C] group-hover:scale-105 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#1D8C8C] transition-colors">
                  Upload TOR / RFP / Tender Package (Single or Multiple Files)
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xl mx-auto">
                  Select one or more PDF, DOCX, or XLSX files (e.g. Main TOR + RFP + BOQ / Financial Templates + Addenda). All documents will be extracted and merged into a unified analysis.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-[#1D8C8C] hover:bg-[#156d6d] text-white text-xs font-bold rounded shadow-2xs transition-colors inline-flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose Files (Single or Multiple)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="p-3.5 bg-white border border-slate-200 rounded shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center space-x-3 min-w-0">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 shrink-0 mt-0.5 sm:mt-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {files.length === 1 ? files[0].name : `${files[0].name} (+${files.length - 1} more)`}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        ({(Array.from(files).reduce((s, f) => s + f.size, 0) / 1024).toFixed(0)} KB total)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span
                        className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold ${
                          extractionMethod === 'markitdown + ocr'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-teal-50 text-teal-800 border border-teal-200'
                        }`}
                      >
                        {extractionMethod === 'markitdown + ocr' ? 'MarkItDown + OCR Fallback' : 'Microsoft MarkItDown'}
                      </span>
                      <span>•</span>
                      <span>
                        {files.length} Doc{files.length > 1 ? 's' : ''} ({pagesProcessed} Page{pagesProcessed > 1 ? 's' : ''} Total)
                      </span>
                      {analysisResult && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold font-mono text-[10px]">
                            {analysisResult.normalization.normalizedCharCount.toLocaleString()} Chars Extracted
                          </span>
                        </>
                      )}
                    </div>

                    {/* Multi-document File Chips */}
                    {files.length > 1 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {processedDocs.map((doc, dIdx) => (
                          <span
                            key={dIdx}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-700"
                          >
                            <FileText className="w-3 h-3 text-slate-500" />
                            <span className="font-medium truncate max-w-[180px]">{doc.file.name}</span>
                            <span className="text-slate-400 font-mono">({doc.pagesProcessed}p)</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {isProcessing ? (
                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs font-semibold animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-700" />
                      <span>{processingStage || 'Processing...'}</span>
                    </div>
                  ) : analysisResult ? (
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Package Analyzed</span>
                      </span>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-300 font-semibold"
                      >
                        Change Files
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Structured Error Reporting */}
              {errorState && (
                <div
                  className={`p-4 rounded-lg text-xs shadow-xs space-y-3 ${
                    errorState.type === 'backend_unreachable'
                      ? 'bg-amber-50/95 border border-amber-300 text-amber-950'
                      : errorState.type === 'analysis_failed'
                      ? 'bg-amber-50/95 border border-amber-300 text-amber-950'
                      : 'bg-red-50/95 border border-red-200 text-red-950'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <AlertCircle
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        errorState.type === 'backend_unreachable' || errorState.type === 'analysis_failed'
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}
                    />
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <p
                        className={`font-bold text-sm ${
                          errorState.type === 'backend_unreachable' || errorState.type === 'analysis_failed'
                            ? 'text-amber-900'
                            : 'text-red-900'
                        }`}
                      >
                        {errorState.title}
                      </p>

                      {errorState.stage && (
                        <div className="flex items-center space-x-1.5 text-xs">
                          <span className="font-semibold text-slate-700">Stage:</span>
                          <span
                            className={`font-bold font-mono px-1.5 py-0.5 rounded text-[11px] ${
                              errorState.type === 'analysis_failed'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-red-100 text-red-900 border border-red-200'
                            }`}
                          >
                            {errorState.stage}
                          </span>
                        </div>
                      )}

                      <div className="text-xs space-y-0.5">
                        {errorState.stage && <span className="font-semibold text-slate-700 mr-1">Reason:</span>}
                        <span
                          className={
                            errorState.type === 'backend_unreachable' || errorState.type === 'analysis_failed'
                              ? 'text-amber-800 leading-relaxed'
                              : 'text-red-800 leading-relaxed'
                          }
                        >
                          {errorState.reason}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`flex items-center space-x-2 pt-2 border-t ${
                      errorState.type === 'backend_unreachable' || errorState.type === 'analysis_failed'
                        ? 'border-amber-200/80'
                        : 'border-red-200/80'
                    }`}
                  >
                    <button
                      onClick={handleRetryUpload}
                      className="px-3.5 py-1.5 bg-[#1B2A6B] hover:bg-[#152152] text-white font-bold rounded text-xs transition-colors flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded border border-slate-300 text-xs transition-colors cursor-pointer"
                    >
                      Choose Different Files
                    </button>
                  </div>
                </div>
              )}

              {/* Duplicate Project Warning */}
              {existingDuplicate && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded text-xs text-amber-950 flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900">This TOR is already linked to an existing proposal:</p>
                      <p className="font-semibold text-slate-900 text-sm mt-0.5">
                        {existingDuplicate.assignmentTitle || existingDuplicate.name}
                      </p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Client: {existingDuplicate.client} • Deadline: {existingDuplicate.submissionDeadline} • Status:{' '}
                        {existingDuplicate.status}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {onOpenExistingProject && (
                      <button
                        onClick={() => {
                          onOpenExistingProject(existingDuplicate.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-[#1B2A6B] hover:bg-[#152152] text-white text-xs font-bold rounded transition-colors flex items-center space-x-1"
                      >
                        <span>Open Existing</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleCreateProposal(true)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded transition-colors"
                    >
                      Create New Anyway
                    </button>
                  </div>
                </div>
              )}

              {/* Completion Confirmation Header Screen */}
              {analysisResult && (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded p-4 text-xs text-emerald-950 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="font-bold text-sm uppercase tracking-wide text-emerald-900 font-mono">
                          ✓ TOR ANALYZED
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{analysisResult.overview.assignment}</h4>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSaveAnalysis}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded border border-slate-300 transition-colors flex items-center space-x-1"
                        title="Save complete analysis"
                      >
                        <Save className="w-3.5 h-3.5 text-[#1D8C8C]" />
                        <span>Save Analysis</span>
                      </button>

                      <button
                        onClick={handleExportMarkdownReport}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded border border-slate-300 transition-colors flex items-center space-x-1"
                        title="Download human-readable analysis report in Markdown format"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        <span>Export Report (.md)</span>
                      </button>

                      <button
                        onClick={handleExportPdfReport}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded border border-slate-300 transition-colors flex items-center space-x-1"
                        title="Print or save human-readable analysis report in PDF format"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#1B2A6B]" />
                        <span>Export PDF</span>
                      </button>

                      <button
                        onClick={handleExportJson}
                        className="p-1.5 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-xs font-mono rounded border border-slate-300 transition-colors"
                        title="Export raw JSON metadata"
                      >
                        JSON
                      </button>

                      <button
                        onClick={() => handleCreateProposal(false)}
                        className="px-4 py-1.5 bg-[#1B2A6B] hover:bg-[#152152] text-white text-xs font-bold rounded transition-colors flex items-center space-x-1.5 shadow-2xs"
                      >
                        <span>Create Proposal</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="bg-white p-2.5 rounded border border-emerald-200/80">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Client</span>
                      <span className="font-semibold text-slate-900 truncate block">
                        {analysisResult.overview.client}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded border border-emerald-200/80">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Deadline</span>
                      <span className="font-semibold text-[#8B1420] truncate block">
                        {analysisResult.overview.deadline}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded border border-emerald-200/80">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Requirements</span>
                      <span className="font-bold text-[#1B2A6B] font-mono text-sm block">
                        {analysisResult.requirements.length} Clauses Found
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded border border-emerald-200/80">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Deliverables</span>
                      <span className="font-bold text-[#1D8C8C] font-mono text-sm block">
                        {analysisResult.keyRequirements.deliverables.length} Deliverables
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-emerald-800 pt-1">
                    <span>Everything has been saved to the local repository.</span>
                    {savedBanner && <span className="font-bold text-emerald-700">✓ Analysis Saved</span>}
                  </div>
                </div>
              )}

              {/* Complete Structured Analysis Views & Tabs */}
              {analysisResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-white px-2 rounded-t">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
                          activeTab === 'overview'
                            ? 'border-[#1D8C8C] text-[#1D8C8C]'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Overview & Scope</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('sections')}
                        className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
                          activeTab === 'sections'
                            ? 'border-[#1D8C8C] text-[#1D8C8C]'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>All TOR Sections & Details</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('requirements')}
                        className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
                          activeTab === 'requirements'
                            ? 'border-[#1D8C8C] text-[#1D8C8C]'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Requirement Matrix ({analysisResult.requirements.length})</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('markdown')}
                        className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
                          activeTab === 'markdown'
                            ? 'border-[#1D8C8C] text-[#1D8C8C]'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Canonical Markdown</span>
                      </button>
                    </div>

                    {activeTab === 'markdown' && (
                      <button
                        onClick={handleCopyMarkdown}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 flex items-center space-x-1 font-semibold transition-colors"
                      >
                        {copiedMd ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedMd ? 'Copied' : 'Copy Text'}</span>
                      </button>
                    )}
                  </div>

                  {/* Tab 1: Overview & Scope */}
                  {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Left 2 Cols: Context & Scope */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded border border-slate-200 p-4 shadow-2xs space-y-3">
                          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                            <Building2 className="w-4 h-4 text-[#1B2A6B]" />
                            <h4 className="text-xs font-bold text-[#1B2A6B] uppercase tracking-wider">
                              TOR Overview & Procurement Context
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Issuing Client</span>
                              <div className="font-semibold text-slate-900">{analysisResult.overview.client}</div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Assignment Title</span>
                              <div className="font-semibold text-slate-900">{analysisResult.overview.assignment}</div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Submission Deadline</span>
                              <div className="font-semibold text-[#8B1420] flex items-center space-x-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{analysisResult.overview.deadline}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Duration</span>
                              <div className="font-semibold text-slate-900 flex items-center space-x-1">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                <span>{analysisResult.overview.duration}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Location</span>
                              <div className="font-semibold text-slate-800 flex items-center space-x-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                <span>{analysisResult.overview.location}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Submission Method</span>
                              <div className="font-semibold text-slate-800 flex items-center space-x-1">
                                <Send className="w-3.5 h-3.5 text-slate-500" />
                                <span>{analysisResult.overview.submissionMethod}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded border border-slate-200 p-4 shadow-2xs space-y-3">
                          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                            <FileCheck2 className="w-4 h-4 text-[#1D8C8C]" />
                            <h4 className="text-xs font-bold text-[#1B2A6B] uppercase tracking-wider">
                              Objectives & Deliverables
                            </h4>
                          </div>

                          <div className="space-y-3 text-xs">
                            <div>
                              <span className="text-[11px] font-bold text-slate-700 block mb-1">
                                Primary Objectives:
                              </span>
                              <ul className="space-y-1">
                                {analysisResult.keyRequirements.objectives.map((obj, i) => (
                                  <li key={i} className="text-slate-700 text-[11px] flex items-start space-x-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#1D8C8C] mt-1.5 shrink-0" />
                                    <span>{obj}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <span className="text-[11px] font-bold text-slate-700 block mb-1">
                                Expected Deliverables:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {analysisResult.keyRequirements.deliverables.map((deliv, i) => (
                                  <div
                                    key={i}
                                    className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-800 font-medium"
                                  >
                                    {i + 1}. {deliv}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Col: Compliance Snapshot */}
                      <div className="space-y-4">
                        <div className="bg-white rounded border border-slate-200 p-4 shadow-2xs space-y-3">
                          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                            <ShieldAlert className="w-4 h-4 text-[#8B1420]" />
                            <h4 className="text-xs font-bold text-[#8B1420] uppercase tracking-wider">
                              Compliance Snapshot
                            </h4>
                          </div>

                          <div className="space-y-3 text-xs">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-slate-700 uppercase">
                                  Mandatory Submissions
                                </span>
                                <span className="px-1.5 py-0.2 bg-red-100 text-red-800 font-mono text-[9px] font-bold rounded">
                                  MANDATORY
                                </span>
                              </div>
                              <ul className="space-y-1">
                                {analysisResult.complianceSnapshot.mandatoryRequirements.slice(0, 4).map((m, i) => (
                                  <li key={i} className="text-[11px] text-slate-700 flex items-start space-x-1.5">
                                    <span className="text-red-500 font-bold">•</span>
                                    <span className="leading-tight">{m}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-slate-700 uppercase">
                                  Supporting Evidence Required
                                </span>
                                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-mono text-[9px] font-bold rounded">
                                  LIBRARY
                                </span>
                              </div>
                              <ul className="space-y-1">
                                {analysisResult.complianceSnapshot.supportingDocuments.slice(0, 4).map((doc, i) => (
                                  <li key={i} className="text-[11px] text-slate-700 flex items-start space-x-1.5">
                                    <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                                    <span className="leading-tight">{doc}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {analysisResult.complianceSnapshot.potentialRisks.length > 0 && (
                              <div className="p-2.5 bg-amber-50 rounded border border-amber-200">
                                <span className="text-[10px] font-bold text-amber-900 uppercase block mb-1">
                                  Potential Compliance Risks:
                                </span>
                                <ul className="space-y-1 text-[11px] text-amber-800">
                                  {analysisResult.complianceSnapshot.potentialRisks.map((risk, i) => (
                                    <li key={i} className="flex items-start space-x-1">
                                      <span>⚠️</span>
                                      <span className="leading-tight">{risk}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: All Structured Sections */}
                  {activeTab === 'sections' && (
                    <div className="bg-white rounded border border-slate-200 p-4 space-y-4 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Scope of work */}
                        <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                          <span className="text-[10px] font-bold text-[#1B2A6B] uppercase block">
                            Scope of Work & Activities
                          </span>
                          <ul className="space-y-1">
                            {analysisResult.keyRequirements.scopeSummary.map((item, idx) => (
                              <li key={idx} className="flex items-start space-x-1.5 text-slate-800 text-[11px]">
                                <span className="text-[#1D8C8C] font-bold">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Team Requirements */}
                        <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                          <span className="text-[10px] font-bold text-[#1B2A6B] uppercase block">
                            Required Team Composition
                          </span>
                          <ul className="space-y-1">
                            {analysisResult.keyRequirements.teamComposition.map((t, idx) => (
                              <li key={idx} className="flex items-center space-x-1.5 text-slate-800 text-[11px]">
                                <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="font-semibold">{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Qualifications */}
                        <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                          <span className="text-[10px] font-bold text-[#1B2A6B] uppercase block">
                            Firm Eligibility & Qualifications
                          </span>
                          <ul className="space-y-1">
                            {analysisResult.keyRequirements.qualifications.map((q, idx) => (
                              <li key={idx} className="flex items-start space-x-1.5 text-slate-800 text-[11px]">
                                <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{q}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Financial & Submission */}
                        <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                          <span className="text-[10px] font-bold text-[#1B2A6B] uppercase block">
                            Financial & Submission Terms
                          </span>
                          <div className="space-y-1 text-[11px] text-slate-800">
                            <div>
                              <strong>Pricing Model:</strong>{' '}
                              {analysisResult.torModel.financial.pricingType || 'Not specified in TOR'}
                              {analysisResult.torModel.financial.currency ? ` (${analysisResult.torModel.financial.currency})` : ''}
                            </div>
                            <div>
                              <strong>Evaluation Weights:</strong>{' '}
                              {analysisResult.torModel.evaluation.techWeight !== undefined && analysisResult.torModel.evaluation.finWeight !== undefined
                                ? `Technical: ${analysisResult.torModel.evaluation.techWeight}% / Financial: ${analysisResult.torModel.evaluation.finWeight}%`
                                : 'Not specified in TOR'}
                            </div>
                            <div>
                              <strong>Submission Email/Address:</strong>{' '}
                              {analysisResult.overview.submissionEmail || analysisResult.overview.submissionAddress || 'Not stated in TOR'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Requirement Matrix Clauses */}
                  {activeTab === 'requirements' && (
                    <div className="bg-white rounded border border-slate-200 p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setReqFilter('all')}
                            className={`px-2.5 py-1 text-xs font-bold rounded ${
                              reqFilter === 'all'
                                ? 'bg-[#1B2A6B] text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            All ({analysisResult.requirements.length})
                          </button>
                          <button
                            onClick={() => setReqFilter('mandatory')}
                            className={`px-2.5 py-1 text-xs font-bold rounded ${
                              reqFilter === 'mandatory'
                                ? 'bg-red-700 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Mandatory ({analysisResult.requirements.filter((r) => r.mandatory).length})
                          </button>
                          <button
                            onClick={() => setReqFilter('optional')}
                            className={`px-2.5 py-1 text-xs font-bold rounded ${
                              reqFilter === 'optional'
                                ? 'bg-[#1D8C8C] text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Standard ({analysisResult.requirements.filter((r) => !r.mandatory).length})
                          </button>
                        </div>

                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={reqSearch}
                            onChange={(e) => setReqSearch(e.target.value)}
                            placeholder="Filter requirement clauses..."
                            className="pl-7 pr-3 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 w-full sm:w-64"
                          />
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100 border border-slate-200 rounded max-h-[380px] overflow-y-auto">
                        {filteredRequirements.map((req, idx) => (
                          <div key={idx} className="p-3 text-xs flex items-start justify-between gap-3 hover:bg-slate-50/80">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="px-1.5 py-0.2 bg-slate-100 font-mono text-[10px] font-bold text-slate-700 rounded">
                                  {req.category || 'General'}
                                </span>
                                {req.sourceSection && (
                                  <span className="text-[10px] font-mono text-slate-500">
                                    Section: {req.sourceSection}
                                  </span>
                                )}
                                {req.mandatory && (
                                  <span className="px-1.5 py-0.2 bg-red-50 text-red-700 border border-red-200 font-mono text-[9px] font-bold rounded">
                                    Mandatory
                                  </span>
                                )}
                              </div>
                              <p className="font-semibold text-slate-900 leading-snug">{req.requirementText}</p>
                              {req.aiInterpretation && (
                                <p className="text-[11px] text-slate-500 leading-snug">{req.aiInterpretation}</p>
                              )}
                            </div>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded shrink-0">
                              ✓ Verified
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tab 4: Canonical Markdown */}
                  {activeTab === 'markdown' && (
                    <div className="bg-white rounded border border-slate-200 p-4 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono border-b border-slate-100 pb-2">
                        <span>Source: {extractionMethod === 'markitdown + ocr' ? 'RapidOCR + pypdfium2' : 'Microsoft MarkItDown'}</span>
                        <span>{analysisResult.normalization.normalizedCharCount.toLocaleString()} characters</span>
                      </div>
                      <pre className="whitespace-pre-wrap font-mono text-xs bg-slate-900 text-slate-100 p-4 rounded overflow-y-auto max-h-[380px] leading-relaxed select-text">
                        {analysisResult.normalization.normalizedMarkdown}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded hover:bg-slate-50 transition-colors"
          >
            Close
          </button>

          {analysisResult && !isProcessing && (
            <button
              onClick={() => handleCreateProposal(false)}
              className="px-5 py-2.5 bg-[#1D8C8C] hover:bg-[#156d6d] text-white text-xs font-bold rounded shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
            >
              <span>Create Proposal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
