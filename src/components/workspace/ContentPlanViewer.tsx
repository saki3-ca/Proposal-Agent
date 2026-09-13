import React, { useState, useEffect } from 'react';
import {
  Project,
  Requirement,
  ProposalContentPlan,
  ProposalContentPlanSection,
  ProposalRequirementMapping,
  ProposalEvidenceRequirement,
  ProposalPlanningGap,
  HouseStyleProfile
} from '../../types';
import { ProposalPlannerService } from '../../services/proposalPlannerService';
import { HouseStyleService } from '../../services/houseStyleService';
import {
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Layers,
  Sparkles,
  RefreshCw,
  Info,
  ChevronRight,
  ShieldAlert,
  Award,
  BookOpen,
  FileText,
  FileSearch,
  ListTree,
  Scale
} from 'lucide-react';

interface ContentPlanViewerProps {
  project: Project;
  requirements: Requirement[];
  onNavigateToDrafting?: () => void;
}

export const ContentPlanViewer: React.FC<ContentPlanViewerProps> = ({
  project,
  requirements,
  onNavigateToDrafting
}) => {
  const [contentPlan, setContentPlan] = useState<ProposalContentPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'architecture' | 'mappings' | 'evaluation' | 'evidence' | 'gaps'>('architecture');
  const [selectedSection, setSelectedSection] = useState<ProposalContentPlanSection | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<ProposalRequirementMapping | null>(null);

  useEffect(() => {
    const existingPlan = ProposalPlannerService.getContentPlan(project.id);
    if (existingPlan) {
      setContentPlan(existingPlan);
    } else {
      handleGeneratePlan();
    }
  }, [project.id]);

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const profile = HouseStyleService.getActiveProfile();
      const plan = await ProposalPlannerService.generateContentPlan(project, requirements, profile);
      setContentPlan(plan);
    } catch (e) {
      console.error('Failed to generate content plan:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusBadge = (status: ProposalContentPlan['status']) => {
    switch (status) {
      case 'READY_FOR_DRAFTING':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-700" />
            READY FOR DRAFTING
          </span>
        );
      case 'READY_FOR_EVIDENCE':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
            <FileSearch className="w-3.5 h-3.5 mr-1 text-indigo-700" />
            READY FOR PHASE 5 EVIDENCE
          </span>
        );
      case 'REVIEW_REQUIRED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-700" />
            REVIEW REQUIRED
          </span>
        );
      case 'NOT_READY':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-red-100 text-red-900 border border-red-300">
            <ShieldAlert className="w-3.5 h-3.5 mr-1 text-red-700" />
            NOT READY (Hard Blockers Exist)
          </span>
        );
    }
  };

  const getSourceBadge = (source: ProposalContentPlanSection['source']) => {
    switch (source) {
      case 'TOR_REQUIRED':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-50 text-amber-800 border border-amber-200">TOR Mandatory</span>;
      case 'REFERENCE_PROPOSAL':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-800 border border-emerald-200">Reference Style</span>;
      case 'ACNABIN_STANDARD':
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">ACNABIN Standard</span>;
    }
  };

  const getSeverityBadge = (severity: ProposalPlanningGap['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-800 border border-red-300">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-300">HIGH</span>;
      case 'MEDIUM':
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800 border border-blue-300">MEDIUM</span>;
    }
  };

  if (isGenerating || !contentPlan) {
    return (
      <div className="bg-white rounded border border-slate-200 p-12 text-center shadow-2xs space-y-4">
        <RefreshCw className="w-8 h-8 text-[#714B67] animate-spin mx-auto" />
        <h3 className="text-sm font-bold text-slate-900">Reconciling TOR & Reference Proposal Architecture...</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Mapping TOR requirements to proposal sections, separating narrative responses from submission controls, and generating evidence plans.
        </p>
      </div>
    );
  }

  const mappedReqCount = requirements.length - (contentPlan.planningGaps.find(g => g.type === 'UNMAPPED_REQUIREMENT')?.requirementIds.length || 0);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">Proposal Content Plan</h2>
              {getStatusBadge(contentPlan.status)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Controlled planning blueprint mapping {requirements.length} TOR requirements to {contentPlan.sections.length} proposal sections.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Planning Readiness</span>
              <span className="text-lg font-mono font-bold text-[#714B67]">{contentPlan.readinessScore}%</span>
            </div>

            <button
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="px-3.5 py-1.5 bg-[#714B67] hover:bg-[#51304A] text-white text-xs font-bold rounded shadow-2xs transition-colors flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate Content Plan</span>
            </button>
          </div>
        </div>

        {/* Summary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Proposal Sections</span>
            <span className="text-base font-mono font-bold text-slate-900">{contentPlan.sections.length}</span>
          </div>

          <div className="p-2.5 rounded bg-emerald-50/60 border border-emerald-200">
            <span className="text-[10px] text-emerald-800 font-bold block uppercase">Mapped Requirements</span>
            <span className="text-base font-mono font-bold text-emerald-900">{mappedReqCount} / {requirements.length}</span>
          </div>

          <div className="p-2.5 rounded bg-indigo-50/60 border border-indigo-200">
            <span className="text-[10px] text-indigo-800 font-bold block uppercase">Evidence Needs</span>
            <span className="text-base font-mono font-bold text-indigo-900">{contentPlan.evidenceRequirements.length}</span>
          </div>

          <div className="p-2.5 rounded bg-amber-50/60 border border-amber-200">
            <span className="text-[10px] text-amber-800 font-bold block uppercase">Submission Controls</span>
            <span className="text-base font-mono font-bold text-amber-900">{contentPlan.submissionItems.length}</span>
          </div>

          <div className="p-2.5 rounded bg-red-50/60 border border-red-200">
            <span className="text-[10px] text-red-800 font-bold block uppercase">Planning Gaps</span>
            <span className="text-base font-mono font-bold text-red-900">{contentPlan.planningGaps.length}</span>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="border-b border-slate-200 flex items-center space-x-1 overflow-x-auto bg-white p-1 rounded border">
        {[
          { id: 'architecture', label: 'Proposal Architecture', icon: ListTree, count: contentPlan.sections.length },
          { id: 'mappings', label: 'Requirement Allocation', icon: Layers, count: contentPlan.requirementMappings.length },
          { id: 'evaluation', label: 'Evaluation & Deliverables', icon: Scale, count: (contentPlan.evaluationAlignment?.length || 0) },
          { id: 'evidence', label: 'Evidence Plan (Phase 5)', icon: FileSearch, count: contentPlan.evidenceRequirements.length },
          { id: 'gaps', label: 'Planning Gaps & Risk', icon: ShieldAlert, count: contentPlan.planningGaps.length }
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

      {/* TAB 1: PROPOSAL ARCHITECTURE TREE */}
      {activeTab === 'architecture' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Reconciled Proposal Structure Hierarchy
            </h3>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {contentPlan.sections.map((sec) => (
                <div
                  key={sec.id}
                  onClick={() => setSelectedSection(sec)}
                  className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between text-xs rounded ${
                    selectedSection?.id === sec.id ? 'bg-indigo-50/70 border border-indigo-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="font-mono text-slate-400 w-6 font-bold">{sec.sectionNumber}</span>
                    <div className="min-w-0">
                      <span className={`font-bold ${sec.level === 1 ? 'text-slate-900 text-xs' : 'text-slate-700 text-[11px] pl-2'}`}>
                        {sec.title}
                      </span>
                      <div className="flex items-center space-x-2 mt-0.5 text-[10px] text-slate-500 font-mono">
                        <span>{sec.torRequirementIds.length} Req(s) Mapped</span>
                        <span>•</span>
                        <span>{sec.sectionType}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {getSourceBadge(sec.source)}
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section Writing Brief Drawer */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Section Writing Brief</span>
            </h3>

            {selectedSection ? (
              <div className="space-y-3 text-xs">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Section</span>
                  <span className="font-bold text-slate-900 text-xs">{selectedSection.sectionNumber}. {selectedSection.title}</span>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-1">Section Purpose:</span>
                  <p className="text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-200">{selectedSection.purpose}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-1">Writing Guidance:</span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                    {selectedSection.writingGuidance.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-2.5 rounded bg-red-50/70 border border-red-200">
                  <span className="font-bold text-red-900 block mb-1 text-[11px]">Prohibited Content:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-red-800">
                    {selectedSection.prohibitedContent.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 italic text-xs">
                Click any section on the left tree to inspect its detailed writing brief instructions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: REQUIREMENT ALLOCATION MATRIX */}
      {activeTab === 'mappings' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              TOR Requirement → Proposal Section Allocation Matrix
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Traceability Preserved across Files & Clauses</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse odoo-table">
              <thead>
                <tr>
                  <th className="w-32 font-mono">TOR Source</th>
                  <th>Requirement Clause</th>
                  <th>Proposal Section Destination</th>
                  <th className="w-36">Response Approach</th>
                  <th className="w-36">Relationship</th>
                  <th className="w-24 text-center">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {contentPlan.requirementMappings.map((map) => {
                  const targetSec = contentPlan.sections.find(s => s.id === map.proposalSectionId);
                  return (
                    <tr key={map.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedMapping(map)}>
                      <td className="font-mono text-[10px] text-slate-600">
                        <div>{map.sourceFile || 'TOR.pdf'}</div>
                        <div className="text-slate-400">P.{map.sourcePage || 1} • {map.sourceClause || 'Clause'}</div>
                      </td>
                      <td>
                        <div className="font-bold text-slate-900 line-clamp-2">{map.sourceQuote || map.requirementId}</div>
                      </td>
                      <td className="font-semibold text-indigo-900">
                        {targetSec ? `${targetSec.sectionNumber}. ${targetSec.title}` : 'Unmapped'}
                      </td>
                      <td className="font-mono text-[11px]">{map.responseApproach}</td>
                      <td className="font-mono text-[10px]">
                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                          map.relationship === 'PRIMARY_RESPONSE' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          map.relationship === 'SUBMISSION_CONTROL' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {map.relationship}
                        </span>
                      </td>
                      <td className="text-center font-bold">
                        {map.evidenceRequired ? (
                          <span className="text-indigo-700">✓ Yes</span>
                        ) : (
                          <span className="text-slate-300">No</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EVALUATION CRITERIA & DELIVERABLES */}
      {activeTab === 'evaluation' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Evaluation Criteria */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center space-x-1.5">
              <Scale className="w-4 h-4 text-indigo-600" />
              <span>Evaluation Criteria Alignment</span>
            </h3>

            <div className="space-y-3">
              {(contentPlan.evaluationAlignment || []).map((evalItem) => (
                <div key={evalItem.id} className="p-3 rounded border border-slate-200 bg-slate-50/50 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{evalItem.criterionText}</span>
                    {evalItem.weight && (
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        Weight: {evalItem.weight}%
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600">{evalItem.planningNotes.join(' ')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Submission Items */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center space-x-1.5">
              <FileCheck2 className="w-4 h-4 text-amber-600" />
              <span>Submission Controls (Non-Narrative Requirements)</span>
            </h3>

            <div className="space-y-2 text-xs">
              {contentPlan.submissionItems.map((sub) => (
                <div key={sub.id} className="p-2.5 rounded border border-slate-200 bg-amber-50/40 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{sub.itemTitle}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Category: {sub.submissionCategory}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded border border-amber-300">
                    {sub.targetSectionOrAppendix}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EVIDENCE REQUIREMENTS PLAN */}
      {activeTab === 'evidence' && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Required Evidence Artifacts Plan (Phase 5 Input)
            </h3>
            <span className="text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-semibold">
              Status = READY_FOR_PHASE_5 (No evidence retrieved in Phase 4)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {contentPlan.evidenceRequirements.map((ev) => (
              <div key={ev.id} className="p-3 rounded border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 uppercase font-mono text-[10px]">{ev.evidenceType}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {ev.status}
                  </span>
                </div>
                <p className="font-semibold text-slate-900 text-xs">{ev.description}</p>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                  <span>Target Repository: {ev.sourceExpected}</span>
                  <span>Mandatory: {ev.mandatory ? 'Yes' : 'No'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PLANNING GAPS & RISKS */}
      {activeTab === 'gaps' && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center space-x-1.5">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>Detected Planning Gaps & Action Items</span>
          </h3>

          {contentPlan.planningGaps.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50 border border-emerald-200 rounded text-emerald-900 text-xs font-semibold">
              ✓ Zero planning gaps detected. All TOR requirements are successfully allocated.
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {contentPlan.planningGaps.map((gap) => (
                <div key={gap.id} className="p-3 rounded border border-slate-200 bg-slate-50/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{gap.type}</span>
                    {getSeverityBadge(gap.severity)}
                  </div>
                  <p className="text-slate-700">{gap.description}</p>
                  <div className="p-2 rounded bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold text-[11px]">
                    Recommended Action: {gap.recommendedAction}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
