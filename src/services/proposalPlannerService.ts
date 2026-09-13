import {
  Project,
  Requirement,
  HouseStyleProfile,
  TorKnowledgeModel,
  ProposalContentPlan,
  ProposalContentPlanSection,
  ProposalRequirementMapping,
  ProposalEvidenceRequirement,
  ProposalSubmissionItem,
  ProposalPlanningGap,
  EvaluationAlignment,
  PlanSectionType,
  PlanSectionSource,
  RequirementRelationship,
  RequirementResponseApproach,
  EvidenceType,
  EvidenceSourceExpected
} from '../types';
import { AiService } from './aiService';
import { HouseStyleService } from './houseStyleService';
import { ProposalDatabaseService } from './proposalDatabaseService';

const STORAGE_KEY_PREFIX = 'acnabin_proposal_content_plan_';

export class ProposalPlannerService {
  /**
   * Main entry point: Generates a machine-readable ProposalContentPlan from TOR Requirements,
   * TOR Knowledge Model, Reference Proposal Structure, and ACNABIN House Style Profile.
   */
  static async generateContentPlan(
    project: Project,
    requirements: Requirement[],
    houseStyleProfile?: HouseStyleProfile,
    torKnowledgeModel?: TorKnowledgeModel
  ): Promise<ProposalContentPlan> {
    const activeRequirements = (requirements && requirements.length > 0)
      ? requirements
      : ProposalDatabaseService.getProjectRequirements(project.id);
    const activeTorModel = torKnowledgeModel || ProposalDatabaseService.getProjectTorModel(project.id) || undefined;

    const activeProfile = houseStyleProfile || HouseStyleService.getActiveProfile();
    const sourceTorDocs = Array.from(new Set(activeRequirements.map(r => r.sourceFile).filter(Boolean)));
    const referenceDocs = activeProfile.metadata.sourceDocuments || [];

    // 1. Architecture Reconciliation (Precedence: TOR > Reference Proposal > ACNABIN Standard)
    const sections = this.reconcileArchitecture(activeProfile, activeRequirements, activeTorModel);

    // 2. Requirement Allocation & Narrative vs. Submission Control Separation
    const { mappings, submissionItems, unmappedReqs } = this.allocateRequirements(activeRequirements, sections);

    // 3. Evaluation Criteria Alignment
    const evaluationAlignment = this.alignEvaluationCriteria(activeTorModel, sections);

    // 4. Evidence Requirements Planning (Phase 4 Evidence Planning — No retrieval)
    const evidenceRequirements = this.planEvidenceRequirements(activeRequirements, sections);

    // 5. Section-Level Writing Guidance & Briefs
    this.enhanceSectionWritingBriefs(sections, mappings, evidenceRequirements);

    // 6. Planning Gap Detection
    const planningGaps = this.detectPlanningGaps(activeRequirements, unmappedReqs, submissionItems, evidenceRequirements, sections);

    // 7. Calculate Readiness Score & Plan Status
    const { readinessScore, status } = this.calculateReadinessScore(activeRequirements, unmappedReqs, submissionItems, planningGaps);


    const contentPlan: ProposalContentPlan = {
      id: `plan-${project.id}-${Date.now()}`,
      projectId: project.id,
      proposalTitle: project.assignmentTitle || project.name,
      sourceTorDocuments: sourceTorDocs.length > 0 ? sourceTorDocs : ['TOR_Document.pdf'],
      referenceProposalDocuments: referenceDocs,
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status,
      readinessScore,
      sections,
      requirementMappings: mappings,
      evidenceRequirements,
      submissionItems,
      planningGaps,
      evaluationAlignment,
      assumptions: [
        'Architecture prioritized from extracted ACNABIN reference proposal structure where compatible with TOR.',
        'Narrative technical sections separated from administrative submission controls.',
        'Evidence requirements flagged for Phase 5 Document & CV matching.'
      ],
      warnings: planningGaps.filter(g => g.severity === 'CRITICAL' || g.severity === 'HIGH').map(g => g.description)
    };

    // 8. Persist Plan
    this.saveContentPlan(contentPlan);

    return contentPlan;
  }

