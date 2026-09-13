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
  ChevronDown,
  ShieldCheck,
  HelpCircle,
  FileCheck,
  Layers,
  History,
  Lock,
  Edit3,
  Check,
  X,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface ProposalDraftWorkbenchProps {
  projectId: string;
}

export const ProposalDraftWorkbench: React.FC<ProposalDraftWorkbenchProps> = ({ projectId }) => {
  const [draft, setDraft] = useState<ProposalDraft | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isDraftingSection, setIsDraftingSection] = useState(false);
  const [isDraftingAll, setIsDraftingAll] = useState(false);

  // Block editing state
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingBlockContent, setEditingBlockContent] = useState<string>('');

  // Right Drawer Tab State
  const [activeRightTab, setActiveRightTab] = useState<'evidence' | 'requirements' | 'gaps' | 'style'>('evidence');

  // Version History Modal
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versions, setVersions] = useState<ProposalDraftVersion[]>([]);

  // Add block state
  const [newBlockType, setNewBlockType] = useState<ContentBlockType>('PARAGRAPH');
  const [newBlockContent, setNewBlockContent] = useState('');

  // Initialize or fetch draft
  useEffect(() => {
    let loaded = ProposalDraftingService.getProposalDraft(projectId);
    if (!loaded) {
      loaded = ProposalDraftingService.initializeDraftFromPlan(projectId);
    }
    setDraft(loaded);
    if (loaded && loaded.sections.length > 0) {
      setSelectedSectionId(loaded.sections[0].id);
    }
  }, [projectId]);

  if (!draft) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
        <Sparkles className="w-8 h-8 text-indigo-500 mx-auto mb-3 animate-pulse" />
        <h3 className="text-sm font-bold text-slate-800">Initializing Proposal Drafting Workspace...</h3>
      </div>
    );
  }

  const activeSection = draft.sections.find((s) => s.id === selectedSectionId) || draft.sections[0];
  const contextPkg = activeSection ? ProposalDraftContextService.buildSectionDraftContext(projectId, activeSection.sectionNumber) : null;

  // Actions
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
    try {
      const updated = await ProposalDraftingService.draftEntireProposal(projectId);
      setDraft(updated);
    } catch (e: any) {
      alert(`Proposal drafting error: ${e?.message || e}`);
    } finally {
      setIsDraftingAll(false);
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

  return (
    <div className="space-y-6">
      {/* 1. Header & Readiness Metrics Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-[11px] font-bold uppercase rounded font-mono">
                Phase 6 Engine
              </span>
              <h2 className="text-lg font-bold text-slate-900">{draft.title}</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Client: <span className="font-semibold text-slate-700">{draft.clientName || 'Target Client'}</span> | Version {draft.version}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenVersions}
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center transition"
            >
              <History className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Versions
            </button>

            <button
              onClick={handleDraftEntireProposal}
              disabled={isDraftingAll}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center transition disabled:opacity-50"
            >
              {isDraftingAll ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Drafting Sequential Proposal...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Draft Entire Proposal (All Sections)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Readiness Dashboard Counters */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-1">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-500">Readiness Score</div>
            <div className="text-lg font-extrabold text-indigo-600">{draft.overallCompletenessScore}%</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-500">Req Coverage</div>
            <div className="text-lg font-extrabold text-emerald-600">{draft.requirementCoverageScore}%</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-500">Evidence Coverage</div>
            <div className="text-lg font-extrabold text-blue-600">{draft.evidenceCoverageScore}%</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-500">Evidence Gaps</div>
            <div className={`text-lg font-extrabold ${draft.evidenceGapCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
              {draft.evidenceGapCount}
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-500">Placeholders</div>
            <div className={`text-lg font-extrabold ${draft.placeholderCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {draft.placeholderCount}
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-500">Approved Sections</div>
            <div className="text-lg font-extrabold text-slate-900">
              {draft.sections.filter((s) => s.status === 'APPROVED').length} / {draft.sections.length}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Workbench Layout (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: Section Navigation Sidebar (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Proposal Structure</h3>
            <span className="text-[10px] font-bold text-slate-500 font-mono">{draft.sections.length} sections</span>
          </div>

          <div className="space-y-1 max-h-[700px] overflow-y-auto pr-1">
            {draft.sections.map((sec) => {
              const isSelected = sec.id === selectedSectionId || sec.sectionNumber === activeSection?.sectionNumber;
              return (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSectionId(sec.id)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold transition flex flex-col space-y-1 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold truncate">
                      {sec.sectionNumber}. {sec.title}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                        isSelected
                          ? 'bg-indigo-800 text-white'
                          : sec.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sec.status === 'BLOCKED'
                          ? 'bg-rose-100 text-rose-800'
                          : sec.status === 'DRAFTED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {sec.status}
                    </span>
                  </div>

                  <div className={`text-[10px] flex items-center justify-between ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                    <span>Blocks: {sec.content.length}</span>
                    {sec.evidenceGapCount > 0 && <span className="font-bold text-amber-400">⚠ {sec.evidenceGapCount} gaps</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column 2: Content Block Editor (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {activeSection ? (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-5">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Section {activeSection.sectionNumber}: {activeSection.title}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Completeness: {activeSection.completenessScore}% | Evidence Coverage: {activeSection.evidenceCoverageScore}%
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDraftCurrentSection}
                    disabled={isDraftingSection}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-md flex items-center transition disabled:opacity-50"
                  >
                    {isDraftingSection ? (
                      <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                    )}
                    {activeSection.status === 'NOT_STARTED' ? 'Draft Section' : 'Regenerate'}
                  </button>

                  <button
                    onClick={handleApproveSection}
                    disabled={activeSection.status === 'APPROVED'}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md flex items-center transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Approve
                  </button>
                </div>
              </div>

              {/* Block List */}
              <div className="space-y-4">
                {activeSection.content.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-lg p-4">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-600 font-medium">This section has not been drafted yet.</p>
                    <button
                      onClick={handleDraftCurrentSection}
                      disabled={isDraftingSection}
                      className="mt-3 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-md hover:bg-indigo-700 transition"
                    >
                      Draft Section Now
                    </button>
                  </div>
                ) : (
                  activeSection.content.map((block) => {
                    const isEditing = editingBlockId === block.id;

                    return (
                      <div
                        key={block.id}
                        className={`p-3.5 rounded-lg border transition ${
                          block.type === 'PLACEHOLDER' || block.content.includes('[TO BE PROVIDED]')
                            ? 'bg-amber-50/70 border-amber-300'
                            : block.reviewStatus === 'APPROVED'
                            ? 'bg-emerald-50/30 border-emerald-200'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded uppercase">
                              {block.type}
                            </span>
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                block.reviewStatus === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : block.reviewStatus === 'HUMAN_EDITED'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : block.reviewStatus === 'FLAGGED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {block.reviewStatus}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1">
                            {!isEditing && (
                              <button
                                onClick={() => {
                                  setEditingBlockId(block.id);
                                  setEditingBlockContent(block.content);
                                }}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                                title="Edit Block"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteBlock(block.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Delete Block"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Content rendering or inline editing */}
                        {isEditing ? (
                          <div className="space-y-2 mt-1">
                            <textarea
                              value={editingBlockContent}
                              onChange={(e) => setEditingBlockContent(e.target.value)}
                              rows={4}
                              className="w-full text-xs font-sans p-2 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => setEditingBlockId(null)}
                                className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveBlockEdit(block.id)}
                                className="px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-bold rounded"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-800 leading-relaxed font-sans">
                            {block.type === 'HEADING' && (
                              <h4 className="font-extrabold text-slate-900 text-sm">{block.content}</h4>
                            )}
                            {block.type === 'PARAGRAPH' && <p>{block.content}</p>}
                            {block.type === 'BULLET_LIST' && (
                              <div className="flex items-start space-x-2">
                                <span className="text-indigo-500">•</span>
                                <span>{block.content}</span>
                              </div>
                            )}
                            {block.type === 'PLACEHOLDER' && (
                              <div className="flex items-start space-x-2 text-amber-900 font-medium">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                  <span>{block.content}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Block Bar */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center space-x-2">
                  <select
                    value={newBlockType}
                    onChange={(e) => setNewBlockType(e.target.value as ContentBlockType)}
                    className="text-xs border border-slate-300 rounded p-1.5 font-semibold text-slate-700"
                  >
                    <option value="PARAGRAPH">Paragraph</option>
                    <option value="HEADING">Heading</option>
                    <option value="BULLET_LIST">Bullet Point</option>
                    <option value="PLACEHOLDER">Placeholder</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Add text or content block..."
                    value={newBlockContent}
                    onChange={(e) => setNewBlockContent(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddBlock()}
                    className="flex-1 text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleAddBlock}
                    className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded hover:bg-slate-900 transition flex items-center"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500">Select a section from the left sidebar to edit.</p>
            </div>
          )}
        </div>

        {/* Column 3: Evidence & Requirement Traceability Panel (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
            {/* Drawer Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveRightTab('evidence')}
                className={`flex-1 pb-2 text-center text-xs font-bold border-b-2 transition ${
                  activeRightTab === 'evidence'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Evidence
              </button>
              <button
                onClick={() => setActiveRightTab('requirements')}
                className={`flex-1 pb-2 text-center text-xs font-bold border-b-2 transition ${
                  activeRightTab === 'requirements'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Requirements
              </button>
              <button
                onClick={() => setActiveRightTab('gaps')}
                className={`flex-1 pb-2 text-center text-xs font-bold border-b-2 transition ${
                  activeRightTab === 'gaps'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Gaps
              </button>
            </div>

            {/* Tab 1: Evidence Used */}
            {activeRightTab === 'evidence' && contextPkg && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Corporate & Team Evidence</h4>
                {contextPkg.corporateEvidence.length === 0 && contextPkg.teamEvidence.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No verified evidence mapped for this section.</p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {contextPkg.corporateEvidence.map((ev) => (
                      <div key={ev.id} className="p-2.5 rounded border border-slate-200 bg-slate-50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 truncate">{ev.title}</span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                            {ev.verificationStatus}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2">{ev.summaryText}</p>
                      </div>
                    ))}

                    {contextPkg.teamEvidence.map((team, idx) => (
                      <div key={idx} className="p-2.5 rounded border border-slate-200 bg-slate-50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">{team.roleName}</span>
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                              team.qualificationMatchStatus === 'FULL_MATCH'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {team.qualificationMatchStatus}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Candidate: <span className="font-semibold">{team.candidateName || '[TO BE PROVIDED]'}</span> ({team.yearsOfExperience} yrs)
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Requirements Mapped */}
            {activeRightTab === 'requirements' && contextPkg && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">TOR Requirements</h4>
                {contextPkg.mappedRequirements.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No specific TOR requirements mapped.</p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {contextPkg.mappedRequirements.map((req) => (
                      <div key={req.id} className="p-2.5 rounded border border-slate-200 bg-slate-50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-indigo-700">{req.id}</span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase">{req.category}</span>
                        </div>
                        <p className="text-xs text-slate-800">{req.requirementText}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Known Gaps */}
            {activeRightTab === 'gaps' && contextPkg && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Identified Gaps</h4>
                {contextPkg.knownGaps.length === 0 ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-medium">
                    ✓ No evidence or qualification gaps identified for this section.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contextPkg.knownGaps.map((gap, gIdx) => (
                      <div key={gIdx} className="p-2.5 rounded border border-amber-300 bg-amber-50 text-xs text-amber-900 font-medium">
                        ⚠ {gap}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Version History Modal */}
      {showVersionHistory && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <History className="w-4 h-4 mr-2 text-indigo-600" />
                Proposal Draft Versions
              </h3>
              <button onClick={() => setShowVersionHistory(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {versions.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No prior versions recorded yet.</p>
              ) : (
                versions.map((ver) => (
                  <div key={ver.id} className="p-3 rounded border border-slate-200 hover:border-slate-300 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">Version {ver.versionNumber}</div>
                      <div className="text-[11px] text-slate-500">{ver.changeSummary}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(ver.createdAt).toLocaleString()}</div>
                    </div>
                    <button
                      onClick={() => handleRestoreVersion(ver.id)}
                      className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded hover:bg-indigo-100"
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
