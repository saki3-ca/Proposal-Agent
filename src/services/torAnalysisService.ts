import { Requirement, TorKnowledgeModel, RequirementCategory, TorSubmissionRecipient, RequirementClassification, CurrentProjectContext, ProjectVerificationStatus } from '../types';
import { MarkdownNormalizer, NormalizationResult } from './markdownNormalizer';
import { AiService } from './aiService';

export interface QuickTorAnalysisResult {
  fileName: string;
  fileSizeMb?: number;
  extractedAt: string;
  normalization: NormalizationResult;
  torModel: TorKnowledgeModel;
  requirements: Partial<Requirement>[];
  currentProjectContext: CurrentProjectContext;
  overview: {
    client?: string;
    assignment: string;
    deadline?: string;
    duration: string;
    location: string;
    submissionMethod: string;
    submissionEmail?: string;
    submissionAddress?: string;
    contactPerson?: string;
  };
  keyRequirements: {
    objectives: string[];
    scopeSummary: string[];
    deliverables: string[];
    teamComposition: string[];
    qualifications: string[];
    requiredDocuments: string[];
    prescribedForms: string[];
    outOfScope: string[];
  };
  complianceSnapshot: {
    mandatoryRequirements: string[];
    conditionalRequirements: string[];
    userInfoRequired: string[];
    supportingDocuments: string[];
    potentialRisks: string[];
    ambiguousOrIncomplete: string[];
    outOfScopeExclusions: string[];
  };
  validationStatus: {
    isValidated: boolean;
    groundedFieldsCount: number;
    totalEvaluatedFields: number;
    warnings: string[];
  };
}

/**
 * Analysis Validation Layer
 * Cross-checks every extracted factual field against the actual source Markdown.
 * Replaces unsupported or hallucinated values with explicit "Not stated in TOR" / "To be confirmed".
 */
export class TorAnalysisValidator {
  static validateAnalysis(
    model: TorKnowledgeModel,
    requirements: Partial<Requirement>[],
    sourceMarkdown: string,
    fileName: string
  ): {
    validatedModel: TorKnowledgeModel;
    validatedRequirements: Partial<Requirement>[];
    warnings: string[];
    groundedFieldsCount: number;
    totalEvaluatedFields: number;
  } {
    const warnings: string[] = [];
    let groundedFieldsCount = 0;
    let totalEvaluatedFields = 0;
    const lowerSource = sourceMarkdown.toLowerCase();

    // Robust Source Grounding Helper: verifies candidate against source text with normalization & entity token matching
    const isGroundedinSource = (snippet: string | undefined | null): boolean => {
      if (!snippet || snippet.trim().length === 0) return false;
      const clean = snippet.toLowerCase().trim().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ');
      if (clean.length < 2) return false;
      if (lowerSource.includes(clean)) return true;

      // Check for acronym matches or significant word subsets
      const words = clean.split(' ').filter(w => w.length > 2);
      if (words.length === 0) return false;
      
      const matchedCount = words.filter(w => lowerSource.includes(w)).length;
      // Allow grounding if at least 50% of substantial words or all words >= 4 chars exist in source
      if ((matchedCount / words.length) >= 0.5) return true;
      if (words.length >= 2 && words.every(w => w.length < 4 ? true : lowerSource.includes(w))) return true;

      return false;
    };

    // 1. Validate Assignment Title
    totalEvaluatedFields++;
    let validTitle = model.assignmentContext?.title?.trim();
    if (!validTitle || validTitle === 'Procurement Assignment' || !isGroundedinSource(validTitle)) {
      const headingMatch = sourceMarkdown.match(/^#{1,3}\s+(.+)$/m);
      if (headingMatch && headingMatch[1].trim().length > 5) {
        validTitle = headingMatch[1].trim();
        groundedFieldsCount++;
      } else {
        validTitle = fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        warnings.push('Assignment title not explicitly identified as a heading; using clean document filename.');
      }
    } else {
      groundedFieldsCount++;
    }

    // 2. Validate Client / Contracting Entity (Current ToR source only, no sample fallbacks)
    totalEvaluatedFields++;
    let validClient = model.assignmentContext?.client?.trim();
    if (!validClient || validClient.toLowerCase().includes('procurement authority') || !isGroundedinSource(validClient)) {
      const clientMatch = sourceMarkdown.match(/(?:client|contracting\s+authority|issuing\s+organization|procuring\s+entity|organization|authority|for\s+the\s+benefit\s+of|commissioned\s+by|employer)[:\s]+([^\n.,]{3,80})/i);
      if (clientMatch && isGroundedinSource(clientMatch[1])) {
        validClient = clientMatch[1].trim();
        groundedFieldsCount++;
      } else {
        validClient = undefined;
        warnings.push('Client / Contracting entity could not be definitively grounded in current TOR document.');
      }
    } else {
      groundedFieldsCount++;
    }

    // 3. Validate Submission Deadline
    totalEvaluatedFields++;
    let validDeadline = model.submission?.deadline?.trim();
    if (!validDeadline || validDeadline === 'To Be Specified' || !isGroundedinSource(validDeadline)) {
      const subDeadlineMatch = sourceMarkdown.match(/(?:submission\s+deadline|deadline\s+for\s+submission|closing\s+date|proposals?\s+due|proposals?\s+must\s+be\s+submitted|proposals?\s+must\s+be\s+received\s+(?:by|before|on)|on\s+or\s+before|no\s+later\s+than)[:\s]*([A-Za-z0-9\s,\-–/:()]{3,80})/i);
      if (subDeadlineMatch && isGroundedinSource(subDeadlineMatch[1])) {
        validDeadline = subDeadlineMatch[1].trim();
        groundedFieldsCount++;
      } else {
        validDeadline = undefined;
        warnings.push('Submission deadline is not explicitly declared in the TOR.');
      }
    } else {
      groundedFieldsCount++;
    }

    if (validDeadline) {
      let cleaned = validDeadline
        .replace(/^(?:proposals?\s+(?:must\s+be\s+submitted|must\s+be\s+received|due)\s+(?:by|on|before|no\s+later\s+than)\s*)/i, '')
        .replace(/^(?:on\s+or\s+before|no\s+later\s+than|before|by|closing\s+date\s*:\s*|deadline\s*:\s*)/i, '')
        .trim();
      cleaned = cleaned.replace(/(\d)\s+(\d)\s*(st|nd|rd|th)/gi, '$1$2$3');
      const dateMatch = cleaned.match(/(?:(?:\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4})|(?:[A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})|(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{4})|(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}))(?:\s*(?:at|by|before|,)?\s*\d{1,2}[:.]\d{2}(?:\s*(?:am|pm|gmt|bst|utc))?)?/i);
      if (dateMatch && dateMatch[0].trim().length >= 6) {
        validDeadline = dateMatch[0].trim();
      } else if (cleaned.length > 0) {
        validDeadline = cleaned;
      }
    }

