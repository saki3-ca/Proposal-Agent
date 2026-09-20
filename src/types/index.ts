export type TenderType =
  | 'Statutory Audit'
  | 'Internal Audit'
  | 'Consulting'
  | 'Assurance'
  | 'Tax Advisory'
  | 'IT/Cyber Advisory'
  | 'Audit'
  | 'Consultancy'
  | 'Advisory'
  | 'Management Audit'
  | 'Fixed Asset Audit'
  | 'Tax'
  | 'Others';

export type ProposalStatus =
  | 'Not Started'
  | 'Draft'
  | 'In Progress'
  | 'Under Review'
  | 'Submitted'
  | 'On Hold'
  | 'Assigned To Other Team'
  | 'Approved'
  | 'Rejected';

export type UserRole = 'Admin' | 'Proposal Manager' | 'Reviewer' | 'Knowledge Base Manager' | 'Viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  avatarInitials: string;
}

export type ProjectProcessingStatus = 'idle' | 'preparing' | 'completed' | 'failed';

export interface ProjectProcessingState {
  status: ProjectProcessingStatus;
  currentStage: string;
  currentStageIndex: number;
  totalStages: number;
  completedStages: string[];
  progressPercent: number;
  startedAt?: string;
  stageStartedAt?: string;
  estimatedRemainingSeconds?: number;
  completedAt?: string;
  totalDurationSeconds?: number;
  errorStage?: string;
  errorMessage?: string;
  lastUpdatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  assignmentTitle: string;
  tenderType: TenderType;
  refNumber: string;
  receiveDate: string; // YYYY-MM-DD
  submissionDeadline: string; // YYYY-MM-DD
  daysLeft?: number;
  assignedTo: string;
  issuingOrg: string;
  recipient?: TorSubmissionRecipient;
  submissionNumber?: string;
  proposalReferenceYear?: string;
  manager: string;
  status: ProposalStatus;
  processingState?: ProjectProcessingState;
  remarks: string;
  completionPercentage: number;
  mandatoryUnresolvedCount: number;
  activeStep: number;
  createdAt: string;
  updatedAt: string;
}

export type DocumentType = 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'Image' | 'TXT' | 'CSV';
export type ProcessingStatus = 'uploaded' | 'file_identified' | 'text_extracted' | 'ocr_check' | 'markdown_converted' | 'ai_analyzed' | 'error';

export interface ProjectDocument {
  id: string;
  projectId?: string;
  kbCategory?: string;
  fileName: string;
  fileType: DocumentType;
  fileSizeMb: number;
  uploadedBy: string;
  uploadDate: string;
  processingStatus: ProcessingStatus;
  ocrRequired: boolean;
  ocrCompleted: boolean;
  isSearchable: boolean;
  pageCount: number;
  sourcePath: string;
  markdownContent?: string;
  aiConfidence: number;
  version: string;
  rawFile?: any;
  rawFileBase64?: string;
}

export type RequirementCategory =
  | 'Eligibility'
  | 'Technical'
  | 'Methodology'
  | 'Deliverable'
  | 'Timeline'
  | 'Team'
  | 'Experience'
  | 'Financial'
  | 'Administrative'
  | 'Submission'
  | 'Evaluation'
  | 'Reporting'
  | 'Contractual';

export type RequirementStatus = 'READY' | 'REVIEW_REQUIRED' | 'MISSING' | 'NOT_APPLICABLE';

export interface Requirement {
  id: string;
  projectId: string;
  requirementText: string;
  category: RequirementCategory;
  classification?: RequirementClassification;
  subcategory?: string;
  mandatory: boolean;
  sourceFile: string;
  sourcePage: number;
  sourceSection?: string;
  sourceClause?: string;
  sourceQuote?: string;
  sourceLocationConfidence?: number;
  status: RequirementStatus;
  aiInterpretation: string;
  evidenceFound: string[];
  evidenceStatus: 'Available' | 'Partial' | 'Missing';
  evidenceGap?: string;
  relatedProposalSection?: string;
  relatedDeliverable?: string;
  relatedTeamRole?: string;
  relatedSubmissionItem?: string;
  aiConfidence: number;
  reviewerComment?: string;
  isVerified: boolean;
  verifiedBy?: string;
}

export interface TorSubmissionRecipient {
  organization?: string;
  secretariatOrUnit?: string;
  addressLines?: string[];
  attentionPerson?: string;
  attentionDesignation?: string;
  relatedOrganization?: string;
  email?: string;
}