  /**
   * Section 6 & 7 Requirement: Architecture Reconciliation Engine
   * Compares TOR requirements, Reference Proposal architecture, and ACNABIN Standard baseline.
   */
  private static reconcileArchitecture(
    profile: HouseStyleProfile,
    requirements: Requirement[],
    torKnowledgeModel?: TorKnowledgeModel
  ): ProposalContentPlanSection[] {
    // Filter out Response to Proposal Submission Requirements if present in reference sections
    const rawRefSections = (profile.sectionArchitecture?.orderedSections || []).filter(
      s => !s.title.toLowerCase().includes('response to proposal submission') && !s.title.toLowerCase().includes('submission requirements')
    );
    
    // Standard ACNABIN baseline sections matching benchmark technical proposal format
    const standardBaseline: { title: string; sectionNumber?: string; type: PlanSectionType; purpose: string }[] = [
      { title: 'Cover Page', type: 'COVER', purpose: 'Formal cover page with client details, assignment title, and secondary firm contact info.' },
      { title: 'Letter of Submission', type: 'TRANSMITTAL', purpose: 'Formal transmittal letter signed by ACNABIN Engagement Partner.' },
      { title: 'Table of Contents', type: 'TOC', purpose: 'Native Word Table of Contents field.' },
      { title: 'Executive Summary', type: 'EXECUTIVE_SUMMARY', purpose: 'High-level synthesis of client understanding, methodology, core annexures, and firm profile.' },
      { title: 'Understanding of the Assignment and the Client', sectionNumber: '1', type: 'TECHNICAL', purpose: 'Demonstrate deep understanding of assignment mandate and client organizational environment.' },
      { title: 'Objectives of the Assignment', sectionNumber: '2', type: 'TECHNICAL', purpose: 'State primary and specific TOR assignment objectives.' },
      { title: 'Scope of Work', sectionNumber: '3', type: 'TECHNICAL', purpose: 'Define exact workstreams, governance annexures, and boundary limits.' },
      { title: 'Proposed Methodology', sectionNumber: '4', type: 'METHODOLOGY', purpose: 'Detail step-by-step technical approach, stakeholder consultations, and iterative validation flow.' },
      { title: 'Detailed Work Plan', sectionNumber: '5', type: 'WORKPLAN', purpose: 'Present phase-by-phase activities, key milestones, and timeline schedule table.' },
      { title: 'Team Composition and Key Experts', sectionNumber: '6', type: 'TEAM', purpose: 'Present proposed team roles, profiles, and key responsibilities.' },
      { title: 'Responsibility Matrix', sectionNumber: '7', type: 'RESPONSIBILITY_MATRIX', purpose: 'Define roles & responsibilities matrix between ACNABIN and client key personnel.' },
      { title: 'Quality Assurance and Risk Management', sectionNumber: '8', type: 'QUALITY', purpose: 'Detail Baker Tilly quality control framework and risk mitigation table.' },
      { title: 'Deliverables of the Assignment', sectionNumber: '9', type: 'DELIVERABLES', purpose: 'List explicit deliverable batches, interim outputs, and final consolidated packages.' },
      { title: 'Timeline of the Assignment', sectionNumber: '10', type: 'TIMELINE', purpose: 'Gantt chart and schedule of activities over contract duration.' },
      { title: 'Relevant Firm Experience', sectionNumber: '11', type: 'EXPERIENCE', purpose: 'Present summary of past similar institutional and advisory assignments delivered by ACNABIN.' },
      { title: 'About ACNABIN Chartered Accountants', sectionNumber: '12', type: 'ABOUT_FIRM', purpose: 'Firm profile, Baker Tilly international affiliation, and quality assurance principles.' },
      { title: 'Conclusion', sectionNumber: '13', type: 'CONCLUSION', purpose: 'Closing commitment, summary of value addition, and formal sign-off.' },
      { title: 'Appendices', type: 'APPENDIX', purpose: 'Supporting annexes, CVs, firm profile, past experience certificates, tax documents, and conflict declarations.' }
    ];

    const sections: ProposalContentPlanSection[] = [];

    // Use reference sections if extracted, otherwise fallback to baseline
    const sourceList = rawRefSections.length > 0
      ? rawRefSections.map(s => ({ title: s.title, level: s.level, sectionNumber: undefined, source: 'REFERENCE_PROPOSAL' as PlanSectionSource }))
      : standardBaseline.map(s => ({ title: s.title, level: 1, sectionNumber: s.sectionNumber, source: 'ACNABIN_STANDARD' as PlanSectionSource }));

    sourceList.forEach((sec, idx) => {
      let secType: PlanSectionType = 'TECHNICAL';
      const titleLower = sec.title.toLowerCase();

      if (titleLower.includes('cover')) secType = 'COVER';
      else if (titleLower.includes('letter') || titleLower.includes('transmittal')) secType = 'TRANSMITTAL';
      else if (titleLower.includes('contents') || titleLower.includes('toc')) secType = 'TOC';
      else if (titleLower.includes('executive summary')) secType = 'EXECUTIVE_SUMMARY';
      else if (titleLower.includes('eoi') || titleLower.includes('eligibility') || titleLower.includes('response to') || titleLower.includes('submission requirements')) secType = 'COMPLIANCE_RESPONSE';
      else if (titleLower.includes('methodology')) secType = 'METHODOLOGY';
      else if (titleLower.includes('work plan') || titleLower.includes('workplan')) secType = 'WORKPLAN';
      else if (titleLower.includes('team') || titleLower.includes('key expert')) secType = 'TEAM';
      else if (titleLower.includes('responsibility')) secType = 'RESPONSIBILITY_MATRIX';
      else if (titleLower.includes('quality') || titleLower.includes('risk')) secType = 'QUALITY';
      else if (titleLower.includes('deliverable')) secType = 'DELIVERABLES';
      else if (titleLower.includes('timeline')) secType = 'TIMELINE';
      else if (titleLower.includes('experience') || titleLower.includes('track record')) secType = 'EXPERIENCE';
      else if (titleLower.includes('about acnabin') || titleLower.includes('firm')) secType = 'ABOUT_FIRM';
      else if (titleLower.includes('conclusion')) secType = 'CONCLUSION';
      else if (titleLower.includes('appendices') || titleLower.includes('annex')) secType = 'APPENDIX';

      const cleanTitle = sec.title.replace(/^\d+(\.\d+)*[\s.:-]+/, '').trim();
      let secNumber = sec.sectionNumber;

      if (secNumber === undefined || secNumber === '') {
        const numMatch = sec.title.match(/^(\d+(\.\d+)*)/);
        if (numMatch) {
          secNumber = numMatch[1];
        } else {
          const baselineMatch = standardBaseline.find(
            b => b.title.toLowerCase() === cleanTitle.toLowerCase() ||
                 cleanTitle.toLowerCase().includes(b.title.toLowerCase()) ||
                 b.title.toLowerCase().includes(cleanTitle.toLowerCase())
          );
          if (baselineMatch && baselineMatch.sectionNumber) {
            secNumber = baselineMatch.sectionNumber;
          } else {
            secNumber = '';
          }
        }
      }

      if (secType === 'COVER' || secType === 'TRANSMITTAL' || secType === 'TOC' || secType === 'EXECUTIVE_SUMMARY' || secType === 'COMPLIANCE_RESPONSE' || secType === 'APPENDIX') {
        secNumber = '';
      }

      sections.push({
        id: `sec-plan-${idx + 1}`,
        sectionNumber: secNumber || '',
        title: cleanTitle || sec.title,
        level: sec.level || 1,
        sectionType: secType,
        source: sec.source,
        purpose: `Provide complete technical and compliance response for section: ${cleanTitle || sec.title}`,
        requiredContent: [`Detail ACNABIN approach for ${cleanTitle || sec.title}`],
        optionalContent: ['Visual diagrams and summary tables'],
        prohibitedContent: [
          'Do NOT fabricate past client names, dates, or contract values.',
          'Do NOT include unsupported personnel claims.',
          'Do NOT include unverified certificates.'
        ],
        torRequirementIds: [],
        evaluationCriteriaIds: [],
        deliverableIds: [],
        evidenceRequirementIds: [],
        submissionItemIds: [],
        teamRoleIds: [],
        recommendedOrder: idx + 1,
        writingGuidance: [
          'Use formal, confident, first-person plural voice ("we", "our team").',
          'Align terminology with TOR definitions.'
        ],
        evidenceDependency: secType === 'EXPERIENCE' || secType === 'TEAM' || secType === 'APPENDIX' ? 'REQUIRED' : 'NONE',
        draftingStatus: 'PLANNED',
        aiConfidence: 0.95
      });
    });

    return sections;
  }

