import {
  Requirement,
  RequirementClassification,
  SubmissionRequirementPlacement,
  SubmissionChecklistRow,
  TorKnowledgeModel
} from '../types';
import { ProposalDatabaseService } from './proposalDatabaseService';

export class SubmissionPlacementEngine {
  /**
   * Dynamically determines the classification and placement of all submission requirements
   * based on explicit TOR instructions, proposal structure, prescribed templates, and evidence types.
   */
  static determinePlacements(
    projectId: string,
    torModel?: TorKnowledgeModel | null,
    requirementsList?: Requirement[],
    isDocxReady: boolean = false
  ): SubmissionRequirementPlacement[] {
    const model = torModel || ProposalDatabaseService.getProjectTorModel(projectId);
    const requirements = (requirementsList && requirementsList.length > 0)
      ? requirementsList
      : ProposalDatabaseService.getProjectRequirements(projectId);

    const submissionInstructions = (model?.submission?.method || '') + ' ' + (model?.submission?.location || '');
    const submissionTextLower = submissionInstructions.toLowerCase();

    const results: SubmissionRequirementPlacement[] = [];

    // =========================================================================
    // 1. Technical Proposal (Understanding, Methodology, Scope)
    // =========================================================================
    results.push({
      item: 'Technical proposal demonstrating assignment understanding and methodology',
      classification: 'Proposal Content',
      placement: 'Technical Proposal — relevant sections',
      mandatory: true,
      included: isDocxReady,
      status: isDocxReady ? 'Ready' : 'Review Required',
      sourceClause: 'TOR Section 3 / Submission Instructions',
      remarks: isDocxReady
        ? 'Comprehensive technical response developed and formatted under ACNABIN house style (Sections 1–5).'
        : 'Technical proposal drafting in progress.',
      targetFolder: '01_Technical_Proposal'
    });

    // =========================================================================
    // 2. Work Plan and Milestone Schedule
    // =========================================================================
    results.push({
      item: 'Detailed work plan and milestone schedule',
      classification: 'Proposal Content',
      placement: 'Technical Proposal — Work Plan',
      mandatory: true,
      included: isDocxReady,
      status: isDocxReady ? 'Ready' : 'Review Required',
      sourceClause: 'TOR Methodology & Timeline Requirements',
      remarks: 'Phased activity breakdown, milestone deliverables, and Gantt schedule incorporated in Section 5 & 10.',
      targetFolder: '01_Technical_Proposal'
    });

    // =========================================================================
    // 3. Financial Proposal
    // =========================================================================
    const hasFinancialInTor = submissionTextLower.includes('financial') ||
      requirements.some((r) => r.category === 'Financial' || r.requirementText.toLowerCase().includes('financial proposal'));
    const isSeparateFinancial = submissionTextLower.includes('separate') || submissionTextLower.includes('two-envelope') || submissionTextLower.includes('sealed') || true;

    results.push({
      item: 'Financial proposal with comprehensive budget breakdown',
      classification: 'Proposal Content',
      placement: isSeparateFinancial ? 'Separate Financial Proposal' : 'Technical Proposal — Financial Section',
      templateRequired: submissionTextLower.includes('prescribed budget') ? 'Client-provided Budget Template' : 'ACNABIN Fee Schedule Format',
      mandatory: hasFinancialInTor,
      included: false,
      status: 'Review Required',
      sourceClause: 'TOR Submission Guidelines / Financial RFP',
      remarks: isSeparateFinancial
        ? 'Submitted separately under sealed cover / separate transmission in accordance with submission instructions.'
        : 'Integrated into proposal financial section.',
      targetFolder: isSeparateFinancial ? undefined : '01_Technical_Proposal'
    });

    // =========================================================================
    // 4. Consulting Team Profiles & CVs
    // =========================================================================
    const cvReq = requirements.find((r) => r.category === 'Team' || r.requirementText.toLowerCase().includes('cv'));
    const cvText = cvReq ? (cvReq.requirementText + ' ' + (cvReq.sourceQuote || '')).toLowerCase() : '';

    let cvClassification: RequirementClassification = 'Supporting Document';
    let cvPlacement = 'Technical Proposal — Appendix A, if required there';
    let cvTemplate = 'ACNABIN / Baker Tilly Standard Expert CV Format';
    let cvFolder = '03_Appendices_Statutory_and_Credentials';

    if (cvText.includes('prescribed form') || cvText.includes('form tech') || cvText.includes('client format')) {
      cvClassification = 'Prescribed Form / Template';
      cvTemplate = 'Client-provided Prescribed CV Format';
    }

    if (cvText.includes('separate volume') || cvText.includes('separate attachment') || cvText.includes('folder') || submissionTextLower.includes('separate cv')) {
      cvPlacement = 'Separate Submission Package / CVs';
      cvFolder = '03_CVs';
    } else if (cvText.includes('within proposal') || cvText.includes('section') || cvText.includes('team section')) {
      cvPlacement = 'Technical Proposal — Team Section';
      cvFolder = '01_Technical_Proposal';
    } else if (cvText.includes('appendix')) {
      cvPlacement = 'Technical Proposal — Appendix A';
    }

    results.push({
      item: 'CVs and profiles of proposed consulting team',
      classification: cvClassification,
      placement: cvPlacement,
      templateRequired: cvTemplate,
      mandatory: true,
      included: false,
      status: 'Information to be provided',
      sourceClause: cvReq ? `Clause ${cvReq.sourceClause || 'TOR Team Qualifications'}` : 'TOR Team Qualifications',
      remarks: '[TO BE PROVIDED] — Signed expert CVs formatted and placed in accordance with TOR requirements.',
      targetFolder: cvFolder
    });

    // =========================================================================
    // 5. Organizational Profile & Statutory Registration Certificates
    // =========================================================================
    const regReq = requirements.find((r) => r.category === 'Eligibility' || r.requirementText.toLowerCase().includes('license') || r.requirementText.toLowerCase().includes('icab'));
    const regText = regReq ? regReq.requirementText.toLowerCase() : '';

    let regPlacement = 'Appropriate Proposal Section / Appendix / Submission Package based on TOR';
    if (regText.includes('section')) {
      regPlacement = 'Technical Proposal — Section 12 (About ACNABIN)';
    } else if (regText.includes('appendix')) {
      regPlacement = 'Technical Proposal — Appendix B';
    } else if (submissionTextLower.includes('separate') || submissionTextLower.includes('attachment')) {
      regPlacement = 'Separate Submission Package / Statutory Documents';
    }

    results.push({
      item: 'Organizational profile and statutory registration certificates',
      classification: 'Supporting Document',
      placement: regPlacement,
      mandatory: true,
      included: isDocxReady,
      status: isDocxReady ? 'Ready' : 'Review Required',
      sourceClause: regReq ? `Clause ${regReq.sourceClause || 'Eligibility'}` : 'TOR Eligibility Criteria',
      remarks: 'ACNABIN firm profile, ICAB registration details, and institutional credentials attached.',
      targetFolder: '03_Appendices_Statutory_and_Credentials'
    });

    // =========================================================================
    // 6. Past Experience & Reference Assignments
    // =========================================================================
    const expReq = requirements.find((r) => r.category === 'Experience' || r.requirementText.toLowerCase().includes('similar') || r.requirementText.toLowerCase().includes('track record'));
    const expText = expReq ? expReq.requirementText.toLowerCase() : '';

    let expPlacement = 'Technical Proposal narrative and/or supporting Appendix, based on TOR';
    if (expText.includes('narrative') || expText.includes('section')) {
      expPlacement = 'Technical Proposal — Section 11 (Relevant Experience)';
    } else if (expText.includes('certificate') || expText.includes('client completion')) {
      expPlacement = 'Technical Proposal — Appendix C & Supporting Certificates';
    }

    results.push({
      item: 'Examples of past similar advisory assignments',
      classification: 'Supporting Document',
      placement: expPlacement,
      mandatory: !!expReq,
      included: isDocxReady,
      status: isDocxReady ? 'Ready' : 'Review Required',
      sourceClause: expReq ? `Clause ${expReq.sourceClause || 'Past Experience'}` : 'TOR Experience Criteria',
      remarks: 'Detailed summaries of relevant governance, financial advisory, and institutional assignments presented in Section 11.',
      targetFolder: '01_Technical_Proposal'
    });

    // =========================================================================
    // 7. Tax, VAT & ICAB Regulatory Compliance Certificates
    // =========================================================================
    const taxReq = requirements.find((r) => r.requirementText.toLowerCase().includes('tax') || r.requirementText.toLowerCase().includes('vat') || r.requirementText.toLowerCase().includes('tin'));
    let taxPlacement = 'Submission Package / Appendix, based on TOR';
    if (submissionTextLower.includes('appendix')) {
      taxPlacement = 'Technical Proposal — Appendix D';
    } else if (submissionTextLower.includes('separate') || submissionTextLower.includes('portal')) {
      taxPlacement = 'Separate Submission Package / Statutory Certificates';
    }

    results.push({
      item: 'Tax, VAT, and ICAB regulatory compliance certificates',
      classification: 'Supporting Document',
      placement: taxPlacement,
      mandatory: true,
      included: false,
      status: 'Information to be provided',
      sourceClause: taxReq ? `Clause ${taxReq.sourceClause || 'Statutory'}` : 'TOR Statutory Requirements',
      remarks: '[TO BE PROVIDED] — Valid Tax clearance certificate, BIN certificate, and ICAB practice license.',
      targetFolder: '03_Appendices_Statutory_and_Credentials'
    });

    // =========================================================================
    // 8. Declaration of No Conflict of Interest / Prescribed Forms
    // =========================================================================
    const conflictReq = requirements.find((r) => r.requirementText.toLowerCase().includes('conflict') || r.requirementText.toLowerCase().includes('declaration') || r.requirementText.toLowerCase().includes('form'));
    const conflictText = conflictReq ? conflictReq.requirementText.toLowerCase() : '';

    let conflictClassification: RequirementClassification = 'Prescribed Form / Template';
    let conflictPlacement = 'Prescribed Form / Declaration or Submission Checklist, based on TOR';

    if (conflictText.includes('letter') || conflictText.includes('submission letter')) {
      conflictPlacement = 'Technical Proposal — Letter of Submission';
    } else if (conflictText.includes('appendix')) {
      conflictPlacement = 'Technical Proposal — Appendix E';
    } else if (conflictText.includes('form') || conflictText.includes('prescribed')) {
      conflictPlacement = 'Prescribed Form / Declaration or Submission Checklist, based on TOR';
    }

    results.push({
      item: 'Signed declaration of no conflict of interest',
      classification: conflictClassification,
      placement: conflictPlacement,
      templateRequired: conflictText.includes('prescribed') ? 'Client Prescribed Form' : 'ACNABIN Standard Declaration Form',
      mandatory: true,
      included: true,
      status: 'Ready',
      sourceClause: conflictReq ? `Clause ${conflictReq.sourceClause || 'Submission'}` : 'TOR Submission Requirements',
      remarks: 'Formal conflict of interest declaration signed and incorporated into technical proposal and transmittal package.',
      targetFolder: '02_Prescribed_Forms'
    });

    // =========================================================================
    // 9. Process any additional bespoke requirements extracted from TOR
    // =========================================================================
    requirements.forEach((req, idx) => {
      const textLower = req.requirementText.toLowerCase();
      // Skip if already covered by the standard baseline categories
      if (
        textLower.includes('methodology') ||
        textLower.includes('work plan') ||
        textLower.includes('financial') ||
        textLower.includes('cv') ||
        textLower.includes('registration') ||
        textLower.includes('similar') ||
        textLower.includes('tax') ||
        textLower.includes('conflict')
      ) {
        return;
      }

      let classification: RequirementClassification = 'Supporting Document';
      let placement = 'Appropriate Proposal Section / Appendix / Submission Package based on TOR';

      if (req.category === 'Technical' || req.category === 'Methodology' || req.category === 'Scope') {
        classification = 'Proposal Content';
        placement = 'Technical Proposal — relevant sections';
      } else if (req.category === 'Evaluation' || req.category === 'Administrative') {
        classification = 'Proposal Content';
        placement = 'Technical Proposal — Section 8 (Quality Assurance & Risk Management)';
      } else if (textLower.includes('form') || textLower.includes('template')) {
        classification = 'Prescribed Form / Template';
        placement = 'Prescribed Form / Declaration or Submission Checklist, based on TOR';
      } else if (textLower.includes('provide') || textLower.includes('submit') || textLower.includes('attach')) {
        classification = 'Supporting Document';
        placement = 'Submission Package / Appendix, based on TOR';
      }

      results.push({
        requirementId: req.id,
        item: req.requirementText.length > 80 ? `${req.requirementText.slice(0, 77)}...` : req.requirementText,
        classification,
        placement,
        mandatory: req.mandatory,
        included: isDocxReady && classification === 'Proposal Content',
        status: (isDocxReady && classification === 'Proposal Content') ? 'Ready' : req.status === 'READY' ? 'Ready' : 'Review Required',
        sourceClause: `Clause ${req.sourceClause || req.sourceSection || 'TOR'}`,
        remarks: req.aiInterpretation || 'Satisfied in accordance with TOR requirements.',
        targetFolder: classification === 'Proposal Content' ? '01_Technical_Proposal' : '03_Appendices_Statutory_and_Credentials'
      });
    });

    return results;
  }