export interface TorKnowledgeModel {
  assignmentContext: {
    client?: string;
    funder?: string;
    refNumber?: string;
    title?: string;
    location?: string;
    sector?: string;
    background?: string;
    contactPerson?: string;
    contactEmail?: string;
    contactAddress?: string;
  };
  objectives: {
    overall?: string;
    specific?: string[];
    outcomes?: string[];
  };
  scope: {
    components?: string[];
    workstreams?: string[];
    tasks?: string[];
    requiredActivities?: string[];
    outOfScope?: string[];
    exclusions?: string[];
  };
  methodology: {
    frameworks?: string[];
    standards?: string[];
    samplingCriteria?: string;
    QAProtocols?: string;
  };
  deliverables: {
    name: string;
    format?: string;
    quantity?: string;
    dueDate?: string;
    milestone?: string;
    paymentPct?: number;
  }[];
  timeline: {
    durationMonths?: string;
    startDate?: string;
    endDate?: string;
    keyDates?: { title: string; date: string }[];
  };
  team: {
    role: string;
    count?: number;
    minYearsExp?: number;
    degree?: string;
    certifications?: string[];
    keySkills?: string[];
  }[];
  eligibility: {
    icabLicenseReq?: boolean;
    minFirmYears?: number;
    minTurnover?: string;
    minSimilarProjects?: number;
    qualifications?: string[];
  };
  administrative: {
    formsRequired?: string[];
    declarations?: string[];
    prescribedTemplates?: string[];
    validityDays?: number;
  };
  financial: {
    pricingType?: string;
    currency?: string;
    vatRate?: number;
    paymentTerms?: string[];
    budgetCap?: string;
    reimbursableRules?: string;
  };
  reporting?: {
    frequency?: string;
    reportsRequired?: string[];
    recipients?: string[];
  };
  evaluation: {
    techWeight?: number;
    finWeight?: number;
    minTechScore?: number;
    criteria?: string[];
  };
  submission: {
    deadline?: string;
    method?: string;
    location?: string;
    email?: string;
    address?: string;
    copies?: string;
    namingConvention?: string;
    recipient?: TorSubmissionRecipient;
  };
  complianceSummary?: {
    mandatoryRequirements?: string[];
    conditionalRequirements?: string[];
    userInfoRequired?: string[];
    supportingDocuments?: string[];
    potentialRisks?: string[];
    ambiguousOrIncomplete?: string[];
    outOfScopeExclusions?: string[];
  };
  metadata?: {
    sourceFileName?: string;
    extractedAt?: string;
    markitdownQuality?: any;
    version?: string;
  };
}

export interface Expert {
  id: string;
  name: string;
  designation: string;
  role: string;
  yearsExperience: number;
  education: string;
  certifications: string[];
  relevantAssignmentsCount: number;
  verificationStatus: 'Verified' | 'Pending' | 'Incomplete';
  skills: string[];
  sectorExperience: string[];
  cvDocumentUrl: string;
  matchScore?: number;
  matchReasons?: string[];
  missingSkills?: string[];
}

export interface CompanyExperience {
  id: string;
  client: string;
  assignmentTitle: string;
  sector: string;
  assignmentType: string;
  scope: string;
  startDate: string;
  endDate: string;
  contractValue: string;
  role: string;
  country: string;
  evidenceDocument: string;
  evidencePage: number;
  matchScore?: number;
  matchReasons?: string[];
  verificationStatus: 'Verified' | 'Pending';
}

export interface ProposalStyle {
  id: string;
  name: 'Corporate' | 'Executive' | 'Technical' | 'Custom';
  title: string;
  description: string;
  tone: string;
  typicalLength: string;
  visualStyle: string;
  features: string[];
  isSelected?: boolean;
}

export type HouseStyleSourceType = 'REFERENCE_EXTRACTED' | 'DEFAULT_BASELINE' | 'CONSOLIDATED';
export type HouseStyleStatus = 'REFERENCE_REQUIRED' | 'ACTIVE' | 'CONFLICT';
export type ReusabilityStatus = 'CANDIDATE' | 'REVIEW_REQUIRED' | 'VERIFIED_REUSABLE' | 'REFERENCE_SPECIFIC';

export interface SectionArchitectureItem {
  title: string;
  level: number;
  numbering?: string;
  sourceDocument?: string;
}

export interface BoilerplateCandidate {
  sectionTitle: string;
  sampleText: string;
  status: ReusabilityStatus;
  confidence: number;
}

export interface HouseStyleRuleSource {
  property: string;
  value: any;
  sourceDocument: string;
  sourceXml?: string;
  confidence: number;
}

export interface HouseStyleProfile {
  metadata: {
    profileId: string;
    name: string;
    status: HouseStyleStatus;
    sourceType: HouseStyleSourceType;
    sourceDocuments: string[];
    sourceCount: number;
    generatedAt: string;
    confidence: number;
    warnings?: string[];
  };

  document: {
    pageSize: string;
    orientation: 'portrait' | 'landscape';
    margins: {
      top: string;
      bottom: string;
      left: string;
      right: string;
    };
    headerDistance: string;
    footerDistance: string;
    sectionBehavior: string;
  };

  typography: {
    bodyFont: string;
    bodyFontSize: string;
    headingFonts: string[];
    headingSizes: {
      title: string;
      h1: string;
      h2: string;
      h3: string;
    };
    headingWeights: {
      h1: string;
      h2: string;
      h3: string;
    };
    bodyColor: string;
    commonTextStyles: string[];
  };

  colors: {
    primary: string;
    secondary: string;
    accent: string;
    headingColors: {
      title: string;
      h1: string;
      h2: string;
      h3: string;
    };
    tableHeaderColor: string;
    tableHeaderTextColor: string;
    alternateRowColor: string;
  };

  headings: {
    hierarchy: string[];
    numberingPattern: string;
    h1: { font: string; size: string; color: string; bold: boolean; pageBreakBefore: boolean };
    h2: { font: string; size: string; color: string; bold: boolean };
    h3: { font: string; size: string; color: string; bold: boolean };
    spacingRules: { before: string; after: string; lineSpacing: string };
  };

