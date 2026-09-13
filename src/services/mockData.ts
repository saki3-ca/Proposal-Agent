import {
  Project,
  ProjectDocument,
  Requirement,
  Expert,
  CompanyExperience,
  ProposalStyle,
  ProposalSection,
  FinancialProposalData,
  PrescribedForm,
  PptxSlideChange,
  FinalComplianceSummary,
  SubmissionPackageData,
  AttentionItem,
  User
} from '../types';

export const DEMO_USER: User = {
  id: 'usr-sakib',
  email: 'sakib@acnabin.com',
  name: 'SAKIB',
  role: 'Proposal Manager',
  department: 'Audit & Advisory Division',
  avatarInitials: 'SK'
};

const today = new Date().toISOString().split('T')[0];

const calculateDaysLeft = (deadlineStr: string): number => {
  const d = new Date(deadlineStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
};

// Database Seeded Proposals (Migrated directly from Google Sheet dataset)
export const INITIAL_PROJECTS: Project[] = [];

export const ATTENTION_ITEMS: AttentionItem[] = [];

export const MOCK_PROJECT_DOCUMENTS: ProjectDocument[] = [];

export const MOCK_REQUIREMENTS: Requirement[] = [];

export const MOCK_EXPERTS: Expert[] = [];

export const MOCK_COMPANY_EXPERIENCE: CompanyExperience[] = [];

export const PROPOSAL_STYLES: ProposalStyle[] = [
  {
    id: 'style-1',
    name: 'Corporate',
    title: 'Traditional Corporate & Audit Style',
    description: 'Formal, structured, compliance-first presentation tailored for financial institutions and regulatory bodies.',
    tone: 'Formal, Rigorous, Authoritative',
    typicalLength: '35–45 Pages',
    visualStyle: 'Restrained corporate palette, high table density, explicit compliance citations.',
    features: ['Detailed Methodology Breakdown', 'Explicit Clause-by-Clause Compliance Table', 'Formal Audit Language'],
    isSelected: true
  },
  {
    id: 'style-2',
    name: 'Executive',
    title: 'Executive Strategic Advisory Style',
    description: 'Concise, high-level summary focused on business value, governance impact, and executive decision-making.',
    tone: 'Strategic, Direct, Executive-focused',
    typicalLength: '20–25 Pages',
    visualStyle: 'Clean typography, visual workflow diagrams, executive callout boxes.',
    features: ['1-Page Visual Executive Summary', 'Key Value Proposition Focus', 'Streamlined Work Plan'],
    isSelected: false
  },
  {
    id: 'style-3',
    name: 'Technical',
    title: 'Technical & Methodological Deep-Dive',
    description: 'Exhaustive technical documentation emphasizing ISO standards, sampling algorithms, and data verification protocols.',
    tone: 'Technical, Analytical, Evidence-heavy',
    typicalLength: '50+ Pages',
    visualStyle: 'Dense analytical matrices, mathematical formulas, detailed annexures.',
    features: ['Sampling & Testing Protocols', 'Detailed Data Flow Architecture', 'Comprehensive ISO Reference Index'],
    isSelected: false
  }
];

export const MOCK_PROPOSAL_SECTIONS: ProposalSection[] = [];

export const MOCK_FINANCIAL_PROPOSAL: FinancialProposalData = {
  projectId: '',
  currency: 'BDT',
  items: [],
  subtotal: 0,
  vatRate: 0.15,
  vatAmount: 0,
  grandTotal: 0,
  narrativeAssumption: 'Note: Professional fees are quoted exclusive of statutory VAT. Standard 15% VAT will be invoiced in accordance with the Value Added Tax Act.',
  milestones: [],
  isApproved: false
};

export const MOCK_PRESCRIBED_FORMS: PrescribedForm[] = [];

export const MOCK_PPTX_CHANGES: PptxSlideChange[] = [];

export const MOCK_COMPLIANCE_SUMMARY: FinalComplianceSummary = {
  projectId: '',
  overallScorePercentage: 0,
  satisfiedCount: 0,
  reviewRequiredCount: 0,
  missingCount: 0,
  mandatoryUnresolvedCount: 0,
  readinessStatus: 'REVIEW_REQUIRED',
  categoryScores: {
    eligibility: 0,
    technical: 0,
    financial: 0,
    administrative: 0,
    prescribedForms: 0
  },
  overrides: []
};

export const MOCK_SUBMISSION_PACKAGE: SubmissionPackageData = {
  projectId: '',
  clientName: '',
  assignmentName: '',
  zipFilename: 'Proposal_Submission.zip',
  totalFiles: 0,
  totalSizeMb: 0,
  isGenerated: false,
  checklist: [],
  folderStructure: []
};
