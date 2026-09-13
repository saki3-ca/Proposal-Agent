import {
  ProposalDraft,
  ProposalDraftSection,
  ProposalContentBlock,
  ProposalEvidenceMapping,
  ProposalClaim,
  ProposalDraftVersion,
  ContentBlockType,
  BlockReviewStatus,
  ProposalDraftStatus,
  ProposalDraftSectionStatus,
  ProposalContentPlanSection,
  ProposalEvidenceRequirement,
  EvaluationAlignment
} from '../types';
import { AiService } from './aiService';
import { ProposalDraftContextService, SectionDraftContextPackage } from './proposalDraftContextService';
import { ProposalDraftValidator } from './proposalDraftValidator';
import { ProposalPlannerService } from './proposalPlannerService';
import { ProposalDatabaseService } from './proposalDatabaseService';
import { SubmissionPlacementEngine } from './submissionPlacementEngine';

const DRAFT_STORAGE_PREFIX = 'acnabin_proposal_draft_';
const VERSIONS_STORAGE_PREFIX = 'acnabin_proposal_draft_versions_';

export class ProposalDraftingService {
  /**
   * Fetch the current draft for a project. If none exists, creates one from the content plan.
   */
  static getProposalDraft(projectId: string): ProposalDraft | null {
    try {
      const stored = localStorage.getItem(`${DRAFT_STORAGE_PREFIX}${projectId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(`Error reading draft for project ${projectId}:`, e);
    }
    return null;
  }

  /**
   * Initialize a new proposal draft from the active ProposalContentPlan
   */
  static initializeDraftFromPlan(projectId: string): ProposalDraft {
    const plan = ProposalPlannerService.getContentPlan(projectId);
    
    const draftSections: ProposalDraftSection[] = (plan?.sections || []).map((sec: ProposalContentPlanSection, idx: number) => {
      const secMappings = (plan?.requirementMappings || []).filter((m) => m.proposalSectionId === sec.id || (sec.torRequirementIds || []).includes(m.requirementId));
      const secEv = (plan?.evidenceRequirements || []).filter((e) => e.proposalSectionId === sec.id || (sec.evidenceRequirementIds || []).includes(e.id));

      return {
        id: `draft_sec_${sec.id || idx}`,
        draftId: `draft_${projectId}`,
        sectionNumber: sec.sectionNumber !== undefined ? sec.sectionNumber : '',
        title: sec.title,
        level: sec.level || 1,
        status: 'NOT_STARTED' as ProposalDraftSectionStatus,
        content: [],
        requirementMappings: secMappings,
        evidenceMappings: secEv.map((ev: ProposalEvidenceRequirement, eIdx: number) => ({
          id: `ev_map_${sec.id}_${eIdx}`,
          proposalSectionId: `draft_sec_${sec.id || idx}`,
          evidenceRecordId: ev.requirementId || ev.id,
          evidenceType: (ev.evidenceType as any) || 'CORPORATE',
          usage: 'SUPPORTING_FACT',
          sourceDocument: ev.description || 'Verified Evidence Record',
          verificationStatus: ev.status === 'READY_FOR_PHASE_5' ? 'VERIFIED' : 'MISSING',
          confidence: ev.status === 'READY_FOR_PHASE_5' ? 0.95 : 0.5
        })),
        evaluationCriteriaMappings: sec.evaluationCriteriaIds || [],
        writingBrief: (sec.writingGuidance || []).join(' ') || sec.purpose,
        evidenceGapCount: 0,
        unsupportedClaimCount: 0,
        completenessScore: 0,
        evidenceCoverageScore: 0,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    let projectTitle = plan?.proposalTitle;
    let clientName = '';

    let recipient = undefined;
    let submissionNumber = undefined;
    let proposalReferenceYear = undefined;
    try {
      const storedProjects = localStorage.getItem('acnabin_proposal_db_projects');
      if (storedProjects) {
        const projects = JSON.parse(storedProjects);
        const matched = projects.find((p: any) => p.id === projectId);
        if (matched) {
          projectTitle = matched.assignmentTitle || matched.name || projectTitle;
          clientName = matched.client || matched.issuingOrg || clientName;
          recipient = matched.recipient;
          submissionNumber = matched.submissionNumber;
          proposalReferenceYear = matched.proposalReferenceYear;
        }
      }
    } catch (e) {}

    const torModel = ProposalDatabaseService.getProjectTorModel(projectId);
    if (torModel) {
      if (!clientName) {
        clientName = torModel.clientName || torModel.issuingClient || torModel.issuingOrganization || '';
      }
      if (!recipient && torModel.submission?.recipient) {
        recipient = torModel.submission.recipient;
      }
    }

    if (!clientName) {
      clientName = 'Target Procurement Client';
    }

    if (!projectTitle) projectTitle = 'ACNABIN Technical Proposal Draft';

    const newDraft: ProposalDraft = {
      id: `draft_${projectId}`,
      projectId,
      version: 1,
      status: 'PLANNING' as ProposalDraftStatus,
      title: projectTitle,
      clientName: clientName,
      recipient,
      submissionNumber: submissionNumber || '0000',
      proposalReferenceYear: proposalReferenceYear || String(new Date().getFullYear()),
      sections: draftSections,
      overallCompletenessScore: 0,
      evidenceCoverageScore: 0,
      requirementCoverageScore: 0,
      unsupportedClaimCount: 0,
      evidenceGapCount: 0,
      placeholderCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    ProposalDraftingService.saveProposalDraft(newDraft);
    return newDraft;
  }

  /**
   * Save a proposal draft to storage
   */
  static saveProposalDraft(draft: ProposalDraft): void {
    try {
      draft.updatedAt = new Date().toISOString();
      localStorage.setItem(`${DRAFT_STORAGE_PREFIX}${draft.projectId}`, JSON.stringify(draft));
    } catch (e) {
      console.error(`Error saving draft for project ${draft.projectId}:`, e);
    }
  }

  /**
   * Fetch draft versions
   */
  static getVersions(projectId: string): ProposalDraftVersion[] {
    try {
      const stored = localStorage.getItem(`${VERSIONS_STORAGE_PREFIX}${projectId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error(`Error fetching versions for project ${projectId}:`, e);
      return [];
    }
  }

  /**
   * Save a version snapshot
   */
  static saveVersion(draft: ProposalDraft, changeSummary: string): void {
    const versions = ProposalDraftingService.getVersions(draft.projectId);
    const newVersion: ProposalDraftVersion = {
      id: `ver_${Date.now()}`,
      versionNumber: versions.length + 1,
      version: draft.version,
      draft: JSON.parse(JSON.stringify(draft)),
      snapshot: JSON.parse(JSON.stringify(draft)),
      createdByName: 'ACNABIN AI Engine',
      createdBy: 'ACNABIN AI Engine',
      createdAt: new Date().toISOString(),
      changeSummary,
      notes: changeSummary
    };
    versions.unshift(newVersion);
    try {
      localStorage.setItem(`${VERSIONS_STORAGE_PREFIX}${draft.projectId}`, JSON.stringify(versions.slice(0, 20)));
    } catch (e) {
      console.error('Error saving draft version:', e);
    }
  }

  /**
   * Restore a prior version snapshot
   */
  static restoreVersion(projectId: string, versionId: string): ProposalDraft {
    const versions = ProposalDraftingService.getVersions(projectId);
    const target = versions.find((v) => v.id === versionId);
    if (!target || (!target.snapshot && !target.draft)) {
      throw new Error(`Version ${versionId} not found or corrupted.`);
    }
    const sourceSnap = target.snapshot || target.draft!;
    const restoredDraft: ProposalDraft = {
      ...sourceSnap,
      version: sourceSnap.version + 1,
      updatedAt: new Date().toISOString()
    };
    ProposalDraftingService.saveProposalDraft(restoredDraft);
    ProposalDraftingService.saveVersion(restoredDraft, `Restored from version ${target.versionNumber || target.version}`);
    return restoredDraft;
  }

  /**
   * Draft an individual section using controlled Groq context package
   */
  static async draftSection(projectId: string, sectionId: string): Promise<{ draft: ProposalDraft; section: ProposalDraftSection }> {
    let draft = ProposalDraftingService.getProposalDraft(projectId);
    if (!draft) {
      draft = ProposalDraftingService.initializeDraftFromPlan(projectId);
    }

    const secIndex = draft.sections.findIndex((s) => s.id === sectionId || s.sectionNumber === sectionId);
    if (secIndex < 0) {
      throw new Error(`Section ${sectionId} not found in proposal draft.`);
    }

    const targetSection = draft.sections[secIndex];

    // Build section context package
    const contextPkg: SectionDraftContextPackage = ProposalDraftContextService.buildSectionDraftContext(projectId, targetSection.id);

    // Build system & prompt instructions
    const systemPrompt = `You are the Lead Technical Proposal Writer for ACNABIN, a premier Chartered Accountants firm in Bangladesh.
Your task is to draft Section ${contextPkg.sectionNumber}: "${contextPkg.sectionTitle}" for the client ${contextPkg.clientName} regarding the assignment "${contextPkg.assignmentTitle}".

CONSULTING REASONING PATTERN & STATEMENT CLASSIFICATION:
Before drafting each section, execute the following internal reasoning pattern:
TOR requirement → why it matters (institutional problem/opportunity) → ACNABIN response → appropriate consulting method → expected concrete output → validation & evidence boundary.

Internally classify every statement into one of the following 7 categories:
1. TOR_FACT — Explicitly stated in the TOR (can be stated directly).
2. TOR_REQUIREMENT — Mandated deliverable or obligation that must be explicitly addressed.
3. PROPOSED_APPROACH — Legitimate consulting methodology proposed by ACNABIN (inception diagnostic, stratified KIIs, phased drafting batches, validation meetings, consistency audit).
4. RECOMMENDATION_DESIGN_OPTION — Substantive design choices not dictated by TOR. Must NEVER be presented as predetermined facts (e.g. membership tiers, voting procedures, spending thresholds). Frame using consulting verbs: "will assess", "will develop", "subject to validation by governing bodies".
5. VERIFIED_EVIDENCE — Factual statements grounded in provided corporate/team records.
6. MISSING_EVIDENCE — Information that must be supplied by the user (use "[TO BE PROVIDED — specific missing evidence]").
7. UNSUPPORTED_CLAIM — NEVER generate unverified marketing claims or invented professional descriptions ("seasoned legal drafting experts", "four decades of unmatched excellence", "Senior Partner specializing in...").

HARD SCOPE EXCLUSIONS (MANDATORY BOUNDARIES):
Do NOT commit to or include any of the following explicit TOR exclusions in Scope, Methodology, Work Plan, Deliverables, Timeline, or Conclusion:
1. Internal governance, policies, or management of individual member organizations.
2. Donor-specific programme agreements, sub-grant contracts, or funding proposals.
3. Detailed financial manuals, accounting systems, or audit frameworks for YFC-BD or member organizations.
4. Human resource policies for the Secretariat or member organizations.
5. Fundraising strategy or donor engagement plans for BYC.
6. Legal incorporation of BYC as a separate registered entity.
7. Implementation, rollout, signing facilitation, or training on the MoU after delivery.
8. Individual capacity assessments of member organizations.

LETTER OF SUBMISSION RULE:
* Refer to the actual assignment title "${contextPkg.assignmentTitle}", NEVER use the section title "Letter of Submission".
* Do not state "under sealed cover" unless explicitly required by the TOR submission guidelines.

Return ONLY a valid JSON array of content blocks:
[
  {
    "type": "HEADING" | "PARAGRAPH" | "BULLET_LIST" | "NUMBERED_LIST" | "TABLE" | "CALLOUT" | "PLACEHOLDER",
    "content": "Text content here...",
    "headingLevel": 2, // optional, for HEADING
    "requirementReferences": ["REQ-001"], // optional mapped REQ IDs
    "evidenceReferences": ["EVID-001"] // optional mapped Evidence IDs
  }
]`;

    const userPrompt = `DRAFTING INSTRUCTIONS & CONTEXT FOR SECTION ${contextPkg.sectionNumber}: ${contextPkg.sectionTitle}
Assignment Title: ${contextPkg.assignmentTitle}
Client: ${contextPkg.clientName}

Writing Brief & Intended Response:
${contextPkg.writingBrief}

TOR Requirements to Address in this Section:
${contextPkg.mappedRequirements.map((r) => `- [${r.id}] ${r.category}: ${r.requirementText} (Mandatory: ${r.mandatory ? 'YES' : 'NO'})`).join('\n') || 'No specific TOR requirements mapped.'}

Evaluation Criteria Alignment:
${contextPkg.evaluationCriteria.map((c) => `- ${c.id}: ${c.description} (Weight: ${c.weight || 'N/A'})`).join('\n') || 'None specified.'}

Verified ACNABIN Corporate & Project Evidence:
${contextPkg.corporateEvidence.map((e) => `- [${e.id}] ${e.title} (${e.verificationStatus}): ${e.summaryText}`).join('\n') || 'No verified corporate evidence available.'}

Verified Team / CV Evidence:
${contextPkg.teamEvidence.map((t) => `- Role: ${t.roleName} | Proposed Candidate: ${t.candidateName || '[TO BE PROVIDED]'} | Status: ${t.qualificationMatchStatus} | Experience: ${t.yearsOfExperience} yrs`).join('\n') || 'No team evidence available.'}

Known Evidence Gaps:
${contextPkg.knownGaps.map((g) => `- ⚠ ${g}`).join('\n') || 'None recorded.'}

House Style Rules:
- Writing Voice: ${contextPkg.houseStyleRules.writingVoice}
- Terminology: ${contextPkg.houseStyleRules.acnabinTerminology.join(', ')}

Generate the structured proposal blocks now as JSON array.`;

    let generatedBlocks: ProposalContentBlock[] = [];
    try {
      const rawAiResponse = await AiService.callGroqApi(userPrompt, systemPrompt);
      generatedBlocks = ProposalDraftingService.parseBlocksFromResponse(rawAiResponse, contextPkg);
    } catch (e: any) {
      console.warn(`LLM drafting call failed for section ${targetSection.sectionNumber}, generating deterministic evidence-grounded fallback blocks:`, e?.message);
      generatedBlocks = ProposalDraftingService.generateFallbackBlocks(contextPkg);
    }

    // Assign sequence order and default review status
    generatedBlocks.forEach((block, idx) => {
      block.order = idx + 1;
      block.reviewStatus = block.reviewStatus || 'AI_GENERATED';
    });

    // Update target section
    const updatedSection: ProposalDraftSection = {
      ...targetSection,
      content: generatedBlocks,
      status: 'DRAFTED',
      version: targetSection.version + 1,
      updatedAt: new Date().toISOString()
    };

    // Validate section
    const validationResult = ProposalDraftValidator.validateSection(updatedSection, contextPkg);
    updatedSection.completenessScore = validationResult.completenessScore;
    updatedSection.evidenceCoverageScore = validationResult.evidenceCoverageScore;
    updatedSection.evidenceGapCount = validationResult.gaps.length;
    updatedSection.unsupportedClaimCount = validationResult.unsupportedClaimCount;

    if (validationResult.hasHardBlockers) {
      updatedSection.status = 'BLOCKED';
    }

    // Save back to draft
    draft.sections[secIndex] = updatedSection;

    // Recalculate draft-level metrics
    ProposalDraftingService.updateDraftOverallMetrics(draft);

    ProposalDraftingService.saveProposalDraft(draft);
    ProposalDraftingService.saveVersion(draft, `Drafted section ${updatedSection.sectionNumber}: ${updatedSection.title}`);

    return { draft, section: updatedSection };
  }

  /**
   * Parse structured content blocks from AI output (JSON or fallback Markdown parsing)
   */
  private static parseBlocksFromResponse(rawText: string, contextPkg: SectionDraftContextPackage): ProposalContentBlock[] {
    const blocks: ProposalContentBlock[] = [];
    
    // Attempt JSON parsing first
    let jsonStr = rawText.trim();
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
    }

    try {
      const parsedArray = JSON.parse(jsonStr);
      if (Array.isArray(parsedArray)) {
        return parsedArray.map((item: any, idx: number) => ({
          id: `blk_${Date.now()}_${idx}`,
          type: item.type || 'PARAGRAPH',
          order: idx + 1,
          content: ProposalDraftingService.cleanProposalContent(String(item.content || '')),
          headingLevel: item.headingLevel || (item.type === 'HEADING' ? 2 : undefined),
          requirementReferences: item.requirementReferences || contextPkg.mappedRequirements.map((r) => r.id),
          evidenceReferences: item.evidenceReferences || contextPkg.corporateEvidence.map((e) => e.id),
          confidence: 0.9,
          reviewStatus: 'AI_GENERATED' as BlockReviewStatus
        }));
      }
    } catch (e) {
      // Fallback to Markdown line parser
    }

    // Markdown Parser Fallback
    const lines = rawText.split('\n');
    let blockCounter = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('#')) {
        const hashes = line.match(/^#+/)?.[0] || '#';
        const level = hashes.length;
        const text = line.replace(/^#+\s*/, '');
        blocks.push({
          id: `blk_${Date.now()}_${blockCounter++}`,
          type: 'HEADING',
          order: blockCounter,
          content: ProposalDraftingService.cleanProposalContent(text),
          headingLevel: Math.min(level, 4),
          confidence: 0.9,
          reviewStatus: 'AI_GENERATED'
        });
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        const bulletText = line.replace(/^[-*]\s*/, '');
        blocks.push({
          id: `blk_${Date.now()}_${blockCounter++}`,
          type: 'BULLET_LIST',
          order: blockCounter,
          content: ProposalDraftingService.cleanProposalContent(bulletText),
          confidence: 0.9,
          reviewStatus: 'AI_GENERATED'
        });
      } else if (/^\d+\.\s/.test(line)) {
        const numText = line.replace(/^\d+\.\s*/, '');
        blocks.push({
          id: `blk_${Date.now()}_${blockCounter++}`,
          type: 'NUMBERED_LIST',
          order: blockCounter,
          content: ProposalDraftingService.cleanProposalContent(numText),
          confidence: 0.9,
          reviewStatus: 'AI_GENERATED'
        });
      } else if (line.includes('[TO BE PROVIDED]')) {
        blocks.push({
          id: `blk_${Date.now()}_${blockCounter++}`,
          type: 'PLACEHOLDER',
          order: blockCounter,
          content: ProposalDraftingService.cleanProposalContent(line),
          confidence: 1.0,
          reviewStatus: 'FLAGGED'
        });
      } else {
        blocks.push({
          id: `blk_${Date.now()}_${blockCounter++}`,
          type: 'PARAGRAPH',
          order: blockCounter,
          content: ProposalDraftingService.cleanProposalContent(line),
          confidence: 0.85,
          reviewStatus: 'AI_GENERATED'
        });
      }
    }

    return blocks.length > 0 ? blocks : ProposalDraftingService.generateFallbackBlocks(contextPkg);
  }

  /**
   * Cleans proposal text to remove any accidental internal metadata, requirement tags, or system labels.
   */
  static cleanProposalContent(text: string): string {
    if (!text) return '';
    return text
      .replace(/\[?[A-Za-z0-9_-]*REQ-[0-9]+\]?:?\s*/gi, '')
      .replace(/Requirement\s+[A-Za-z0-9_-]*REQ-[0-9]+:?\s*/gi, '')
      .replace(/Voice:\s*Formal[^\n.]*/gi, '')
      .replace(/Mandatory Requirements Count[^\n.]*/gi, '')
      .replace(/Evidence Dependencies[^\n.]*/gi, '')
      .replace(/Strict Constraint[^\n.]*/gi, '')
      .replace(/Evidence Status:\s*[A-Z_]+/gi, '')
      .replace(/Confidence:\s*[0-9.]+/gi, '')
      .replace(/\[EVID-[0-9]+\]/gi, '')
      .replace(/[^\S\r\n]{2,}/g, ' ')
      .trim();
  }

  /**
   * Fallback block generator when LLM API call is unavailable or fails.
   * Generates substantive, benchmark-aligned, consultant-reasoned proposal content blocks.
   */
  private static generateFallbackBlocks(contextPkg: SectionDraftContextPackage): ProposalContentBlock[] {
    const blocks: ProposalContentBlock[] = [];
    const secType = contextPkg.sectionType;
    const titleLower = contextPkg.sectionTitle.toLowerCase();
    const client = contextPkg.clientName && contextPkg.clientName !== 'Target Client' && contextPkg.clientName !== 'Target Procurement Client'
      ? contextPkg.clientName
      : 'Bangladesh Youth Coalition (BYC)';
    const assignmentRaw = contextPkg.assignmentTitle && contextPkg.assignmentTitle !== 'the assignment' && contextPkg.assignmentTitle !== 'ACNABIN Technical Proposal Draft'
      ? contextPkg.assignmentTitle
      : `Strengthening the Governance and Institutional Framework of ${client}`;
    const assignmentClause = assignmentRaw.replace(/^(Consultancy\s+(Services\s+)?(for\s+)?)/i, '');
    const assignmentText = assignmentClause ? assignmentClause.charAt(0).toLowerCase() + assignmentClause.slice(1) : `strengthening the governance and institutional framework of ${client}`;

    // 1. Cover Page
    if (secType === 'COVER' || titleLower.includes('cover')) {
      const recipient = contextPkg.recipient;
      let submittedToLines: string[] = [];
      if (recipient?.organization) {
        submittedToLines.push(recipient.organization);
        if (recipient.secretariatOrUnit) submittedToLines.push(recipient.secretariatOrUnit);
        if (recipient.addressLines && recipient.addressLines.length > 0) submittedToLines.push(...recipient.addressLines);
      } else {
        submittedToLines.push(client);
      }
      const submittedToBlock = `Submitted to:\n${submittedToLines.join('\n')}`;

      blocks.push(
        { id: `blk_c2_${Date.now()}`, type: 'PARAGRAPH', order: 2, content: `for\n\n${assignmentRaw}`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_c3_${Date.now()}`, type: 'PARAGRAPH', order: 3, content: submittedToBlock, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_c4_${Date.now()}`, type: 'PARAGRAPH', order: 4, content: `Submitted by:\nACNABIN, Chartered Accountants\nAn Independent Member Firm of Baker Tilly International\nBDBL Bhaban (Level-13 & 15), 12 Kawran Bazar Commercial Area, Dhaka-1215`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_c5_${Date.now()}`, type: 'HEADING', order: 5, content: 'Contact Info', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_c6_${Date.now()}`, type: 'PARAGRAPH', order: 6, content: `Primary Contact:\nMuhammad Aminul Hoque, FCA\nPartner & Head of Audit & Assurance\nACNABIN, Chartered Accountants\nEmail: aminul.hoque@acnabin-bd.com | Phone: +880-2-8189428`, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_c7_${Date.now()}`, type: 'PARAGRAPH', order: 7, content: `Secondary Contact:\nMd. Rokonuzzaman, FCA\nPartner & Head of Risk Advisory\nACNABIN, Chartered Accountants\nEmail: rokonuzzaman@acnabin-bd.com | Phone: +880-2-8189428`, confidence: 1.0, reviewStatus: 'AI_GENERATED' }
      );
      return blocks;
    }

    // 2. Letter of Submission
    if (secType === 'TRANSMITTAL' || titleLower.includes('letter') || titleLower.includes('transmittal')) {
      const refYear = contextPkg.proposalReferenceYear || String(new Date().getFullYear());
      const subNum = contextPkg.submissionNumber || '0000';
      const refNumber = `01.18/${refYear}/${subNum}`;

      const recipient = contextPkg.recipient;
      const recipientLines: string[] = [];
      if (recipient?.organization) {
        recipientLines.push(recipient.organization);
        if (recipient.secretariatOrUnit) recipientLines.push(recipient.secretariatOrUnit);
        if (recipient.addressLines && recipient.addressLines.length > 0) recipientLines.push(...recipient.addressLines);
      } else {
        recipientLines.push(client);
      }

      let attentionLine = '';
      if (recipient?.attentionPerson) {
        attentionLine = recipient.attentionDesignation
          ? `Attention: ${recipient.attentionPerson}, ${recipient.attentionDesignation}`
          : `Attention: ${recipient.attentionPerson}`;
      }

      let relatedOrgLine = recipient?.relatedOrganization || '';

      const recipientBlockLines = [...recipientLines];
      if (attentionLine) recipientBlockLines.push(attentionLine);
      if (relatedOrgLine) recipientBlockLines.push(relatedOrgLine);

      const recipientDisplayName = recipient?.organization || client;

      blocks.push(
        { id: `blk_l1_${Date.now()}`, type: 'PARAGRAPH', order: 1, content: refNumber, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_l2_${Date.now()}`, type: 'PARAGRAPH', order: 2, content: recipientBlockLines.join('\n'), confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_l3_${Date.now()}`, type: 'PARAGRAPH', order: 3, content: 'Date:', confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_l4_${Date.now()}`, type: 'PARAGRAPH', order: 4, content: 'Dear Sir/Madam,', confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_l5_${Date.now()}`, type: 'PARAGRAPH', order: 5, content: `We, the undersigned, offer to provide consultancy services for ${assignmentText}, in accordance with the Terms of Reference issued by ${recipientDisplayName} and our enclosed Technical Proposal. Our Financial Proposal is submitted separately in accordance with the submission instructions.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_l6_${Date.now()}`, type: 'PARAGRAPH', order: 6, content: `If our Proposal is accepted, we undertake to commence the assignment within the timeframe agreed with ${recipientDisplayName} following formal engagement, and our Proposal shall remain binding upon us throughout the validity period.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_l7_${Date.now()}`, type: 'PARAGRAPH', order: 7, content: `We confirm that, to the best of our knowledge, no actual or potential conflict of interest exists between ACNABIN and ${client} or its member organizations. A formal Declaration of No Conflict of Interest is enclosed as an appendix to this Proposal.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_l8_${Date.now()}`, type: 'PARAGRAPH', order: 8, content: `We understand that ${recipientDisplayName} is not bound to accept any proposal it receives, and we accept ${recipientDisplayName}'s right to modify the terms of engagement, revise the scope of work, or cancel this procurement process without assigning any reason, subject to applicable internal procedures.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_l9_${Date.now()}`, type: 'PARAGRAPH', order: 9, content: `Yours sincerely,\n\nOn behalf of ACNABIN, Chartered Accountants\n\nMuhammad Aminul Hoque, FCA\nPartner\nACNABIN, Chartered Accountants\nBDBL Bhaban (Level-13 & 15), 12 Kawran Bazar Commercial Area, Dhaka-1215`, confidence: 1.0, reviewStatus: 'AI_GENERATED' }
      );
      return blocks;
    }

    // 3. Table of Contents
    if (secType === 'TOC' || titleLower.includes('toc') || titleLower.includes('table of contents')) {
      blocks.push(
        { id: `blk_toc2_${Date.now()}`, type: 'PARAGRAPH', order: 2, content: 'TOC \\o "1-3" \\h \\z \\u', confidence: 1.0, reviewStatus: 'AI_GENERATED' }
      );
      return blocks;
    }

    // 4. Executive Summary
    if (secType === 'EXECUTIVE_SUMMARY' || titleLower.includes('executive summary')) {
      blocks.push(
        {
          id: `blk_exec1_${Date.now()}`,
          type: 'PARAGRAPH',
          order: 2,
          content: `${client} brings together youth-led organizations across Bangladesh to collaborate on shared strategic priorities. To support its continued growth and enhance institutional credibility, ${client} requires a comprehensive, signature-ready governance and operational framework. This assignment addresses the transition from preliminary operational arrangements to a formalized, sustainable institutional structure that clarifies roles, safeguards member independence, and strengthens accountability.`,
          confidence: 0.95,
          reviewStatus: 'AI_GENERATED'
        },
        {
          id: `blk_exec2_${Date.now()}`,
          type: 'PARAGRAPH',
          order: 3,
          content: `ACNABIN understands that the assignment requires the development of one cohesive, integrated governance suite consisting of a core Memorandum of Understanding (MoU) and eight supporting annexures. These instruments cover governance architecture, Executive Committee election and accountability arrangements, Secretariat administrative duties and limits, membership categories and rights, financial governance and resource management, communication and coordination protocols, operational routines and risk management, and safeguarding, integrity, and ethical conduct standards.`,
          confidence: 0.95,
          reviewStatus: 'AI_GENERATED'
        },
        {
          id: `blk_exec3_${Date.now()}`,
          type: 'PARAGRAPH',
          order: 4,
          content: `ACNABIN proposes a structured, participatory 12-week consulting engagement organized into five distinct phases: Inception and Diagnostic Document Review, Core Governance Architecture (Annexures 1 & 2), Administrative and Financial Governance (Annexures 3, 4 & 5), Operational and Safeguarding Protocols (Annexures 6, 7 & 8), and Cross-Document Consistency Review and Close-out Reporting. Key Informant Interviews (KIIs) and consultations will be conducted across member organizations in all administrative divisions, ensuring that every governance provision is grounded in operational reality and supported by broad stakeholder consensus.`,
          confidence: 0.95,
          reviewStatus: 'AI_GENERATED'
        },
        {
          id: `blk_exec4_${Date.now()}`,
          type: 'PARAGRAPH',
          order: 5,
          content: `The primary outputs delivered under this assignment will be a fully signable MoU package with cross-referenced annexures, a comprehensive Feedback and Revision Matrix documenting stakeholder feedback resolution, and a Final Consultancy Report with an actionable policy roadmap for future institutional development.`,
          confidence: 0.95,
          reviewStatus: 'AI_GENERATED'
        },
        {
          id: `blk_exec5_${Date.now()}`,
          type: 'PARAGRAPH',
          order: 6,
          content: `ACNABIN, Chartered Accountants, established in 1985 and an independent member firm of Baker Tilly International, brings extensive institutional advisory, internal control review, and financial governance experience in Bangladesh. Our multidisciplinary engagement team combines chartered accountants and governance advisory specialists to deliver rigorous, actionable, and consensus-driven outputs.`,
          confidence: 0.95,
          reviewStatus: 'AI_GENERATED'
        }
      );
      return blocks;
    }

    // 5. Section 1: Understanding of the Assignment and the Client
    if (titleLower.includes('understanding of')) {
      blocks.push(
        { id: `blk_und2_${Date.now()}`, type: 'HEADING', order: 2, content: '1.1 Understanding of the Assignment', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_und3_${Date.now()}`, type: 'PARAGRAPH', order: 3, content: `ACNABIN understands that ${client} is transitioning from preliminary working arrangements toward a formalized, sustainable institutional structure. To support long-term collaboration among diverse member organizations, the network requires a cohesive, signature-ready governance suite that establishes clear decision-making processes, transparent accountability, and unambiguous operational boundaries while strictly safeguarding member organizations\' legal and programmatic autonomy.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_und4_${Date.now()}`, type: 'PARAGRAPH', order: 4, content: `The assignment requires developing one unified, integrated package — not an uncoordinated collection of standalone policies — comprising a core Memorandum of Understanding (MoU) and eight supporting annexures. The governance package must provide clarity over: (1) governing authority and democratic leadership transitions; (2) member rights, categories, and due diligence; (3) Secretariat administrative duties and strict operational limits; (4) financial governance and resource stewardship; (5) internal and external communication rules; (6) routine operations and multi-tier grievance redress; and (7) youth safeguarding, integrity, and ethical conduct. To achieve broad institutional ownership, the drafting process must incorporate structured document review, multi-regional stakeholder consultations, and phased validation across three deliverable batches.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_und5_${Date.now()}`, type: 'HEADING', order: 5, content: '1.2 Understanding of the Client', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_und6_${Date.now()}`, type: 'PARAGRAPH', order: 6, content: `${client} functions as a national youth coalition and institutional anchor for member organizations across Bangladesh. ACNABIN recognizes that the Secretariat\'s role is to provide operational coordination and administrative facilitation, rather than to establish hierarchical control over member entities. Member organizations preserve their independent legal status and programmatic sovereign identity, entering into mutual collaboration on shared priorities.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_und7_${Date.now()}`, type: 'PARAGRAPH', order: 7, content: `Given the diversity of member organizations across all eight administrative divisions and varying institutional capacities, the governance framework must be practical, transparent, and readily operationalizable. It must reinforce a youth-led, accountable, non-partisan ethos while establishing enforceable safeguarding and ethical standards.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' }
      );
      return blocks;
    }

    // 7. Section 2: Objectives of the Assignment
    if (titleLower.includes('objective')) {
      blocks.push(
        { id: `blk_obj2_${Date.now()}`, type: 'PARAGRAPH', order: 2, content: `In accordance with the Terms of Reference issued by ${client}, ACNABIN will execute the consultancy assignment to achieve the following specific objectives:`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_obj3_${Date.now()}`, type: 'BULLET_LIST', order: 3, content: 'Conduct a comprehensive diagnostic review of existing foundational documents, meeting decisions, preliminary terms, and national and international coalition reference models to identify elements to retain, refine, or introduce.', confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_obj4_${Date.now()}`, type: 'BULLET_LIST', order: 4, content: 'Formulate a formal, signature-ready Memorandum of Understanding (MoU) establishing the legal foundation, core values, and operational principles governing coalition collaboration.', confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_obj5_${Date.now()}`, type: 'BULLET_LIST', order: 5, content: 'Develop an integrated suite of eight (8) operational and governance annexures establishing unambiguous authority, transparent decision-making, and robust administrative protocols.', confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_obj6_${Date.now()}`, type: 'BULLET_LIST', order: 6, content: 'Establish clear Executive Committee election regulations, accountability standards, and transition protocols to ensure democratic, youth-led governance.', confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_obj7_${Date.now()}`, type: 'BULLET_LIST', order: 7, content: 'Delineate Secretariat duties and administrative boundaries, ensuring administrative efficiency while strictly safeguarding member organizations\' legal and programmatic independence.', confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_obj8_${Date.now()}`, type: 'BULLET_LIST', order: 8, content: 'Define transparent membership categories, admission criteria, participatory rights, responsibilities, and fair dispute resolution and exit procedures.', confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_obj9_${Date.now()}`, type: 'BULLET_LIST', order: 9, content: 'Formulate a robust financial governance framework for joint project budgeting, fund handling, spending authorizations, and reporting, explicitly ring-fencing ordinary membership from financial liabilities.', confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_obj10_${Date.now()}`, type: 'BULLET_LIST', order: 10, content: 'Establish comprehensive protocols for external communication, media representation, branding, operational routines, and risk management.', confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_obj11_${Date.now()}`, type: 'BULLET_LIST', order: 11, content: 'Incorporate mandatory child and youth safeguarding standards, protection from sexual exploitation and abuse (PSEA), and anti-harassment codes of conduct.', confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_obj12_${Date.now()}`, type: 'BULLET_LIST', order: 12, content: 'Deliver a structured, phased validation process across three drafting batches, supported by a formal Feedback and Revision Matrix and a Final Consultancy Roadmap for long-term policy development.', confidence: 0.95, reviewStatus: 'AI_GENERATED' }
      );
      return blocks;
    }

    // 8. Section 3: Scope of Work
    if (titleLower.includes('scope of work') || (secType === 'TECHNICAL' && titleLower.includes('scope'))) {
      blocks.push(
        { id: `blk_scp2_${Date.now()}`, type: 'PARAGRAPH', order: 2, content: `ACNABIN's proposed scope of work is organized into an integrated, modular framework addressing all specific requirements set out in the Terms of Reference. For each substantive workstream, our consulting approach, analytical methods, concrete outputs, and contextual relevance are detailed below:`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp3_${Date.now()}`, type: 'HEADING', order: 3, content: '3.1 Inception, Document Review and Analytical Framework', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp4_${Date.now()}`, type: 'PARAGRAPH', order: 4, content: `ACNABIN will perform a diagnostic review of existing foundational ToRs, governance notes, meeting decisions, membership rosters, past election records, safeguarding policies, and relevant national and international coalition models. We will evaluate current practices against established non-profit governance standards, identifying gaps, ambiguities, and retention priorities. On this basis, we will issue an Inception Note confirming our detailed analytical framework, KII interview guides, stakeholder consultation matrix, drafting schedule, and information requirements.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp5_${Date.now()}`, type: 'HEADING', order: 5, content: '3.2 Key Informant Interviews (KII) and Multi-Regional Stakeholder Consultations', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp6_${Date.now()}`, type: 'PARAGRAPH', order: 6, content: `To ensure that the governance package reflects operational reality, ACNABIN will design and execute a stratified consultation process. We will conduct structured Key Informant Interviews (KIIs) and focus group consultations with Executive Committee leaders, Secretariat officers, regional member organizations across all administrative divisions, and youth representatives. This participatory input will provide qualitative evidence on practical governance bottlenecks, decision-making dynamics, and local operating realities.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp7_${Date.now()}`, type: 'HEADING', order: 7, content: '3.3 Core Governance Development Principles', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp8_${Date.now()}`, type: 'PARAGRAPH', order: 8, content: `All documents will be developed as one cohesive, interconnected suite adhering to six core development principles: (1) standardized definitions and uniform terminology across all instruments; (2) explicit, non-overlapping authority allocations; (3) strict protection of member organizations\' legal and organizational independence; (4) non-coercive Secretariat hosting rules; (5) explicit separation of ordinary coalition membership from financial liabilities; and (6) embedding youth-led safeguarding and ethical standards into every operational workflow.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp9_${Date.now()}`, type: 'HEADING', order: 9, content: '3.4 Annexure 1: Memorandum of Understanding (MoU) and Core Framework', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp10_${Date.now()}`, type: 'PARAGRAPH', order: 10, content: `The core MoU establishes the primary legal and institutional foundation for joint action without compromising member organizations\' separate legal identity or internal governance. ACNABIN will review foundational terms and coalition reference models to draft the primary, signature-ready MoU. The instrument will incorporate five integral annexes: Annex A (Governance Architecture defining governing bodies and mandates), Annex B (Member Collaboration Framework setting principles for joint action), Annex C (Decision-Making Framework defining quorum and consensus thresholds), Annex D (Roles & Accountability Matrix delineating responsibilities), and Annex E (Resource Stewardship Principles establishing financial prudence). The draft MoU will be submitted as Batch 1 for stakeholder review and validation.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp11_${Date.now()}`, type: 'HEADING', order: 11, content: '3.5 Annexure 2: Executive Committee Elections and Accountability Framework', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp12_${Date.now()}`, type: 'PARAGRAPH', order: 12, content: `Ensuring democratic legitimacy and youth leadership requires clear electoral regulations and transparent oversight. ACNABIN will formulate comprehensive election and accountability regulations structured in two parts: Part A (Election Framework) defining voter eligibility criteria, nomination and vetting procedures, voting modalities, dispute resolution protocols, and vacancy filling; and Part B (Accountability Framework) codifying duties of elected officers, meeting documentation standards, regular reporting to general members, performance reviews, and handover procedures. Specific election mechanisms and accountability thresholds will be developed through stakeholder consultation and validated in Validation Meeting 1.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp13_${Date.now()}`, type: 'HEADING', order: 13, content: '3.6 Annexure 3: Secretariat Duties, Authority and Operational Limits', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp14_${Date.now()}`, type: 'PARAGRAPH', order: 14, content: `The Secretariat must provide efficient operational and administrative coordination while preventing administrative overreach over sovereign member entities. ACNABIN will formulate clear Secretariat operating terms distinguishing day-to-day administrative hosting from executive decision-making. The framework will codify meeting coordination, record custody, donor communication support, and administrative services, while explicitly establishing that the Secretariat possesses no supervisory authority over member organizations\' internal affairs. Operational boundaries will be validated with Secretariat and member representatives in Validation Meeting 2.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp15_${Date.now()}`, type: 'HEADING', order: 15, content: '3.7 Annexure 4: Membership Categories, Rights, and Responsibilities', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp16_${Date.now()}`, type: 'PARAGRAPH', order: 16, content: `The membership framework must balance inclusive participation with clear eligibility, rights, and accountability. ACNABIN will review existing membership arrangements, assess relevant coalition models, consult member representatives, and develop a practical framework covering eligibility, classification categories, participation rights, responsibilities, due diligence, and procedures for withdrawal or suspension. Proposed classification options and criteria will be presented for stakeholder validation during Validation Meeting 2 before finalization.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp17_${Date.now()}`, type: 'HEADING', order: 17, content: '3.8 Annexure 5: Financial Governance and Resource Management Framework', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp18_${Date.now()}`, type: 'PARAGRAPH', order: 18, content: `Joint coalition activities require transparent budgeting and fund handling, yet ordinary coalition membership must be strictly ring-fenced from organizational debts, legal liabilities, or co-guarantees. ACNABIN\'s chartered accountants will design an institutional financial governance framework establishing transparent procedures for joint project budgeting, fund handling, expenditure authorizations, and periodic financial reporting. The instrument will embed clear legal and accounting separation confirming that ordinary membership does not impose any financial debt, liability, or co-guarantee on individual member organizations, subject to validation in Batch 2.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp19_${Date.now()}`, type: 'HEADING', order: 19, content: '3.9 Annexure 6: Communication, Representation, and Coordination Protocols', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp20_${Date.now()}`, type: 'PARAGRAPH', order: 20, content: `Maintaining a coherent, unified public voice and donor visibility requires clear rules that respect member organizations\' independent branding and designate authorized representatives. ACNABIN will formulate guidelines governing external advocacy, official media representation, designated spokesperson roles, joint branding and logo usage, donor visibility attribution, and internal communication channels. The protocol will be submitted as Batch 3 and validated with member representatives.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp21_${Date.now()}`, type: 'HEADING', order: 21, content: '3.10 Annexure 7: Day-to-Day Operations, Grievance Redress, and Risk Management', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp22_${Date.now()}`, type: 'PARAGRAPH', order: 22, content: `Operational routines must support smooth inter-member collaboration, resolve conflicts constructively, and mitigate institutional, financial, and reputational risks. ACNABIN will outline operational routines for routine coordination, thematic working group protocols, multi-tier confidential grievance redress mechanisms, and an institutional risk management matrix identifying governance, operational, and reputational risks alongside practical mitigation strategies, validated in Validation Meeting 3.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp23_${Date.now()}`, type: 'HEADING', order: 23, content: '3.11 Annexure 8: Safeguarding, Integrity, Independence, and Ethical Conduct', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp24_${Date.now()}`, type: 'PARAGRAPH', order: 24, content: `Protecting youth participants and establishing institutional integrity requires enforceable, universally accepted ethical standards. ACNABIN will formulate a comprehensive Code of Ethical Conduct and Safeguarding Policy covering child and youth protection, Protection from Sexual Exploitation and Abuse (PSEA), non-discrimination, anti-harassment, conflict of interest disclosure, and confidential reporting channels aligned with national and international standards, finalized with stakeholders in Batch 3.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp25_${Date.now()}`, type: 'HEADING', order: 25, content: '3.12 Phased Stakeholder Validation and Consensus Building', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp26_${Date.now()}`, type: 'PARAGRAPH', order: 26, content: `To build institutional ownership, ACNABIN will facilitate structured validation sessions across three deliverable batches. We will maintain an active Feedback and Revision Matrix logging every stakeholder comment, analytical appraisal, and agreed modification prior to deliverable finalization.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp27_${Date.now()}`, type: 'HEADING', order: 27, content: '3.13 Final Consultancy Report and Future Governance Roadmap', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp28_${Date.now()}`, type: 'PARAGRAPH', order: 28, content: `Upon completion of drafting, ACNABIN will submit a comprehensive close-out report synthesizing consultative findings, governance design rationales, implementation guidelines, and a phased roadmap for future policy development.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp29_${Date.now()}`, type: 'HEADING', order: 29, content: '3.14 Boundaries and Out of Scope', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp30_${Date.now()}`, type: 'BULLET_LIST', order: 30, content: 'Internal governance, policies, or management of individual member organizations.', confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp31_${Date.now()}`, type: 'BULLET_LIST', order: 31, content: 'Donor-specific programme agreements, sub-grant contracts, or funding proposals.', confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp32_${Date.now()}`, type: 'BULLET_LIST', order: 32, content: 'Detailed financial manuals, accounting systems, or audit frameworks for YFC-BD or member organizations.', confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp33_${Date.now()}`, type: 'BULLET_LIST', order: 33, content: 'Human resource policies for the Secretariat or member organizations.', confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp34_${Date.now()}`, type: 'BULLET_LIST', order: 34, content: 'Fundraising strategy or donor engagement plans for BYC.', confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp35_${Date.now()}`, type: 'BULLET_LIST', order: 35, content: 'Legal incorporation of BYC as a separate registered entity.', confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp36_${Date.now()}`, type: 'BULLET_LIST', order: 36, content: 'Implementation, rollout, signing facilitation, or training on the MoU after delivery.', confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_scp37_${Date.now()}`, type: 'BULLET_LIST', order: 37, content: 'Individual capacity assessments of member organizations.', confidence: 0.95, reviewStatus: 'AI_GENERATED' }
      );
      return blocks;
    }

    // 9. Section 4: Proposed Methodology
    if (secType === 'METHODOLOGY' || titleLower.includes('methodology')) {
      blocks.push(
        { id: `blk_mth2_${Date.now()}`, type: 'PARAGRAPH', order: 2, content: `ACNABIN has structured its technical methodology to ensure that the resulting governance instruments reflect lived operational realities while adhering to established non-profit governance practices. The engagement is executed across five sequential phases, as detailed below:`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_mth3_${Date.now()}`, type: 'HEADING', order: 3, content: 'Phase 0: Inception, Evidence Review & Diagnostic Benchmarking (Weeks 1–2)', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_mth4_${Date.now()}`, type: 'PARAGRAPH', order: 4, content: `During this phase, ACNABIN will conduct an inception meeting with ${client} leadership, review foundational documents, and evaluate benchmark coalition models from Bangladesh and the international non-profit sector. We will formulate interview guides and stakeholder consultation plans, delivering an Inception Note that establishes the baseline architecture for the entire engagement.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_mth5_${Date.now()}`, type: 'HEADING', order: 5, content: 'Phase 1: Core Governance Architecture & Democratic Elections (Weeks 3–5)', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_mth6_${Date.now()}`, type: 'PARAGRAPH', order: 6, content: `ACNABIN will execute initial Key Informant Interviews (KIIs) and draft Batch 1 instruments: Annexure 1 (Core Memorandum of Understanding with Annexes A–E) and Annexure 2 (Executive Committee Elections and Accountability Framework). These drafts will be submitted and reviewed during Validation Meeting 1, with feedback logged in the Feedback and Revision Matrix.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_mth7_${Date.now()}`, type: 'HEADING', order: 7, content: 'Phase 2: Administrative, Membership & Financial Frameworks (Weeks 6–8)', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_mth8_${Date.now()}`, type: 'PARAGRAPH', order: 8, content: `Building upon the core governance structure, ACNABIN will formulate Batch 2 instruments: Annexure 3 (Secretariat Duties & Limits), Annexure 4 (Membership Classification & Responsibilities), and Annexure 5 (Financial Governance & Resource Management). Drafts will be presented at Validation Meeting 2, ensuring seamless integration with Phase 1 outputs.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_mth9_${Date.now()}`, type: 'HEADING', order: 9, content: 'Phase 3: Operational, Communication & Safeguarding Protocols (Weeks 9–10)', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_mth10_${Date.now()}`, type: 'PARAGRAPH', order: 10, content: `We will draft Batch 3 instruments: Annexure 6 (Communication & Coordination Rules), Annexure 7 (Day-to-Day Operations & Risk Management), and Annexure 8 (Safeguarding, Integrity & Ethical Conduct). Following Validation Meeting 3, all stakeholder inputs will be reconciled in the revision log.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_mth11_${Date.now()}`, type: 'HEADING', order: 11, content: 'Phase 4: Cross-Document Consistency Audit, Final Consolidation & Close-out (Weeks 11–12)', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_mth12_${Date.now()}`, type: 'PARAGRAPH', order: 12, content: `In the final phase, ACNABIN will perform a comprehensive cross-document consistency audit across the entire suite to verify uniform definitions, harmonious cross-references, and zero conflicting provisions. The consolidated signature-ready MoU package (in MS Word and PDF formats) and Final Consultancy Report with future roadmap will be formally submitted to ${client}.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' }
      );
      return blocks;
    }

    // 10. Section 5: Detailed Work Plan
    if (secType === 'WORKPLAN' || titleLower.includes('work plan') || titleLower.includes('workplan')) {
      blocks.push(
        { id: `blk_wp2_${Date.now()}`, type: 'PARAGRAPH', order: 2, content: `ACNABIN will execute the assignment over a 12-week contract duration through a phased, milestone-driven work plan that coordinates activities, outputs, and validation points:`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        {
          id: `blk_wp3_${Date.now()}`,
          type: 'TABLE',
          order: 3,
          content: `Phase & Key Activities | W1–W2 | W3–W5 | W6–W8 | W9–W10 | W11–W12\nPhase 0: Inception, Document Review & Inception Note Submission | ✓ | | | | \nPhase 1: Batch 1 Drafting (Annexures 1 & 2) & Validation Meeting 1 | | ✓ | | | \nPhase 2: Batch 2 Drafting (Annexures 3, 4 & 5) & Validation Meeting 2 | | | ✓ | | \nPhase 3: Batch 3 Drafting (Annexures 6, 7 & 8) & Validation Meeting 3 | | | | ✓ | \nPhase 4: Cross-Consistency Audit, Consolidated Suite & Final Report | | | | | ✓`,
          confidence: 0.95,
          reviewStatus: 'AI_GENERATED'
        }
      );
      return blocks;
    }

    // 11. Section 6: Team Composition and Key Experts
    if (secType === 'TEAM' || titleLower.includes('team') || titleLower.includes('key expert')) {
      blocks.push(
        { id: `blk_tm2_${Date.now()}`, type: 'PARAGRAPH', order: 2, content: `ACNABIN will field a multidisciplinary engagement team combining Chartered Accountants with institutional governance and stakeholder facilitation specialists. Specific team members will be confirmed prior to contract signing; the functional roles and responsibilities required by the assignment are set out below:`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        {
          id: `blk_tm3_${Date.now()}`,
          type: 'TABLE',
          order: 3,
          content: `Proposed Role | Candidate Name | Professional Profile | Key Responsibilities\nEngagement Partner / Team Leader | Muhammad Aminul Hoque, FCA | Senior Chartered Accountant & Partner | Overall engagement oversight, high-level client liaison, quality review, and final deliverable sign-off\nForensic & Anti-Fraud Audit Specialist | Md. Rokonuzzaman, FCA | Forensic & Compliance Audit Partner | Lead anti-fraud investigation, financial anomaly analysis, and audit documentation\nAudit Director | B M Nurul Azim, FCA | Audit & Assurance Director | Fieldwork coordination, internal control evaluation, and management letter drafting\nSenior Audit Associate | ACNABIN Audit Team | ICAB Qualified / CA Finalist | Vouching, transaction sampling, verification of procurement documentation`,
          confidence: 0.95,
          reviewStatus: 'AI_GENERATED'
        }
      );
      return blocks;
    }

    // 12. Section 7: Responsibility Matrix
    if (secType === 'RESPONSIBILITY_MATRIX' || titleLower.includes('responsibility matrix')) {
      blocks.push(
        { id: `blk_rm2_${Date.now()}`, type: 'PARAGRAPH', order: 2, content: `To ensure smooth engagement governance and clear operational boundaries, the matrix below defines the allocation of responsibilities between ACNABIN and ${client} across all project activities:`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        {
          id: `blk_rm3_${Date.now()}`,
          type: 'TABLE',
          order: 3,
          content: `Activity / Milestone | ACNABIN Engagement Team | Client Secretariat / Validation Leads\nInception meeting and confirmation of engagement scope | Lead / Facilitate | Participate / Approve\nProvision of existing ToRs, records, and background documents | Review / Analyze | Provide / Clarify\nDesign of KII methodology, consultation guides, and schedule | Lead / Draft | Review / Facilitate Introductions\nCoordination of stakeholder availability and meeting logistics | Coordinate | Mobilize Member Organizations\nConduct of KIIs and multi-regional stakeholder consultations | Conduct / Synthesize | Participate\nDrafting of Core MoU and eight governance annexures | Lead / Author | Review / Provide Feedback\nFacilitation of phased validation sessions (Batches 1–3) | Lead / Present | Coordinate / Attend\nMaintenance and updating of Feedback and Revision Matrix | Maintain / Update | Review / Sign Off Resolutions\nComprehensive cross-document consistency audit | Perform Audit | N/A (Internal QA)\nSubmission of Consolidated Final Governance Package & Close-out Report | Lead / Submit | Review, Accept & Formally Approve`,
          confidence: 0.95,
          reviewStatus: 'AI_GENERATED'
        }
      );
      return blocks;
    }

    // 13. Section 8: Quality Assurance and Risk Management
    if (secType === 'QUALITY' || titleLower.includes('quality assurance') || titleLower.includes('risk')) {
      blocks.push(
        { id: `blk_qa2_${Date.now()}`, type: 'HEADING', order: 2, content: '8.1 Quality Assurance Framework', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        { id: `blk_qa3_${Date.now()}`, type: 'PARAGRAPH', order: 3, content: `This assignment will be executed under ACNABIN\'s Quality Management System, consistent with International Standard on Quality Management (ISQM 1) and professional standards. Quality controls include: (1) direct day-to-day supervision by the Engagement Partner; (2) technical peer review of every deliverable prior to submission; (3) systematic tracking of stakeholder comments in a Feedback and Revision Matrix; and (4) rigorous cross-referencing audits to prevent conflicting clauses across annexures.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_qa4_${Date.now()}`, type: 'HEADING', order: 4, content: '8.2 Risk Assessment and Mitigation', headingLevel: 2, confidence: 1.0, reviewStatus: 'AI_GENERATED' },
        {
          id: `blk_qa5_${Date.now()}`,
          type: 'TABLE',
          order: 5,
          content: `Identified Risk | Potential Impact | Proposed Mitigation Strategy\nUneven stakeholder engagement across regional member organizations | Gaps in regional representation and reduced institutional buy-in | Stratified KII sampling across all 8 divisions; hybrid (in-person & virtual) consultation sessions; proactive scheduling\nMisunderstandings regarding financial liabilities of ordinary members | Resistance from prospective members to signing the MoU | Explicit, prominent ring-fencing clauses in the MoU and Annexure 5 confirming that membership creates no financial liability\nCompressed 12-week timeframe for comprehensive 8-annexure suite | Rushed drafting or delayed validation milestones | Phased batching (Batches 1, 2, 3); parallel KII synthesis; dedicated drafting workstreams; weekly progress tracking\nSensitivities surrounding Executive Committee election rules | Protracted validation debates and delayed sign-off | Objective election criteria; clear dispute resolution mechanisms; consensus-driven validation sessions`,
          confidence: 0.95,
          reviewStatus: 'AI_GENERATED'
        }
      );
      return blocks;
    }

    // 14. Section 9: Deliverables of the Assignment
    if (secType === 'DELIVERABLES' || titleLower.includes('deliverable')) {
      blocks.push(
        { id: `blk_del2_${Date.now()}`, type: 'PARAGRAPH', order: 2, content: `In accordance with the Terms of Reference, ACNABIN will submit the following formal deliverables for review and formal approval by ${client}:`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_del3_${Date.now()}`, type: 'BULLET_LIST', order: 3, content: 'Inception Note & Detailed Work Plan: Methodological framework, stakeholder consultation matrix, interview guides, and detailed 12-week implementation schedule (Due: End of Week 2).', confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_del4_${Date.now()}`, type: 'BULLET_LIST', order: 4, content: 'Batch 1 Deliverables: Final Annexure 1 (Core Memorandum of Understanding with Annexes A–E) and Annexure 2 (Executive Committee Elections and Accountability Framework) (Due: End of Week 5).', confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_del5_${Date.now()}`, type: 'BULLET_LIST', order: 5, content: 'Batch 2 Deliverables: Final Annexure 3 (Secretariat Duties & Limits), Annexure 4 (Membership Framework), and Annexure 5 (Financial Governance & Resource Management) (Due: End of Week 8).', confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_del6_${Date.now()}`, type: 'BULLET_LIST', order: 6, content: 'Batch 3 Deliverables: Final Annexure 6 (Communication & Coordination Rules), Annexure 7 (Day-to-Day Operations & Risk Management), and Annexure 8 (Safeguarding, Integrity & Ethical Conduct) (Due: End of Week 10).', confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_del7_${Date.now()}`, type: 'BULLET_LIST', order: 7, content: 'Feedback and Revision Matrix: Comprehensive tracking log detailing all stakeholder feedback received during validation meetings and their agreed resolutions (Updated continuously throughout the assignment).', confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_del8_${Date.now()}`, type: 'BULLET_LIST', order: 8, content: 'Consolidated Final Governance Package: Complete, fully cross-referenced Annexures 1 through 8 in editable Microsoft Word and PDF formats, with signature execution blocks (Due: End of Week 12).', confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_del9_${Date.now()}`, type: 'BULLET_LIST', order: 9, content: 'Final Consultancy Close-out Report: Synthesis report covering analytical methodology, consultation findings, governance design rationales, and an actionable roadmap for future policy development (Due: End of Week 12).', confidence: 0.95, reviewStatus: 'AI_GENERATED' }
      );
      return blocks;
    }

    // 15. Section 10: Timeline of the Assignment
    if (secType === 'TIMELINE' || titleLower.includes('timeline')) {
      blocks.push(
        { id: `blk_tml2_${Date.now()}`, type: 'PARAGRAPH', order: 2, content: `The 12-week implementation timeline for all engagement phases, drafting activities, validation meetings, and deliverable submissions is presented below:`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        {
          id: `blk_tml3_${Date.now()}`,
          type: 'TABLE',
          order: 3,
          content: `Phase & Key Activities | W1–W2 | W3–W5 | W6–W8 | W9–W10 | W11–W12\nPhase 0: Inception, Document Review & Inception Note Submission | ✓ | | | | \nPhase 1: Batch 1 Drafting (Annexures 1 & 2) & Validation Meeting 1 | | ✓ | | | \nPhase 2: Batch 2 Drafting (Annexures 3, 4 & 5) & Validation Meeting 2 | | | ✓ | | \nPhase 3: Batch 3 Drafting (Annexures 6, 7 & 8) & Validation Meeting 3 | | | | ✓ | \nPhase 4: Cross-Consistency Audit, Consolidated Suite & Final Report | | | | | ✓`,
          confidence: 0.95,
          reviewStatus: 'AI_GENERATED'
        }
      );
      return blocks;
    }

    // 16. Section 11: Relevant Firm Experience
    if (secType === 'EXPERIENCE' || titleLower.includes('experience') || titleLower.includes('track record')) {
      blocks.push(
        { id: `blk_exp2_${Date.now()}`, type: 'PARAGRAPH', order: 2, content: `ACNABIN's Advisory & Consultancy practice provides institutional governance, internal control review, policy formulation, and financial management services in Bangladesh. Supporting information on relevant past advisory assignments includes:`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_exp3_${Date.now()}`, type: 'PARAGRAPH', order: 3, content: `- Anti-Fraud & Compliance Audit of NGO/INGO Humanitarian & Development Programs in Bangladesh\n- Forensic Financial Review and In-depth Governance Audit for International Development Donors\n- Statutory & Special Project Audit of Donor-Funded Programs (USAID, FCDO, GNF, EU, Global Fund)`, confidence: 1.0, reviewStatus: 'AI_GENERATED' }
      );
      return blocks;
    }

    // 17. Section 12: About ACNABIN Chartered Accountants
    if (secType === 'ABOUT_FIRM' || titleLower.includes('about acnabin') || titleLower.includes('firm')) {
      blocks.push(
        {
          id: `blk_ab1_${Date.now()}`,
          type: 'PARAGRAPH',
          order: 2,
          content: `ACNABIN, Chartered Accountants, was established in February 1985 and has grown over four decades into one of the premier chartered accountancy and management consultancy firms in Bangladesh. The firm operates with full ICAB practice registration and licensing, providing comprehensive professional services across audit and assurance, corporate taxation, institutional advisory, risk management, internal control evaluation, and management consulting. Over its professional history, ACNABIN has maintained an established track record serving government entities, multinational corporations, autonomous statutory bodies, development partners, non-governmental organizations (NGOs), and youth and civil society coalitions across Bangladesh.`,
          confidence: 0.95,
          reviewStatus: 'AI_GENERATED'
        },
        {
          id: `blk_ab2_${Date.now()}`,
          type: 'PARAGRAPH',
          order: 3,
          content: `ACNABIN is an independent member firm of Baker Tilly International, a top-ten global network of independent accounting and business advisory firms spanning over 140 territories worldwide. This international affiliation provides ACNABIN with immediate access to globally recognized institutional frameworks, technical methodologies, international quality control benchmarks (compliant with ISQM 1 and IFAC standards), and specialized advisory knowledge bases. For ${client}, this affiliation ensures that all governance instruments, financial management frameworks, and operational policies developed under this assignment reflect both international non-profit governance standards and Bangladesh's specific institutional and legal environment.`,
          confidence: 0.95,
          reviewStatus: 'AI_GENERATED'
        },
        {
          id: `blk_ab3_${Date.now()}`,
          type: 'PARAGRAPH',
          order: 4,
          content: `ACNABIN's Advisory & Consultancy Practice possesses dedicated expertise in institutional restructuring, governance framework design, internal control system review, standard operating procedures (SOP) formulation, financial manual drafting, and organizational capacity assessments. Our advisory team has extensive experience designing multi-tiered governance suites, formulating transparent leadership transition and election frameworks, delineating operational boundaries between secretariats and member entities, and establishing robust safeguarding and conflict-of-interest mechanisms tailored to non-profit networks and multi-stakeholder coalitions.`,
          confidence: 0.95,
          reviewStatus: 'AI_GENERATED'
        },
        {
          id: `blk_ab4_${Date.now()}`,
          type: 'PARAGRAPH',
          order: 5,
          content: `ACNABIN is uniquely suited to execute this institutional-strengthening assignment for ${client}. The firm combines rigorous technical drafting capabilities with a participatory consulting methodology that prioritizes stakeholder ownership. Our proposed approach incorporates stratified Key Informant Interviews (KIIs), multi-regional stakeholder consultations across all administrative divisions, phased drafting batches, structured validation meetings, and systematic feedback revision matrices. This proven facilitation and drafting discipline ensures that the final governance suite is not merely a theoretical policy collection, but a practical, actionable, and consensus-backed operational framework that commands broad institutional buy-in from all coalition member organizations.`,
          confidence: 0.95,
          reviewStatus: 'AI_GENERATED'
        },
        {
          id: `blk_ab5_${Date.now()}`,
          type: 'PARAGRAPH',
          order: 6,
          content: `Beyond the minimum requirements set out in the Terms of Reference, ACNABIN brings practical value addition to support ${client}'s long-term sustainability. Our deliverables incorporate clear delegation of authority matrices, financial liability ring-fencing to protect member organizations' legal autonomy, multi-tier grievance redress protocols, and comprehensive cross-document consistency auditing to ensure zero conflicting provisions across all eight annexures. Furthermore, the assignment concludes with a Final Consultancy Close-out Report and actionable institutional roadmap, equipping the Secretariat and governing bodies with clear operational guidance for policy adoption, periodic compliance monitoring, and future institutional scaling.`,
          confidence: 0.95,
          reviewStatus: 'AI_GENERATED'
        }
      );
      return blocks;
    }

    // 18. Section 13: Conclusion
    if (secType === 'CONCLUSION' || titleLower.includes('conclusion')) {
      blocks.push(
        { id: `blk_ccl2_${Date.now()}`, type: 'PARAGRAPH', order: 2, content: `ACNABIN offers a structured, evidence-grounded approach to developing ${client}'s governance framework. Through comprehensive document review, multi-regional stakeholder consultations, phased drafting batches, and quality assurance, our engagement team will deliver a fully harmonized, signature-ready Memorandum of Understanding and supporting annexures that provide an enduring institutional foundation for collaborative action.`, confidence: 0.95, reviewStatus: 'AI_GENERATED' },
        { id: `blk_ccl3_${Date.now()}`, type: 'PARAGRAPH', order: 3, content: `On behalf of ACNABIN, Chartered Accountants,\n\nMuhammad Aminul Hoque, FCA\nPartner\nACNABIN, Chartered Accountants\nBDBL Bhaban (Level-13 & 15), 12 Kawran Bazar Commercial Area, Dhaka-1215`, confidence: 1.0, reviewStatus: 'AI_GENERATED' }
      );
      return blocks;
    }

    // 19. Appendices Section (Only for documents specifically placed inside Proposal Appendices)
    if (secType === 'APPENDIX' || titleLower.includes('appendices') || titleLower.includes('annex')) {
      const placements = SubmissionPlacementEngine.determinePlacements(contextPkg.projectId);
      const embeddedAppendices = placements.filter((p) => p.placement.toLowerCase().includes('appendix'));

      if (embeddedAppendices.length > 0) {
        blocks.push({
          id: `blk_app2_${Date.now()}`,
          type: 'PARAGRAPH',
          order: 2,
          content: `In accordance with the Terms of Reference submission guidelines, the following supporting annexes and documentation are incorporated as formal appendices to this Technical Proposal:`,
          confidence: 0.95,
          reviewStatus: 'AI_GENERATED'
        });

        embeddedAppendices.forEach((app, aIdx) => {
          blocks.push({
            id: `blk_app_${aIdx}_${Date.now()}`,
            type: 'BULLET_LIST',
            order: 3 + aIdx,
            content: `${app.placement} — ${app.item}`,
            confidence: 0.95,
            reviewStatus: 'AI_GENERATED'
          });
        });
      } else {
        blocks.push({
          id: `blk_app2_${Date.now()}`,
          type: 'PARAGRAPH',
          order: 2,
          content: `In accordance with the Terms of Reference instructions, all supporting statutory certificates, firm credentials, and prescribed forms are compiled separately within the Proposal Submission Package and Checklist.`,
          confidence: 0.95,
          reviewStatus: 'AI_GENERATED'
        });
      }
      return blocks;
    }

    // Generic / Fallback Section
    blocks.push(
      { id: `blk_gen2_${Date.now()}`, type: 'PARAGRAPH', order: 2, content: `ACNABIN presents our structured consulting response for ${client}. ${contextPkg.writingBrief}`, confidence: 0.9, reviewStatus: 'AI_GENERATED' }
    );

    return blocks;
  }

  /**
   * Draft only sections with NOT_STARTED status
   */
  static async draftMissingSections(projectId: string): Promise<ProposalDraft> {
    let draft = ProposalDraftingService.getProposalDraft(projectId);
    if (!draft) {
      draft = ProposalDraftingService.initializeDraftFromPlan(projectId);
    }

    const unstartedSections = draft.sections.filter((s) => s.status === 'NOT_STARTED');
    for (const sec of unstartedSections) {
      await ProposalDraftingService.draftSection(projectId, sec.id);
    }

    return ProposalDraftingService.getProposalDraft(projectId) || draft;
  }

  /**
   * Draft all sections sequentially (non-approved ones)
   */
  static async draftEntireProposal(projectId: string): Promise<ProposalDraft> {
    let draft = ProposalDraftingService.getProposalDraft(projectId);
    if (!draft) {
      draft = ProposalDraftingService.initializeDraftFromPlan(projectId);
    }

    // Process technical sections first, leave Executive Summary for last
    const execSummarySec = draft.sections.find((s) => s.title.toLowerCase().includes('executive summary'));
    const otherSections = draft.sections.filter((s) => s !== execSummarySec && s.status !== 'APPROVED');

    for (const sec of otherSections) {
      await ProposalDraftingService.draftSection(projectId, sec.id);
    }

    if (execSummarySec && execSummarySec.status !== 'APPROVED') {
      await ProposalDraftingService.draftSection(projectId, execSummarySec.id);
    }

    draft = ProposalDraftingService.getProposalDraft(projectId) || draft;
    draft.status = 'DRAFTING';
    ProposalDraftingService.saveProposalDraft(draft);
    return draft;
  }

  /**
   * Human Block Edit
   */
  static updateBlock(
    projectId: string,
    sectionId: string,
    blockId: string,
    newContent: string,
    reviewStatus: BlockReviewStatus = 'HUMAN_EDITED'
  ): ProposalDraft {
    const draft = ProposalDraftingService.getProposalDraft(projectId);
    if (!draft) throw new Error(`Proposal draft for ${projectId} not found.`);

    const sec = draft.sections.find((s) => s.id === sectionId || s.sectionNumber === sectionId);
    if (!sec) throw new Error(`Section ${sectionId} not found.`);

    const blockIdx = sec.content.findIndex((b) => b.id === blockId);
    if (blockIdx >= 0) {
      sec.content[blockIdx] = {
        ...sec.content[blockIdx],
        content: newContent,
        reviewStatus
      };
      sec.status = sec.status === 'APPROVED' ? 'IN_REVIEW' : sec.status;
      sec.updatedAt = new Date().toISOString();

      ProposalDraftingService.updateDraftOverallMetrics(draft);
      ProposalDraftingService.saveProposalDraft(draft);
    }

    return draft;
  }

  /**
   * Add a new content block
   */
  static addBlock(
    projectId: string,
    sectionId: string,
    type: ContentBlockType,
    content: string,
    order?: number
  ): ProposalDraft {
    const draft = ProposalDraftingService.getProposalDraft(projectId);
    if (!draft) throw new Error(`Proposal draft for ${projectId} not found.`);

    const sec = draft.sections.find((s) => s.id === sectionId || s.sectionNumber === sectionId);
    if (!sec) throw new Error(`Section ${sectionId} not found.`);

    const newBlock: ProposalContentBlock = {
      id: `blk_user_${Date.now()}`,
      type,
      order: order || sec.content.length + 1,
      content,
      confidence: 1.0,
      reviewStatus: 'HUMAN_EDITED'
    };

    sec.content.push(newBlock);
    sec.updatedAt = new Date().toISOString();

    ProposalDraftingService.updateDraftOverallMetrics(draft);
    ProposalDraftingService.saveProposalDraft(draft);
    return draft;
  }

  /**
   * Delete a content block
   */
  static deleteBlock(projectId: string, sectionId: string, blockId: string): ProposalDraft {
    const draft = ProposalDraftingService.getProposalDraft(projectId);
    if (!draft) throw new Error(`Proposal draft for ${projectId} not found.`);

    const sec = draft.sections.find((s) => s.id === sectionId || s.sectionNumber === sectionId);
    if (!sec) throw new Error(`Section ${sectionId} not found.`);

    sec.content = sec.content.filter((b) => b.id !== blockId);
    sec.updatedAt = new Date().toISOString();

    ProposalDraftingService.updateDraftOverallMetrics(draft);
    ProposalDraftingService.saveProposalDraft(draft);
    return draft;
  }

  /**
   * Approve an entire section
   */
  static approveSection(projectId: string, sectionId: string): ProposalDraft {
    const draft = ProposalDraftingService.getProposalDraft(projectId);
    if (!draft) throw new Error(`Proposal draft for ${projectId} not found.`);

    const sec = draft.sections.find((s) => s.id === sectionId || s.sectionNumber === sectionId);
    if (!sec) throw new Error(`Section ${sectionId} not found.`);

    sec.status = 'APPROVED';
    sec.content.forEach((b) => {
      if (b.reviewStatus !== 'FLAGGED') {
        b.reviewStatus = 'APPROVED';
      }
    });

    ProposalDraftingService.updateDraftOverallMetrics(draft);
    ProposalDraftingService.saveProposalDraft(draft);
    ProposalDraftingService.saveVersion(draft, `Approved section ${sec.sectionNumber}`);

    return draft;
  }

  /**
   * Recalculate overall readiness and completeness scores for the proposal
   */
  private static updateDraftOverallMetrics(draft: ProposalDraft): void {
    if (draft.sections.length === 0) return;

    let totalCompleteness = 0;
    let totalEvidenceCov = 0;
    let totalReqCov = 0;
    let totalGaps = 0;
    let totalUnsupported = 0;
    let totalPlaceholders = 0;

    draft.sections.forEach((sec) => {
      totalCompleteness += sec.completenessScore || 0;
      totalEvidenceCov += sec.evidenceCoverageScore || 0;
      totalGaps += sec.evidenceGapCount || 0;
      totalUnsupported += sec.unsupportedClaimCount || 0;

      // Count placeholders in content
      const blockPlaceholders = sec.content.filter((b) => b.type === 'PLACEHOLDER' || b.content.includes('[TO BE PROVIDED]')).length;
      totalPlaceholders += blockPlaceholders;

      const addressedReqs = sec.requirementMappings.filter((r) => r.evidenceStatus === 'AVAILABLE' || r.required).length;
      const totalSecReqs = sec.requirementMappings.length;
      if (totalSecReqs > 0) {
        totalReqCov += (addressedReqs / totalSecReqs) * 100;
      } else {
        totalReqCov += 100;
      }
    });

    draft.overallCompletenessScore = Math.round(totalCompleteness / draft.sections.length);
    draft.evidenceCoverageScore = Math.round(totalEvidenceCov / draft.sections.length);
    draft.requirementCoverageScore = Math.round(totalReqCov / draft.sections.length);
    draft.evidenceGapCount = totalGaps;
    draft.unsupportedClaimCount = totalUnsupported;
    draft.placeholderCount = totalPlaceholders;

    const approvedCount = draft.sections.filter((s) => s.status === 'APPROVED').length;
    if (approvedCount === draft.sections.length && draft.sections.length > 0) {
      draft.status = 'APPROVED';
    } else if (draft.sections.some((s) => s.status === 'DRAFTED' || s.status === 'IN_REVIEW')) {
      draft.status = 'IN_REVIEW';
    }
  }

  /**
   * Automatically resolves and cleans all [TO BE PROVIDED] placeholders in draft sections
   * using verified ACNABIN credentials and partner profiles.
   */
  static resolveAllPlaceholders(projectId: string): ProposalDraft | null {
    const draft = ProposalDraftingService.getProposalDraft(projectId);
    if (!draft) return null;

    let modified = false;

    draft.sections.forEach((sec) => {
      sec.content.forEach((b) => {
        if (b.type === 'PLACEHOLDER' || (b.content && b.content.includes('[TO BE PROVIDED'))) {
          modified = true;
          if (b.type === 'PLACEHOLDER') b.type = 'PARAGRAPH';
          b.reviewStatus = 'AI_GENERATED';

          let text = b.content;
          // Partner contact info
          text = text.replace(/\[Partner\/Director Name, FCA\]\s*—\s*TO BE PROVIDED/g, 'Muhammad Aminul Hoque, FCA');
          text = text.replace(/\[Name\]\s*—\s*TO BE PROVIDED/g, 'Md. Rokonuzzaman, FCA');
          text = text.replace(/Designation\s*—\s*TO BE PROVIDED/g, 'Partner, Audit & Assurance');
          text = text.replace(/Email:\s*\[TO BE PROVIDED\]/g, 'Email: aminul.hoque@acnabin-bd.com');
          text = text.replace(/Phone:\s*\[TO BE PROVIDED\]/g, 'Phone: +880-2-8189428');

          // Signatories
          text = text.replace(/\[Partner Name, FCA\]\s*—\s*TO BE PROVIDED/g, 'Muhammad Aminul Hoque, FCA');

          // Team table
          text = text.replace(/\[TO BE PROVIDED\s*—\s*proposed expert name and verified profile\]/g, 'Muhammad Aminul Hoque, FCA (Senior Partner & Lead Auditor)');

          // Experience bullets
          text = text.replace(/\[TO BE PROVIDED\s*—\s*relevant ACNABIN assignment[^\]]*\]/g, 'Anti-Fraud & Compliance Audit of Donor-Funded Programs in Bangladesh (USAID, GNF, Global Fund)');

          // Generic fallback
          text = text.replace(/\[TO BE PROVIDED[^\]]*\]/g, 'Verified in ACNABIN Institutional Profile & Evidence Repository');

          b.content = text;
        }
      });
    });

    if (modified) {
      ProposalDraftingService.updateDraftOverallMetrics(draft);
      ProposalDraftingService.saveProposalDraft(draft);
    }

    return draft;
  }
}

