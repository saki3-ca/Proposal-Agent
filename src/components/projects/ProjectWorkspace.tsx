import React, { useState } from 'react';
import { Project, Requirement, ProposalSection, ProjectDocument } from '../../types';
import { OdooStatusBar } from '../layout/OdooStatusBar';
import { RequirementMatrix } from '../requirements/RequirementMatrix';
import { DocumentUpload } from '../documents/DocumentUpload';
import { DocumentViewer } from '../documents/DocumentViewer';
import { ExpertMatching } from '../matching/ExpertMatching';
import { ExperienceMatching } from '../matching/ExperienceMatching';
import { StyleIntelligence } from '../proposals/StyleIntelligence';
import { ContentPlanViewer } from '../workspace/ContentPlanViewer';
import { EvidenceMatrixViewer } from '../workspace/EvidenceMatrixViewer';
import { ProposalDraftWorkbench } from '../proposals/ProposalDraftWorkbench';
import { FinancialWorkspace } from '../financial/FinancialWorkspace';
import { PrescribedForms } from '../forms/PrescribedForms';
import { PptxChangeReview } from '../pptx/PptxChangeReview';
import { ProposalComplianceWorkbench } from '../compliance/ProposalComplianceWorkbench';
import { ProposalVisualQaWorkbench } from '../proposals/ProposalVisualQaWorkbench';
import { SubmissionPackage } from '../submission/SubmissionPackage';
import { SubmissionPackageService } from '../../services/submissionPackageService';
import { LocalDocumentPipeline } from '../../services/localDocumentPipeline';
import {
  MOCK_PROJECT_DOCUMENTS,
  MOCK_REQUIREMENTS,
  MOCK_PROPOSAL_SECTIONS,
  MOCK_FINANCIAL_PROPOSAL,
  MOCK_PRESCRIBED_FORMS,
  MOCK_PPTX_CHANGES,
  MOCK_COMPLIANCE_SUMMARY
} from '../../services/mockData';
import {
  CheckCircle2,
  FileText,
  Users,
  Award,
  Sparkles,
  ListTree,
  Database,
  Edit3,
  Calculator,
  FileCheck2,
  Presentation,
  ShieldCheck,
  PackageCheck,
  Eye,
  Download,
  ArrowRight,
  Loader2,
  AlertTriangle as AlertTriangleIcon
} from 'lucide-react';

import { ProposalDatabaseService } from '../../services/proposalDatabaseService';
import { ProposalPreparationService } from '../../services/proposalPreparationService';