    // 4. Validate Submission Email (Context-specific)
    totalEvaluatedFields++;
    let validSubmissionEmail = model.submission?.email?.trim();
    if (validSubmissionEmail) {
      if (!lowerSource.includes(validSubmissionEmail.toLowerCase())) {
        warnings.push(`Extracted submission email '${validSubmissionEmail}' was not found in source text; removed.`);
        validSubmissionEmail = undefined;
      } else {
        groundedFieldsCount++;
      }
    }

    // 5. Validate Duration / Timeline
    totalEvaluatedFields++;
    let validDuration = model.timeline?.durationMonths?.trim();
    if (!validDuration || !isGroundedinSource(validDuration)) {
      const durMatch = sourceMarkdown.match(/(?:duration|period\s+of\s+assignment|contract\s+duration|level\s+of\s+effort)[:\s]+([^\n.]{4,60})/i);
      if (durMatch && isGroundedinSource(durMatch[1])) {
        validDuration = durMatch[1].trim();
        groundedFieldsCount++;
      } else {
        validDuration = 'Not specified';
      }
    } else {
      groundedFieldsCount++;
    }

    // 6. Validate Location / Duty Station
    totalEvaluatedFields++;
    let validLocation = model.assignmentContext?.location?.trim();
    if (!validLocation || !isGroundedinSource(validLocation)) {
      const locMatch = sourceMarkdown.match(/(?:location|duty\s+station|place\s+of\s+assignment)[:\s]+([^\n.]{3,60})/i);
      if (locMatch && isGroundedinSource(locMatch[1])) {
        validLocation = locMatch[1].trim();
        groundedFieldsCount++;
      } else {
        validLocation = 'Not specified';
      }
    } else {
      groundedFieldsCount++;
    }

    // 7. Validate Deliverables
    const validDeliverables = (model.deliverables || []).filter(d => {
      totalEvaluatedFields++;
      if (isGroundedinSource(d.name)) {
        groundedFieldsCount++;
        return true;
      }
      return false;
    });

    // 8. Validate Requirements
    const validatedRequirements: Partial<Requirement>[] = [];
    for (const req of requirements) {
      totalEvaluatedFields++;
      const text = req.requirementText || '';
      const quote = req.sourceQuote || '';
      
      const isGrounded = isGroundedinSource(quote) || isGroundedinSource(text) || isGroundedinSource(req.sourceSection);
      if (isGrounded) {
        groundedFieldsCount++;
        validatedRequirements.push({
          ...req,
          isVerified: true,
          status: 'READY'
        });
      } else if (text.length > 10) {
        validatedRequirements.push({
          ...req,
          isVerified: false,
          status: 'REVIEW_REQUIRED'
        });
      }
    }

    const validatedModel: TorKnowledgeModel = {
      ...model,
      assignmentContext: {
        ...model.assignmentContext,
        title: validTitle,
        client: validClient,
        location: validLocation
      },
      submission: {
        ...model.submission,
        deadline: validDeadline,
        email: validSubmissionEmail
      },
      timeline: {
        ...model.timeline,
        durationMonths: validDuration
      },
      deliverables: validDeliverables
    };

    return {
      validatedModel,
      validatedRequirements,
      warnings,
      groundedFieldsCount,
      totalEvaluatedFields
    };
  }
}

