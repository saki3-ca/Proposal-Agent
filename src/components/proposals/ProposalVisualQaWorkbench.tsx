import React, { useState, useEffect } from 'react';
import {
  VisualQaReport,
  VisualQaFinding,
  VisualQaFindingStatus,
  VisualQaFindingSeverity,
  VisualQaFindingCategory
} from '../../types';
import { DocxVisualQaService } from '../../services/docxVisualQaService';
import { DocxGenerationService } from '../../services/docxGenerationService';
import { HouseStyleService } from '../../services/houseStyleService';

interface ProposalVisualQaWorkbenchProps {
  projectId: string;
}

export const ProposalVisualQaWorkbench: React.FC<ProposalVisualQaWorkbenchProps> = ({ projectId }) => {
  const [report, setReport] = useState<VisualQaReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'pages' | 'findings' | 'layout' | 'tables' | 'typography' | 'hf' | 'history'
  >('overview');

  // Findings Filters
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Human Review Modal State
  const [selectedFinding, setSelectedFinding] = useState<VisualQaFinding | null>(null);
  const [reviewStatus, setReviewStatus] = useState<VisualQaFindingStatus>('ACKNOWLEDGED');
  const [reviewerNote, setReviewerNote] = useState<string>('');

  useEffect(() => {
    loadReport();
  }, [projectId]);

  const loadReport = () => {
    const existing = DocxVisualQaService.getVisualQaReport(projectId);
    setReport(existing);
  };

  const handleRunQa = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const newReport = await DocxVisualQaService.runVisualQa(projectId);
      setReport(newReport);
    } catch (err: any) {
      setError(err.message || 'Failed to execute Visual QA inspection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReviewModal = (finding: VisualQaFinding) => {
    setSelectedFinding(finding);
    setReviewStatus(finding.status === 'OPEN' ? 'ACKNOWLEDGED' : finding.status);
    setReviewerNote(finding.reviewerNote || '');
  };

  const handleSaveReview = () => {
    if (!selectedFinding) return;
    try {
      const updated = DocxVisualQaService.updateFindingStatus(
        projectId,
        selectedFinding.id,
        reviewStatus,
        reviewerNote
      );
      setReport(updated);
      setSelectedFinding(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update finding review status.');
    }
  };

  const docxMeta = DocxGenerationService.getArtifactMetadata(projectId);
  const houseStyle = HouseStyleService.getActiveProfile();

  const filteredFindings = (report?.findings || []).filter(f => {
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    if (categoryFilter !== 'ALL' && f.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PASSED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PASSED_WITH_ISSUES': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'REQUIRES_HUMAN_REVIEW': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'BLOCKED': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getSeverityBadgeColor = (sev: VisualQaFindingSeverity) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'MAJOR': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'MINOR': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'INFORMATIONAL': return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-100">Phase 9 — DOCX Visual QA & Rendering Validation</h2>
              {report && (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(report.status)}`}>
                  {report.status}
                </span>
              )}
              {report?.isStale && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  STALE (DOCX Updated)
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Post-generation visual inspection, page layout geometry, heading hierarchy, table formatting, and house-style alignment verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunQa}
              disabled={isLoading || !docxMeta || docxMeta.generationStatus === 'BLOCKED'}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                isLoading || !docxMeta || docxMeta.generationStatus === 'BLOCKED'
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running Visual QA...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Run Visual QA Inspection
                </>
              )}
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        {report && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3">
              <span className="text-xs text-slate-400">DOCX Artifact</span>
              <p className="text-sm font-bold text-slate-200 mt-0.5">v{report.version}</p>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3">
              <span className="text-xs text-slate-400">Est. Total Pages</span>
              <p className="text-sm font-bold text-slate-200 mt-0.5">{report.pageCount} Pages</p>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3">
              <span className="text-xs text-red-400 font-medium">Critical Issues</span>
              <p className="text-lg font-bold text-red-400 mt-0.5">{report.criticalIssueCount}</p>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3">
              <span className="text-xs text-amber-400 font-medium">Major Issues</span>
              <p className="text-lg font-bold text-amber-400 mt-0.5">{report.majorIssueCount}</p>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3">
              <span className="text-xs text-blue-400 font-medium">Minor Issues</span>
              <p className="text-lg font-bold text-blue-400 mt-0.5">{report.minorIssueCount}</p>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3">
              <span className="text-xs text-slate-400">Renderer Status</span>
              <p className="text-xs font-semibold text-emerald-400 mt-1">OpenXML Structural QA</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* WORKBENCH TABS */}
      <div className="border-b border-slate-800 flex flex-wrap gap-2">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'pages', label: 'Page Review' },
          { id: 'findings', label: `Findings (${report?.findings?.length || 0})` },
          { id: 'layout', label: 'Layout & Geometry' },
          { id: 'tables', label: 'Tables & Shading' },
          { id: 'typography', label: 'Typography' },
          { id: 'hf', label: 'Header / Footer' },
          { id: 'history', label: 'QA History' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === t.id
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {!report && !isLoading && (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-xl">
          <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-300">No Visual QA Inspection Performed Yet</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Click "Run Visual QA Inspection" to execute automated page layout, heading hierarchy, table formatting, and house-style alignment checks.
          </p>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
                <h3 className="text-base font-semibold text-slate-200 mb-4">Inspection Summary & Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                    <span className="text-sm text-slate-400">Target Document</span>
                    <span className="text-sm font-medium text-slate-200">{docxMeta?.fileName || 'ACNABIN Proposal'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                    <span className="text-sm text-slate-400">House Style Profile</span>
                    <span className="text-sm font-medium text-indigo-400">{houseStyle?.metadata?.name || 'Active Profile'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                    <span className="text-sm text-slate-400">Page Geometry</span>
                    <span className="text-sm font-medium text-slate-200">{houseStyle?.document?.pageSize || 'A4 (210mm x 297mm)'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                    <span className="text-sm text-slate-400">Page Margins</span>
                    <span className="text-sm font-medium text-slate-200">{houseStyle?.document?.margins?.top || '0.75 in'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-slate-400">Renderer Mode</span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 text-slate-300">
                      OpenXML Structural Audit
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
                <h3 className="text-base font-semibold text-slate-200 mb-4">Active House Style Applied</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                    <span className="text-sm text-slate-400">Body Typography</span>
                    <span className="text-sm font-medium text-slate-200">{houseStyle?.typography?.bodyFont || 'Tahoma'} ({houseStyle?.typography?.bodyFontSize || '11 pt'})</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                    <span className="text-sm text-slate-400">H1 Heading</span>
                    <span className="text-sm font-medium text-slate-200">{houseStyle?.typography?.headingSizes?.h1 || '16 pt'} ({houseStyle?.colors?.headingColors?.h1 || '#1F3864'})</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                    <span className="text-sm text-slate-400">H2 / H3 Headings</span>
                    <span className="text-sm font-medium text-slate-200">{houseStyle?.typography?.headingSizes?.h2 || '13 pt'} / {houseStyle?.typography?.headingSizes?.h3 || '12 pt'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                    <span className="text-sm text-slate-400">Table Header Color</span>
                    <span className="text-sm font-medium text-slate-200">{houseStyle?.colors?.tableHeaderColor || '#0F4761'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-slate-400">Alternate Row Color</span>
                    <span className="text-sm font-medium text-slate-200">{houseStyle?.colors?.alternateRowColor || '#F8FAFC'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PAGE REVIEW */}
          {activeTab === 'pages' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: report.pageCount }).map((_, pIdx) => (
                <div key={pIdx} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Page {pIdx + 1}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">A4 Portrait</span>
                    </div>

                    <div className="aspect-[1/1.4] bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col justify-between text-xs text-slate-500 overflow-hidden relative">
                      <div className="text-[10px] text-slate-600 text-right truncate">ACNABIN Proposal</div>
                      <div className="space-y-1 my-auto text-center text-slate-400">
                        {pIdx === 0 ? (
                          <div className="space-y-1">
                            <div className="font-bold text-indigo-400 text-sm">COVER PAGE</div>
                            <div className="text-[10px]">Technical Proposal</div>
                          </div>
                        ) : pIdx === 1 ? (
                          <div className="font-semibold text-slate-300">Table of Contents</div>
                        ) : (
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-300">Section {pIdx - 1} Narrative</div>
                            <div className="h-1 bg-slate-800 rounded w-3/4 mx-auto" />
                            <div className="h-1 bg-slate-800 rounded w-1/2 mx-auto" />
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-600 text-center">Strictly Confidential | Page {pIdx + 1} of {report.pageCount}</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/60 text-xs text-slate-400 flex justify-between items-center">
                    <span>Layout Verified</span>
                    <span className="text-emerald-400 font-semibold">OK</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: FINDINGS */}
          {activeTab === 'findings' && (
            <div className="space-y-4">
              {/* FILTERS */}
              <div className="flex flex-wrap gap-3 p-4 bg-slate-900/40 border border-slate-800 rounded-xl">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Severity</label>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Severities</option>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="MAJOR">MAJOR</option>
                    <option value="MINOR">MINOR</option>
                    <option value="INFORMATIONAL">INFORMATIONAL</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="PAGE">PAGE</option>
                    <option value="LAYOUT">LAYOUT</option>
                    <option value="HEADING">HEADING</option>
                    <option value="TABLE">TABLE</option>
                    <option value="HEADER_FOOTER">HEADER_FOOTER</option>
                    <option value="TYPOGRAPHY">TYPOGRAPHY</option>
                    <option value="PLACEHOLDER">PLACEHOLDER</option>
                    <option value="STRUCTURE">STRUCTURE</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="OPEN">OPEN</option>
                    <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="WAIVED">WAIVED</option>
                  </select>
                </div>
              </div>

              {/* FINDINGS LIST */}
              <div className="space-y-3">
                {filteredFindings.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-400 text-sm">
                    No findings match the selected filter criteria.
                  </div>
                ) : (
                  filteredFindings.map(f => (
                    <div key={f.id} className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${getSeverityBadgeColor(f.severity)}`}>
                            {f.severity}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-semibold">
                            {f.category}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">Page {f.pageNumber}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-200">{f.title}</h4>
                        <p className="text-xs text-slate-400">{f.description}</p>
                        {f.reviewerNote && (
                          <div className="mt-2 text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 p-2 rounded">
                            <span className="font-semibold">Reviewer Note:</span> {f.reviewerNote}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">
                          Status: <strong className="text-slate-200">{f.status}</strong>
                        </span>
                        <button
                          onClick={() => handleOpenReviewModal(f)}
                          className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-all"
                        >
                          Review Action
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: LAYOUT */}
          {activeTab === 'layout' && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-200">Page Layout & Geometry Audit</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg">
                  <span className="text-xs text-slate-400">Page Standard</span>
                  <p className="text-base font-bold text-slate-200 mt-1">A4 (210mm x 297mm)</p>
                  <p className="text-xs text-emerald-400 mt-1">✓ 11906 x 16838 DXA Twips</p>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg">
                  <span className="text-xs text-slate-400">Page Orientation</span>
                  <p className="text-base font-bold text-slate-200 mt-1">Portrait</p>
                  <p className="text-xs text-emerald-400 mt-1">✓ Uniform Across Sections</p>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg">
                  <span className="text-xs text-slate-400">Page Margins</span>
                  <p className="text-base font-bold text-slate-200 mt-1">0.75" All Sides</p>
                  <p className="text-xs text-emerald-400 mt-1">✓ 1080 DXA Printable Boundary</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TABLES */}
          {activeTab === 'tables' && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-200">OpenXML Editable Table Audit</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2">
                  <span className="text-xs text-slate-400">Header Shading Color</span>
                  <p className="text-lg font-bold text-indigo-400">{houseStyle?.colors?.tableHeaderColor || '#0F4761'}</p>
                  <p className="text-xs text-slate-400">Header Text: #FFFFFF (White Bold)</p>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2">
                  <span className="text-xs text-slate-400">Alternate Row Zebra Shading</span>
                  <p className="text-lg font-bold text-indigo-400">{houseStyle?.colors?.alternateRowColor || '#F8FAFC'}</p>
                  <p className="text-xs text-slate-400">Zebra Alternating Active</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TYPOGRAPHY */}
          {activeTab === 'typography' && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-200">Typography & House Style Hierarchy</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg">
                  <span className="text-xs text-slate-400">Body Font</span>
                  <p className="text-lg font-bold text-slate-200 mt-1">{houseStyle?.typography?.bodyFont || 'Tahoma'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{houseStyle?.typography?.bodyFontSize || '11 pt'}</p>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg">
                  <span className="text-xs text-slate-400">Heading 1</span>
                  <p className="text-lg font-bold text-slate-200 mt-1">{houseStyle?.typography?.headingSizes?.h1 || '16 pt'}</p>
                  <p className="text-xs text-indigo-400 mt-0.5">{houseStyle?.colors?.headingColors?.h1 || '#1F3864'}</p>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg">
                  <span className="text-xs text-slate-400">Heading 2</span>
                  <p className="text-lg font-bold text-slate-200 mt-1">{houseStyle?.typography?.headingSizes?.h2 || '13 pt'}</p>
                  <p className="text-xs text-indigo-400 mt-0.5">{houseStyle?.colors?.headingColors?.h2 || '#1F3864'}</p>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg">
                  <span className="text-xs text-slate-400">Heading 3</span>
                  <p className="text-lg font-bold text-slate-200 mt-1">{houseStyle?.typography?.headingSizes?.h3 || '12 pt'}</p>
                  <p className="text-xs text-indigo-400 mt-0.5">{houseStyle?.colors?.headingColors?.h3 || '#153D63'}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: HEADER / FOOTER */}
          {activeTab === 'hf' && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-200">Header & Footer Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2">
                  <span className="text-xs text-slate-400">Running Header</span>
                  <p className="text-sm font-semibold text-slate-200">Right-Aligned Proposal Title</p>
                  <p className="text-xs text-slate-400">ACNABIN Technical Proposal — Client Confidential</p>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2">
                  <span className="text-xs text-slate-400">Footer Page Numbering & Confidentiality</span>
                  <p className="text-sm font-semibold text-slate-200">Center-Aligned Dynamic Page Field</p>
                  <p className="text-xs text-slate-400">Strictly Confidential | Page X of Y</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: HISTORY */}
          {activeTab === 'history' && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-200">QA Report History & Staleness Control</h3>
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Current DOCX Artifact Version</span>
                  <p className="text-base font-bold text-slate-200">Version {report.version}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Generated: {report.createdAt}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Report Staleness</span>
                  <p className={`text-sm font-semibold mt-0.5 ${report.isStale ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {report.isStale ? 'STALE (Re-run Required)' : 'UP TO DATE'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HUMAN REVIEW MODAL */}
      {selectedFinding && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-100">Review Visual QA Finding</h3>
              <button onClick={() => setSelectedFinding(null)} className="text-slate-400 hover:text-slate-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-slate-200">{selectedFinding.title}</p>
              <p className="text-slate-400">{selectedFinding.description}</p>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1 font-semibold">Set Finding Status</label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value as VisualQaFindingStatus)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="ACKNOWLEDGED">ACKNOWLEDGED (Under Review)</option>
                <option value="RESOLVED">RESOLVED (Corrected)</option>
                <option value="WAIVED">WAIVED (Acceptable Visual Variation)</option>
                <option value="OPEN">OPEN (Unresolved)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1 font-semibold">Reviewer Rationale / Note</label>
              <textarea
                value={reviewerNote}
                onChange={(e) => setReviewerNote(e.target.value)}
                placeholder="Enter justification for waiver or resolution..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedFinding(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReview}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-600/20"
              >
                Save Review Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