  /**
   * Formats the Dynamic Markdown Matrix for the Proposal Draft ("Response to Proposal Submission Requirements")
   */
  static generateComplianceResponseMarkdown(
    projectId: string,
    torModel?: TorKnowledgeModel | null,
    requirementsList?: Requirement[]
  ): string {
    const placements = this.determinePlacements(projectId, torModel, requirementsList, true);

    const rows = placements.map((p, idx) => {
      return `${idx + 1}. ${p.item} | ${p.placement}`;
    });

    return `Submission Requirement | Addressed In Proposal / Submission\n${rows.join('\n')}`;
  }

  /**
   * Converts placements into SubmissionChecklistRow items for Excel and Package view.
   */
  static generateChecklistRows(
    projectId: string,
    torModel?: TorKnowledgeModel | null,
    requirementsList?: Requirement[],
    isDocxReady: boolean = false
  ): SubmissionChecklistRow[] {
    const placements = this.determinePlacements(projectId, torModel, requirementsList, isDocxReady);

    return placements.map((p) => ({
      item: p.item,
      classification: p.classification,
      placement: p.placement,
      templateRequired: p.templateRequired,
      required: p.mandatory,
      included: p.included,
      status: p.status === 'Information to be provided' ? 'Review Required' : p.status,
      source: p.sourceClause || 'TOR Requirement',
      remarks: p.remarks
    }));
  }
}
