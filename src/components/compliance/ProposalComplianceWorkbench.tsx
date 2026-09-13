import React, { useState, useEffect } from 'react';
import {
  ComplianceAudit,
  ComplianceFinding,
  RequirementComplianceRecord,
  EvaluationAuditRecord,
  SubmissionAuditRecord,
  ConsistencyFinding,
  ProposalComplianceReadiness,
  ComplianceStatus,
  FindingStatus
} from '../../types';
import { ProposalComplianceAuditService } from '../../services/proposalComplianceAuditService';
import { DocxGenerationService } from '../../services/docxGenerationService';
import {
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCheck,
  Layers,
  Search,
  Filter,
  Check,
  X,
  Lock,
  ChevronRight,
  HelpCircle,
  FileText,
  UserCheck,
  AlertCircle,
  History,
  Edit3
} from 'lucide-react';

interface ProposalComplianceWorkbenchProps {
  projectId: string;
}

export const ProposalComplianceWorkbench: React.FC<ProposalComplianceWorkbenchProps> = ({ projectId }) => {
  const [audit, setAudit] = useState<ComplianceAudit | null>(null);
  const [readiness, setReadiness] = useState<ProposalComplianceReadiness | null>(null);
  const [findings, setFindings] = useState<ComplianceFinding[]>([]);
  const [reqRecords, setReqRecords] = useState<RequirementComplianceRecord[]>([]);
  const [evalRecords, setEvalRecords] = useState<EvaluationAuditRecord[]>([]);
  const [subRecords, setSubRecords] = useState<SubmissionAuditRecord[]>([]);
  const [consistencyFindings, setConsistencyFindings] = useState<ConsistencyFinding[]>([]);

  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'evaluation' | 'evidence' | 'submission' | 'consistency' | 'findings' | 'history'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Selected Requirement for Traceability Drawer
  const [selectedReq, setSelectedReq] = useState<RequirementComplianceRecord | null>(null);
  
  // Override Modal
  const [overrideFindingTarget, setOverrideFindingTarget] = useState<ComplianceFinding | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<FindingStatus>('RESOLVED');
  const [overrideNote, setOverrideNote] = useState('');

  // Filter state for findings
  const [findingSeverityFilter, setFindingSeverityFilter] = useState<string>('ALL');

  useEffect(() => {
    loadAuditData();
  }, [projectId]);

  const loadAuditData = async () => {
    setIsLoading(true);
    try {
      let currentAudit = await ProposalComplianceAuditService.getComplianceAudit(projectId);
      if (!currentAudit) {
        currentAudit = await ProposalComplianceAuditService.runComplianceAudit(projectId);
      }
      setAudit(currentAudit);

      const [rReadiness, rFindings, rReqs, rEval, rSub, rCons] = await Promise.all([
        ProposalComplianceAuditService.getComplianceReadiness(projectId),
        ProposalComplianceAuditService.getComplianceFindings(projectId),
        ProposalComplianceAuditService.getRequirementCompliance(projectId),
        ProposalComplianceAuditService.getEvaluationAudit(projectId),
        ProposalComplianceAuditService.getSubmissionAudit(projectId),
        ProposalComplianceAuditService.getConsistencyFindings(projectId)
      ]);

      setReadiness(rReadiness);
      setFindings(rFindings);
      setReqRecords(rReqs);
      setEvalRecords(rEval);
      setSubRecords(rSub);
      setConsistencyFindings(rCons);
    } catch (e: any) {
      console.error('Error loading compliance audit workbench data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAudit = async () => {
    setIsLoading(true);
    try {
      await ProposalComplianceAuditService.runComplianceAudit(projectId);
      await loadAuditData();
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyOverride = async () => {
    if (!overrideFindingTarget || !overrideNote.trim()) return;
    await ProposalComplianceAuditService.overrideFinding(projectId, overrideFindingTarget.id, overrideStatus, overrideNote.trim());
    setOverrideFindingTarget(null);
    setOverrideNote('');
    await loadAuditData();
  };

  if (!audit || isLoading) {
    return (
      <div className="p-12 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-600 mx-auto animate-spin" />
        <h3 className="text-sm font-bold text-slate-800">Executing Independent Dual-Model Compliance Audit...</h3>
        <p className="text-xs text-slate-500">Auditing TOR requirements, evidence claims, evaluation criteria, and submission controls.</p>
      </div>
    );
  }

  const getResultBadge = () => {
    if (audit.overallResult === 'PASS') {
      return (
        <span className="px-3.5 py-1 bg-emerald-600 text-white font-extrabold text-xs rounded-full shadow-xs flex items-center">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          PASS — FULL COMPLIANCE
        </span>
      );
    }
    if (audit.overallResult === 'PASS_WITH_ISSUES') {
      return (
        <span className="px-3.5 py-1 bg-amber-600 text-white font-extrabold text-xs rounded-full shadow-xs flex items-center">
          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
          PASS WITH REVIEW ITEMS
        </span>
      );
    }
    return (
      <span className="px-3.5 py-1 bg-rose-600 text-white font-extrabold text-xs rounded-full shadow-xs flex items-center">
        <AlertOctagon className="w-3.5 h-3.5 mr-1" />
        BLOCKED — HARD BLOCKERS ACTIVE
      </span>
    );
  };

  const filteredFindings = findings.filter((f) => {
    if (findingSeverityFilter === 'ALL') return true;
    return f.severity === findingSeverityFilter;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Readiness Dashboard Hero Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-[11px] font-bold uppercase rounded font-mono">
                Phase 7 Independent Audit
              </span>
              <h2 className="text-lg font-bold text-slate-900">Proposal Quality & Compliance Review</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Dual-Model Quality Audit | Audit Version {audit.version} | Last Audited: {new Date(audit.updatedAt).toLocaleTimeString()}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {getResultBadge()}

            <button
              onClick={handleRunAudit}
              disabled={isLoading}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Re-run Audit
            </button>

            <button
              onClick={async () => {
                try {
                  await DocxGenerationService.downloadDocx(projectId);
                } catch (e: any) {
                  alert(e?.message || 'DOCX Generation refused by Phase 7 gate.');
                }
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center transition"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Generate Native DOCX
            </button>
          </div>
        </div>

        {/* Metric Counters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="text-[10px] uppercase font-bold text-slate-500">Readiness Score</div>
            <div className="text-xl font-extrabold text-indigo-600">{audit.overallComplianceScore}%</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="text-[10px] uppercase font-bold text-slate-500">Mandatory Score</div>
            <div className="text-xl font-extrabold text-emerald-600">{audit.mandatoryComplianceScore}%</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="text-[10px] uppercase font-bold text-slate-500">Evaluation Score</div>
            <div className="text-xl font-extrabold text-blue-600">{audit.evaluationAlignmentScore}%</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="text-[10px] uppercase font-bold text-slate-500">Submission Score</div>
            <div className="text-xl font-extrabold text-teal-600">{audit.submissionReadinessScore}%</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="text-[10px] uppercase font-bold text-slate-500">Critical Findings</div>
            <div className={`text-xl font-extrabold ${audit.criticalFindingCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {audit.criticalFindingCount}
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="text-[10px] uppercase font-bold text-slate-500">Phase 8 Gate</div>
            <div className="text-xs font-extrabold mt-1">
              {readiness?.overallResult === 'READY_FOR_DOCX' ? (
                <span className="text-emerald-700">✓ READY FOR DOCX</span>
              ) : readiness?.overallResult === 'READY_WITH_REVIEW_ITEMS' ? (
                <span className="text-amber-700">⚠ REVIEW NEEDED</span>
              ) : (
                <span className="text-rose-700">✕ BLOCKED</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center space-x-1 bg-white p-1 rounded-lg border overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2 text-xs font-bold rounded-md transition ${activeTab === 'overview' ? 'bg-[#714B67] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Overview Summary
        </button>
        <button
          onClick={() => setActiveTab('requirements')}
          className={`px-3 py-2 text-xs font-bold rounded-md transition ${activeTab === 'requirements' ? 'bg-[#714B67] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Requirements Matrix ({reqRecords.length})
        </button>
        <button
          onClick={() => setActiveTab('evaluation')}
          className={`px-3 py-2 text-xs font-bold rounded-md transition ${activeTab === 'evaluation' ? 'bg-[#714B67] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Evaluation Alignment ({evalRecords.length})
        </button>
        <button
          onClick={() => setActiveTab('submission')}
          className={`px-3 py-2 text-xs font-bold rounded-md transition ${activeTab === 'submission' ? 'bg-[#714B67] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Submission Checklist ({subRecords.length})
        </button>
        <button
          onClick={() => setActiveTab('findings')}
          className={`px-3 py-2 text-xs font-bold rounded-md transition ${activeTab === 'findings' ? 'bg-[#714B67] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Audit Findings ({findings.length})
        </button>
        <button
          onClick={() => setActiveTab('consistency')}
          className={`px-3 py-2 text-xs font-bold rounded-md transition ${activeTab === 'consistency' ? 'bg-[#714B67] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Consistency Audit ({consistencyFindings.length})
        </button>
      </div>

      {/* 3. Notebook Tab Content Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Executive Audit Summary</h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              The independent Phase 7 compliance engine evaluated Section Drafts, Verified Evidence, and Submission Items against the TOR requirements. 
              {audit.overallResult === 'BLOCKED' ? (
                <span className="font-bold text-rose-700"> Hard blockers are active due to unresolved mandatory eligibility items, team PQE shortfalls, or reference client contamination. Phase 8 DOCX generation is blocked until issues are resolved.</span>
              ) : (
                <span className="font-bold text-emerald-700"> Proposal structure is compliant with mandatory requirements and ready for Phase 8 native DOCX generation.</span>
              )}
            </p>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-800">Hard Blockers & Critical Findings:</h4>
              {readiness?.hardBlockers && readiness.hardBlockers.length > 0 ? (
                <div className="space-y-2">
                  {readiness.hardBlockers.map((hb, idx) => (
                    <div key={idx} className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-900 flex items-start space-x-2">
                      <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{hb}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-900 flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2" />
                  No critical hard blockers detected.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Phase 8 Gate Status</h3>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase font-mono">isReadyForDocx()</div>
              <div className={`text-xl font-black ${readiness?.overallResult === 'READY_FOR_DOCX' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {readiness?.overallResult === 'READY_FOR_DOCX' ? 'TRUE (READY)' : 'FALSE (BLOCKED)'}
              </div>
              <p className="text-[11px] text-slate-600">
                Phase 8 Native DOCX Generation requires 0 open critical findings and full mandatory compliance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Requirements Matrix */}
      {activeTab === 'requirements' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">TOR Requirement Compliance Matrix</h3>
            <span className="text-xs text-slate-500 font-mono">Click row for full traceability</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Requirement</th>
                  <th className="p-3">Mandatory</th>
                  <th className="p-3">Adequacy</th>
                  <th className="p-3">Compliance Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {reqRecords.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => setSelectedReq(req)}
                    className="hover:bg-indigo-50/50 cursor-pointer transition"
                  >
                    <td className="p-3 font-mono font-bold text-indigo-700">{req.requirementId}</td>
                    <td className="p-3 font-semibold text-slate-600">{req.requirementCategory}</td>
                    <td className="p-3 font-medium text-slate-900 max-w-xs truncate">{req.sourceQuote}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${req.mandatory ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>
                        {req.mandatory ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td className="p-3 font-bold">{req.responseAdequacy}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full font-mono font-bold text-[10px] ${
                          req.status === 'COMPLIANT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'PARTIALLY_COMPLIANT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button className="text-indigo-600 font-bold hover:underline text-xs flex items-center">
                        Trace <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Evaluation Criteria */}
      {activeTab === 'evaluation' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Weighted TOR Evaluation Alignment</h3>

          <div className="space-y-3">
            {evalRecords.map((ev) => (
              <div key={ev.id} className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                      {ev.criterionId}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{ev.criterionText}</h4>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded font-mono font-bold text-[10px] ${
                      ev.scoreRisk === 'LOW'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ev.scoreRisk === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    Risk: {ev.scoreRisk}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                  <div>
                    <span className="font-bold text-emerald-800">Strengths:</span>
                    <ul className="list-disc list-inside text-slate-600 space-y-0.5 mt-1">
                      {ev.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-bold text-rose-800">Weaknesses / Gaps:</span>
                    <ul className="list-disc list-inside text-slate-600 space-y-0.5 mt-1">
                      {ev.weaknesses.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Submission Checklist */}
      {activeTab === 'submission' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Submission Controls & Legal Document Checklist</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {subRecords.map((sub) => (
              <div key={sub.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">{sub.requirementText}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">Location: {sub.proposalOrPackageLocation}</div>
                </div>
                <span
                  className={`px-2 py-1 rounded font-mono font-bold text-[10px] ${
                    sub.status === 'READY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {sub.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Findings Management */}
      {activeTab === 'findings' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Audit Findings & Human Review Overrides</h3>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-600">Filter Severity:</span>
              <select
                value={findingSeverityFilter}
                onChange={(e) => setFindingSeverityFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded p-1 font-semibold text-slate-700"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical Only</option>
                <option value="MAJOR">Major Only</option>
                <option value="MINOR">Minor Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredFindings.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No audit findings matching filter criteria.</p>
            ) : (
              filteredFindings.map((fnd) => (
                <div key={fnd.id} className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          fnd.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : fnd.severity === 'MAJOR'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {fnd.severity}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{fnd.title}</h4>
                    </div>

                    <button
                      onClick={() => setOverrideFindingTarget(fnd)}
                      className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px] font-bold rounded"
                    >
                      Review / Override
                    </button>
                  </div>

                  <p className="text-xs text-slate-700">{fnd.description}</p>
                  <div className="text-[11px] text-indigo-900 bg-indigo-50/70 p-2 rounded border border-indigo-100">
                    <strong>Recommended Action:</strong> {fnd.recommendedAction}
                  </div>
                  {fnd.reviewerNote && (
                    <div className="text-[11px] text-emerald-900 bg-emerald-50 p-2 rounded border border-emerald-200">
                      <strong>Human Reviewer Note:</strong> {fnd.reviewerNote} (Status: {fnd.status})
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Consistency Audit */}
      {activeTab === 'consistency' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Cross-Section Consistency Audit</h3>

          <div className="space-y-3">
            {consistencyFindings.length === 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-medium">
                ✓ No cross-section entity contradictions detected across draft sections.
              </div>
            ) : (
              consistencyFindings.map((cf) => (
                <div key={cf.id} className="p-4 rounded-lg border border-rose-300 bg-rose-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-rose-800 uppercase">Conflict: {cf.entityType}</span>
                    <span className="px-2 py-0.5 bg-rose-200 text-rose-900 font-bold text-[10px] rounded">{cf.severity}</span>
                  </div>
                  <p className="text-xs text-slate-800">
                    <strong>Action Required:</strong> {cf.recommendedAction}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Requirement Traceability Drawer */}
      {selectedReq && (
        <div className="fixed inset-0 bg-slate-900/50 flex justify-end z-50">
          <div className="bg-white max-w-xl w-full h-full p-6 overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                  {selectedReq.requirementId}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">Requirement Compliance Traceability</h3>
              </div>
              <button onClick={() => setSelectedReq(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">TOR Requirement Text:</div>
                <p className="italic text-slate-800">"{selectedReq.sourceQuote}"</p>
                <div className="text-[11px] text-slate-500 font-mono pt-1">
                  Source: {selectedReq.sourceFile} (Page {selectedReq.sourcePage})
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">Auditor Rationale & Findings:</div>
                <p>{selectedReq.auditorRationale}</p>
              </div>

              <div className="p-3 bg-indigo-50/50 rounded border border-indigo-200 space-y-1">
                <div className="font-bold text-indigo-900">Traceability Trail:</div>
                <div>Requirement [{selectedReq.requirementId}] → Proposal Content → Verified Evidence → Audit Result ({selectedReq.status})</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {overrideFindingTarget && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Human Reviewer Override</h3>

            <p className="text-xs text-slate-600">
              Override finding: <span className="font-bold text-slate-800">{overrideFindingTarget.title}</span>
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">New Finding Status:</label>
              <select
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value as FindingStatus)}
                className="w-full text-xs border border-slate-300 rounded p-2 font-semibold"
              >
                <option value="RESOLVED">RESOLVED</option>
                <option value="WAIVED">WAIVED</option>
                <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Reviewer Rationale & Override Note:</label>
              <textarea
                rows={3}
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
                placeholder="Enter justification for human override..."
                className="w-full text-xs border border-slate-300 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button onClick={() => setOverrideFindingTarget(null)} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded">
                Cancel
              </button>
              <button onClick={handleApplyOverride} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700">
                Confirm Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