  /**
   * Section 8 & 9 Requirement: TOR Requirement Allocation & Narrative vs. Submission Control Separation
   */
  private static allocateRequirements(
    requirements: Requirement[],
    sections: ProposalContentPlanSection[]
  ): {
    mappings: ProposalRequirementMapping[];
    submissionItems: ProposalSubmissionItem[];
    unmappedReqs: Requirement[];
  } {
    const mappings: ProposalRequirementMapping[] = [];
    const submissionItems: ProposalSubmissionItem[] = [];
    const unmappedReqs: Requirement[] = [];

    requirements.forEach((req) => {
      const textLower = (req.requirementText || '').toLowerCase();
      const catLower = (req.category || '').toLowerCase();

      // Classify Non-Narrative Submission Controls
      if (
        catLower === 'submission' ||
        catLower === 'administrative' ||
        textLower.includes('sealed envelope') ||
        textLower.includes('signed declaration') ||
        textLower.includes('tax clearance certificate') ||
        textLower.includes('trade license') ||
        textLower.includes('icab practice license') ||
        textLower.includes('financial proposal')
      ) {
        let catName: ProposalSubmissionItem['submissionCategory'] = 'FORM_DECLARATION';
        if (textLower.includes('financial proposal') || textLower.includes('sealed')) catName = 'SEALED_FINANCIAL';
        if (textLower.includes('envelope')) catName = 'ENVELOPE_FORMAT';
        if (textLower.includes('deadline')) catName = 'DEADLINE_RULE';
        if (textLower.includes('license') || textLower.includes('tax') || textLower.includes('vat')) catName = 'LEGAL_DOC';

        const subItem: ProposalSubmissionItem = {
          id: `sub-${req.id}`,
          requirementId: req.id,
          itemTitle: req.requirementText.slice(0, 80),
          submissionCategory: catName,
          instructions: `Administrative Requirement: ${req.aiInterpretation || req.requirementText}`,
          targetSectionOrAppendix: catName === 'LEGAL_DOC' ? 'Appendices (Annex A-F)' : 'Submission Envelope Package',
          mandatory: req.mandatory
        };
        submissionItems.push(subItem);

        // Also map to Appendix or Compliance Response section
        const targetSec = sections.find(s => s.sectionType === 'COMPLIANCE_RESPONSE' || s.sectionType === 'APPENDIX');
        if (targetSec) {
          targetSec.torRequirementIds.push(req.id);
          targetSec.submissionItemIds.push(subItem.id);
          mappings.push({
            id: `map-${req.id}-${targetSec.id}`,
            requirementId: req.id,
            proposalSectionId: targetSec.id,
            relationship: 'SUBMISSION_CONTROL',
            responseApproach: 'ADMINISTRATIVE',
            required: req.mandatory,
            rationale: 'Administrative submission control clause mapped to compliance response or appendix.',
            evidenceRequired: true,
            evidenceStatus: 'EXPECTED',
            aiConfidence: 0.95,
            sourceFile: req.sourceFile,
            sourcePage: req.sourcePage,
            sourceSection: req.sourceSection,
            sourceClause: req.sourceClause,
            sourceQuote: req.sourceQuote
          });
        }
        return;
      }

      // Map Narrative Technical Requirements
      let mappedSections: ProposalContentPlanSection[] = [];

      if (catLower === 'methodology' || textLower.includes('approach') || textLower.includes('methodology')) {
        mappedSections = sections.filter(s => s.sectionType === 'METHODOLOGY' || s.sectionType === 'TECHNICAL');
      } else if (catLower === 'team' || textLower.includes('expert') || textLower.includes('fca') || textLower.includes('cv')) {
        mappedSections = sections.filter(s => s.sectionType === 'TEAM');
      } else if (catLower === 'experience' || textLower.includes('similar assignment') || textLower.includes('years experience')) {
        mappedSections = sections.filter(s => s.sectionType === 'EXPERIENCE' || s.sectionType === 'TEAM' || s.sectionType === 'APPENDIX');
      } else if (catLower === 'deliverable' || textLower.includes('report') || textLower.includes('deliverable')) {
        mappedSections = sections.filter(s => s.sectionType === 'DELIVERABLES' || s.sectionType === 'METHODOLOGY');
      } else if (catLower === 'timeline' || textLower.includes('duration') || textLower.includes('weeks') || textLower.includes('days')) {
        mappedSections = sections.filter(s => s.sectionType === 'TIMELINE' || s.sectionType === 'WORKPLAN');
      } else if (catLower === 'eligibility' || textLower.includes('icab') || textLower.includes('registered')) {
        mappedSections = sections.filter(s => s.sectionType === 'COMPLIANCE_RESPONSE' || s.sectionType === 'ABOUT_FIRM');
      } else {
        mappedSections = sections.filter(s => s.sectionType === 'TECHNICAL');
      }

      if (mappedSections.length === 0) {
        mappedSections = sections.filter(s => s.sectionType === 'TECHNICAL');
      }

      if (mappedSections.length > 0) {
        mappedSections.forEach((sec, idx) => {
          sec.torRequirementIds.push(req.id);

          const rel: RequirementRelationship = idx === 0 ? 'PRIMARY_RESPONSE' : (sec.sectionType === 'APPENDIX' ? 'APPENDIX_SUPPORT' : 'SUPPORTING_RESPONSE');

          let approach: RequirementResponseApproach = 'DIRECT_RESPONSE';
          if (sec.sectionType === 'METHODOLOGY') approach = 'METHODOLOGY';
          if (sec.sectionType === 'WORKPLAN') approach = 'WORKPLAN';
          if (sec.sectionType === 'TEAM') approach = 'TEAM';
          if (sec.sectionType === 'EXPERIENCE') approach = 'EXPERIENCE';
          if (sec.sectionType === 'DELIVERABLES') approach = 'DELIVERABLE';

          mappings.push({
            id: `map-${req.id}-${sec.id}`,
            requirementId: req.id,
            proposalSectionId: sec.id,
            relationship: rel,
            responseApproach: approach,
            required: req.mandatory,
            rationale: `Mapped to ${sec.title} as ${rel}.`,
            evidenceRequired: catLower === 'experience' || catLower === 'team' || catLower === 'eligibility',
            evidenceStatus: 'EXPECTED',
            aiConfidence: 0.95,
            sourceFile: req.sourceFile,
            sourcePage: req.sourcePage,
            sourceSection: req.sourceSection,
            sourceClause: req.sourceClause,
            sourceQuote: req.sourceQuote
          });
        });
      } else {
        unmappedReqs.push(req);
      }
    });

    return { mappings, submissionItems, unmappedReqs };
  }

