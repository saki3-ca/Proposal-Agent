import {
  Project,
  Requirement,
  ProposalContentPlan,
  ProposalContentPlanSection,
  ProposalRequirementMapping,
  ProposalEvidenceRequirement,
  EvaluationAlignment,
  EvidencePackage,
  HouseStyleProfile
} from '../types';
import { ProposalPlannerService } from './proposalPlannerService';
import { EvidenceMatchingService } from './evidenceMatchingService';
import { HouseStyleService } from './houseStyleService';
import { ProposalDatabaseService } from './proposalDatabaseService';

export interface SectionDraftContext {
  projectId: string;
  assignmentTitle: string;
  sectionId: string;
  sectionNumber: string;
  title: string;
  sectionTitle: string;
  sectionType: string;
  clientName: string;
  recipient?: import('../types').TorSubmissionRecipient;
  submissionNumber?: string;
  proposalReferenceYear?: string;
  purpose: string;
  writingBrief: string;
  writingGuidance: string[];
  mappedRequirements: {
    id: string;
    requirementText: string;
    category: string;
    mandatory?: boolean;
    clause?: string;
    quote?: string;
    relationship?: string;
  }[];
  evaluationCriteria: {
    id: string;
    description: string;
    weight?: string;
  }[];
  corporateEvidence: {
    id: string;
    title: string;
    sourceFile: string;
    sourcePage?: number | null;
    sourceQuote?: string;
    summaryText: string;
    verificationStatus: string;
  }[];
  teamEvidence: {
    roleName: string;
    candidateName?: string;
    qualificationMatchStatus: string;
    yearsOfExperience: number;
  }[];
  houseStyleRules: {
    writingVoice: string;
    acnabinTerminology: string[];
    bodyFont: string;
    headingColors: Record<string, string>;
  };
  restrictedContent: {
    prohibitedClientNames: string[];
  };
  knownGaps: string[];
  hasMissingEvidence: boolean;
}

export type SectionDraftContextPackage = SectionDraftContext;

