import React, { useState, useEffect } from 'react';
import {
  Project,
  Requirement,
  EvidencePackage,
  RequirementEvidenceMatch,
  EvidenceRecord,
  EvidenceGap,
  MatchStatus
} from '../../types';
import { EvidenceMatchingService } from '../../services/evidenceMatchingService';
import { EvidenceIndexingService } from '../../services/evidenceIndexingService';
import {
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  FileSearch,
  RefreshCw,
  Info,
  ChevronRight,
  ShieldAlert,
  BookOpen,
  FileText,
  Filter,
  ExternalLink,
  Check,
  X,
  Layers,
  Database
} from 'lucide-react';

interface EvidenceMatrixViewerProps {
  project: Project;
  requirements: Requirement[];
  onNavigateToDrafting?: () => void;
}

export const EvidenceMatrixViewer: React.FC<EvidenceMatrixViewerProps> = ({
  project,
  requirements
}) => {
  const [evidencePackage, setEvidencePackage] = useState<EvidencePackage | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [activeTab, setActiveTab] = useState<'matrix' | 'traceability' | 'gaps' | 'verification'>('matrix');
  const [selectedMatch, setSelectedMatch] = useState<RequirementEvidenceMatch | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [verificationNote, setVerificationNote] = useState('');
  const [showToast, setShowToast] = useState<string | null>(null);

  useEffect(() => {
    const existing = EvidenceMatchingService.getSavedEvidencePackage(project.id);
    if (existing) {
      setEvidencePackage(existing);
      if (existing.matches.length > 0) setSelectedMatch(existing.matches[0]);
    } else {
      handleEvaluateEvidence();
    }
  }, [project.id]);

  const handleEvaluateEvidence = async () => {
    setIsEvaluating(true);
    try {
      // Re-index Document Library, firm credentials, and Project Documents
      EvidenceIndexingService.buildEvidenceIndex();
      // Clear previous cached package to force complete re-evaluation
      try {
        localStorage.removeItem(`acnabin_evidence_package_${project.id}`);
      } catch (e) {}

      const pkg = await EvidenceMatchingService.evaluateEvidencePackage(project, requirements);
      setEvidencePackage(pkg);
      if (pkg.matches.length > 0) setSelectedMatch(pkg.matches[0]);
      setShowToast(`✓ Evidence matching refreshed: ${pkg.availableCount} of ${pkg.totalRequirementsEvaluated} requirements verified (${pkg.readinessScore}% readiness)`);
      setTimeout(() => setShowToast(null), 4000);
    } catch (e) {
      console.error('Failed to evaluate evidence package:', e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleManualVerify = (status: RequirementEvidenceMatch['verificationStatus']) => {
    if (!selectedMatch || !evidencePackage) return;

    const updatedPkg = EvidenceMatchingService.updateVerificationStatus(
      project.id,
      selectedMatch.id,
      status,
      'Farhan Ahmed, Engagement Partner',
      verificationNote || `Manually set status to ${status}`
    );

    if (updatedPkg) {
      setEvidencePackage(updatedPkg);
      const updatedMatch = updatedPkg.matches.find(m => m.id === selectedMatch.id);
      if (updatedMatch) setSelectedMatch(updatedMatch);
      setVerificationNote('');
    }
  };

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">AVAILABLE</span>;
      case 'PARTIAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">PARTIAL</span>;
      case 'CONFLICTING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">CONFLICTING</span>;
      case 'MISSING':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-900 border border-red-300">MISSING</span>;
    }
  };

  const getReadinessBadge = (status: EvidencePackage['readinessStatus']) => {
    switch (status) {
      case 'READY':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-700" />
            EVIDENCE READY FOR PHASE 6 DRAFTING
          </span>
        );
      case 'REVIEW_REQUIRED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-700" />
            REVIEW REQUIRED (Gaps / Expiries)
          </span>
        );
      case 'NOT_READY':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-red-100 text-red-900 border border-red-300">
            <ShieldAlert className="w-3.5 h-3.5 mr-1 text-red-700" />
            NOT READY (Mandatory Evidence Missing)
          </span>
        );
    }
  };

  if (isEvaluating || !evidencePackage) {
    return (
      <div className="bg-white rounded border border-slate-200 p-12 text-center shadow-2xs space-y-4">
        <RefreshCw className="w-8 h-8 text-[#714B67] animate-spin mx-auto" />
        <h3 className="text-sm font-bold text-slate-900">Evaluating ACNABIN Evidence Library...</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Searching Document Library, practice licenses, firm experience records, and expert CVs. Verifying expiry dates and exact source quotes.
        </p>
      </div>
    );
  }

  const filteredMatches = statusFilter === 'ALL'
    ? evidencePackage.matches
    : evidencePackage.matches.filter(m => m.status === statusFilter);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">ACNABIN Evidence Matching Matrix</h2>
              {getReadinessBadge(evidencePackage.readinessStatus)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Verified evidence package supporting {requirements.length} TOR requirements from Document Library and Project Documents.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Evidence Readiness</span>
              <span className="text-lg font-mono font-bold text-[#714B67]">{evidencePackage.readinessScore}%</span>
            </div>

            <button
              onClick={handleEvaluateEvidence}
              disabled={isEvaluating}
              className="px-3.5 py-1.5 bg-[#714B67] hover:bg-[#51304A] text-white text-xs font-bold rounded shadow-2xs transition-colors flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
              <span>Re-run Evidence Matching</span>
            </button>
          </div>
        </div>

        {/* Live Re-Evaluation Confirmation Toast */}
        {showToast && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-bold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{showToast}</span>
            </div>
            <button
              onClick={() => setShowToast(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Evaluated</span>
            <span className="text-base font-mono font-bold text-slate-900">{evidencePackage.totalRequirementsEvaluated}</span>
          </div>

          <div className="p-2.5 rounded bg-emerald-50/60 border border-emerald-200">
            <span className="text-[10px] text-emerald-800 font-bold block uppercase">Available</span>
            <span className="text-base font-mono font-bold text-emerald-900">{evidencePackage.availableCount}</span>
          </div>

          <div className="p-2.5 rounded bg-amber-50/60 border border-amber-200">
            <span className="text-[10px] text-amber-800 font-bold block uppercase">Partial</span>
            <span className="text-base font-mono font-bold text-amber-900">{evidencePackage.partialCount}</span>
          </div>

          <div className="p-2.5 rounded bg-red-50/60 border border-red-200">
            <span className="text-[10px] text-red-800 font-bold block uppercase">Missing</span>
            <span className="text-base font-mono font-bold text-red-900">{evidencePackage.missingCount}</span>
          </div>

          <div className="p-2.5 rounded bg-purple-50/60 border border-purple-200">
            <span className="text-[10px] text-purple-800 font-bold block uppercase">Critical Gaps</span>
            <span className="text-base font-mono font-bold text-purple-900">{evidencePackage.gaps.length}</span>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="border-b border-slate-200 flex items-center justify-between bg-white p-1 rounded border">
        <div className="flex items-center space-x-1 overflow-x-auto">
          {[
            { id: 'matrix', label: 'Evidence Matrix', icon: Database, count: filteredMatches.length },
            { id: 'traceability', label: 'Source Traceability', icon: FileSearch },
            { id: 'gaps', label: 'Evidence Gaps', icon: ShieldAlert, count: evidencePackage.gaps.length },
            { id: 'verification', label: 'Auditor Verification', icon: CheckCircle2 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold flex items-center space-x-1.5 rounded transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#714B67] text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded ${isActive ? 'bg-[#51304A] text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filter Dropdown */}
        {activeTab === 'matrix' && (
          <div className="flex items-center space-x-2 px-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available Only</option>
              <option value="PARTIAL">Partial Only</option>
              <option value="MISSING">Missing Only</option>
              <option value="CONFLICTING">Conflicting Only</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: EVIDENCE MATRIX VIEW */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse odoo-table">
              <thead>
                <tr>
                  <th className="w-24">Req ID</th>
                  <th>TOR Requirement Clause</th>
                  <th className="w-48">Matched Evidence Source</th>
                  <th className="w-24 text-center">Status</th>
                  <th className="w-24 font-mono text-right">Confidence</th>
                  <th className="w-28 text-center">Verification</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.map((m) => {
                  const req = requirements.find(r => r.id === m.requirementId);
                  const ev = evidencePackage.evidenceRecords.find(e => e.id === m.evidenceId);

                  return (
                    <tr
                      key={m.id}
                      onClick={() => {
                        setSelectedMatch(m);
                        setActiveTab('traceability');
                      }}
                      className="hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="font-mono text-[10px] font-bold text-slate-600">{m.requirementId}</td>
                      <td>
                        <div className="font-bold text-slate-900 line-clamp-2">{req?.requirementText || m.requirementId}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {req?.sourceFile} • P.{req?.sourcePage || 1} • {req?.category}
                        </div>
                      </td>
                      <td>
                        {ev ? (
                          <div>
                            <span className="font-bold text-indigo-900 block truncate">{ev.title}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{ev.sourceFile}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No evidence document candidate</span>
                        )}
                      </td>
                      <td className="text-center">{getStatusBadge(m.status)}</td>
                      <td className="font-mono text-right font-bold text-slate-800">
                        {(m.relevanceScore * 100).toFixed(0)}%
                      </td>
                      <td className="text-center font-mono text-[10px]">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          m.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {m.verificationStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SOURCE TRACEABILITY DRAWER */}
      {activeTab === 'traceability' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Select Requirement Match
            </h3>

            <div className="divide-y divide-slate-100 max-h-[450px] overflow-y-auto">
              {evidencePackage.matches.map((m) => {
                const req = requirements.find(r => r.id === m.requirementId);
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMatch(m)}
                    className={`p-2.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between text-xs rounded ${
                      selectedMatch?.id === m.id ? 'bg-indigo-50/70 border border-indigo-200' : ''
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-bold text-slate-900 block truncate">{req?.requirementText}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{req?.sourceFile} (Clause {req?.sourceClause || 'N/A'})</span>
                    </div>
                    {getStatusBadge(m.status)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Traceability & Source Quote Highlighting */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center space-x-1.5">
              <FileSearch className="w-4 h-4 text-indigo-600" />
              <span>Verbatim Source Traceability</span>
            </h3>

            {selectedMatch ? (
              (() => {
                const req = requirements.find(r => r.id === selectedMatch.requirementId);
                const ev = evidencePackage.evidenceRecords.find(e => e.id === selectedMatch.evidenceId);

                return (
                  <div className="space-y-3 text-xs">
                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">TOR Requirement Clause</span>
                      <span className="font-bold text-slate-900 text-xs">{req?.requirementText}</span>
                      <div className="text-[10px] font-mono text-slate-500 mt-1">
                        Source: {req?.sourceFile} • Page {req?.sourcePage || 1} • {req?.sourceClause}
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Match Rationale:</span>
                      <p className="text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-200">{selectedMatch.matchRationale}</p>
                    </div>

                    {ev ? (
                      <div className="p-3 rounded border border-indigo-200 bg-indigo-50/40 space-y-2">
                        <span className="font-bold text-indigo-900 block text-xs">Matched Source Document: {ev.title}</span>
                        <div className="text-[10px] font-mono text-indigo-700">
                          Source File: {ev.sourceFile} (Page {ev.sourcePage || 1}, {ev.sourceSection || 'Section'})
                        </div>

                        <div className="p-2.5 rounded bg-white border border-indigo-200 text-slate-900 font-mono text-[11px] leading-relaxed">
                          <span className="text-indigo-800 font-bold block mb-1 text-[10px] uppercase">Verbatim Source Quote:</span>
                          "{ev.sourceQuote}"
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-900 text-xs italic">
                        No supporting document found in library. Requirement status = MISSING.
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="p-8 text-center text-slate-400 italic text-xs">
                Select any match from the left list to inspect exact verbatim quotes and page numbers.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: EVIDENCE GAPS */}
      {activeTab === 'gaps' && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center space-x-1.5">
            <ShieldAlert className="w-4 h-4 text-purple-600" />
            <span>Detected Evidence Gaps & Recommended Actions ({evidencePackage.gaps.length})</span>
          </h3>

          {evidencePackage.gaps.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50 border border-emerald-200 rounded text-emerald-900 text-xs font-semibold">
              ✓ Zero evidence gaps detected. All requirements have verified supporting documentation.
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {evidencePackage.gaps.map((gap) => (
                <div key={gap.id} className="p-3 rounded border border-slate-200 bg-slate-50/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{gap.description}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      gap.severity === 'CRITICAL' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {gap.severity}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">Missing Facts: {gap.missingFacts.join(', ')}</p>
                  <div className="p-2 rounded bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold text-[11px]">
                    Recommended Action: {gap.recommendedAction}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AUDITOR MANUAL VERIFICATION */}
      {activeTab === 'verification' && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Human Auditor Verification Control Panel</span>
          </h3>

          {selectedMatch ? (
            <div className="space-y-4 text-xs max-w-xl">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Requirement</span>
                <span className="font-bold text-slate-900">{selectedMatch.requirementId}</span>
                <p className="text-slate-600 mt-1">{selectedMatch.matchRationale}</p>
                <div className="mt-2 text-[10px] font-mono text-indigo-700">
                  Current Verification Status: <strong>{selectedMatch.verificationStatus}</strong>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Auditor Verification Note:</label>
                <input
                  type="text"
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                  placeholder="Enter auditor review note (e.g. Verified against physical ICAB seal)..."
                  className="w-full text-xs p-2 border border-slate-300 rounded focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  onClick={() => handleManualVerify('VERIFIED')}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded shadow-2xs flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Verify Evidence</span>
                </button>

                <button
                  onClick={() => handleManualVerify('REJECTED')}
                  className="px-3.5 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded shadow-2xs flex items-center space-x-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject Match</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 italic text-xs">
              Select a requirement match to perform manual auditor verification.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