  /**
   * Section 10 Requirement: Evaluation Criteria Alignment
   */
  private static alignEvaluationCriteria(
    torKnowledgeModel: TorKnowledgeModel | undefined,
    sections: ProposalContentPlanSection[]
  ): EvaluationAlignment[] {
    const alignments: EvaluationAlignment[] = [];
    const evalData = torKnowledgeModel?.evaluation;

    if (evalData) {
      if (evalData.criteria && evalData.criteria.length > 0) {
        evalData.criteria.forEach((critText, idx) => {
          const matchedSecs = sections.filter(s =>
            s.sectionType === 'METHODOLOGY' || s.sectionType === 'TEAM' || s.sectionType === 'EXPERIENCE'
          );
          alignments.push({
            id: `eval-align-${idx + 1}`,
            evaluationCriterionId: `eval-crit-${idx + 1}`,
            criterionText: critText,
            proposalSectionIds: matchedSecs.map(s => s.id),
            requiredContent: [`Explicit response addressing criterion: ${critText}`],
            evidenceNeeded: critText.toLowerCase().includes('experience') || critText.toLowerCase().includes('expert'),
            riskLevel: 'HIGH',
            planningNotes: ['Scored evaluation criterion — ensure comprehensive technical evidence.']
          });
        });
      } else {
        // Standard Technical vs Financial weights
        const techSecs = sections.filter(s => s.sectionType === 'METHODOLOGY' || s.sectionType === 'TECHNICAL');
        alignments.push({
          id: 'eval-align-tech',
          evaluationCriterionId: 'eval-tech-80',
          criterionText: `Technical Proposal Qualification Score (${evalData.techWeight || 80}%)`,
          weight: evalData.techWeight || 80,
          proposalSectionIds: techSecs.map(s => s.id),
          requiredContent: ['Methodology, Work Plan, Team Qualifications, and Firm Experience'],
          evidenceNeeded: true,
          riskLevel: 'HIGH',
          planningNotes: [`Minimum technical score requirement: ${evalData.minTechScore || 75} points.`]
        });
      }
    }

    return alignments;
  }