  paragraphs: {
    alignment: 'left' | 'justified' | 'center';
    lineSpacing: string;
    spaceBefore: string;
    spaceAfter: string;
    indentation: string;
  };

  tables: {
    commonStructures: string[];
    headerStyle: { backgroundColor: string; textColor: string; bold: boolean };
    borderStyle: string;
    alignment: 'center' | 'left';
    alternateRows: boolean;
    commonColumnPatterns: string[];
  };

  cover: {
    structure: string[];
    logoDetected: boolean;
    logoPosition: string;
    titlePlacement: string;
    subtitlePlacement: string;
    submittedTo: string;
    submittedBy: string;
    contactBlock: string;
  };

  letter: {
    detected: boolean;
    structure: string[];
    toneCharacteristics: string[];
  };

  toc: {
    detected: boolean;
    style: string;
    depth: number;
  };

  header: {
    detected: boolean;
    layout: string;
    logoDetected: boolean;
    runningTitleDetected: boolean;
    rule: boolean;
  };

  footer: {
    detected: boolean;
    pageNumbering: boolean;
    confidentialityText: string;
    rule: boolean;
  };

  sectionArchitecture: {
    orderedSections: SectionArchitectureItem[];
    numberingScheme: string;
    titlePatterns: string[];
    recurringSections: string[];
  };

  boilerplate: {
    candidates: BoilerplateCandidate[];
    recurringContent: string[];
  };

  restrictions: {
    clientSpecificContent: string[];
    namedEntities: string[];
    dates: string[];
    monetaryValues: string[];
    personnel: string[];
    unsupportedClaims: string[];
  };
}

export interface ProposalSection {
  id: string;
  projectId: string;
  sectionKey: string;
  title: string;
  order: number;
  content: string;
  aiDraft: string;
  aiGenerated: boolean;
  confidence: number;
  sourcesUsed: { name: string; page?: number; type: string }[];
  requirementsCovered: string[];
  status: 'draft' | 'ai_generated' | 'reviewed' | 'approved';
  lastModified: string;
}

export interface FinancialMilestone {
  milestone: string;
  percentage: number;
  amount: number;
  deliverable: string;
}

export interface FinancialItem {
  id: string;
  feeType: string;
  description: string;
  quantity: number;
  unitRate: number;
  totalFee: number;
}

export interface FinancialProposalData {
  projectId: string;
  currency: string;
  items: FinancialItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  narrativeAssumption: string;
  milestones: FinancialMilestone[];
  isApproved: boolean;
}

export interface PrescribedForm {
  id: string;
  projectId: string;
  formName: string;
  formNumber: string;
  sourcePage: number;
  mandatory: boolean;
  fileFormat: string;
  status: 'not_started' | 'populated' | 'verified';
  signatureRequired: boolean;
  signatureStatus: 'Pending Signature' | 'Signed';
  populatedFieldsCount: number;
  totalFieldsCount: number;
}

export interface PptxSlideChange {
  id: string;
  projectId: string;
  slideNumber: number;
  originalTitle: string;
  proposedTitle: string;
  changeType: 'no_change' | 'text_updated' | 'table_updated' | 'chart_updated' | 'slide_replaced';
  status: 'preserve' | 'review_required' | 'approved';
  preservedElements: {
    theme: boolean;
    layout: boolean;
    fonts: boolean;
    colors: boolean;
    images: boolean;
    slideOrder: boolean;
  };
  changesList: string[];
  beforePreviewUrl?: string;
  afterPreviewUrl?: string;
}

export interface ComplianceOverride {
  requirementId: string;
  requirementText: string;
  reason: string;
  overriddenBy: string;
  timestamp: string;
}

export interface FinalComplianceSummary {
  projectId: string;
  overallScorePercentage: number;
  satisfiedCount: number;
  reviewRequiredCount: number;
  missingCount: number;
  mandatoryUnresolvedCount: number;
  readinessStatus: 'READY' | 'REVIEW_REQUIRED' | 'BLOCKED';
  categoryScores: {
    eligibility: number;
    technical: number;
    financial: number;
    administrative: number;
    prescribedForms: number;
  };
  overrides: ComplianceOverride[];
}

export type RequirementClassification =
  | 'Proposal Content'
  | 'Supporting Evidence'
  | 'Submission Document'
  | 'Information to Confirm'
  | 'Contextual / Descriptive'
  | 'Not Applicable'
  | 'Prescribed Form / Template'
  | 'Supporting Document'
  | 'User Information Required'
  | 'Not Applicable / Not Required';

export interface SubmissionRequirementPlacement {
  requirementId?: string;
  item: string;
  classification: RequirementClassification;
  placement: string;
  templateRequired?: string;
  sourceClause?: string;
  mandatory: boolean;
  included: boolean;
  status: 'Ready' | 'Missing' | 'Review Required' | 'Information to be provided';
  remarks: string;
  targetFolder?: string;
}

export interface SubmissionChecklistRow {
  item: string;
  classification?: RequirementClassification | string;
  placement?: string;
  templateRequired?: string;
  required: boolean;
  included: boolean;
  status: 'Ready' | 'Missing' | 'Review Required' | 'Information to be provided';
  source: string;
  remarks: string;
}

