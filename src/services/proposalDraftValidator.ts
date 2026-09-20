import {
  ProposalDraftSection,
  ProposalContentBlock,
  Requirement,
  ProposalRequirementMapping,
  EvidencePackage
} from '../types';
import { SectionDraftContext } from './proposalDraftContextService';
import { AiService } from './aiService';

export type AuditableRequirement = {
  id?: string;
  requirementText?: string;
  category?: string;
  mandatory?: boolean;
  clause?: string;
  quote?: string;
  relationship?: string;
  [key: string]: any;
};

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
   * Fast semantic heuristic check to evaluate whether a requirement is addressed
   */
  private static isRequirementSubstantivelyAddressed(
    req: AuditableRequirement,
    fullText: string,
    section: ProposalDraftSection
  ): boolean {
    const reqId = (req.id || '').toLowerCase();
    const textLower = (req.requirementText || '').toLowerCase();
    const cleanFullText = fullText.toLowerCase();

    // 1. Explicit ID or direct inclusion
    if (reqId && cleanFullText.includes(reqId)) {
      return true;
    }

    // 2. Block requirementReferences tag
    if (req.id) {
      const isTaggedInBlocks = section.content.some(
        (b) => b.requirementReferences && b.requirementReferences.includes(req.id!)
      );
      if (isTaggedInBlocks) {
        return true;
      }
    }

    // 3. Category and semantic keyword overlap
    const stopWords = new Set([
      'shall', 'must', 'should', 'will', 'with', 'from', 'that', 'this', 'have',
      'been', 'were', 'which', 'their', 'about', 'under', 'these', 'those', 'other'
    ]);

    const words = textLower
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !stopWords.has(w));

    if (words.length === 0) return true;

    const matchedWords = words.filter((w) => cleanFullText.includes(w));
    const matchRatio = matchedWords.length / words.length;

    // Substantive match if >30% of distinctive requirement terms or >= 2 core keywords appear
    if (matchRatio >= 0.30 || matchedWords.length >= 2) {
      return true;
    }

    // 4. Check section category relevance (if methodology section has methodology content blocks)
    if (
      (req.category === 'Methodology' || req.category === 'Technical') &&
      section.content.length >= 3 &&
      section.content.some((b) => b.content.length > 80)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Asynchronous Semantic Requirement Coverage Audit using fast LLM with fallback
   */
  static async validateSectionDraftAsync(
    section: ProposalDraftSection,
    context: SectionDraftContext,
    mappedReqs: AuditableRequirement[] = []
  ): Promise<SectionValidationResult> {
    const rawReqs: AuditableRequirement[] = mappedReqs.length > 0 ? mappedReqs : (context.mappedRequirements as AuditableRequirement[]) || [];
    const activeReqs = rawReqs.filter((r) => Boolean(r && (r.id || r.requirementText)));
    const contentBlocks = section.content || [];
    const fullText = contentBlocks
      .map((b) => {
        const itemText = b.items && b.items.length > 0 ? b.items.join(' ') : '';
        return `${b.content || ''} ${itemText}`.trim();
      })
      .join('\n');

    let addressedReqIds: string[] = [];
    let unaddressedReqIds: string[] = [];

    // Attempt Fast Semantic LLM Evaluation if requirements exist
    if (activeReqs.length > 0 && contentBlocks.length > 0) {
      try {
        const evalPrompt = `Evaluate if this proposal section substantively addresses each listed TOR requirement.
Section Title: ${section.title}
Section Content:
${fullText.slice(0, 3000)}

Requirements to evaluate:
${activeReqs.map((r, i) => `[${r.id || `REQ-${i + 1}`}] ${r.requirementText || ''}`).join('\n')}

Return ONLY JSON:
{
  "addressedIds": ["REQ-ID-1", "REQ-ID-2"],
  "unaddressedIds": []
}`;
        const rawResponse = await AiService.callGroqApi(
          evalPrompt,
          'You are a strict proposal compliance auditor. Return valid JSON only.',
          'llama-3.3-70b-versatile'
        );

        let jsonStr = rawResponse.trim();
        if (jsonStr.includes('```json')) jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
        else if (jsonStr.includes('```')) jsonStr = jsonStr.split('```')[1].split('```')[0].trim();

        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed.addressedIds)) {
          addressedReqIds = parsed.addressedIds.map((id: any) => String(id));
          unaddressedReqIds = activeReqs
            .map((r, idx) => r.id || `REQ-${idx + 1}`)
            .filter((id) => !addressedReqIds.includes(id));
        }
      } catch (llmErr) {
        console.warn('[ProposalDraftValidator] Fast LLM check unavailable, using semantic heuristic:', llmErr);
      }
    }

    // Fallback if LLM was skipped or returned empty
    if (addressedReqIds.length === 0 && unaddressedReqIds.length === 0) {
      activeReqs.forEach((req, idx) => {
        const reqId = req.id || `REQ-${idx + 1}`;
        if (this.isRequirementSubstantivelyAddressed(req, fullText, section)) {
          addressedReqIds.push(reqId);
        } else {
          unaddressedReqIds.push(reqId);
        }
      });
    }

    return this.buildResultFromAudit(section, context, activeReqs, fullText, addressedReqIds, unaddressedReqIds);
  }

  /**
   * Synchronous / deterministic requirement audit
   */
  static validateSectionDraft(
    section: ProposalDraftSection,
    context: SectionDraftContext,
    mappedReqs: AuditableRequirement[] = []
  ): SectionValidationResult {
    const rawReqs: AuditableRequirement[] = mappedReqs.length > 0 ? mappedReqs : (context.mappedRequirements as AuditableRequirement[]) || [];
    const activeReqs = rawReqs.filter((r) => Boolean(r && (r.id || r.requirementText)));
    const contentBlocks = section.content || [];
    const fullText = contentBlocks
      .map((b) => {
        const itemText = b.items && b.items.length > 0 ? b.items.join(' ') : '';
        return `${b.content || ''} ${itemText}`.trim();
      })
      .join('\n');

    const addressedReqIds: string[] = [];
    const unaddressedReqIds: string[] = [];

    activeReqs.forEach((req, idx) => {
      const reqId = req.id || `REQ-${idx + 1}`;
      if (this.isRequirementSubstantivelyAddressed(req, fullText, section)) {
        addressedReqIds.push(reqId);
      } else {
        unaddressedReqIds.push(reqId);
      }
    });

    return this.buildResultFromAudit(section, context, activeReqs, fullText, addressedReqIds, unaddressedReqIds);
  }

  private static buildResultFromAudit(
    section: ProposalDraftSection,
    context: SectionDraftContext,
    activeReqs: AuditableRequirement[],
    fullText: string,
    addressedReqIds: string[],
    unaddressedReqIds: string[]
  ): SectionValidationResult {
    const totalReqsCount = activeReqs.length;
    const completenessScore = totalReqsCount > 0
      ? Math.round((addressedReqIds.length / totalReqsCount) * 100)
      : ((section.content || []).length > 0 ? 100 : 0);

    // Placeholder Detection
    const placeholderBlocks = (section.content || []).filter(
      (b) => b.type === 'PLACEHOLDER' || (b.content && b.content.includes('[TO BE PROVIDED'))
    );
    const placeholderCount = placeholderBlocks.length;

    // Evidence Grounding & Unsupported Claim Audit
    const unsupportedClaims: string[] = [];
    const gaps: string[] = [...(context.knownGaps || [])];

    const forbiddenClients = ['nbsml', 'north bengal sugar', 'titas gas', 'berger paints', 'prime bank'];
    const lowerText = fullText.toLowerCase();

    forbiddenClients.forEach((client) => {
      if (lowerText.includes(client)) {
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
      : (placeholderCount > 0 ? 85 : 100);

    // Section Status Determination
    // IMPORTANT: Hard BLOCKED is only reserved for hard blockers (e.g. unverified client leakage).
    // Missed requirements or placeholders are marked IN_REVIEW for human review, never blocking.
    let status: ProposalDraftSection['status'] = 'DRAFTED';
    const hasHardBlockers = unsupportedClaims.length > 0;

    if (hasHardBlockers) {
      status = 'BLOCKED';
    } else if (placeholderCount > 0 || unaddressedReqIds.length > 0) {
      status = 'IN_REVIEW';
    } else if (completenessScore >= 80) {
      status = 'DRAFTED';
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
   * Main alias method for validating a section draft
   */
  static validateSection(section: ProposalDraftSection, context: SectionDraftContext): SectionValidationResult {
    return ProposalDraftValidator.validateSectionDraft(section, context, (context.mappedRequirements as AuditableRequirement[]) || []);
  }

  /**
   * Async alias method
   */
  static async validateSectionAsync(section: ProposalDraftSection, context: SectionDraftContext): Promise<SectionValidationResult> {
    return ProposalDraftValidator.validateSectionDraftAsync(section, context, (context.mappedRequirements as AuditableRequirement[]) || []);
  }
}