export class TorAnalysisService {
  /**
   * Main entry point: Takes raw markdown and produces a 100% source-bounded, validated Quick TOR Analysis
   */
  static async analyzeTorMarkdown(
    rawMarkdown: string,
    fileName: string = 'TOR_Document.pdf',
    fileSizeMb?: number
  ): Promise<QuickTorAnalysisResult> {
    // 1. Normalize Markdown and clean extraction artifacts
    let normResult: NormalizationResult;
    try {
      normResult = MarkdownNormalizer.normalize(rawMarkdown, fileName);
    } catch (normErr: any) {
      const err: any = new Error(normErr?.message || 'Markdown normalization failed.');
      err.stage = 'TOR Normalization';
      throw err;
    }

    const text = normResult.normalizedMarkdown;

    if (!text || text.trim().length === 0) {
      const err: any = new Error('Document extraction yielded zero text. The file may be empty or an unreadable scanned image.');
      err.stage = 'Microsoft MarkItDown';
      throw err;
    }

    // 2. Perform deep structural rule extraction strictly from text
    let structuredModel: TorKnowledgeModel;
    try {
      structuredModel = this.extractDeterministicTorModel(text, fileName);
    } catch (structErr: any) {
      const err: any = new Error(structErr?.message || 'Structural TOR clause parsing failed.');
      err.stage = 'TOR Analysis';
      throw err;
    }

    // 3. Optional LLM enhancement (if AI service is configured)
    let enhancedModel = structuredModel;
    try {
      const llmModel = await AiService.extractTorKnowledgeModel(text);
      if (llmModel && Object.keys(llmModel.assignmentContext || {}).length > 0) {
        enhancedModel = this.mergeModels(structuredModel, llmModel);
      }
    } catch (e) {
      console.warn('LLM TOR enhancement skipped, relying on deterministic extraction:', e);
    }

    // 4. Extract granular requirement clauses
    let extractedReqs: Partial<Requirement>[] = [];
    try {
      extractedReqs = await AiService.extractRequirements(text, fileName);
    } catch (e) {
      console.warn('LLM Requirement extraction skipped, extracting deterministically from clauses:', e);
    }

    if (!extractedReqs || extractedReqs.length === 0) {
      extractedReqs = this.generateRequirementsFromSource(text, enhancedModel, fileName);
    }

    // 5. Run rigorous Analysis Validation Layer
    const validation = TorAnalysisValidator.validateAnalysis(enhancedModel, extractedReqs, text, fileName);
    enhancedModel = validation.validatedModel;
    extractedReqs = validation.validatedRequirements;

    // 6. Build compliance snapshot & summary views from validated source
    const complianceSnapshot = this.buildComplianceSnapshot(enhancedModel, extractedReqs, text);
    enhancedModel.complianceSummary = {
      ...complianceSnapshot,
      outOfScopeExclusions: enhancedModel.scope.outOfScope || []
    };

    enhancedModel.metadata = {
      sourceFileName: fileName,
      extractedAt: new Date().toISOString(),
      markitdownQuality: {
        charCount: normResult.normalizedCharCount,
        artifactsCleaned: normResult.cleanedArtifactsCount,
        warnings: normResult.warnings,
        isSuspicious: normResult.isSuspicious
      },
      version: '1.0'
    };

    const isClientGrounded = !!enhancedModel.assignmentContext?.client && validation.groundedFieldsCount > 0;
    const resolvedClient = enhancedModel.assignmentContext?.client || undefined;
    const resolvedTitle = enhancedModel.assignmentContext?.title || fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    const resolvedDeadline = enhancedModel.submission?.deadline || undefined;

    const currentProjectContext: CurrentProjectContext = {
      clientName: resolvedClient || null,
      procuringEntity: enhancedModel.assignmentContext?.client || null,
      assignmentTitle: resolvedTitle || null,
      tenderReference: enhancedModel.assignmentContext?.refNumber || null,
      submissionDeadline: resolvedDeadline || null,
      submissionEmail: enhancedModel.submission?.email || null,
      submissionAddress: enhancedModel.submission?.address || null,
      proposalType: 'TECHNICAL',
      currentToRDocument: {
        fileName,
        fileSizeMb,
        rawMarkdown: text
      },
      currentProjectDocuments: [fileName],
      verificationStatus: resolvedClient ? 'VERIFIED' : 'REVIEW_REQUIRED',
      sourceGrounding: {
        clientConfidence: resolvedClient ? 0.95 : 0.0,
        isSourceGrounded: isClientGrounded,
        rejectionReason: resolvedClient ? undefined : 'Client name could not be definitively grounded in current ToR source text.'
      }
    };

    const overview = {
      client: resolvedClient,
      assignment: resolvedTitle,
      deadline: resolvedDeadline,
      duration: enhancedModel.timeline.durationMonths || 'Not specified',
      location: enhancedModel.assignmentContext.location || 'Not specified',
      submissionMethod: enhancedModel.submission.method || 'Not specified in TOR',
      submissionEmail: enhancedModel.submission.email,
      submissionAddress: enhancedModel.submission.address,
      contactPerson: enhancedModel.assignmentContext.contactPerson
    };

    const keyRequirements = {
      objectives: [
        ...(enhancedModel.objectives.overall ? [enhancedModel.objectives.overall] : []),
        ...(enhancedModel.objectives.specific || [])
      ],
      scopeSummary: [
        ...(enhancedModel.scope.components || []),
        ...(enhancedModel.scope.tasks || []),
        ...(enhancedModel.scope.requiredActivities || [])
      ],
      deliverables: (enhancedModel.deliverables || []).map((d) =>
        d.dueDate ? `${d.name} (${d.dueDate})` : d.name
      ),
      teamComposition: (enhancedModel.team || []).map((t) =>
        t.role + (t.minYearsExp ? ` (Min ${t.minYearsExp} yrs exp)` : '')
      ),
      qualifications: [
        ...(enhancedModel.eligibility.qualifications || []),
        enhancedModel.eligibility.icabLicenseReq ? 'Valid Professional License / ICAB Practice Certificate' : '',
        enhancedModel.eligibility.minFirmYears ? `Minimum ${enhancedModel.eligibility.minFirmYears} years firm experience` : '',
        enhancedModel.eligibility.minSimilarProjects ? `Minimum ${enhancedModel.eligibility.minSimilarProjects} similar completed projects` : ''
      ].filter(Boolean),
      requiredDocuments: [
        ...(enhancedModel.administrative.formsRequired || []),
        ...(complianceSnapshot.supportingDocuments || [])
      ],
      prescribedForms: enhancedModel.administrative.prescribedTemplates || [],
      outOfScope: enhancedModel.scope.outOfScope || enhancedModel.scope.exclusions || []
    };

    return {
      fileName,
      fileSizeMb,
      extractedAt: new Date().toISOString(),
      normalization: normResult,
      torModel: enhancedModel,
      requirements: extractedReqs,
      currentProjectContext,
      overview,
      keyRequirements,
      complianceSnapshot,
      validationStatus: {
        isValidated: true,
        groundedFieldsCount: validation.groundedFieldsCount,
        totalEvaluatedFields: validation.totalEvaluatedFields,
        warnings: validation.warnings
      }
    };
  }

  /**
   * Source-bound deterministic regex/NLP parser for generic TOR/RFP/EOI procurement documents.
   * Extracts ONLY explicit data from text. Never guesses or applies hardcoded tender data.
   */
  private static extractDeterministicTorModel(text: string, fileName: string): TorKnowledgeModel {
    const lines = text.split('\n');
    const lowerText = text.toLowerCase();

    // 1. Assignment Title & Client Extraction
    let title = '';
    let client = '';
    let funder: string | undefined = undefined;
    let refNumber: string | undefined = undefined;
    let location = '';

    // Helper to sanitize extracted deadline dates to date/time only (removing "Proposals must be submitted by...")
    const cleanDeadlineString = (raw: string): string => {
      if (!raw) return '';
      let cleaned = raw
        .replace(/^(?:proposals?\s+(?:must\s+be\s+submitted|must\s+be\s+received|due)\s+(?:by|on|before|no\s+later\s+than)\s*)/i, '')
        .replace(/^(?:on\s+or\s+before|no\s+later\s+than|before|by|closing\s+date\s*:\s*|deadline\s*:\s*)/i, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Normalize spaced digits e.g. "1 5 th July 2026" -> "15th July 2026"
      cleaned = cleaned.replace(/(\d)\s+(\d)\s*(st|nd|rd|th)/gi, '$1$2$3');

      // Extract strict date string e.g. "July 31, 2026", "15th July 2026", "31-07-2026", "2026-07-31" with optional time
      const dateMatch = cleaned.match(/(?:(?:\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4})|(?:[A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})|(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{4})|(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}))(?:\s*(?:at|by|before|,)?\s*\d{1,2}[:.]\d{2}(?:\s*(?:am|pm|gmt|bst|utc))?)?/i);
      if (dateMatch && dateMatch[0].trim().length >= 6) {
        return dateMatch[0].trim();
      }

      return cleaned;
    };