export interface SubmissionPackageData {
  projectId: string;
  clientName: string;
  assignmentName: string;
  zipFilename: string;
  totalFiles: number;
  totalSizeMb: number;
  checklist: SubmissionChecklistRow[];
  folderStructure: {
    folderName: string;
    files: { name: string; size: string; status: string }[];
  }[];
  isGenerated: boolean;
  generatedDate?: string;
}

export interface AttentionItem {
  id: string;
  projectId: string;
  projectName: string;
  client: string;
  type: 'mandatory_missing' | 'review_required' | 'deadline_approaching' | 'ocr_failed' | 'ai_review_done';
  title: string;
  description: string;
  deadline: string;
  severity: 'critical' | 'warning' | 'info';
  actionPath: string;
}

/* ==========================================================================
   PHASE 4 — PROPOSAL CONTENT PLANNING & TOR-TO-REFERENCE MAPPING TYPES
   ========================================================================== */

export type PlanStatus = 'DRAFT' | 'REVIEW_REQUIRED' | 'READY_FOR_EVIDENCE' | 'READY_FOR_DRAFTING' | 'NOT_READY';

export type PlanSectionType =
  | 'COVER'
  | 'TRANSMITTAL'
  | 'TOC'
  | 'EXECUTIVE_SUMMARY'
  | 'COMPLIANCE_RESPONSE'
  | 'TECHNICAL'
  | 'METHODOLOGY'
  | 'WORKPLAN'
  | 'TEAM'
  | 'RESPONSIBILITY_MATRIX'
  | 'QUALITY'
  | 'RISK'
  | 'DELIVERABLES'
  | 'TIMELINE'
  | 'EXPERIENCE'
  | 'ABOUT_FIRM'
  | 'CONCLUSION'
  | 'APPENDIX'
  | 'OTHER';

export type PlanSectionSource = 'TOR_REQUIRED' | 'REFERENCE_PROPOSAL' | 'ACNABIN_STANDARD' | 'SYSTEM_GENERATED';

export type PlanEvidenceDependency = 'NONE' | 'OPTIONAL' | 'REQUIRED';

export type PlanDraftingStatus = 'NOT_STARTED' | 'PLANNED' | 'READY_FOR_EVIDENCE' | 'READY_FOR_DRAFTING';

export interface ProposalContentPlanSection {
  id: string;
  sectionNumber: string;
  title: string;
  level: number;
  parentSectionId?: string;
  sectionType: PlanSectionType;
  source: PlanSectionSource;
  referenceSectionId?: string;
  purpose: string;
  requiredContent: string[];
  optionalContent: string[];
  prohibitedContent: string[];
  torRequirementIds: string[];
  evaluationCriteriaIds: string[];
  deliverableIds: string[];
  evidenceRequirementIds: string[];
  submissionItemIds: string[];
  teamRoleIds: string[];
  recommendedOrder: number;
  writingGuidance: string[];
  evidenceDependency: PlanEvidenceDependency;
  draftingStatus: PlanDraftingStatus;
  aiConfidence: number;
}

export type RequirementRelationship =
  | 'PRIMARY_RESPONSE'
  | 'SUPPORTING_RESPONSE'
  | 'REFERENCE_ONLY'
  | 'APPENDIX_SUPPORT'
  | 'SUBMISSION_CONTROL';

export type RequirementResponseApproach =
  | 'DIRECT_RESPONSE'
  | 'METHODOLOGY'
  | 'WORKPLAN'
  | 'TEAM'
  | 'EXPERIENCE'
  | 'DELIVERABLE'
  | 'TIMELINE'
  | 'FIRM_PROFILE'
  | 'APPENDIX'
  | 'ADMINISTRATIVE';

export type MappingEvidenceStatus = 'NOT_CHECKED' | 'EXPECTED' | 'AVAILABLE' | 'PARTIAL' | 'MISSING';

export interface ProposalRequirementMapping {
  id: string;
  requirementId: string;
  proposalSectionId: string;
  relationship: RequirementRelationship;
  responseApproach: RequirementResponseApproach;
  required: boolean;
  rationale: string;
  evidenceRequired: boolean;
  evidenceStatus: MappingEvidenceStatus;
  aiConfidence: number;
  // Traceability preservation
  sourceFile?: string;
  sourcePage?: number;
  sourceSection?: string;
  sourceClause?: string;
  sourceQuote?: string;
}

export type EvidenceType =
  | 'FIRM_PROFILE'
  | 'EXPERIENCE'
  | 'CERTIFICATE'
  | 'LICENSE'
  | 'TAX'
  | 'VAT'
  | 'TRADE_LICENSE'
  | 'CV'
  | 'QUALIFICATION'
  | 'ASSIGNMENT_RECORD'
  | 'REFERENCE'
  | 'FINANCIAL'
  | 'OTHER';

export type EvidenceSourceExpected =
  | 'DOCUMENT_LIBRARY'
  | 'PROJECT_DOCUMENTS'
  | 'CV_LIBRARY'
  | 'CLIENT_DOCUMENT'
  | 'EXTERNAL'
  | 'TO_BE_PROVIDED';

export type EvidenceRequirementStatus = 'NOT_CHECKED' | 'EXPECTED' | 'READY_FOR_PHASE_5';