  /**
   * Section 12 Requirement: Evidence Requirements Planning (NO document retrieval)
   */
  private static planEvidenceRequirements(
    requirements: Requirement[],
    sections: ProposalContentPlanSection[]
  ): ProposalEvidenceRequirement[] {
    const evidenceList: ProposalEvidenceRequirement[] = [];

    requirements.forEach((req) => {
      const textLower = (req.requirementText || '').toLowerCase();
      const catLower = (req.category || '').toLowerCase();

      let evType: EvidenceType | null = null;
      let expectedSource: EvidenceSourceExpected = 'DOCUMENT_LIBRARY';

      if (catLower === 'team' || textLower.includes('fca') || textLower.includes('cv') || textLower.includes('key expert')) {
        evType = 'CV';
        expectedSource = 'CV_LIBRARY';
      } else if (catLower === 'experience' || textLower.includes('similar assignment')) {
        evType = 'ASSIGNMENT_RECORD';
        expectedSource = 'DOCUMENT_LIBRARY';
      } else if (textLower.includes('tax clearance')) {
        evType = 'TAX';
        expectedSource = 'DOCUMENT_LIBRARY';
      } else if (textLower.includes('vat') || textLower.includes('bin')) {
        evType = 'VAT';
        expectedSource = 'DOCUMENT_LIBRARY';
      } else if (textLower.includes('trade license')) {
        evType = 'TRADE_LICENSE';
        expectedSource = 'DOCUMENT_LIBRARY';
      } else if (textLower.includes('icab') || textLower.includes('practice license')) {
        evType = 'LICENSE';
        expectedSource = 'DOCUMENT_LIBRARY';
      }

      if (evType) {
        const targetSec = sections.find(s =>
          (evType === 'CV' && s.sectionType === 'TEAM') ||
          (evType === 'ASSIGNMENT_RECORD' && s.sectionType === 'EXPERIENCE') ||
          s.sectionType === 'APPENDIX'
        ) || sections[0];

        const evReq: ProposalEvidenceRequirement = {
          id: `ev-${req.id}`,
          requirementId: req.id,
          proposalSectionId: targetSec.id,
          evidenceType: evType,
          description: `Evidence artifact required for: ${req.requirementText}`,
          mandatory: req.mandatory,
          sourceExpected: expectedSource,
          verificationRequired: true,
          status: 'READY_FOR_PHASE_5',
          notes: 'Evidence requirement identified for Phase 5 Evidence Matching engine.'
        };

        evidenceList.push(evReq);
        targetSec.evidenceRequirementIds.push(evReq.id);
      }
    });

    return evidenceList;
  }