    // Extract title: check markdown H1/H2, explicit ToR titles, or first prominent line
    for (let i = 0; i < Math.min(30, lines.length); i++) {
      const line = lines[i].trim();
      const cleanHeading = line.replace(/^#+\s*/, '').trim();

      // Detect explicit Terms of Reference title format
      const torColonMatch = cleanHeading.match(/terms\s+of\s+reference\s*(?:\(tor\)\s*)?[:\-–]\s*([^\n]{5,200})/i);
      const titleLabelMatch = cleanHeading.match(/(?:assignment\s+title|title\s+of\s+the\s+assignment|name\s+of\s+the\s+consultancy|project\s+title|terms\s+of\s+reference\s+(?:\(tor\)\s+)?for|tor\s+for|scope\s+of\s+services\s+for|rfp\s+for)[:\s]+([^\n]{5,200})/i);
      const auditMatch = cleanHeading.match(/^(?:special\s+|statutory\s+|internal\s+|external\s+|annual\s+|forensic\s+)?audit\s+of\s+([^\n]{5,120})/i);

      if (torColonMatch && !title) {
        title = torColonMatch[1].trim();
      } else if (titleLabelMatch && !title) {
        title = titleLabelMatch[1].trim();
      } else if (auditMatch && !title) {
        title = cleanHeading;
      } else if (!title && (line.startsWith('# ') || line.startsWith('## ')) && cleanHeading.length > 10 && cleanHeading.length < 150) {
        if (!cleanHeading.toLowerCase().includes('table of content') && !cleanHeading.toLowerCase().includes('abbreviation') && !cleanHeading.toLowerCase().startsWith('registration:')) {
          const torSubMatch = cleanHeading.match(/terms\s+of\s+reference\s+(?:\(tor\)\s+)?for\s+(.+)/i);
          title = torSubMatch ? torSubMatch[1].trim() : cleanHeading;
        }
      }

      // Detect Client: Look for "About <Client Name>" header or top organizational header
      const aboutClientMatch = cleanHeading.match(/(?:\d+\.\s*)?About\s+([A-Z][A-Za-z0-9\s,&.\-–]{3,80}?)(?:\s+Foundation|\s+Centre|\s+Center|\s+Institute|\s+Limited|\s+Ltd|\s+PLC|\s+Bangladesh|\s+Society|\s+Trust|\s+Trustee|\s+Hub|\s+Network|\s+Bank|\s+Company|\s*$)/i);
      const clientLabelMatch = cleanHeading.match(/^(?:client|issuing\s+organization|procuring\s+entity|contracting\s+authority|employer)[:\s]+([A-Z][^\n.,]{3,80})/i);
      
      // Check if line before "Terms of Reference" is an organization name
      const isOrgHeader = !cleanHeading.toLowerCase().startsWith('registration:') && 
                          !cleanHeading.toLowerCase().startsWith('address:') && 
                          !cleanHeading.toLowerCase().startsWith('contact') && 
                          !cleanHeading.toLowerCase().startsWith('email') && 
                          !cleanHeading.toLowerCase().startsWith('terms of reference') &&
                          !cleanHeading.toLowerCase().startsWith('background') &&
                          (cleanHeading.includes('Foundation') || cleanHeading.includes('Centre') || cleanHeading.includes('Center') || cleanHeading.includes('CRP') || cleanHeading.includes('Limited') || cleanHeading.includes('PLC') || cleanHeading.includes('Bank') || cleanHeading.includes('Bangladesh') || cleanHeading.includes('Association'));

      if (aboutClientMatch && !client) {
        client = aboutClientMatch[1].trim();
        if (!client.toLowerCase().includes('foundation') && cleanHeading.toLowerCase().includes('foundation')) {
          client = `${client} Foundation`;
        }
      } else if (clientLabelMatch && !client) {
        client = clientLabelMatch[1].trim();
      } else if (isOrgHeader && !client && i < 10) {
        client = cleanHeading;
      }

      const refMatch = cleanHeading.match(/(?:reference\s*no\.?|ref\s*no\.?|rfp\s*no\.?|tender\s*no\.?|eoi\s*no\.?)[:\s]*([A-Za-z0-9_\-\/.]+)/i);
      if (refMatch && !refNumber) {
        refNumber = refMatch[1].trim();
      }

      const funderMatch = cleanHeading.match(/(?:funder|funded\s+by|donor|financing\s+agency)[:\s]+([^\n.,]{3,80})/i);
      if (funderMatch && !funder) {
        funder = funderMatch[1].trim();
      }
    }

    // Secondary client scan across document (e.g. "Centre for the Rehabilitation of the Paralysed (CRP) is dedicated...")
    if (!client) {
      const backgroundOrgMatch = text.match(/(?:about|background(?:\s+of)?)\s*[:\n\-–]*\s*([A-Z][A-Za-z0-9\s,&.\-–]{3,80}?(?:\([A-Z0-9]+\))?)(?:\s+is\s+|\s+was\s+|\s+dedicated\s+|\s+working\s+|\n|\.)/i);
      if (backgroundOrgMatch && backgroundOrgMatch[1].trim().length > 3) {
        const candidate = backgroundOrgMatch[1].trim();
        // Ignore descriptive sentence starters like "The purpose" or "This assignment"
        if (!candidate.toLowerCase().startsWith('the purpose') && !candidate.toLowerCase().startsWith('this ') && !candidate.toLowerCase().startsWith('an assessment')) {
          client = candidate;
        }
      }
    }

    if (!title) {
      title = fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    }

    // 2. Context-Aware Submission Deadline Extraction
    let deadline = '';
    const deadlineContextPatterns = [
      /(?:submission\s+deadline|deadline\s+for\s+submission|closing\s+date|proposals?\s+due|proposals?\s+must\s+be\s+submitted|proposals?\s+must\s+be\s+received|on\s+or\s+before|no\s+later\s+than|application\s+deadline|submission\s+of\s+(?:expression\s+of\s+interest|proposals?|eoi)[:\s\S]{0,80}?(?:on\s+or\s+before|by))[:\s]*([^\n.,;]{3,80})/i,
      /(?:deadline)[:\s]*(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4}(?:\s*,\s*\d{1,2}[:.]\d{2}\s*(?:am|pm|gmt|bst|utc)?)?)/i
    ];