export interface ProposalEvidenceRequirement {
  id: string;
  requirementId?: string;
  proposalSectionId: string;
  evidenceType: EvidenceType;
  description: string;
  mandatory: boolean;
  sourceExpected: EvidenceSourceExpected;
  verificationRequired: boolean;
  status: EvidenceRequirementStatus;
  notes: string;
}

export type PlanningGapType =
  | 'UNMAPPED_REQUIREMENT'
  | 'MISSING_SECTION'
  | 'MISSING_EVIDENCE_PLAN'
  | 'CONFLICTING_STRUCTURE'
  | 'MISSING_EVALUATION_MAPPING'
  | 'MISSING_DELIVERABLE_MAPPING'
  | 'SUBMISSION_ITEM_UNMAPPED'
  | 'REFERENCE_CONFLICT'
  | 'OTHER';

export type GapSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type GapStatus = 'OPEN' | 'RESOLVED' | 'ACCEPTED';

export interface ProposalPlanningGap {
  id: string;
  type: PlanningGapType;
  severity: GapSeverity;
  requirementIds: string[];
  description: string;
  recommendedAction: string;
  status: GapStatus;
  createdAt: string;
}

export interface EvaluationAlignment {
  id: string;
  evaluationCriterionId: string;
  criterionText: string;
  weight?: number;
  proposalSectionIds: string[];
  requiredContent: string[];
  evidenceNeeded: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  planningNotes: string[];
}

export interface ProposalSubmissionItem {
  id: string;
  requirementId?: string;
  itemTitle: string;
  submissionCategory: 'ENVELOPE_FORMAT' | 'FORM_DECLARATION' | 'SEALED_FINANCIAL' | 'DEADLINE_RULE' | 'LEGAL_DOC';
  instructions: string;
  targetSectionOrAppendix: string;
  mandatory: boolean;
}

export interface ProposalContentPlan {
  id: string;
  projectId: string;
  proposalTitle: string;
  sourceTorDocuments: string[];
  referenceProposalDocuments: string[];
  generatedAt: string;
  updatedAt: string;
  status: PlanStatus;
  readinessScore: number; // 0 - 100%
  sections: ProposalContentPlanSection[];
  requirementMappings: ProposalRequirementMapping[];
  evidenceRequirements: ProposalEvidenceRequirement[];
  submissionItems: ProposalSubmissionItem[];
  planningGaps: ProposalPlanningGap[];
  evaluationAlignment?: EvaluationAlignment[];
  assumptions: string[];
  warnings: string[];
}

/* ==========================================================================
   PHASE 5 — ACNABIN EVIDENCE RETRIEVAL & REQUIREMENT MATCHING TYPES
   ========================================================================== */

export type EvidenceCategory =
  | 'PREVIOUS_PROPOSAL'
  | 'COMPANY_PROFILE'
  | 'CERTIFICATE'
  | 'COMPANY_EXPERIENCE'
  | 'CV'
  | 'LEGAL_TAX'
  | 'OTHER';

export type EvidenceVerificationStatus =
  | 'UNVERIFIED'
  | 'CANDIDATE'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CONFLICTING';

export type MatchStatus = 'AVAILABLE' | 'PARTIAL' | 'MISSING' | 'CONFLICTING' | 'NOT_RELEVANT';

export type MatchType = 'DIRECT' | 'PARTIAL' | 'CONTEXTUAL' | 'RELATED' | 'CONFLICTING';

export type EvidenceFactField =
  | 'CLIENT'
  | 'ASSIGNMENT'
  | 'SECTOR'
  | 'SERVICE'
  | 'DATE'
  | 'VALUE'
  | 'CERTIFICATION'
  | 'LICENSE'
  | 'QUALIFICATION'
  | 'ROLE'
  | 'YEARS_EXPERIENCE'
  | 'LOCATION'
  | 'STATUS'
  | 'OTHER';

export interface EvidenceFact {
  id: string;
  field: EvidenceFactField;
  value: string;
  sourceQuote: string;
  sourcePage?: number | null;
  sourceSection?: string | null;
  confidence: number;
}

export interface EvidenceValidity {
  validFrom?: string | null;
  validTo?: string | null;
  asOfDate?: string | null;
  isExpired: boolean;
  validitySource?: string;
  confidence: number;
}

export interface EvidenceRecord {
  id: string;
  documentId: string;
  projectId?: string;
  category: EvidenceCategory;
  title: string;
  sourceFile: string;
  sourcePage?: number | null;
  sourceSection?: string | null;
  sourceClause?: string | null;
  sourceQuote: string;
  evidenceType: EvidenceType;
  extractedFacts: EvidenceFact[];
  validity?: EvidenceValidity;
  relevanceScore: number;
  confidenceScore: number;
  verificationStatus: EvidenceVerificationStatus;
  indexedAt: string;
  contentHash?: string;
  documentVersion?: string;
}