  /**
   * Section 13 Requirement: Section-Level Writing Briefs Enhancement
   */
  private static enhanceSectionWritingBriefs(
    sections: ProposalContentPlanSection[],
    mappings: ProposalRequirementMapping[],
    evidence: ProposalEvidenceRequirement[]
  ): void {
    sections.forEach((sec) => {
      const secMappings = mappings.filter(m => m.proposalSectionId === sec.id);
      const secEv = evidence.filter(e => e.proposalSectionId === sec.id);

      sec.writingGuidance = [
        `Voice: Formal, authoritative, first-person plural ("we", "our engagement team").`,
        `Mandatory Requirements Count: ${secMappings.filter(m => m.required).length}`,
        `Evidence Dependencies: ${secEv.length > 0 ? `${secEv.length} Evidence Artifact(s) Required` : 'None'}`,
        `Strict Constraint: Never invent past client assignments, dates, contract values, or unsupported personnel claims.`
      ];

      sec.requiredContent = secMappings.map(m => `Address Requirement (${m.sourceClause || 'Clause'}): ${m.sourceQuote || m.requirementId}`);
    });
  }

  /**
   * Section 16 Requirement: Planning Gap Detection
   */
  private static detectPlanningGaps(
    allRequirements: Requirement[],
    unmappedReqs: Requirement[],
    submissionItems: ProposalSubmissionItem[],
    evidenceList: ProposalEvidenceRequirement[],
    sections: ProposalContentPlanSection[]
  ): ProposalPlanningGap[] {
    const gaps: ProposalPlanningGap[] = [];

    // Gap 1: Unmapped Mandatory Requirements
    const unmappedMandatory = unmappedReqs.filter(r => r.mandatory);
    if (unmappedMandatory.length > 0) {
      gaps.push({
        id: `gap-unmapped-${Date.now()}`,
        type: 'UNMAPPED_REQUIREMENT',
        severity: 'CRITICAL',
        requirementIds: unmappedMandatory.map(r => r.id),
        description: `${unmappedMandatory.length} mandatory TOR requirement(s) have no assigned proposal response location.`,
        recommendedAction: 'Map requirement(s) to a technical narrative section or append as an administrative response.',
        status: 'OPEN',
        createdAt: new Date().toISOString()
      });
    }

    // Gap 2: Mandatory Evidence Requirements without defined plan
    const mandatoryEvGaps = evidenceList.filter(e => e.mandatory && e.status !== 'READY_FOR_PHASE_5');
    if (mandatoryEvGaps.length > 0) {
      gaps.push({
        id: `gap-ev-${Date.now()}`,
        type: 'MISSING_EVIDENCE_PLAN',
        severity: 'HIGH',
        requirementIds: mandatoryEvGaps.map(e => e.requirementId || ''),
        description: `${mandatoryEvGaps.length} mandatory eligibility requirement(s) require evidence but have no evidence plan.`,
        recommendedAction: 'Define evidence type and target document repository in Phase 4 planning.',
        status: 'OPEN',
        createdAt: new Date().toISOString()
      });
    }

    // Gap 3: Unmapped Submission Items
    const unmappedSubmission = submissionItems.filter(s => !s.targetSectionOrAppendix);
    if (unmappedSubmission.length > 0) {
      gaps.push({
        id: `gap-sub-${Date.now()}`,
        type: 'SUBMISSION_ITEM_UNMAPPED',
        severity: 'HIGH',
        requirementIds: unmappedSubmission.map(s => s.requirementId || ''),
        description: `${unmappedSubmission.length} submission control item(s) are unmapped to an envelope or annex.`,
        recommendedAction: 'Assign target submission envelope or appendix package.',
        status: 'OPEN',
        createdAt: new Date().toISOString()
      });
    }

    return gaps;
  }

