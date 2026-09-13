import {
  Project,
  Requirement,
  ProposalContentPlan,
  ProposalDraft,
  EvidencePackage,
  HouseStyleProfile,
  EvaluationAlignment,
  ProposalSubmissionItem,
  EvidenceGap,
  ProposalPlanningGap,
  ProposalDraftSection
} from '../types';
import { ProposalPlannerService } from './proposalPlannerService';
import { EvidenceMatchingService } from './evidenceMatchingService';
import { HouseStyleService } from './houseStyleService';
import { ProposalDraftingService } from './proposalDraftingService';

export interface ProposalAuditContext {
  projectId: string;
  proposalDraftId: string;

  requirements: Requirement[];
  contentPlan: ProposalContentPlan | null;
  verifiedEvidence: EvidencePackage | null;
  houseStyle: HouseStyleProfile | null;
  proposalDraft: ProposalDraft | null;

  draftSections: ProposalDraftSection[];
  evaluationCriteria: EvaluationAlignment[];
  submissionItems: ProposalSubmissionItem[];
  referenceRestrictedContent: string[];

  knownEvidenceGaps: EvidenceGap[];
  knownPlanningGaps: ProposalPlanningGap[];
}

import { ProposalDatabaseService } from './proposalDatabaseService';

export class ProposalAuditContextService {
  /**
   * Builds an un-compromised, independent audit context package for Phase 7.
   * Gathers active requirements, plan, evidence, house style rules, and current proposal draft blocks.
   */
  static buildProposalAuditContext(projectId: string, customRequirements: Requirement[] = []): ProposalAuditContext {
    let draft = ProposalDraftingService.getProposalDraft(projectId);
    if (!draft) {
      draft = ProposalDraftingService.initializeDraftFromPlan(projectId);
    }

    const contentPlan = ProposalPlannerService.getContentPlan(projectId);
    const houseStyle = HouseStyleService.getActiveProfile();
    const verifiedEvidence = EvidenceMatchingService.getSavedEvidencePackage(projectId);

    const activeRequirements = (customRequirements && customRequirements.length > 0)
      ? customRequirements
      : ProposalDatabaseService.getProjectRequirements(projectId);

    const evaluationCriteria: EvaluationAlignment[] = (contentPlan?.evaluationAlignment && contentPlan.evaluationAlignment.length > 0)
      ? contentPlan.evaluationAlignment
      : [
          {
            id: 'eval_1',
            evaluationCriterionId: 'CRIT-01',
            criterionText: 'Quality, relevance, and robustness of technical methodology and assignment approach',
            weight: 50,
            proposalSectionIds: (draft?.sections || []).map(s => s.id),
            requiredContent: ['Technical Methodology', 'Scope Breakdown', 'Quality Controls'],
            evidenceNeeded: false,
            riskLevel: 'LOW',
            planningNotes: ['Demonstrate comprehensive understanding of TOR requirements']
          },
          {
            id: 'eval_2',
            evaluationCriterionId: 'CRIT-02',
            criterionText: 'Qualifications and relevant experience of Key Personnel and Experts',
            weight: 50,
            proposalSectionIds: (draft?.sections || []).map(s => s.id),
            requiredContent: ['Team Qualifications', 'Expert CVs'],
            evidenceNeeded: true,
            riskLevel: 'MEDIUM',
            planningNotes: ['Requires verified team experience and qualifications']
          }
        ];

    const submissionItems: ProposalSubmissionItem[] = (contentPlan?.submissionItems && contentPlan.submissionItems.length > 0)
      ? contentPlan.submissionItems
      : [
          {
            id: 'sub_1',
            itemTitle: 'Valid ICAB Practice License / Organization Registration',
            submissionCategory: 'LEGAL_DOC',
            instructions: 'Attach certified copy in Appendix',
            targetSectionOrAppendix: 'Appendix',
            mandatory: true
          },
          {
            id: 'sub_2',
            itemTitle: 'Signed Technical & Financial Proposal Declarations',
            submissionCategory: 'FORM_DECLARATION',
            instructions: 'Signed by authorized representative',
            targetSectionOrAppendix: 'Section 1',
            mandatory: true
          }
        ];

    const referenceRestrictedContent = [
      'NBSML',
      'North Bengal Sugar Mills',
      'Titas Gas',
      'Berger Paints',
      'Prime Bank'
    ];

    return {
      projectId,
      proposalDraftId: draft?.id || `draft_${projectId}`,
      requirements: activeRequirements,
      contentPlan,
      verifiedEvidence,
      houseStyle,
      proposalDraft: draft,
      draftSections: draft?.sections || [],
      evaluationCriteria,
      submissionItems,
      referenceRestrictedContent,
      knownEvidenceGaps: verifiedEvidence?.gaps || [],
      knownPlanningGaps: contentPlan?.planningGaps || []
    };
  }
}