export interface RequirementEvidenceMatch {
  id: string;
  requirementId: string;
  proposalSectionId?: string;
  evidenceId: string;
  matchType: MatchType;
  status: MatchStatus;
  relevanceScore: number;
  factualConfidence: number;
  sourceLocationConfidence: number;
  matchRationale: string;
  supportedFacts: string[];
  unsupportedFacts: string[];
  gaps: string[];
  verificationStatus: 'UNVERIFIED' | 'REVIEW_REQUIRED' | 'VERIFIED' | 'REJECTED';
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceGap {
  id: string;
  requirementId: string;
  evidenceType: string;
  description: string;
  missingFacts: string[];
  currentEvidence: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedAction: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ACCEPTED';
  createdAt: string;
}

export interface EvidencePackage {
  id: string;
  projectId: string;
  generatedAt: string;
  updatedAt: string;
  readinessScore: number; // 0 - 100%
  readinessStatus: 'READY' | 'REVIEW_REQUIRED' | 'NOT_READY';
  matches: RequirementEvidenceMatch[];
  evidenceRecords: EvidenceRecord[];
  gaps: EvidenceGap[];
  availableCount: number;
  partialCount: number;
  missingCount: number;
  conflictingCount: number;
  totalRequirementsEvaluated: number;
  warnings: string[];
}

/* ==========================================================================
   PHASE 6 — EVIDENCE-GROUNDED PROPOSAL DRAFTING TYPES
   ========================================================================== */

export type ProposalDraftStatus = 'PLANNING' | 'DRAFTING' | 'IN_REVIEW' | 'APPROVED' | 'SUPERSEDED';

export type ProposalDraftSectionStatus = 'NOT_STARTED' | 'DRAFTING' | 'DRAFTED' | 'IN_REVIEW' | 'APPROVED' | 'BLOCKED';

export type ContentBlockType =
  | 'HEADING'
  | 'PARAGRAPH'
  | 'BULLET_LIST'
  | 'NUMBERED_LIST'
  | 'TABLE'
  | 'CALLOUT'
  | 'PLACEHOLDER'
  | 'NOTE';

export type BlockReviewStatus = 'AI_GENERATED' | 'HUMAN_EDITED' | 'APPROVED' | 'FLAGGED';

export type EvidenceUsage =
  | 'DIRECT_FACT'
  | 'SUPPORTING_FACT'
  | 'EXPERIENCE'
  | 'QUALIFICATION'
  | 'BOILERPLATE'
  | 'CONTEXT';

export type ClaimType =
  | 'FIRM_FACT'
  | 'EXPERIENCE'
  | 'TEAM'
  | 'CERTIFICATION'
  | 'METHODOLOGY'
  | 'COMMITMENT'
  | 'TIMELINE'
  | 'OTHER';

export type ClaimStatus = 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'UNSUPPORTED' | 'PLACEHOLDER' | 'REQUIRES_REVIEW';

export interface ProposalContentBlock {
  id: string;
  type: ContentBlockType;
  order: number;
  content: string;
  items?: string[];
  tableData?: {
    headers?: string[];
    rows?: string[][];
  };
  headingLevel?: number;
  evidenceReferences?: string[];
  requirementReferences?: string[];
  confidence?: number;
  reviewStatus: BlockReviewStatus;
}

export interface ProposalEvidenceMapping {
  id: string;
  proposalSectionId: string;
  contentBlockId?: string;
  evidenceRecordId: string;
  evidenceType: 'CORPORATE' | 'EXPERIENCE' | 'TEAM' | 'CERTIFICATION' | 'LEGAL' | 'FINANCIAL' | 'REFERENCE_PROPOSAL';
  usage: EvidenceUsage;
  sourceDocument: string;
  sourcePage?: string;
  sourceSection?: string;
  sourceClause?: string;
  sourceQuote?: string;
  verificationStatus: string;
  confidence: number;
}

export interface ProposalClaim {
  id: string;
  sectionId: string;
  contentBlockId: string;
  claimText: string;
  claimType: ClaimType;
  evidenceRequired: boolean;
  evidenceIds: string[];
  status: ClaimStatus;
  confidence: number;
}

export interface ProposalDraftSection {
  id: string;
  draftId: string;
  sectionNumber: string;
  title: string;
  level: number;
  status: ProposalDraftSectionStatus;
  content: ProposalContentBlock[];
  requirementMappings: ProposalRequirementMapping[];
  evidenceMappings: ProposalEvidenceMapping[];
  evaluationCriteriaMappings: string[];
  writingBrief?: string;
  evidenceGapCount: number;
  unsupportedClaimCount: number;
  completenessScore: number;
  evidenceCoverageScore: number;
  reviewerComments?: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type ProjectVerificationStatus = 'VERIFIED' | 'REVIEW_REQUIRED' | 'NOT_FOUND' | 'BLOCKED';

export interface CurrentProjectContext {
  clientName: string | null;
  procuringEntity?: string | null;
  assignmentTitle: string | null;
  tenderReference?: string | null;
  submissionDeadline?: string | null;
  submissionEmail?: string | null;
  submissionAddress?: string | null;
  proposalType: 'TECHNICAL' | 'FINANCIAL';
  currentToRDocument?: {
    fileName: string;
    fileSizeMb?: number;
    rawMarkdown?: string;
  };
  currentProjectDocuments: string[];
  verificationStatus: ProjectVerificationStatus;
  sourceGrounding?: {
    clientConfidence: number;
    isSourceGrounded: boolean;
    matchedSnippets?: string[];
    rejectionReason?: string;
  };
}

export interface ProposalDraft {
  id: string;
  projectId: string;
  version: number;
  status: ProposalDraftStatus;
  title: string;
  clientName?: string;
  currentProjectContext?: CurrentProjectContext;
  recipient?: TorSubmissionRecipient;
  submissionNumber?: string;
  proposalReferenceYear?: string;
  sections: ProposalDraftSection[];
  overallCompletenessScore: number;
  evidenceCoverageScore: number;
  requirementCoverageScore: number;
  unsupportedClaimCount: number;
  evidenceGapCount: number;
  placeholderCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalDraftVersion {
  id: string;
  versionNumber: number;
  version: number;
  draft?: ProposalDraft;
  snapshot?: ProposalDraft;
  createdAt: string;
  createdBy?: string;
  createdByName?: string;
  notes?: string;
  changeSummary?: string;
}

/* ==========================================================================
   PHASE 7 — PROPOSAL COMPLIANCE REVIEW & DUAL-MODEL AUDIT TYPES
   ========================================================================== */

export type ComplianceStatus =
  | 'COMPLIANT'
  | 'PARTIALLY_COMPLIANT'
  | 'NON_COMPLIANT'
  | 'NOT_APPLICABLE'
  | 'REQUIRES_HUMAN_REVIEW';

export type ComplianceAuditStatus =
  | 'NOT_STARTED'
  | 'AUDITING'
  | 'ISSUES_FOUND'
  | 'READY_FOR_FINAL_REVIEW'
  | 'APPROVED'
  | 'BLOCKED';

export type ComplianceOverallResult =
  | 'PASS'
  | 'PASS_WITH_ISSUES'
  | 'BLOCKED'
  | 'REQUIRES_HUMAN_REVIEW';

export type FindingSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFORMATIONAL';

export type FindingCategory =
  | 'REQUIREMENT'
  | 'ELIGIBILITY'
  | 'EVALUATION'
  | 'EVIDENCE'
  | 'SUBMISSION'
  | 'TEAM'
  | 'EXPERIENCE'
  | 'DELIVERABLE'
  | 'TIMELINE'
  | 'CONSISTENCY'
  | 'REFERENCE_CONTAMINATION'
  | 'UNSUPPORTED_CLAIM'
  | 'PLACEHOLDER'
  | 'STRUCTURE'
  | 'CONTRACTUAL'
  | 'FINANCIAL'
  | 'ADMINISTRATIVE';

export type FindingStatus =
  | 'OPEN'
  | 'ACKNOWLEDGED'
  | 'RESOLVED'
  | 'WAIVED'
  | 'REQUIRES_HUMAN_DECISION';

export interface ComplianceFinding {
  id: string;
  auditId: string;
  severity: FindingSeverity;
  category: FindingCategory;
  title: string;
  description: string;
  requirementId?: string;
  evaluationCriterionId?: string;
  proposalSectionId?: string;
  contentBlockId?: string;
  sourceFile?: string;
  sourcePage?: number;
  sourceSection?: string;
  sourceClause?: string;
  sourceQuote?: string;
  currentProposalResponse?: string;
  expectedResponse?: string;
  evidenceIds?: string[];
  recommendedAction: string;
  status: FindingStatus;
  reviewerNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequirementComplianceRecord {
  id: string;
  auditId: string;
  requirementId: string;
  status: ComplianceStatus;
  mandatory: boolean;
  requirementCategory: string;
  sourceFile: string;
  sourcePage?: number;
  sourceSection?: string;
  sourceClause?: string;
  sourceQuote?: string;
  proposalSectionIds: string[];
  contentBlockIds: string[];
  responseFound: boolean;
  responseAdequacy: 'FULL' | 'PARTIAL' | 'INSUFFICIENT' | 'NONE';
  evidenceRequired: boolean;
  evidenceAvailable: boolean;
  evidenceVerified: boolean;
  evaluationRelevant: boolean;
  factualClaimsCount: number;
  unsupportedClaimsCount: number;
  findings: string[];
  auditorRationale: string;
  reviewerOverride?: ComplianceStatus;
  reviewerNote?: string;
}

export interface EvaluationAuditRecord {
  id: string;
  auditId: string;
  criterionId: string;
  criterionText: string;
  sourceFile?: string;
  sourcePage?: number;
  sourceSection?: string;
  sourceClause?: string;
  weighting?: number;
  mappedProposalSectionIds: string[];
  responseFound: boolean;
  responseAdequacy: 'STRONG' | 'ADEQUATE' | 'WEAK' | 'MISSING';
  evidenceIds: string[];
  evaluatorQuestion: string;
  strengths: string[];
  weaknesses: string[];
  recommendedImprovement?: string;
  scoreRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'COMPLIANT' | 'PARTIAL' | 'MISSING' | 'REQUIRES_HUMAN_REVIEW';
}

export interface SubmissionAuditRecord {
  id: string;
  auditId: string;
  submissionItemId?: string;
  category:
    | 'FORMAT'
    | 'DEADLINE'
    | 'DELIVERY_METHOD'
    | 'DOCUMENT'
    | 'FORM'
    | 'CERTIFICATE'
    | 'SIGNATURE'
    | 'ENVELOPE'
    | 'COPY'
    | 'FILE'
    | 'ANNEX'
    | 'VALIDITY'
    | 'OTHER';
  requirementText: string;
  mandatory: boolean;
  proposalOrPackageLocation?: string;
  status: 'READY' | 'MISSING' | 'PARTIAL' | 'NOT_APPLICABLE' | 'REQUIRES_HUMAN_REVIEW';
  evidenceIds?: string[];
  findingId?: string;
  notes?: string;
}

export interface ConsistencyFinding {
  id: string;
  auditId: string;
  entityType:
    | 'CLIENT'
    | 'TEAM_MEMBER'
    | 'ROLE'
    | 'QUALIFICATION'
    | 'PQE'
    | 'DATE'
    | 'DURATION'
    | 'DELIVERABLE'
    | 'MILESTONE'
    | 'EXPERIENCE'
    | 'PROJECT_VALUE'
    | 'METHODOLOGY'
    | 'OTHER';
  canonicalValue?: string;
  conflictingValues: {
    value: string;
    sectionId: string;
    blockId?: string;
  }[];
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  recommendedAction: string;
  status: 'OPEN' | 'RESOLVED' | 'REQUIRES_HUMAN_REVIEW';
}

export interface ProposalComplianceReadiness {
  overallResult: 'READY_FOR_DOCX' | 'READY_WITH_REVIEW_ITEMS' | 'BLOCKED';
  readinessScore: number;
  hardBlockers: string[];
  openCriticalFindings: number;
  openMajorFindings: number;
  openMinorFindings: number;
  mandatoryRequirementsReady: boolean;
  evaluationCriteriaReady: boolean;
  evidenceIntegrityReady: boolean;
  submissionControlsReady: boolean;
  consistencyReady: boolean;
  structureReady: boolean;
  humanReviewRequired: boolean;
  generatedAt: string;
}

export interface ComplianceAudit {
  id: string;
  projectId: string;
  proposalDraftId: string;
  version: number;
  status: ComplianceAuditStatus;
  overallResult: ComplianceOverallResult;
  overallComplianceScore: number;
  mandatoryComplianceScore: number;
  evaluationAlignmentScore: number;
  evidenceIntegrityScore: number;
  submissionReadinessScore: number;
  consistencyScore: number;
  structuralReadinessScore: number;
  totalRequirements: number;
  compliantRequirements: number;
  partialRequirements: number;
  nonCompliantRequirements: number;
  notApplicableRequirements: number;
  humanReviewRequirements: number;
  criticalFindingCount: number;
  majorFindingCount: number;
  minorFindingCount: number;
  unsupportedClaimCount: number;
  conflictingEvidenceCount: number;
  expiredEvidenceCount: number;
  placeholderCount: number;
  evaluationCriterionCount: number;
  evaluationCriteriaCovered: number;
  submissionItemCount: number;
  submissionItemsReady: number;
  createdAt: string;
  updatedAt: string;
}

/* ==========================================================================
   PHASE 8 — NATIVE DOCX GENERATION TYPES
   ========================================================================== */

export type DocxGenerationStatus = 'SUCCESS' | 'FAILED' | 'BLOCKED';

export interface DocxArtifactMetadata {
  id: string;
  projectId: string;
  draftId: string;
  auditId: string;
  version: number;
  fileName: string;
  fileSizeBytes: number;
  generatedAt: string;
  generationStatus: DocxGenerationStatus;
  appliedHouseStyleProfileId: string;
  gateCheckResult: 'PASSED' | 'BLOCKED';
  blockers?: string[];
  base64Data?: string;
  filePath?: string;
  integrityStatus?: 'PASS' | 'FAIL';
  sourceSectionsCount?: number;
  sourceContentBlocksCount?: number;
  sourceTablesCount?: number;
  sourcePlaceholdersCount?: number;
  generatedHeadingsCount?: number;
  generatedTablesCount?: number;
  generatedPlaceholdersCount?: number;
  extractedTextLength?: number;
}

/* ==========================================================================
   PHASE 9 — DOCX VISUAL QA & RENDERING VALIDATION TYPES
   ========================================================================== */

export type VisualQaStatus =
  | 'RUNNING'
  | 'PASSED'
  | 'PASSED_WITH_ISSUES'
  | 'BLOCKED'
  | 'REQUIRES_HUMAN_REVIEW'
  | 'RENDERING_UNAVAILABLE';

export type VisualQaFindingCategory =
  | 'PAGE'
  | 'LAYOUT'
  | 'HEADING'
  | 'TABLE'
  | 'HEADER_FOOTER'
  | 'TYPOGRAPHY'
  | 'COLOR'
  | 'PLACEHOLDER'
  | 'STRUCTURE';

export type VisualQaFindingSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFORMATIONAL';

export type VisualQaFindingStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'WAIVED';

export interface VisualQaFinding {
  id: string;
  pageNumber: number;
  severity: VisualQaFindingSeverity;
  category: VisualQaFindingCategory;
  title: string;
  description: string;
  confidence: number;
  status: VisualQaFindingStatus;
  reviewerNote?: string;
  isDeterministic: boolean;
  details?: Record<string, any>;
}

export interface VisualQaReport {
  id: string;
  projectId: string;
  docxArtifactId: string;
  version: number;
  status: VisualQaStatus;
  pageCount: number;
  criticalIssueCount: number;
  majorIssueCount: number;
  minorIssueCount: number;
  informationalIssueCount: number;
  findings: VisualQaFinding[];
  appliedHouseStyleProfileId: string;
  isRendererAvailable: boolean;
  rendererNotes?: string;
  isStale: boolean;
  createdAt: string;
  updatedAt: string;
}