  /**
   * Section 18 Requirement: Deterministic Content Plan Readiness Score Calculation
   */
  private static calculateReadinessScore(
    allRequirements: Requirement[],
    unmappedReqs: Requirement[],
    submissionItems: ProposalSubmissionItem[],
    gaps: ProposalPlanningGap[]
  ): { readinessScore: number; status: ProposalContentPlan['status'] } {
    const totalReqs = allRequirements.length || 1;
    const mappedCount = totalReqs - unmappedReqs.length;

    const reqCoverageScore = (mappedCount / totalReqs) * 25; // 25% max
    const structureScore = 20; // 20% max (architecture reconciled)
    const evaluationScore = 15; // 15% max
    const deliverableScore = 15; // 15% max
    const evidenceScore = 15; // 15% max
    const submissionScore = submissionItems.length > 0 ? 10 : 5; // 10% max

    let totalScore = Math.round(reqCoverageScore + structureScore + evaluationScore + deliverableScore + evidenceScore + submissionScore);

    // Apply Hard Blockers
    const criticalGaps = gaps.filter(g => g.severity === 'CRITICAL');
    const hasUnmappedMandatory = unmappedReqs.some(r => r.mandatory);

    let status: ProposalContentPlan['status'] = 'READY_FOR_EVIDENCE';

    if (criticalGaps.length > 0 || hasUnmappedMandatory) {
      status = 'NOT_READY';
      totalScore = Math.min(48, totalScore); // Cap below 50% if hard blocker
    } else if (totalScore < 75) {
      status = 'REVIEW_REQUIRED';
    } else if (totalScore >= 90) {
      status = 'READY_FOR_DRAFTING';
    }

    return { readinessScore: totalScore, status };
  }

  /**
   * Local Storage Persistence helpers
   */
  static saveContentPlan(plan: ProposalContentPlan): void {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${plan.projectId}`, JSON.stringify(plan));
    } catch (e) {
      console.warn('Failed to save ProposalContentPlan to localStorage:', e);
    }
  }

  static getContentPlan(projectId: string): ProposalContentPlan | null {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${projectId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to load ProposalContentPlan from localStorage:', e);
    }
    return null;
  }
}
