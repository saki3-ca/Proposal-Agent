import React, { useState, useEffect } from 'react';
import {
  ProposalDraft,
  ProposalDraftSection,
  ProposalContentBlock,
  ContentBlockType,
  ProposalDraftVersion
} from '../../types';
import { ProposalDraftingService } from '../../services/proposalDraftingService';
import { ProposalDraftContextService } from '../../services/proposalDraftContextService';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ShieldCheck,
  History,
  Edit3,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Search,
  BookOpen,
  Eye,
  Copy,
  Download,
  Share2,
  Maximize2,
  Minimize2,
  CheckCheck,
  FileDown,
  Clock,
  Layers,
  Zap,
  HelpCircle,
  FolderLock,
  Table as TableIcon,
  Info,
  ListOrdered
} from 'lucide-react';

interface ProposalDraftWorkbenchProps {
  projectId: string;
}

export const ProposalDraftWorkbench: React.FC<ProposalDraftWorkbenchProps> = ({ projectId }) => {
  const [draft, setDraft] = useState<ProposalDraft | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isDraftingSection, setIsDraftingSection] = useState(false);
  const [isDraftingAll, setIsDraftingAll] = useState(false);
  const [draftingProgressText, setDraftingProgressText] = useState<string>('');

  // View Mode: 'studio' (Focused Section Editor) vs 'document' (Full Continuous Proposal View)
  const [viewMode, setViewMode] = useState<'studio' | 'document'>('studio');

  // Block editing state
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingBlockContent, setEditingBlockContent] = useState<string>('');

  // Right Rail State
  const [showRightRail, setShowRightRail] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState<'evidence' | 'requirements' | 'gaps'>('evidence');

  // Search in outline
  const [outlineSearch, setOutlineSearch] = useState('');

  // Version History Modal
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versions, setVersions] = useState<ProposalDraftVersion[]>([]);

  // Add block state
  const [showAddBlockMenu, setShowAddBlockMenu] = useState(false);
  const [newBlockType, setNewBlockType] = useState<ContentBlockType>('PARAGRAPH');
  const [newBlockContent, setNewBlockContent] = useState('');

  // Quick fill placeholder popover
  const [fillingPlaceholderBlockId, setFillingPlaceholderBlockId] = useState<string | null>(null);
  const [placeholderFillValue, setPlaceholderFillValue] = useState<string>('');

  // Copy notification banner
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Initialize or fetch draft
  useEffect(() => {
    let loaded = ProposalDraftingService.getProposalDraft(projectId);
    if (!loaded || !loaded.sections || loaded.sections.length === 0) {
      loaded = ProposalDraftingService.initializeDraftFromPlan(projectId);
    }
    setDraft(loaded);
    if (loaded && loaded.sections.length > 0) {
      setSelectedSectionId(loaded.sections[0].id);
    }
  }, [projectId]);

  if (!draft) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Preparing Proposal Document Studio</h3>
        <p className="text-xs text-slate-500 mt-1.5">Organizing TOR specifications, requirements, and compliance structures...</p>
      </div>
    );
  }

  const activeSectionIndex = draft.sections.findIndex((s) => s.id === selectedSectionId || s.sectionNumber === selectedSectionId);
  const activeSection = activeSectionIndex >= 0 ? draft.sections[activeSectionIndex] : draft.sections[0];
  const contextPkg = activeSection ? ProposalDraftContextService.buildSectionDraftContext(projectId, activeSection.id) : null;

  // Filtered outline sections
  const filteredSections = draft.sections.filter((s) => {
    if (!outlineSearch.trim()) return true;
    const query = outlineSearch.toLowerCase();
    return s.title.toLowerCase().includes(query) || String(s.sectionNumber).toLowerCase().includes(query);
  });

  // Approved count
  const approvedSectionsCount = draft.sections.filter((s) => s.status === 'APPROVED').length;
  const draftedSectionsCount = draft.sections.filter((s) => s.status === 'DRAFTED' || s.status === 'APPROVED').length;

  // --- Handlers ---
  const handleDraftCurrentSection = async () => {
    if (!activeSection) return;
    setIsDraftingSection(true);
    try {
      const res = await ProposalDraftingService.draftSection(projectId, activeSection.id);
      setDraft(res.draft);
    } catch (e: any) {
      alert(`Drafting error: ${e?.message || e}`);
    } finally {
      setIsDraftingSection(false);
    }
  };

  const handleDraftEntireProposal = async () => {
    setIsDraftingAll(true);
    setDraftingProgressText('Starting AI generation pipeline...');
    try {
      // Loop through sequentially with live progress update
      let currentDraft = ProposalDraftingService.getProposalDraft(projectId) || ProposalDraftingService.initializeDraftFromPlan(projectId);
      const total = currentDraft.sections.length;

      const execSummary = currentDraft.sections.find((s) => s.title.toLowerCase().includes('executive summary'));
      const sectionsToDraft = currentDraft.sections.filter((s) => s.id !== execSummary?.id && s.status !== 'APPROVED');

      let currentStep = 1;
      for (const sec of sectionsToDraft) {
        setDraftingProgressText(`Drafting (${currentStep++}/${total}): ${sec.title}...`);
        try {
          const res = await ProposalDraftingService.draftSection(projectId, sec.id);
          setDraft({ ...res.draft });
        } catch (secErr: any) {
          console.warn(`Error drafting section ${sec.title}:`, secErr);
        }
      }

      if (execSummary && execSummary.status !== 'APPROVED') {
        setDraftingProgressText(`Finalizing Executive Summary (${total}/${total})...`);
        try {
          const res = await ProposalDraftingService.draftSection(projectId, execSummary.id);
          setDraft({ ...res.draft });
        } catch (execErr: any) {
          console.warn(`Error drafting executive summary:`, execErr);
        }
      }

      const finalized = ProposalDraftingService.getProposalDraft(projectId);
      if (finalized) setDraft(finalized);
    } catch (e: any) {
      console.error('Proposal batch drafting error:', e);
      alert(`Proposal drafting notice: ${e?.message || e}`);
    } finally {
      setIsDraftingAll(false);
      setDraftingProgressText('');
    }
  };

  const handleApproveSection = () => {
    if (!activeSection) return;
    const updated = ProposalDraftingService.approveSection(projectId, activeSection.id);
    setDraft(updated);
  };

  const handleSaveBlockEdit = (blockId: string) => {
    if (!activeSection) return;
    const updated = ProposalDraftingService.updateBlock(projectId, activeSection.id, blockId, editingBlockContent);
    setDraft(updated);
    setEditingBlockId(null);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!activeSection) return;
    const updated = ProposalDraftingService.deleteBlock(projectId, activeSection.id, blockId);
    setDraft(updated);
  };

  const handleAddBlock = () => {
    if (!activeSection || !newBlockContent.trim()) return;
    const updated = ProposalDraftingService.addBlock(projectId, activeSection.id, newBlockType, newBlockContent.trim());
    setDraft(updated);
    setNewBlockContent('');
    setShowAddBlockMenu(false);
  };

  const handleOpenVersions = () => {
    setVersions(ProposalDraftingService.getVersions(projectId));
    setShowVersionHistory(true);
  };

  const handleRestoreVersion = (versionId: string) => {
    if (confirm('Restore this prior proposal snapshot? Current unsaved edits will be superseded.')) {
      const restored = ProposalDraftingService.restoreVersion(projectId, versionId);
      setDraft(restored);
      setShowVersionHistory(false);
    }
  };

  const handleFillPlaceholder = (blockId: string, currentContent: string) => {
    setFillingPlaceholderBlockId(blockId);
    // Extract default text or placeholder label
    const match = currentContent.match(/\[TO BE PROVIDED\s*[-—:]?\s*(.*?)\]/i);
    setPlaceholderFillValue(match ? match[1].trim() : '');
  };

  const handleSavePlaceholderValue = (blockId: string, originalContent: string) => {
    if (!activeSection || !placeholderFillValue.trim()) {
      setFillingPlaceholderBlockId(null);
      return;
    }
    const newContent = originalContent.replace(/\[TO BE PROVIDED\s*[-—:]?\s*.*?\]/i, placeholderFillValue.trim());
    const updated = ProposalDraftingService.updateBlock(projectId, activeSection.id, blockId, newContent);
    setDraft(updated);
    setFillingPlaceholderBlockId(null);
    setPlaceholderFillValue('');
  };

  const handleInsertEvidenceFact = (factText: string) => {
    if (!activeSection) return;
    const updated = ProposalDraftingService.addBlock(projectId, activeSection.id, 'PARAGRAPH', factText);
    setDraft(updated);
  };

  const handleCopyToClipboard = () => {
    if (!draft) return;
    const fullText = draft.sections
      .map((sec) => `## ${sec.sectionNumber ? sec.sectionNumber + '. ' : ''}${sec.title}\n\n` + sec.content.map((b) => b.content).join('\n\n'))
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(fullText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  const navigateSection = (direction: 'prev' | 'next') => {
    if (!draft || activeSectionIndex < 0) return;
    const nextIdx = direction === 'next' ? activeSectionIndex + 1 : activeSectionIndex - 1;
    if (nextIdx >= 0 && nextIdx < draft.sections.length) {
      setSelectedSectionId(draft.sections[nextIdx].id);
    }
  };

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-12">
      {/* 1. Sleek Executive Studio Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5 flex-wrap">
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Technical Proposal Studio
              </span>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {draft.title}
              </h1>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-500 pt-0.5">
              <span>Client: <strong className="text-slate-800 font-semibold">{draft.clientName || 'Target Client'}</strong></span>
              <span>•</span>
              <span>Version: <strong className="text-slate-800 font-semibold">{draft.version}.0</strong></span>
              <span>•</span>
              <span className="text-emerald-700 font-medium">{draftedSectionsCount} of {draft.sections.length} Sections Drafted</span>
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex items-center space-x-2.5 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setViewMode('studio')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === 'studio'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Section Editor</span>
              </button>
              <button
                onClick={() => setViewMode('document')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === 'document'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Full Read-Through</span>
              </button>
            </div>

            <button
              onClick={handleOpenVersions}
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-2xs"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Versions</span>
            </button>

            <button
              onClick={handleDraftEntireProposal}
              disabled={isDraftingAll}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isDraftingAll ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Drafting Entire Proposal...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>✨ Draft Entire Proposal (All 18 Sections)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Generation Progress Banner */}
        {isDraftingAll && (
          <div className="mt-4 p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 text-xs text-indigo-900 animate-pulse">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
              <span className="font-semibold">{draftingProgressText || 'Generating full tender proposal with AI...'}</span>
            </div>
            <span className="font-mono text-[11px] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">
              Autonomous Batch Generation
            </span>
          </div>
        )}

        {/* Readiness Quality Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 mt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proposal Readiness</span>
            <div className="text-lg font-extrabold text-indigo-600 mt-0.5">{draft.overallCompletenessScore}%</div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${draft.overallCompletenessScore}%` }}></div>
            </div>
          </div>

          <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Requirement Coverage</span>
            <div className="text-lg font-extrabold text-emerald-600 mt-0.5">{draft.requirementCoverageScore}%</div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${draft.requirementCoverageScore}%` }}></div>
            </div>
          </div>

          <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Evidence Backing</span>
            <div className="text-lg font-extrabold text-blue-600 mt-0.5">{draft.evidenceCoverageScore}%</div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${draft.evidenceCoverageScore}%` }}></div>
            </div>
          </div>

          <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Placeholders</span>
            <div className={`text-lg font-extrabold mt-0.5 ${draft.placeholderCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
              {draft.placeholderCount}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Missing data tags</span>
          </div>

          <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Evidence Gaps</span>
            <div className={`text-lg font-extrabold mt-0.5 ${draft.evidenceGapCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
              {draft.evidenceGapCount}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Unmapped clauses</span>
          </div>

          <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approved Sections</span>
            <div className="text-lg font-extrabold text-slate-900 mt-0.5">
              {approvedSectionsCount} <span className="text-xs font-normal text-slate-400">/ {draft.sections.length}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Ready for submission</span>
          </div>
        </div>
      </div>

      {/* 2. MODE A: CONTINUOUS FULL PROPOSAL READ-THROUGH */}
      {viewMode === 'document' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-bold text-slate-800">Complete Proposal Continuous Read-Through</span>
              <span className="text-xs text-slate-500 font-medium">({draft.sections.length} sections compiled)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyToClipboard}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
              >
                {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNotification ? 'Copied to Clipboard!' : 'Copy Proposal Text'}</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export / Print</span>
              </button>
            </div>
          </div>

          {/* Render Full Continuous Paper */}
          <div className="space-y-8">
            {draft.sections.map((sec, sIdx) => (
              <div key={sec.id} className="doc-page rounded-2xl p-8 sm:p-12 space-y-6 max-w-4xl mx-auto">
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 font-mono">
                      {sec.sectionNumber ? `Section ${sec.sectionNumber}` : `Section ${sIdx + 1}`}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">{sec.title}</h2>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    sec.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {sec.status}
                  </span>
                </div>

                <div className="space-y-4 text-slate-800 leading-relaxed text-sm">
                  {sec.content.length === 0 ? (
                    <p className="text-slate-400 italic py-4">Section has not been drafted yet.</p>
                  ) : (
                    sec.content.map((block) => {
                      if (block.type === 'HEADING') {
                        return (
                          <h3 key={block.id} className="text-base font-bold text-slate-900 pt-2 tracking-tight">
                            {block.content}
                          </h3>
                        );
                      }
                      if (block.type === 'BULLET_LIST') {
                        if (block.items && block.items.length > 0) {
                          return (
                            <ul key={block.id} className="space-y-1.5 pl-2 my-1.5">
                              {block.items.map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-800 leading-relaxed">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0"></span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          );
                        }
                        return (
                          <div key={block.id} className="flex items-start gap-2.5 pl-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0"></span>
                            <span>{block.content}</span>
                          </div>
                        );
                      }
                      if (block.type === 'NUMBERED_LIST') {
                        if (block.items && block.items.length > 0) {
                          return (
                            <ol key={block.id} className="space-y-1.5 pl-2 my-1.5">
                              {block.items.map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-800 leading-relaxed">
                                  <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-indigo-200 font-mono">
                                    {i + 1}
                                  </span>
                                  <span className="pt-0.5">{item}</span>
                                </li>
                              ))}
                            </ol>
                          );
                        }
                        return (
                          <div key={block.id} className="flex items-start gap-2.5 pl-2">
                            <span className="font-bold text-indigo-600 text-xs shrink-0">{block.order}.</span>
                            <span>{block.content}</span>
                          </div>
                        );
                      }
                      if (block.type === 'TABLE') {
                        const tableData = block.tableData;
                        if (tableData && tableData.headers && tableData.headers.length > 0) {
                          return (
                            <div key={block.id} className="overflow-x-auto my-3 rounded-xl border border-slate-200 shadow-2xs">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                                  <tr>
                                    {tableData.headers.map((h, hi) => (
                                      <th key={hi} className="py-2.5 px-3.5">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                  {(tableData.rows || []).map((row, ri) => (
                                    <tr key={ri} className="hover:bg-slate-50/80 transition-colors">
                                      {row.map((cell, ci) => (
                                        <td key={ci} className="py-2.5 px-3.5 text-slate-800">{cell}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        }
                      }
                      if (block.type === 'CALLOUT') {
                        return (
                          <div key={block.id} className="p-4 my-2.5 rounded-xl bg-gradient-to-r from-indigo-50/80 to-blue-50/50 border-l-4 border-indigo-600 text-slate-800 text-sm flex items-start gap-3 shadow-2xs">
                            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                            <div className="leading-relaxed">{block.content}</div>
                          </div>
                        );
                      }
                      if (block.type === 'NOTE') {
                        return (
                          <div key={block.id} className="p-3 my-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs italic flex items-start gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                            <span>{block.content}</span>
                          </div>
                        );
                      }
                      return <p key={block.id} className="text-slate-800">{block.content}</p>;
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 3. MODE B: SECTION STUDIO (HUMAN DOCUMENT WRITING & COLLABORATION) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Clean Section Outline (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3.5 h-fit sticky top-16">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Document Outline</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">{approvedSectionsCount} of {draft.sections.length} sections approved</p>
              </div>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-md font-mono">
                {draft.sections.length} Parts
              </span>
            </div>

            {/* Search outline */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={outlineSearch}
                onChange={(e) => setOutlineSearch(e.target.value)}
                placeholder="Find section in proposal..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Section Item List */}
            <div className="space-y-1 max-h-[620px] overflow-y-auto pr-1">
              {filteredSections.map((sec) => {
                const isSelected = sec.id === selectedSectionId || sec.sectionNumber === activeSection?.sectionNumber;
                const isApproved = sec.status === 'APPROVED';
                const isDrafted = sec.status === 'DRAFTED' || sec.content.length > 0;
                const hasGaps = sec.evidenceGapCount > 0;

                return (
                  <button
                    key={sec.id}
                    onClick={() => setSelectedSectionId(sec.id)}
                    className={`w-full text-left p-3 rounded-xl text-xs font-medium transition-all flex items-start gap-2.5 group ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600'
                        : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    {/* Status Dot / Icon */}
                    <div className="mt-0.5 shrink-0">
                      {isApproved ? (
                        <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                      ) : isDrafted ? (
                        <div className={`w-2 h-2 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-indigo-600'}`}></div>
                      ) : (
                        <div className={`w-2 h-2 rounded-full mt-1 ${isSelected ? 'bg-white/60' : 'bg-slate-300'}`}></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-900 group-hover:text-indigo-600'}`}>
                          {sec.sectionNumber ? `${sec.sectionNumber}. ` : ''}{sec.title}
                        </span>
                      </div>

                      <div className={`text-[10px] flex items-center justify-between mt-1 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                        <span>{sec.content.length > 0 ? `${sec.content.length} blocks` : 'Unwritten'}</span>
                        {hasGaps && (
                          <span className={`font-bold ${isSelected ? 'text-amber-200' : 'text-amber-600'}`}>
                            ⚠ {sec.evidenceGapCount} gap{sec.evidenceGapCount > 1 ? 's' : ''}
                          </span>
                        )}
                        {sec.completenessScore > 0 && <span>{sec.completenessScore}% ready</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: Document Canvas & Inline Editor (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {activeSection ? (
              <div className="doc-page rounded-2xl p-6 sm:p-10 space-y-6">
                {/* Section Studio Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 font-mono">
                        {activeSection.sectionNumber ? `Section ${activeSection.sectionNumber}` : 'Draft Section'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        activeSection.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : activeSection.status === 'DRAFTED'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {activeSection.status}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                      {activeSection.title}
                    </h2>
                    {activeSection.writingBrief && (
                      <p className="text-xs text-slate-500 mt-1 max-w-2xl">{activeSection.writingBrief}</p>
                    )}
                  </div>

                  {/* Section Top Controls */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={handleDraftCurrentSection}
                      disabled={isDraftingSection}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      {isDraftingSection ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      )}
                      <span>{activeSection.content.length === 0 ? 'Generate Section with AI' : 'Regenerate'}</span>
                    </button>

                    <button
                      onClick={handleApproveSection}
                      disabled={activeSection.status === 'APPROVED'}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
                        activeSection.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 opacity-80 cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{activeSection.status === 'APPROVED' ? 'Approved' : 'Approve Section'}</span>
                    </button>
                  </div>
                </div>

                {/* Section Content Flow - Clean Human Document Reading */}
                <div className="space-y-4">
                  {activeSection.content.length === 0 ? (
                    <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl p-6 space-y-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="max-w-md mx-auto">
                        <h4 className="text-sm font-bold text-slate-800">This section is ready to be drafted</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          The AI has already pre-mapped all TOR obligations, evaluation criteria, and verified credentials for this section.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          onClick={handleDraftCurrentSection}
                          disabled={isDraftingSection}
                          className="btn-primary"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generate Section Now</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeSection.content.map((block) => {
                        const isEditing = editingBlockId === block.id;
                        const isPlaceholder = block.type === 'PLACEHOLDER' || block.content.includes('[TO BE PROVIDED');

                        return (
                          <div
                            key={block.id}
                            className={`group relative rounded-xl transition-all ${
                              isPlaceholder
                                ? 'p-3 bg-amber-50/80 border border-amber-200'
                                : 'p-2.5 hover:bg-slate-50/80 rounded-lg'
                            }`}
                          >
                            {/* Floating Action Menu on Hover */}
                            {!isEditing && (
                              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg shadow-xs flex items-center p-0.5 space-x-0.5 z-10">
                                <button
                                  onClick={() => {
                                    setEditingBlockId(block.id);
                                    setEditingBlockContent(block.content);
                                  }}
                                  className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded"
                                  title="Edit Block Content"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBlock(block.id)}
                                  className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded"
                                  title="Delete Block"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            {/* Block Content Display or Inline Editor */}
                            {isEditing ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editingBlockContent}
                                  onChange={(e) => setEditingBlockContent(e.target.value)}
                                  rows={4}
                                  className="w-full text-sm font-sans p-3 border border-indigo-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white leading-relaxed text-slate-800"
                                  autoFocus
                                />
                                <div className="flex justify-end items-center gap-2">
                                  <button
                                    onClick={() => setEditingBlockId(null)}
                                    className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveBlockEdit(block.id)}
                                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 shadow-xs"
                                  >
                                    Save Changes
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                {block.type === 'HEADING' && (
                                  <h3 className="text-base font-bold text-slate-900 tracking-tight">{block.content}</h3>
                                )}

                                {block.type === 'PARAGRAPH' && !isPlaceholder && (
                                  <p className="text-sm text-slate-800 leading-relaxed">{block.content}</p>
                                )}

                                {block.type === 'BULLET_LIST' && (
                                  block.items && block.items.length > 0 ? (
                                    <ul className="space-y-1.5 pl-1 my-1">
                                      {block.items.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-800 leading-relaxed">
                                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0"></span>
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div className="flex items-start gap-2.5 pl-1 text-sm text-slate-800 leading-relaxed">
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0"></span>
                                      <span>{block.content}</span>
                                    </div>
                                  )
                                )}

                                {block.type === 'NUMBERED_LIST' && (
                                  block.items && block.items.length > 0 ? (
                                    <ol className="space-y-1.5 pl-1 my-1">
                                      {block.items.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-800 leading-relaxed">
                                          <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-indigo-200 font-mono">
                                            {i + 1}
                                          </span>
                                          <span className="pt-0.5">{item}</span>
                                        </li>
                                      ))}
                                    </ol>
                                  ) : (
                                    <div className="flex items-start gap-2.5 pl-1 text-sm text-slate-800 leading-relaxed">
                                      <span className="font-bold text-indigo-600 text-xs shrink-0">{block.order}.</span>
                                      <span>{block.content}</span>
                                    </div>
                                  )
                                )}

                                {block.type === 'TABLE' && (
                                  block.tableData && block.tableData.headers && block.tableData.headers.length > 0 ? (
                                    <div className="overflow-x-auto my-3 rounded-xl border border-slate-200 shadow-2xs">
                                      <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                                          <tr>
                                            {block.tableData.headers.map((h, hi) => (
                                              <th key={hi} className="py-2.5 px-3.5">{h}</th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                          {(block.tableData.rows || []).map((row, ri) => (
                                            <tr key={ri} className="hover:bg-slate-50/80 transition-colors">
                                              {row.map((cell, ci) => (
                                                <td key={ci} className="py-2.5 px-3.5 text-slate-800">{cell}</td>
                                              ))}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="p-3 my-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-700 whitespace-pre-wrap">
                                      {block.content}
                                    </div>
                                  )
                                )}

                                {block.type === 'CALLOUT' && (
                                  <div className="p-3.5 my-2 rounded-xl bg-gradient-to-r from-indigo-50/80 to-blue-50/40 border-l-4 border-indigo-600 text-slate-800 text-sm flex items-start gap-3 shadow-2xs">
                                    <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                                    <div className="leading-relaxed">{block.content}</div>
                                  </div>
                                )}

                                {block.type === 'NOTE' && (
                                  <div className="p-3 my-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs italic flex items-start gap-2">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                    <span>{block.content}</span>
                                  </div>
                                )}

                                {/* Highlighted Missing Placeholder Block */}
                                {isPlaceholder && (
                                  <div className="space-y-2">
                                    <div className="flex items-start gap-2 text-xs font-medium text-amber-900">
                                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                      <span className="leading-relaxed font-sans">{block.content}</span>
                                    </div>

                                    {/* Inline Fill Popover */}
                                    {fillingPlaceholderBlockId === block.id ? (
                                      <div className="flex items-center gap-2 pt-1">
                                        <input
                                          type="text"
                                          placeholder="Enter replacement data..."
                                          value={placeholderFillValue}
                                          onChange={(e) => setPlaceholderFillValue(e.target.value)}
                                          onKeyDown={(e) => e.key === 'Enter' && handleSavePlaceholderValue(block.id, block.content)}
                                          className="flex-1 text-xs border border-amber-300 rounded-lg p-1.5 outline-none bg-white focus:border-indigo-500"
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => handleSavePlaceholderValue(block.id, block.content)}
                                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg"
                                        >
                                          Replace
                                        </button>
                                        <button
                                          onClick={() => setFillingPlaceholderBlockId(null)}
                                          className="px-2 py-1.5 text-slate-500 text-xs"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleFillPlaceholder(block.id, block.content)}
                                        className="text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-200/60 hover:bg-amber-200 px-2.5 py-1 rounded-md transition flex items-center gap-1"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                        <span>Click to Fill Missing Information</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Add New Content Block Inserter */}
                <div className="pt-4 border-t border-slate-100">
                  {showAddBlockMenu ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Add Content to Section</span>
                        <button onClick={() => setShowAddBlockMenu(false)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={newBlockType}
                          onChange={(e) => setNewBlockType(e.target.value as ContentBlockType)}
                          className="text-xs border border-slate-300 rounded-lg p-1.5 font-semibold text-slate-700 bg-white"
                        >
                          <option value="PARAGRAPH">Paragraph</option>
                          <option value="HEADING">Sub-heading</option>
                          <option value="BULLET_LIST">Bullet Point</option>
                          <option value="NUMBERED_LIST">Numbered Item</option>
                        </select>

                        <input
                          type="text"
                          placeholder="Type or paste content..."
                          value={newBlockContent}
                          onChange={(e) => setNewBlockContent(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddBlock()}
                          className="flex-1 text-xs border border-slate-300 rounded-lg p-1.5 outline-none bg-white focus:border-indigo-500"
                          autoFocus
                        />

                        <button
                          onClick={handleAddBlock}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition"
                        >
                          Add Block
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddBlockMenu(true)}
                      className="w-full py-2.5 border border-dashed border-slate-300 hover:border-indigo-400 rounded-xl text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/30 transition flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Text, Heading, or Point to this Section</span>
                    </button>
                  )}
                </div>

                {/* Section Navigation Footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
                  <button
                    onClick={() => navigateSection('prev')}
                    disabled={activeSectionIndex <= 0}
                    className="flex items-center gap-1.5 hover:text-slate-900 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous Section</span>
                  </button>

                  <span className="text-slate-400">
                    Section {activeSectionIndex + 1} of {draft.sections.length}
                  </span>

                  <button
                    onClick={() => navigateSection('next')}
                    disabled={activeSectionIndex >= draft.sections.length - 1}
                    className="flex items-center gap-1.5 hover:text-slate-900 disabled:opacity-30"
                  >
                    <span>Next Section</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="doc-page rounded-2xl p-12 text-center text-slate-500">
                Select a section from the left outline to edit.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showVersionHistory && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <span>Proposal Snapshot History</span>
              </h3>
              <button onClick={() => setShowVersionHistory(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {versions.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">No prior snapshots recorded yet.</p>
              ) : (
                versions.map((ver) => (
                  <div key={ver.id} className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Version {ver.versionNumber}</div>
                      <div className="text-[11px] text-slate-500">{ver.changeSummary || 'Snapshot created'}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(ver.createdAt).toLocaleString()}</div>
                    </div>
                    <button
                      onClick={() => handleRestoreVersion(ver.id)}
                      className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100"
                    >
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