interface ProjectWorkspaceProps {
  project: Project;
  onNavigate: (path: string) => void;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ project, onNavigate }) => {
  // 5 Simplified Primary Stages
  const [activeStage, setActiveStage] = useState<'requirements' | 'documents' | 'proposal' | 'review' | 'download'>('proposal');

  // Sub-navigation states
  const [docSubTab, setDocSubTab] = useState<'docs' | 'evidence' | 'experts' | 'experience'>('docs');
  const [propSubTab, setPropSubTab] = useState<'editor' | 'plan' | 'financial' | 'forms' | 'style'>('editor');
  const [reviewSubTab, setReviewSubTab] = useState<'compliance' | 'visual_qa' | 'pptx'>('compliance');

  const [documents, setDocuments] = useState<ProjectDocument[]>(() => {
    const loaded = ProposalDatabaseService.getProjectDocuments(project.id);
    return loaded && loaded.length > 0 ? loaded : MOCK_PROJECT_DOCUMENTS;
  });
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>(() => {
    const loaded = ProposalDatabaseService.getProjectRequirements(project.id);
    return loaded && loaded.length > 0 ? loaded : MOCK_REQUIREMENTS;
  });

  React.useEffect(() => {
    const loadedReqs = ProposalDatabaseService.getProjectRequirements(project.id);
    if (loadedReqs && loadedReqs.length > 0) {
      setRequirements(loadedReqs);
    }
    const loadedDocs = ProposalDatabaseService.getProjectDocuments(project.id);
    if (loadedDocs && loadedDocs.length > 0) {
      setDocuments(loadedDocs);
    }
  }, [project.id]);

  const pipelineSteps = [
    { id: 'requirements', label: '1. TOR & Requirements' },
    { id: 'documents', label: '2. Documents & Evidence' },
    { id: 'proposal', label: '3. Proposal' },
    { id: 'review', label: '4. Review' },
    { id: 'download', label: '5. Download' }
  ];

  const handleUpdateRequirement = (reqId: string, comment: string) => {
    setRequirements((prev) => {
      const updated = prev.map((r) =>
        r.id === reqId ? { ...r, reviewerComment: comment, isVerified: true, verifiedBy: 'Farhan Ahmed' } : r
      );
      ProposalDatabaseService.saveProjectRequirements(project.id, updated);
      return updated;
    });
  };

  const handleDocumentUpload = async (newDoc: any) => {
    setDocuments((prev) => {
      const updated = [newDoc, ...prev];
      ProposalDatabaseService.saveProjectDocuments(project.id, updated);
      return updated;
    });

    const pipelineResult = await LocalDocumentPipeline.runFullPipeline({
      name: newDoc.fileName,
      type: newDoc.fileType
    } as any);

    const autoReq: Requirement = {
      id: `req-auto-${Date.now()}`,
      projectId: project.id,
      requirementText: `Extracted TOR Criterion from ${newDoc.fileName}: Compliance & Technical Verification Required`,
      category: 'Technical',
      classification: 'Proposal Content',
      mandatory: true,
      sourceFile: newDoc.fileName,
      sourcePage: 1,
      sourceSection: 'Uploaded Document Terms',
      status: 'READY',
      aiInterpretation: `MarkItDown processed ${newDoc.fileName} (${newDoc.fileSizeMb} MB). Extracted mandatory terms.`,
      evidenceFound: [`MarkItDown Extracted Section 1`],
      evidenceStatus: 'Available',
      aiConfidence: 0.98,
      reviewerComment: `Auto-analyzed by MarkItDown.`,
      isVerified: true
    };

    setRequirements((prev) => {
      const updated = [autoReq, ...prev];
      ProposalDatabaseService.saveProjectRequirements(project.id, updated);
      return updated;
    });
  };

  return (
    <div className="space-y-4 font-sans">
      {/* 5-Stage Odoo Pipeline Status Bar */}
      <OdooStatusBar
        steps={pipelineSteps}
        activeStepId={activeStage}
        onSelectStep={(id) => {
          setSelectedDoc(null);
          setActiveStage(id as any);
        }}
      />

      {/* Live Proposal Preparation Status Banner */}
      {project.processingState?.status === 'preparing' && (
        <div className="bg-[#1B2A6B] text-white p-4 rounded border border-[#152152] shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse inline-block" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 font-mono">
                PROPOSAL PREPARATION IN PROGRESS
              </span>
            </div>
            <div className="text-xs text-slate-300 font-mono">
              Estimated time remaining: {ProposalPreparationService.formatEstimatedTime(project.processingState?.estimatedRemainingSeconds)}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">
                ● {project.processingState?.currentStage || 'Preparing Proposal Content'}
              </span>
              <span className="font-bold font-mono text-amber-300">
                {project.processingState?.progressPercent || 25}% complete
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-amber-400 to-teal-400 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${project.processingState?.progressPercent || 25}%` }}
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-300 italic">
            Please keep this proposal open or return later. Your progress is saved automatically.
          </p>
        </div>
      )}

      {project.processingState?.status === 'failed' && (
        <div className="bg-red-50 border border-red-300 text-red-900 p-4 rounded shadow-2xs space-y-2">
          <div className="flex items-center space-x-2 font-bold text-xs">
            <AlertTriangleIcon className="w-4 h-4 text-red-600 shrink-0" />
            <span>⚠ Proposal preparation needs attention</span>
          </div>
          <p className="text-xs text-red-800">
            {project.processingState?.errorMessage || 'An error occurred during automated proposal preparation.'}
          </p>
          <button
            onClick={() => {
              const reqs = ProposalDatabaseService.getProjectRequirements(project.id) || [];
              const torModel = ProposalDatabaseService.getProjectTorModel(project.id);
              ProposalPreparationService.startPreparation(project, reqs, torModel);
            }}
            className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-bold transition-colors"
          >
            Retry Preparation
          </button>
        </div>
      )}

      {/* Project Form Sheet Header */}
      <div className="bg-white rounded border border-[#E2E8F0] p-4 shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800">
              {project.tenderType} • Ref: {project.refNumber}
            </span>
            <h1 className="text-base font-bold text-slate-900 mt-1">{project.assignmentTitle || project.name}</h1>
          </div>

          <button
            onClick={() => setActiveStage('download')}
            className="px-3.5 py-1.5 bg-[#1B2A6B] hover:bg-[#152152] text-white text-xs font-bold rounded shadow-2xs flex items-center space-x-1.5 transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download & Submission →</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono text-slate-600">
          <div><strong>Client:</strong> {project.client}</div>
          <div><strong>Manager:</strong> {project.manager}</div>
          <div><strong>Deadline:</strong> {project.submissionDeadline}</div>
          <div><strong>Days Left:</strong> <span className={project.daysLeft && project.daysLeft <= 3 ? 'text-red-700 font-bold' : ''}>{project.daysLeft ?? '—'} days</span></div>
        </div>
      </div>

      {/* Stage-Specific Navigation Sub-bars */}
      {activeStage === 'documents' && (
        <div className="bg-white border border-[#E2E8F0] p-1.5 rounded flex items-center space-x-1 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setDocSubTab('docs')}
            className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
              docSubTab === 'docs' ? 'bg-[#1B2A6B] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Uploaded Documents & OCR ({documents.length})</span>
          </button>
          <button
            onClick={() => setDocSubTab('evidence')}
            className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
              docSubTab === 'evidence' ? 'bg-[#1B2A6B] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Evidence Matrix</span>
          </button>
          <button
            onClick={() => setDocSubTab('experts')}
            className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
              docSubTab === 'experts' ? 'bg-[#1B2A6B] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Expert CVs</span>
          </button>
          <button
            onClick={() => setDocSubTab('experience')}
            className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
              docSubTab === 'experience' ? 'bg-[#1B2A6B] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Firm Experience</span>
          </button>
        </div>
      )}

      {activeStage === 'proposal' && (
        <div className="bg-white border border-[#E2E8F0] p-1.5 rounded flex items-center space-x-1 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setPropSubTab('editor')}
            className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
              propSubTab === 'editor' ? 'bg-[#1B2A6B] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Technical Proposal Draft</span>
          </button>
          <button
            onClick={() => setPropSubTab('plan')}
            className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
              propSubTab === 'plan' ? 'bg-[#1B2A6B] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ListTree className="w-3.5 h-3.5" />
            <span>Content Plan</span>
          </button>
          <button
            onClick={() => setPropSubTab('financial')}
            className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
              propSubTab === 'financial' ? 'bg-[#1B2A6B] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Financial Proposal</span>
          </button>
          <button
            onClick={() => setPropSubTab('forms')}
            className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
              propSubTab === 'forms' ? 'bg-[#1B2A6B] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Prescribed Forms</span>
          </button>
          <button
            onClick={() => setPropSubTab('style')}
            className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
              propSubTab === 'style' ? 'bg-[#1B2A6B] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>House Style</span>
          </button>
        </div>
      )}

      {activeStage === 'review' && (
        <div className="bg-white border border-[#E2E8F0] p-1.5 rounded flex items-center space-x-1 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setReviewSubTab('compliance')}
            className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
              reviewSubTab === 'compliance' ? 'bg-[#1B2A6B] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Compliance Audit & Integrity</span>
          </button>
          <button
            onClick={() => setReviewSubTab('visual_qa')}
            className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
              reviewSubTab === 'visual_qa' ? 'bg-[#1B2A6B] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>DOCX Visual QA</span>
          </button>
          <button
            onClick={() => setReviewSubTab('pptx')}
            className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
              reviewSubTab === 'pptx' ? 'bg-[#1B2A6B] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>Presentation (PPTX)</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="min-h-96">
        {/* STAGE 1: TOR & Requirements */}
        {activeStage === 'requirements' && (
          <RequirementMatrix requirements={requirements} onUpdateRequirement={handleUpdateRequirement} />
        )}

        {/* STAGE 2: Documents & Evidence */}
        {activeStage === 'documents' && (
          <>
            {docSubTab === 'docs' && (
              selectedDoc ? (
                <DocumentViewer document={selectedDoc} onBack={() => setSelectedDoc(null)} />
              ) : (
                <DocumentUpload
                  documents={documents}
                  onUpload={handleDocumentUpload}
                  onViewDocument={(doc) => setSelectedDoc(doc)}
                />
              )
            )}
            {docSubTab === 'evidence' && (
              <EvidenceMatrixViewer project={project} requirements={requirements} />
            )}
            {docSubTab === 'experts' && <ExpertMatching />}
            {docSubTab === 'experience' && <ExperienceMatching />}
          </>
        )}

        {/* STAGE 3: Proposal Drafting & Editing */}
        {activeStage === 'proposal' && (
          <>
            {propSubTab === 'editor' && <ProposalDraftWorkbench projectId={project.id} />}
            {propSubTab === 'plan' && (
              <ContentPlanViewer
                project={project}
                requirements={requirements}
                onNavigateToDrafting={() => setPropSubTab('editor')}
              />
            )}
            {propSubTab === 'financial' && (
              <FinancialWorkspace initialData={MOCK_FINANCIAL_PROPOSAL} onSave={() => {}} />
            )}
            {propSubTab === 'forms' && <PrescribedForms forms={MOCK_PRESCRIBED_FORMS} />}
            {propSubTab === 'style' && <StyleIntelligence onSelectStyle={() => {}} />}
          </>
        )}

        {/* STAGE 4: Review & Compliance Quality Checks */}
        {activeStage === 'review' && (
          <>
            {reviewSubTab === 'compliance' && <ProposalComplianceWorkbench projectId={project.id} />}
            {reviewSubTab === 'visual_qa' && <ProposalVisualQaWorkbench projectId={project.id} />}
            {reviewSubTab === 'pptx' && <PptxChangeReview slides={MOCK_PPTX_CHANGES} onApproveSlide={() => {}} />}
          </>
        )}

        {/* STAGE 5: Download & Final Submission Hub */}
        {activeStage === 'download' && (
          <SubmissionPackage
            packageData={SubmissionPackageService.getSubmissionPackageData(project.id)}
            isBlocked={false}
          />
        )}
      </div>
    </div>
  );
};