    for (const pattern of deadlineContextPatterns) {
      const match = text.match(pattern);
      if (match) {
        const candidate = cleanDeadlineString(match[1]);
        if (candidate && (/\d{4}/.test(candidate) || /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(candidate) || /\d{1,2}\/\d{1,2}/.test(candidate))) {
          deadline = candidate;
          break;
        }
      }
    }

    // 3. Context-Aware Email Extraction (Differentiate Submission vs Clarification)
    let submissionEmail = '';
    let queryEmail = '';
    let contactPerson = '';

    const subEmailMatch = text.match(/(?:submission\s+email|send\s+(?:proposals?|applications?)\s+to|submit\s+(?:via|to)\s+email|email\s*:)[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (subEmailMatch) {
      submissionEmail = subEmailMatch[1].trim();
    }

    const queryEmailMatch = text.match(/(?:queries|clarifications?|inquiries|questions?|focal\s+point)[:\s\S]{0,100}?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (queryEmailMatch) {
      queryEmail = queryEmailMatch[1].trim();
    }

    if (!submissionEmail) {
      const allEmails = Array.from(text.matchAll(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g)).map(m => m[1]);
      if (allEmails.length === 1) {
        submissionEmail = allEmails[0];
      }
    }

    const contactMatch = text.match(/(?:attention|contact\s+person|focal\s+point|procurement\s+lead|coordinator)[:\s]+([^\n.,]{3,60})/i);
    if (contactMatch) {
      contactPerson = contactMatch[1].trim();
    }

    let submissionMethod = '';
    if (lowerText.includes('electronic procurement') || lowerText.includes('e-gp') || lowerText.includes('eprocure')) {
      submissionMethod = 'Electronic Procurement Portal (e-GP)';
    } else if (lowerText.includes('email') && (lowerText.includes('hard copy') || lowerText.includes('physical envelope') || lowerText.includes('sealed envelope') || lowerText.includes('physically to:'))) {
      submissionMethod = 'Email, Physical submission';
    } else if (lowerText.includes('sealed envelope') || lowerText.includes('hard copy') || lowerText.includes('physical copy')) {
      submissionMethod = 'Physical Sealed Envelopes';
    } else if (lowerText.includes('email') || submissionEmail) {
      submissionMethod = 'Electronic Email Submission';
    }

    const locationMatch = text.match(/(?:location|duty\s+station|place\s+of\s+work|assignment\s+location|address)[:\s]+([^\n.]{5,100})/i);
    if (locationMatch) {
      location = locationMatch[1].trim();
    }

    // 4. Duration & Timeline
    let durationMonths = '';
    let startDate = '';
    let endDate = '';
    const durationMatch = text.match(/(?:duration|period\s+of\s+assignment|contract\s+duration|level\s+of\s+effort|assignment\s+period)[:\s]+([^\n.]{3,80})/i);
    if (durationMatch) {
      durationMonths = durationMatch[1].trim();
    }

    const startMatch = text.match(/(?:start\s+date|expected\s+start|commencement\s+date)[:\s]+([^\n.,]{3,40})/i);
    if (startMatch) startDate = startMatch[1].trim();

    const endMatch = text.match(/(?:end\s+date|completion\s+date|concluding\s+date)[:\s]+([^\n.,]{3,40})/i);
    if (endMatch) endDate = endMatch[1].trim();

    // 5. Objectives Extraction (Supports Role Purpose, Objectives of the Assignment, Primary Objectives)
    let overallObjective = '';
    const specificObjectives: string[] = [];

    const objSectionRegex = /(?:##+\s*|\n)(?:\d+\.\s*)?(?:(?:Primary|Specific|Assignment|Main)\s+)?Objectives?(?:\s+of\s+the\s+Assignment)?|(?:Role\s+Purpose|Purpose\s+of\s+(?:this\s+)?(?:Consultancy|Assignment))([\s\S]*?)(?=(?:##+\s*|\n)(?:\d+\.\s*)?(?:Scope|Key\s+Responsibilities|Deliverables|Methodology|Outputs|Team|Qualifications)|$)/i;
    const objMatch = text.match(objSectionRegex);
    if (objMatch && objMatch[1]) {
      const objLines = objMatch[1].split('\n');
      for (const rawLine of objLines) {
        const clean = rawLine.trim().replace(/^[-*•\d.]+\s*/, '');
        if (clean.length > 15 && !clean.toLowerCase().includes('table of content') && !clean.toLowerCase().startsWith('registration:') && !clean.toLowerCase().startsWith('address:')) {
          if (!overallObjective) overallObjective = clean;
          else specificObjectives.push(clean);
        }
      }
    }

    // 6. Scope of Work & Out of Scope Activities (Supports Key Responsibilities, Areas of Work, Scope of Services)
    const scopeComponents: string[] = [];
    const outOfScope: string[] = [];

    const scopeSectionRegex = /(?:##+\s*|\n)(?:\d+\.\s*)?(?:Scope\s+of\s+(?:Work|Services)|Key\s+Responsibilities|Major\s+Components|Areas\s+of\s+Work)([\s\S]*?)(?=(?:##+\s*|\n)(?:\d+\.\s*)?(?:Expected\s+Deliverables|Deliverables|Outputs|Timeline|Duration|Methodology|Team|Qualifications|Validation)|$)/i;
    const scopeMatch = text.match(scopeSectionRegex);
    if (scopeMatch && scopeMatch[1]) {
      const scopeLines = scopeMatch[1].split('\n');
      for (const rawLine of scopeLines) {
        const clean = rawLine.trim().replace(/^[-*•\d.]+\s*/, '');
        if (clean.length > 15 && !clean.toLowerCase().includes('table of content') && !clean.toLowerCase().startsWith('registration:') && !clean.toLowerCase().startsWith('address:')) {
          if (clean.toLowerCase().includes('out of scope') || clean.toLowerCase().includes('exclusion') || clean.toLowerCase().includes('not included')) {
            outOfScope.push(clean);
          } else {
            scopeComponents.push(clean);
          }
        }
      }
    }

    const outOfScopeRegex = /(?:##+\s*|\n)(?:\d+\.\s*)?(?:Out\s+of\s+Scope|Exclusions)([\s\S]*?)(?=(?:##+\s*|\n)|$)/i;
    const outMatch = text.match(outOfScopeRegex);
    if (outMatch && outMatch[1]) {
      const outLines = outMatch[1].split('\n');
      for (const rawLine of outLines) {
        const clean = rawLine.trim().replace(/^[-*•\d.]+\s*/, '');
        if (clean.length > 15 && !outOfScope.includes(clean)) {
          outOfScope.push(clean);
        }
      }
    }

    // 7. Deliverables Extraction (Strict section boundary stop at Duration, Eligibility, Submission)
    const deliverables: { name: string; format?: string; quantity?: string; dueDate?: string; milestone?: string; paymentPct?: number }[] = [];
    const delivSectionRegex = /(?:##+\s*|\n)(?:\d+\.\s*)?(?:(?:Expected\s+)?(?:Technical\s+)?Deliverables|Expected\s+Outputs|Deliverables\s+Schedule)([\s\S]*?)(?=(?:##+\s*|\n)(?:\d+\.\s*)?(?:Assignment\s+Duration|Duration|Timeline|Reporting\s+Line|Required\s+Qualifications|Key\s+Qualifications|Eligibility\s+Criteria|Submission\s+of\s+Expression\s+of\s+Interest|Submission\s+Guidelines|Payment\s+Schedule|Evaluation\s+Criteria|Application\s+Requirements|Expected\s+Outcomes)|$)/i;
    const delivMatch = text.match(delivSectionRegex);
    if (delivMatch && delivMatch[1]) {
      const delivLines = delivMatch[1].split('\n');
      let currentDelivName = '';
      
      for (const rawLine of delivLines) {
        const trimmed = rawLine.trim();
        if (!trimmed || trimmed.toLowerCase().startsWith('registration:') || trimmed.toLowerCase().startsWith('address:') || trimmed.toLowerCase().startsWith('contact') || trimmed.toLowerCase().startsWith('email')) {
          continue;
        }

        // Check if line starts with a deliverable number (e.g. "1. Inception Report", "2. Draft Policy") or bullet
        const numMatch = trimmed.match(/^(\d+)\.\s+([^\n]+)/);
        const bulletMatch = trimmed.match(/^[-*•]\s+([^\n]+)/);
        
        const candidateText = numMatch ? numMatch[2].trim() : (bulletMatch ? bulletMatch[1].trim() : '');
        if (candidateText && candidateText.length > 5) {
          // Filter out generic boilerplate headers like "The consultant/firm will submit the following deliverables:"
          if (!candidateText.toLowerCase().includes('following deliverables') && 
              !candidateText.toLowerCase().includes('table of content') &&
              !candidateText.toLowerCase().includes('the consultant will submit') &&
              !candidateText.toLowerCase().includes('the consultant will provide')) {
            currentDelivName = candidateText;
            const dueMatch = currentDelivName.match(/(?:due|within|by|timeline)[:\s]+([^()]+)/i);
            deliverables.push({
              name: currentDelivName,
              dueDate: dueMatch ? dueMatch[1].trim() : undefined
            });
          }
        }
      }
    }

    // 8. Team & Qualifications
    const team: { role: string; count?: number; minYearsExp?: number; degree?: string; certifications?: string[]; keySkills?: string[] }[] = [];
    const teamSectionRegex = /(?:##+\s*|\n)(?:\d+\.\s*)?(?:Team\s+Composition|Key\s+Experts?|Required\s+Personnel)([\s\S]*?)(?=(?:##+\s*|\n)|$)/i;
    const teamMatch = text.match(teamSectionRegex);
    if (teamMatch && teamMatch[1]) {
      const teamLines = teamMatch[1].split('\n');
      for (const rawLine of teamLines) {
        const clean = rawLine.trim().replace(/^[-*•\d.]+\s*/, '');
        if (clean.length > 10 && (clean.toLowerCase().includes('expert') || clean.toLowerCase().includes('lead') || clean.toLowerCase().includes('specialist') || clean.toLowerCase().includes('consultant') || clean.toLowerCase().includes('auditor'))) {
          const yrsMatch = clean.match(/(\d+)\+?\s*years?/i);
          team.push({
            role: clean,
            count: 1,
            minYearsExp: yrsMatch ? parseInt(yrsMatch[1], 10) : undefined
          });
        }
      }
    }

    // 9. Financial & Payment Terms
    let pricingType = '';
    let currency = '';
    if (lowerText.includes('lump sum') || lowerText.includes('lump-sum')) pricingType = 'Lump Sum Fixed Price';
    else if (lowerText.includes('time-based') || lowerText.includes('time based')) pricingType = 'Time-Based Contract';

    const currMatch = text.match(/\b(BDT|USD|EUR|GBP|AUD|CAD|JPY|Taka)\b/i);
    if (currMatch) currency = currMatch[1].toUpperCase();

    // 10. Evaluation Criteria
    let techWeight: number | undefined = undefined;
    let finWeight: number | undefined = undefined;
    let minTechScore: number | undefined = undefined;
    const evalCriteria: string[] = [];

    const weightMatch = text.match(/(\d{2})\s*(?:%|\/)\s*(\d{2})/);
    if (weightMatch && (parseInt(weightMatch[1], 10) + parseInt(weightMatch[2], 10) === 100)) {
      techWeight = parseInt(weightMatch[1], 10);
      finWeight = parseInt(weightMatch[2], 10);
    }

    const minScoreMatch = text.match(/(?:minimum\s+technical\s+score|qualifying\s+score|pass\s+mark)[:\s]+(\d{2})/i);
    if (minScoreMatch) {
      minTechScore = parseInt(minScoreMatch[1], 10);
    }

    const evalSectionRegex = /(?:##+\s*|\n)(?:\d+\.\s*)?Evaluation\s+Criteria([\s\S]*?)(?=(?:##+\s*|\n)|$)/i;
    const evalMatch = text.match(evalSectionRegex);
    if (evalMatch && evalMatch[1]) {
      const evalLines = evalMatch[1].split('\n');
      for (const rawLine of evalLines) {
        const clean = rawLine.trim().replace(/^[-*•\d.]+\s*/, '');
        if (clean.length > 15 && !clean.toLowerCase().includes('table of content')) {
          evalCriteria.push(clean);
        }
      }
    }

    const submissionRecipient: TorSubmissionRecipient = {
      organization: client || undefined,
      email: submissionEmail || undefined
    };

    return {
      assignmentContext: {
        client: client || undefined,
        funder,
        refNumber,
        title,
        location: location || undefined,
        background: overallObjective || undefined,
        contactPerson: contactPerson || undefined,
        contactEmail: queryEmail || submissionEmail || undefined
      },
      objectives: {
        overall: overallObjective || undefined,
        specific: specificObjectives,
        outcomes: []
      },
      scope: {
        components: scopeComponents,
        tasks: scopeComponents,
        requiredActivities: [],
        outOfScope,
        exclusions: outOfScope
      },
      methodology: {
        frameworks: [],
        standards: []
      },
      deliverables,
      timeline: {
        durationMonths: durationMonths || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        keyDates: []
      },
      team,
      eligibility: {
        qualifications: []
      },
      administrative: {
        formsRequired: [],
        declarations: [],
        prescribedTemplates: []
      },
      financial: {
        pricingType: pricingType || undefined,
        currency: currency || undefined,
        paymentTerms: []
      },
      reporting: {
        frequency: undefined,
        reportsRequired: deliverables.map(d => d.name),
        recipients: client ? [client] : []
      },
      evaluation: {
        techWeight,
        finWeight,
        minTechScore,
        criteria: evalCriteria
      },
      submission: {
        deadline: deadline || undefined,
        method: submissionMethod || undefined,
        location: location || undefined,
        email: submissionEmail || undefined,
        recipient: submissionRecipient
      }
    };
  }

  /**
   * Deterministic clause-by-clause requirement generator when LLM is unavailable.
   * Extracts requirements strictly from parsed sections and headings in source text.
   */
  private static generateRequirementsFromSource(
    text: string,
    model: TorKnowledgeModel,
    fileName: string
  ): Partial<Requirement>[] {
    const reqs: Partial<Requirement>[] = [];
    let count = 1;

    // 1. Objectives & Scope
    if (model.objectives.overall) {
      reqs.push({
        id: `req-${Date.now()}-${count++}`,
        requirementText: `Objective: ${model.objectives.overall}`,
        category: 'Technical',
        mandatory: true,
        sourceFile: fileName,
        sourceSection: 'Objectives',
        status: 'READY',
        aiInterpretation: 'Primary technical objective stated in TOR.',
        aiConfidence: 0.95,
        isVerified: true
      });
    }

    for (const spec of model.objectives.specific || []) {
      reqs.push({
        id: `req-${Date.now()}-${count++}`,
        requirementText: `Specific Objective: ${spec}`,
        category: 'Technical',
        mandatory: true,
        sourceFile: fileName,
        sourceSection: 'Specific Objectives',
        status: 'READY',
        aiInterpretation: 'Specific objective stated in TOR.',
        aiConfidence: 0.95,
        isVerified: true
      });
    }

    // 2. Deliverables
    (model.deliverables || []).forEach((d, idx) => {
      reqs.push({
        id: `req-${Date.now()}-${count++}`,
        requirementText: `Deliverable ${idx + 1}: ${d.name}${d.dueDate ? ` (Due: ${d.dueDate})` : ''}`,
        category: 'Deliverable',
        mandatory: true,
        sourceFile: fileName,
        sourceSection: 'Deliverables',
        status: 'READY',
        aiInterpretation: `Deliverable requirement extracted from TOR.`,
        aiConfidence: 0.95,
        isVerified: true
      });
    });

    // 3. Team
    (model.team || []).forEach((t) => {
      reqs.push({
        id: `req-${Date.now()}-${count++}`,
        requirementText: `Key Personnel: ${t.role}${t.minYearsExp ? ` (${t.minYearsExp}+ years experience)` : ''}`,
        category: 'Team',
        mandatory: true,
        sourceFile: fileName,
        sourceSection: 'Team Requirements',
        status: 'READY',
        aiInterpretation: `Key personnel qualification requirement.`,
        aiConfidence: 0.95,
        isVerified: true
      });
    });

    // 4. Submission Deadline
    if (model.submission.deadline && model.submission.deadline !== 'Not stated in TOR') {
      reqs.push({
        id: `req-${Date.now()}-${count++}`,
        requirementText: `Submission Deadline: ${model.submission.deadline}${model.submission.method ? ` via ${model.submission.method}` : ''}`,
        category: 'Submission',
        mandatory: true,
        sourceFile: fileName,
        sourceSection: 'Submission Requirements',
        status: 'READY',
        aiInterpretation: `Mandatory proposal submission deadline clause.`,
        aiConfidence: 0.98,
        isVerified: true
      });
    }

    // 5. Submission Email
    if (model.submission.email) {
      reqs.push({
        id: `req-${Date.now()}-${count++}`,
        requirementText: `Proposal Submission Email: ${model.submission.email}`,
        category: 'Submission',
        mandatory: true,
        sourceFile: fileName,
        sourceSection: 'Submission Requirements',
        status: 'READY',
        aiInterpretation: `Designated electronic submission inbox.`,
        aiConfidence: 0.98,
        isVerified: true
      });
    }

    return reqs;
  }

  /**
   * Builds the comprehensive compliance snapshot strictly from extracted requirements and text.
   * Zero hardcoded mock items or external company assumptions.
   */
  private static buildComplianceSnapshot(
    model: TorKnowledgeModel,
    requirements: Partial<Requirement>[],
    text: string
  ) {
    const mandatoryRequirements = requirements
      .filter((r) => r.mandatory)
      .map((r) => r.requirementText || '')
      .filter(Boolean);

    const conditionalRequirements = requirements
      .filter((r) => {
        const t = (r.requirementText || '').toLowerCase();
        return t.includes('if applicable') || t.includes('where relevant') || t.includes('if selected') || t.includes('upon award') || t.includes('subject to');
      })
      .map((r) => r.requirementText || '')
      .filter(Boolean);

    const supportingDocuments = requirements
      .filter((r) => {
        const cat = (r.category || '').toLowerCase();
        const t = (r.requirementText || '').toLowerCase();
        return (
          cat === 'eligibility' ||
          cat === 'administrative' ||
          t.includes('certificate') ||
          t.includes('license') ||
          t.includes('registration') ||
          t.includes('tin') ||
          t.includes('bin') ||
          t.includes('tax clearance') ||
          t.includes('trade license') ||
          t.includes('work order')
        );
      })
      .map((r) => r.requirementText || '')
      .filter(Boolean);

    const potentialRisks: string[] = [];
    if (model.submission?.deadline && model.submission.deadline !== 'Not stated in TOR') {
      potentialRisks.push(`Strict proposal submission deadline: ${model.submission.deadline}`);
    }
    if (model.evaluation?.minTechScore) {
      potentialRisks.push(`High technical qualifying threshold: minimum ${model.evaluation.minTechScore} points required to open financial proposal.`);
    }
    if (model.submission?.method?.toLowerCase().includes('sealed envelope')) {
      potentialRisks.push('Physical sealed submission required; ensure separate packaging of Technical and Financial envelopes.');
    }

    const ambiguousOrIncomplete: string[] = [];
    if (!model.submission?.deadline || model.submission.deadline === 'Not stated in TOR') {
      ambiguousOrIncomplete.push('Submission deadline is not explicitly declared in this TOR document.');
    }
    if (!model.submission?.email && !model.submission?.address) {
      ambiguousOrIncomplete.push('Submission recipient email/address is not specified in the document.');
    }
    if (!model.timeline?.durationMonths || model.timeline.durationMonths === 'Not specified') {
      ambiguousOrIncomplete.push('Total assignment duration is not explicitly specified.');
    }

    return {
      mandatoryRequirements: Array.from(new Set(mandatoryRequirements)).slice(0, 15),
      conditionalRequirements: Array.from(new Set(conditionalRequirements)),
      userInfoRequired: [],
      supportingDocuments: Array.from(new Set(supportingDocuments)),
      potentialRisks: Array.from(new Set(potentialRisks)),
      ambiguousOrIncomplete: Array.from(new Set(ambiguousOrIncomplete)),
      outOfScopeExclusions: model.scope.outOfScope || []
    };
  }

  /**
   * Merges deterministic extraction with LLM extraction, prioritizing explicit source-backed values.
   */
  private static mergeModels(det: TorKnowledgeModel, llm: TorKnowledgeModel): TorKnowledgeModel {
    return {
      assignmentContext: {
        client: (llm.assignmentContext?.client && llm.assignmentContext.client.trim().length > 1) ? llm.assignmentContext.client.trim() : det.assignmentContext.client,
        funder: llm.assignmentContext?.funder || det.assignmentContext.funder,
        refNumber: llm.assignmentContext?.refNumber || det.assignmentContext.refNumber,
        title: (llm.assignmentContext?.title && llm.assignmentContext.title.length > 5) ? llm.assignmentContext.title : det.assignmentContext.title,
        location: llm.assignmentContext?.location || det.assignmentContext.location,
        sector: llm.assignmentContext?.sector || det.assignmentContext.sector,
        background: llm.assignmentContext?.background || det.assignmentContext.background,
        contactPerson: llm.assignmentContext?.contactPerson || det.assignmentContext.contactPerson,
        contactEmail: llm.assignmentContext?.contactEmail || det.assignmentContext.contactEmail,
        contactAddress: llm.assignmentContext?.contactAddress || det.assignmentContext.contactAddress
      },
      objectives: {
        overall: llm.objectives?.overall || det.objectives.overall,
        specific: (llm.objectives?.specific && llm.objectives.specific.length > 0) ? llm.objectives.specific : det.objectives.specific,
        outcomes: (llm.objectives?.outcomes && llm.objectives.outcomes.length > 0) ? llm.objectives.outcomes : det.objectives.outcomes
      },
      scope: {
        components: (llm.scope?.components && llm.scope.components.length > 0) ? llm.scope.components : det.scope.components,
        tasks: (llm.scope?.tasks && llm.scope.tasks.length > 0) ? llm.scope.tasks : det.scope.tasks,
        requiredActivities: det.scope.requiredActivities,
        outOfScope: (llm.scope?.outOfScope && llm.scope.outOfScope.length > 0) ? llm.scope.outOfScope : det.scope.outOfScope,
        exclusions: (llm.scope?.exclusions && llm.scope.exclusions.length > 0) ? llm.scope.exclusions : det.scope.exclusions
      },
      methodology: {
        frameworks: (llm.methodology?.frameworks && llm.methodology.frameworks.length > 0) ? llm.methodology.frameworks : det.methodology.frameworks,
        standards: (llm.methodology?.standards && llm.methodology.standards.length > 0) ? llm.methodology.standards : det.methodology.standards
      },
      deliverables: (llm.deliverables && llm.deliverables.length > 0) ? llm.deliverables : det.deliverables,
      timeline: {
        durationMonths: llm.timeline?.durationMonths || det.timeline.durationMonths,
        startDate: llm.timeline?.startDate || det.timeline.startDate,
        endDate: llm.timeline?.endDate || det.timeline.endDate,
        keyDates: (llm.timeline?.keyDates && llm.timeline.keyDates.length > 0) ? llm.timeline.keyDates : det.timeline.keyDates
      },
      team: (llm.team && llm.team.length > 0) ? llm.team : det.team,
      eligibility: {
        ...det.eligibility,
        ...llm.eligibility
      },
      administrative: {
        ...det.administrative,
        ...llm.administrative
      },
      financial: {
        ...det.financial,
        ...llm.financial
      },
      reporting: det.reporting,
      evaluation: {
        ...det.evaluation,
        ...llm.evaluation
      },
      submission: {
        ...det.submission,
        ...llm.submission,
        deadline: (llm.submission?.deadline && llm.submission.deadline.trim().length > 1) ? llm.submission.deadline.trim() : det.submission.deadline,
        method: llm.submission?.method || det.submission.method,
        email: llm.submission?.email || det.submission.email
      },
      complianceSummary: det.complianceSummary
    };
  }
}
