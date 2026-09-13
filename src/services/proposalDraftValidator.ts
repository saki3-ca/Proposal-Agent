import {
  ProposalDraftSection,
  ProposalContentBlock,
  Requirement,
  ProposalRequirementMapping,
  EvidencePackage
} from '../types';
import { SectionDraftContext } from './proposalDraftContextService';

export interface SectionValidationResult {
  completenessScore: number;
  evidenceCoverageScore: number;
  unsupportedClaimCount: number;
  placeholderCount: number;
  unsupportedClaims: string[];
  addressedRequirementIds: string[];
  unaddressedRequirementIds: string[];
  gaps: string[];
  hasHardBlockers: boolean;
  status: ProposalDraftSection['status'];
}

export class ProposalDraftValidator {
  /**
   * Main entry point: Audits a generated ProposalDraftSection for requirement coverage,
   * evidence grounding, unsupported claims, placeholders, and consistency.
   */
  static validateSectionDraft(
    section: ProposalDraftSection,
    context: SectionDraftContext,
    mappedReqs: Requirement[] = []
  ): SectionValidationResult {
    const fullText = section.content.map((b) => b.content).join('\n').toLowerCase();
    const addressedReqIds: string[] = [];
    const unaddressedReqIds: string[] = [];

    // 1. Requirement Coverage Audit
    context.mappedRequirements.forEach((req) => {
      const textLower = req.requirementText.toLowerCase();
      const keywords = textLower.split(/\s+/).filter((w) => w.length > 4);
      const matchCount = keywords.filter((k) => fullText.includes(k)).length;

      if (matchCount >= Math.min(2, keywords.length) || fullText.includes(req.id.toLowerCase())) {
        addressedReqIds.push(req.id);
      } else {
        unaddressedReqIds.push(req.id);
      }
    });

    const totalReqsCount = mappedReqs.length || context.mappedRequirements.length;
    const completenessScore = totalReqsCount > 0
      ? Math.round((addressedReqIds.length / totalReqsCount) * 100)
      : 100;

    // 2. Placeholder Detection ([TO BE PROVIDED])
    const placeholderBlocks = section.content.filter(
      (b) => b.type === 'PLACEHOLDER' || b.content.includes('[TO BE PROVIDED]')
    );
    const placeholderCount = placeholderBlocks.length;

    // 3. Evidence Grounding & Unsupported Claim Audit
    const unsupportedClaims: string[] = [];
    const gaps: string[] = [...(context.knownGaps || [])];

    // Check for reference proposal client leakage (e.g. NBSML, Titas Gas if not in context evidence)
    const forbiddenClients = ['nbsml', 'north bengal sugar', 'titas gas', 'berger paints', 'prime bank'];
    forbiddenClients.forEach((client) => {
      if (fullText.includes(client)) {
        const isVerifiedInContext = (context.corporateEvidence || []).some(
          (e) => (e.sourceQuote || e.summaryText || '').toLowerCase().includes(client)
        );
        if (!isVerifiedInContext) {
          unsupportedClaims.push(`Unverified reference client name "${client.toUpperCase()}" detected.`);
          gaps.push(`Unverified reference client name "${client.toUpperCase()}" detected in section draft.`);
        }
      }
    });

    const corporateCount = context.corporateEvidence?.length || 0;
    const evidenceCoverageScore = corporateCount > 0
      ? Math.round((Math.max(0, corporateCount - unsupportedClaims.length) / corporateCount) * 100)
      : (placeholderCount > 0 ? 80 : 100);

    // 4. Section Status Determination (BLOCKED if mandatory unaddressed or unverified client leakage)
    let status: ProposalDraftSection['status'] = 'DRAFTED';
    const hasUnaddressedMandatory = context.mappedRequirements.some(
      (r) => (r.mandatory ?? true) && unaddressedReqIds.includes(r.id)
    );

    const hasHardBlockers = hasUnaddressedMandatory || unsupportedClaims.length > 0;

    if (hasHardBlockers) {
      status = 'BLOCKED';
    } else if (placeholderCount > 0 || unaddressedReqIds.length > 0) {
      status = 'IN_REVIEW';
    }

    return {
      completenessScore,
      evidenceCoverageScore,
      unsupportedClaimCount: unsupportedClaims.length,
      placeholderCount,
      unsupportedClaims,
      addressedRequirementIds: addressedReqIds,
      unaddressedRequirementIds: unaddressedReqIds,
      gaps,
      hasHardBlockers,
      status
    };
  }

  /**
   * Alias helper for validateSection
   */
  static validateSection(section: ProposalDraftSection, context: SectionDraftContext): SectionValidationResult {
    return ProposalDraftValidator.validateSectionDraft(section, context, []);
  }
}