export class ProposalDraftContextService {
  /**
   * Synchronous / Asynchronous helper to build controlled drafting context for a section
   */
  static buildSectionDraftContext(
    projectIdOrProject: string | Project,
    sectionNumberOrId: string,
    requirements: Requirement[] = []
  ): SectionDraftContext {
    const projectId = typeof projectIdOrProject === 'string' ? projectIdOrProject : projectIdOrProject.id;
    const plan = ProposalPlannerService.getContentPlan(projectId);
    const houseStyle = HouseStyleService.getActiveProfile();
    const evidencePkg = EvidenceMatchingService.getSavedEvidencePackage(projectId);

    const targetId = String(sectionNumberOrId).replace(/^draft_sec_/, '');
    const section = (plan?.sections || []).find((s: ProposalContentPlanSection) =>
      s.id === sectionNumberOrId ||
      s.id === targetId ||
      s.sectionNumber === sectionNumberOrId ||
      s.sectionNumber === targetId ||
      s.title.toLowerCase() === String(sectionNumberOrId).toLowerCase()
    ) || (plan?.sections || [])[0] || {
      id: sectionNumberOrId,
      sectionNumber: sectionNumberOrId,
      title: 'Proposal Section',
      sectionType: 'TECHNICAL',
      purpose: 'Technical Proposal Section',
      writingGuidance: ['Formal first-person plural'],
      torRequirementIds: [],
      prohibitedContent: []
    };

    const sectionMappings = (plan?.requirementMappings || []).filter((m: ProposalRequirementMapping) => m.proposalSectionId === section.id);
    const mappedReqs = sectionMappings.map((m: ProposalRequirementMapping) => {
      const r = requirements.find((req) => req.id === m.requirementId);
      return {
        id: m.requirementId,
        requirementText: r?.requirementText || `Requirement ${m.requirementId}`,
        category: r?.category || 'Technical',
        mandatory: r?.mandatory ?? true,
        clause: m.sourceClause || r?.sourceClause,
        quote: m.sourceQuote || r?.sourceQuote,
        relationship: m.relationship
      };
    });

    const matches = evidencePkg?.matches || [];
    const sectionMatches = matches.filter(
      (m) =>
        (m.proposalSectionId === section.id || (section.torRequirementIds || []).includes(m.requirementId)) &&
        (m.verificationStatus === 'VERIFIED' || m.status === 'AVAILABLE')
    );

    const corporateEv = sectionMatches.map((m) => {
      const record = (evidencePkg?.evidenceRecords || []).find((e) => e.id === m.evidenceId);
      return {
        id: m.id,
        title: record?.title || m.matchRationale || 'Verified Evidence',
        sourceFile: record?.sourceFile || 'Library Document',
        sourcePage: record?.sourcePage,
        sourceQuote: record?.sourceQuote || m.matchRationale,
        summaryText: record?.sourceQuote || m.matchRationale || 'Verified Firm Experience',
        verificationStatus: m.verificationStatus || 'VERIFIED'
      };
    });

    const secGaps = (evidencePkg?.gaps || [])
      .filter((g) => (section.torRequirementIds || []).includes(g.requirementId))
      .map((g) => g.description);

    const prohibitedClients = ['NBSML', 'Titas Gas', 'Berger Paints', 'Prime Bank'];

    // Derive team evidence from CV evidence records
    const teamRecords = (evidencePkg?.evidenceRecords || []).filter((e) => e.category === 'CV');
    const teamEv = teamRecords.length > 0
      ? teamRecords.map((t) => ({
        roleName: t.title || 'Audit Specialist',
        candidateName: t.sourceFile.replace(/\.[^/.]+$/, ''),
        qualificationMatchStatus: t.verificationStatus || 'VERIFIED',
        yearsOfExperience: 10
      }))
      : [
        {
          roleName: 'Team Leader / Lead Partner',
          candidateName: '[TO BE PROVIDED]',
          qualificationMatchStatus: 'PARTIAL',
          yearsOfExperience: 15
        }
      ];

    let resolvedClientName = typeof projectIdOrProject === 'object' ? (projectIdOrProject.client || projectIdOrProject.issuingOrg) : '';
    if (!resolvedClientName) {
      try {
        const storedProjects = localStorage.getItem('acnabin_proposal_db_projects');
        if (storedProjects) {
          const projects = JSON.parse(storedProjects);
          const matched = projects.find((p: any) => p.id === projectId);
          if (matched) resolvedClientName = matched.client || matched.issuingOrg;
        }
      } catch (e) { }
    }
    if (!resolvedClientName) {
      const torModel = ProposalDatabaseService.getProjectTorModel(projectId);
      if (torModel) {
        resolvedClientName = torModel.clientName || torModel.issuingClient || torModel.issuingOrganization || '';
      }
    }
    let resolvedAssignmentTitle = plan?.proposalTitle || '';
    if (!resolvedAssignmentTitle && typeof projectIdOrProject === 'object') {
      resolvedAssignmentTitle = projectIdOrProject.assignmentTitle || projectIdOrProject.name || '';
    }
    if (!resolvedAssignmentTitle) {
      const torModel = ProposalDatabaseService.getProjectTorModel(projectId);
      if (torModel) {
        resolvedAssignmentTitle = torModel.assignmentTitle || '';
      }
    }
    if (!resolvedAssignmentTitle) {
      try {
        const storedProjects = localStorage.getItem('acnabin_proposal_db_projects');
        if (storedProjects) {
          const projects = JSON.parse(storedProjects);
          const matched = projects.find((p: any) => p.id === projectId);
          if (matched) resolvedAssignmentTitle = matched.assignmentTitle || matched.name || '';
        }
      } catch (e) { }
    }
    if (!resolvedAssignmentTitle) resolvedAssignmentTitle = 'the assignment';

    let resolvedRecipient = typeof projectIdOrProject === 'object' ? projectIdOrProject.recipient : undefined;
    let resolvedSubmissionNumber = typeof projectIdOrProject === 'object' ? projectIdOrProject.submissionNumber : undefined;
    let resolvedRefYear = typeof projectIdOrProject === 'object' ? projectIdOrProject.proposalReferenceYear : undefined;

    const torModel = ProposalDatabaseService.getProjectTorModel(projectId);
    if (!resolvedRecipient && torModel?.submission?.recipient) {
      resolvedRecipient = torModel.submission.recipient;
    }
    if (!resolvedRecipient) {
      try {
        const storedProjects = localStorage.getItem('acnabin_proposal_db_projects');
        if (storedProjects) {
          const projects = JSON.parse(storedProjects);
          const matched = projects.find((p: any) => p.id === projectId);
          if (matched?.recipient) resolvedRecipient = matched.recipient;
          if (matched?.submissionNumber) resolvedSubmissionNumber = matched.submissionNumber;
          if (matched?.proposalReferenceYear) resolvedRefYear = matched.proposalReferenceYear;
        }
      } catch (e) { }
    }

    return {
      projectId,
      assignmentTitle: resolvedAssignmentTitle,
      sectionId: section.id,
      sectionNumber: section.sectionNumber || '1',
      title: section.title || 'Proposal Section',
      sectionTitle: section.title || 'Proposal Section',
      sectionType: section.sectionType || 'TECHNICAL',
      clientName: resolvedClientName,
      recipient: resolvedRecipient,
      submissionNumber: resolvedSubmissionNumber || '0000',
      proposalReferenceYear: resolvedRefYear || String(new Date().getFullYear()),
      purpose: section.purpose || 'Technical Proposal Section',
      writingBrief: (section.writingGuidance || []).join(' ') || 'Draft authoritative response.',
      writingGuidance: section.writingGuidance || ['Formal first-person plural'],
      mappedRequirements: mappedReqs,
      evaluationCriteria: (plan?.evaluationAlignment || []).map((e: EvaluationAlignment) => ({
        id: e.evaluationCriterionId,
        description: e.criterionText,
        weight: e.weight ? String(e.weight) : undefined
      })),
      corporateEvidence: corporateEv,
      teamEvidence: teamEv,
      houseStyleRules: {
        writingVoice: 'Formal, authoritative, first-person plural ("we", "our engagement team").',
        acnabinTerminology: ['ACNABIN', 'Engagement Team', 'Audit Quality Framework', 'Chartered Accountants'],
        bodyFont: houseStyle?.typography?.bodyFont || 'Tahoma',
        headingColors: houseStyle?.colors?.headingColors || { H1: '#002060', H2: '#002060', H3: '#002060' }
      },
      restrictedContent: {
        prohibitedClientNames: prohibitedClients
      },
      knownGaps: secGaps,
      hasMissingEvidence: secGaps.length > 0
    };
  }
}
