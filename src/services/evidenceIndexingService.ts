import {
  EvidenceRecord,
  EvidenceCategory,
  EvidenceType,
  EvidenceVerificationStatus,
  ProjectDocument,
  CompanyExperience,
  Expert
} from '../types';
import { REAL_TEST_DATA_DOCUMENTS, LibraryDocumentItem } from './documentLibraryData';

const INDEX_STORAGE_KEY = 'acnabin_evidence_index_records';
const LIBRARY_STORAGE_KEY = 'acnabin_document_library_docs';

export const DEFAULT_ACNABIN_EXPERTS: Expert[] = [
  {
    id: 'exp-aminul-hoque',
    name: 'Muhammad Aminul Hoque, FCA',
    role: 'Senior Partner & Engagement Lead',
    designation: 'Senior Partner (Audit & Financial Assurance)',
    yearsExperience: 25,
    education: 'M.Com in Accounting (University of Dhaka), Fellow Chartered Accountant (ICAB)',
    certifications: ['FCA (ICAB)', 'ISQM 1 Quality Assurance', 'Forensic & Anti-Fraud Audit Specialist'],
    relevantAssignmentsCount: 45,
    verificationStatus: 'Verified',
    skills: ['Statutory Audit', 'Forensic Investigation', 'Anti-Fraud Audit', 'Governance Advisory'],
    sectorExperience: ['Energy', 'Manufacturing', 'Financial Institutions', 'Development Sector'],
    cvDocumentUrl: 'Muhammad_Aminul_Hoque_FCA_CV.pdf'
  },
  {
    id: 'exp-km-alam',
    name: 'K. M. Alam, FCA',
    role: 'Lead Audit Partner & QA Reviewer',
    designation: 'Senior Partner (Forensic Investigation & Governance)',
    yearsExperience: 30,
    education: 'B.Com (Hons), M.Com in Accounting, Fellow Chartered Accountant (ICAB)',
    certifications: ['FCA (ICAB)', 'Senior Quality Review Partner', 'ISA / IFRS Master Trainer'],
    relevantAssignmentsCount: 60,
    verificationStatus: 'Verified',
    skills: ['Quality Assurance', 'ISQM 1', 'Financial Audit', 'Risk Management'],
    sectorExperience: ['Banking', 'Utilities', 'NGOs', 'Public Sector'],
    cvDocumentUrl: 'KM_Alam_FCA_CV.pdf'
  },
  {
    id: 'exp-mostakin',
    name: 'Mostakin Ahmed, FCA, CISA',
    role: 'Director Advisory & Forensic Lead',
    designation: 'Director (Risk Advisory, IT Audit & Fraud Risk)',
    yearsExperience: 14,
    education: 'BBA & MBA in Accounting & Information Systems (University of Dhaka)',
    certifications: ['FCA (ICAB)', 'Certified Information Systems Auditor (CISA)', 'Certified Internal Auditor (CIA)'],
    relevantAssignmentsCount: 28,
    verificationStatus: 'Verified',
    skills: ['IT Audit', 'Forensic Data Analytics', 'Fraud Risk Assessment', 'Internal Controls'],
    sectorExperience: ['Technology', 'Financial Services', 'Development Partners'],
    cvDocumentUrl: 'Mostakin_Ahmed_FCA_CISA_CV.pdf'
  },
  {
    id: 'exp-audit-team',
    name: 'ACNABIN Qualified Audit & Field Investigation Team',
    role: 'Key Personnel / Senior Audit Team',
    designation: 'Senior Audit Managers & Qualified Chartered Accountants',
    yearsExperience: 8,
    education: 'Chartered Accountants (ACA / FCA), Masters in Finance & Accounting',
    certifications: ['ICAB Practice Certificate', 'Anti-Fraud Audit Certification', 'Donor Compliance Assurance'],
    relevantAssignmentsCount: 35,
    verificationStatus: 'Verified',
    skills: ['Vouching & Verification', 'Procurement Audit', 'Fund Flow Tracing', 'Field Investigation'],
    sectorExperience: ['Donor-Funded Projects', 'Grant Verification', 'NGOs'],
    cvDocumentUrl: 'ACNABIN_Key_Experts_Profiles_and_CVs.txt'
  }
];

export const DEFAULT_ACNABIN_EXPERIENCES: CompanyExperience[] = [
  {
    id: 'exp-titas-gas',
    client: 'Titas Gas Transmission & Distribution Co. Ltd.',
    assignmentTitle: 'Special Financial & Compliance Audit of Gas Operations',
    contractValue: 'BDT 4,500,000',
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    sector: 'Energy & Utilities',
    assignmentType: 'Special Financial Audit',
    role: 'Lead Auditor & Independent Consultant',
    country: 'Bangladesh',
    scope: 'Conducted in-depth financial verification, asset quality inspection, and statutory compliance audit.',
    verificationStatus: 'Verified',
    evidenceDocument: 'Acceptance of Appointment- Titas Gas Transmission Ltd.pdf',
    evidencePage: 1
  },
  {
    id: 'exp-walton',
    client: 'Walton Hi-Tech Industries PLC',
    assignmentTitle: 'Comprehensive Internal Control Review & Special Investigation',
    contractValue: 'BDT 6,200,000',
    startDate: '2024-03-01',
    endDate: '2024-11-30',
    sector: 'Manufacturing & Commercial',
    assignmentType: 'Internal Control & Special Audit',
    role: 'Principal Advisor',
    country: 'Bangladesh',
    scope: 'Assessed governance, anti-fraud controls, inventory reconciliation, and financial reporting accuracy.',
    verificationStatus: 'Verified',
    evidenceDocument: 'Completion Certificate - Walton Hi-Tech Industries Ltd.pdf',
    evidencePage: 1
  },
  {
    id: 'exp-berger',
    client: 'Berger Paints Bangladesh Ltd.',
    assignmentTitle: 'Statutory Assurance & Tax Compliance Verification',
    contractValue: 'BDT 3,800,000',
    startDate: '2024-01-01',
    endDate: '2024-08-31',
    sector: 'Multinational Manufacturing',
    assignmentType: 'Statutory Assurance',
    role: 'Statutory Auditor',
    country: 'Bangladesh',
    scope: 'Comprehensive review of financial statements, internal governance, and statutory reporting.',
    verificationStatus: 'Verified',
    evidenceDocument: 'Appointment letter- Berger Paints Bangladesh Ltd.PDF',
    evidencePage: 1
  },
  {
    id: 'exp-gnf-audit',
    client: 'Development Partners & INGOs (Plan Int., GIZ, GNF)',
    assignmentTitle: 'Anti-Fraud Investigation, Governance & Financial Assurance Audit',
    contractValue: 'BDT 5,500,000',
    startDate: '2024-06-01',
    endDate: '2025-05-31',
    sector: 'Development & International Non-Profit',
    assignmentType: 'Anti-Fraud & Donor Grant Audit',
    role: 'Independent Audit Consultant',
    country: 'Bangladesh',
    scope: 'Conducted independent in-depth anti-fraud audit, verification of donor grant fund utilization, and internal controls assessment.',
    verificationStatus: 'Verified',
    evidenceDocument: 'Technical Proposal for Start Bangladesh Hub - Finance and Procurement Policies.pdf',
    evidencePage: 1
  }
];

export class EvidenceIndexingService {
  /**
   * Main entry point to build or refresh the Evidence Index from Document Library and Project Documents.
   */
  static buildEvidenceIndex(
    documents: ProjectDocument[] = [],
    companyExperiences: CompanyExperience[] = DEFAULT_ACNABIN_EXPERIENCES,
    experts: Expert[] = DEFAULT_ACNABIN_EXPERTS
  ): EvidenceRecord[] {
    const records: EvidenceRecord[] = [];

    // 1. Load active Document Library items from localStorage or defaults
    let libraryDocs: LibraryDocumentItem[] = REAL_TEST_DATA_DOCUMENTS;
    try {
      const rawLib = localStorage.getItem(LIBRARY_STORAGE_KEY);
      if (rawLib) {
        const parsed = JSON.parse(rawLib);
        if (Array.isArray(parsed) && parsed.length > 0) libraryDocs = parsed;
      }
    } catch (e) {
      console.warn('Failed to load library docs for evidence indexing:', e);
    }

    // 2. Index Company Experience Records (Verified Firm Experience)
    companyExperiences.forEach((exp, idx) => {
      const rec: EvidenceRecord = {
        id: `ev-exp-${exp.id}`,
        documentId: `doc-exp-${exp.id}`,
        category: 'COMPANY_EXPERIENCE',
        title: `${exp.client} — ${exp.assignmentTitle}`,
        sourceFile: exp.evidenceDocument || 'Company_Experience_Database.xlsx',
        sourcePage: exp.evidencePage || 1,
        sourceSection: exp.sector || 'Firm Assignment History',
        sourceQuote: `Assignment: ${exp.assignmentTitle}. Client: ${exp.client}. Value: ${exp.contractValue}. Completion: ${exp.endDate}. Scope: ${exp.scope}`,
        evidenceType: 'ASSIGNMENT_RECORD',
        extractedFacts: [
          { id: `f-1-${idx}`, field: 'CLIENT', value: exp.client, sourceQuote: exp.client, confidence: 1.0 },
          { id: `f-2-${idx}`, field: 'ASSIGNMENT', value: exp.assignmentTitle, sourceQuote: exp.assignmentTitle, confidence: 1.0 },
          { id: `f-3-${idx}`, field: 'VALUE', value: exp.contractValue, sourceQuote: exp.contractValue, confidence: 1.0 },
          { id: `f-4-${idx}`, field: 'DATE', value: exp.endDate, sourceQuote: exp.endDate, confidence: 1.0 },
          { id: `f-5-${idx}`, field: 'SECTOR', value: exp.sector, sourceQuote: exp.sector, confidence: 1.0 }
        ],
        validity: {
          validFrom: exp.startDate,
          validTo: exp.endDate,
          isExpired: false,
          confidence: 1.0
        },
        relevanceScore: 0.95,
        confidenceScore: 0.98,
        verificationStatus: exp.verificationStatus === 'Verified' ? 'VERIFIED' : 'CANDIDATE',
        indexedAt: new Date().toISOString(),
        contentHash: `hash-exp-${exp.id}`
      };
      records.push(rec);
    });

    // 3. Index Expert CVs (Partners & Key Personnel)
    experts.forEach((exp, idx) => {
      const rec: EvidenceRecord = {
        id: `ev-cv-${exp.id}`,
        documentId: `doc-cv-${exp.id}`,
        category: 'CV',
        title: `CV — ${exp.name} (${exp.designation})`,
        sourceFile: exp.cvDocumentUrl || `${exp.name.replace(/\s+/g, '_')}_CV.pdf`,
        sourcePage: 1,
        sourceSection: 'Curriculum Vitae & Expert Profile',
        sourceQuote: `${exp.name}, ${exp.designation}. Education: ${exp.education}. PQE Years: ${exp.yearsExperience}. Certifications: ${exp.certifications.join(', ')}. Key Competency: Anti-fraud audit, statutory governance, financial reporting.`,
        evidenceType: 'CV',
        extractedFacts: [
          { id: `fc-1-${idx}`, field: 'ROLE', value: exp.role, sourceQuote: exp.role, confidence: 1.0 },
          { id: `fc-2-${idx}`, field: 'YEARS_EXPERIENCE', value: `${exp.yearsExperience} years`, sourceQuote: `${exp.yearsExperience} yrs`, confidence: 1.0 },
          { id: `fc-3-${idx}`, field: 'QUALIFICATION', value: exp.education, sourceQuote: exp.education, confidence: 1.0 },
          { id: `fc-4-${idx}`, field: 'CERTIFICATION', value: exp.certifications.join(', '), sourceQuote: exp.certifications.join(', '), confidence: 1.0 }
        ],
        validity: { isExpired: false, confidence: 1.0 },
        relevanceScore: 0.98,
        confidenceScore: 0.98,
        verificationStatus: exp.verificationStatus === 'Verified' ? 'VERIFIED' : 'CANDIDATE',
        indexedAt: new Date().toISOString()
      };
      records.push(rec);
    });

    // 4. Index Standard Legal & Firm Credentials
    const legalCredentials = [
      { id: 'leg-icab', name: 'ICAB Firm Practice License FY 2025-26', type: 'LICENSE' as EvidenceType, file: 'ICAB_Practice_License_2025-26.pdf', validTo: '2026-06-30' },
      { id: 'leg-tax', name: 'NBR Tax Clearance Certificate AY 2024-25', type: 'TAX' as EvidenceType, file: 'NBR_Tax_Clearance_AY2024-25.pdf', validTo: '2025-12-31' },
      { id: 'leg-vat', name: 'VAT BIN Registration Certificate', type: 'VAT' as EvidenceType, file: 'VAT_BIN_Registration_ACNABIN.pdf', validTo: '2027-12-31' },
      { id: 'leg-trade', name: 'Trade License City Corporation Dhaka', type: 'TRADE_LICENSE' as EvidenceType, file: 'Trade_License_2025-26.pdf', validTo: '2026-06-30' }
    ];

    legalCredentials.forEach((leg, idx) => {
      const isExpired = new Date(leg.validTo) < new Date();
      const rec: EvidenceRecord = {
        id: `ev-${leg.id}`,
        documentId: `doc-${leg.id}`,
        category: 'LEGAL_TAX',
        title: leg.name,
        sourceFile: leg.file,
        sourcePage: 1,
        sourceSection: 'Legal & Tax Credentials',
        sourceQuote: `${leg.name}. Valid until ${leg.validTo}. Issued to ACNABIN Chartered Accountants.`,
        evidenceType: leg.type,
        extractedFacts: [
          { id: `fl-1-${idx}`, field: 'STATUS', value: isExpired ? 'Expired' : 'Active', sourceQuote: leg.validTo, confidence: 1.0 },
          { id: `fl-2-${idx}`, field: 'DATE', value: leg.validTo, sourceQuote: leg.validTo, confidence: 1.0 }
        ],
        validity: {
          validTo: leg.validTo,
          isExpired,
          validitySource: leg.file,
          confidence: 1.0
        },
        relevanceScore: 1.0,
        confidenceScore: 1.0,
        verificationStatus: isExpired ? 'EXPIRED' : 'VERIFIED',
        indexedAt: new Date().toISOString()
      };
      records.push(rec);
    });

    // 5. Index Document Library Items dynamically
    libraryDocs.forEach((libDoc) => {
      if (!records.some((r) => r.documentId === libDoc.id)) {
        let evCat: EvidenceCategory = 'OTHER';
        let evType: EvidenceType = 'OTHER';

        if (libDoc.kbCategory === 'CVs') {
          evCat = 'CV';
          evType = 'CV';
        } else if (libDoc.kbCategory === 'Company Profile') {
          evCat = 'COMPANY_PROFILE';
          evType = 'FIRM_PROFILE';
        } else if (libDoc.kbCategory === 'Company Experience') {
          evCat = 'COMPANY_EXPERIENCE';
          evType = 'ASSIGNMENT_RECORD';
        } else if (libDoc.kbCategory === 'Legal & Tax' || libDoc.kbCategory === 'Certificates & Credentials') {
          evCat = 'LEGAL_TAX';
          evType = 'LICENSE';
        } else if (libDoc.kbCategory === 'Previous Proposals') {
          evCat = 'PREVIOUS_PROPOSAL';
          evType = 'REFERENCE';
        }

        const rec: EvidenceRecord = {
          id: `ev-lib-${libDoc.id}`,
          documentId: libDoc.id,
          category: evCat,
          title: libDoc.fileName,
          sourceFile: libDoc.fileName,
          sourcePage: 1,
          sourceSection: libDoc.folderName || 'Document Library',
          sourceQuote: libDoc.markdownContent ? libDoc.markdownContent.substring(0, 400) : libDoc.description || libDoc.fileName,
          evidenceType: evType,
          extractedFacts: [
            { id: `fact-lib-1-${libDoc.id}`, field: 'SERVICE', value: libDoc.kbCategory, sourceQuote: libDoc.kbCategory, confidence: 1.0 },
            { id: `fact-lib-2-${libDoc.id}`, field: 'ASSIGNMENT', value: libDoc.fileName, sourceQuote: libDoc.fileName, confidence: 1.0 }
          ],
          validity: { isExpired: false, confidence: 1.0 },
          relevanceScore: 0.95,
          confidenceScore: libDoc.aiConfidence || 0.95,
          verificationStatus: 'VERIFIED',
          indexedAt: new Date().toISOString()
        };
        records.push(rec);
      }
    });

    // 6. Index Project Documents if provided
    documents.forEach((doc) => {
      if (doc.markdownContent && !records.some((r) => r.documentId === doc.id)) {
        const cat: EvidenceCategory = doc.fileName.toLowerCase().includes('proposal') ? 'PREVIOUS_PROPOSAL' : 'OTHER';
        const rec: EvidenceRecord = {
          id: `ev-doc-${doc.id}`,
          documentId: doc.id,
          category: cat,
          title: doc.fileName,
          sourceFile: doc.fileName,
          sourcePage: 1,
          sourceSection: 'Uploaded Project Document',
          sourceQuote: doc.markdownContent.substring(0, 400),
          evidenceType: 'OTHER',
          extractedFacts: [],
          validity: { isExpired: false, confidence: 0.95 },
          relevanceScore: 0.90,
          confidenceScore: doc.aiConfidence || 0.95,
          verificationStatus: 'VERIFIED',
          indexedAt: new Date().toISOString()
        };
        records.push(rec);
      }
    });

    // Save index to localStorage
    this.saveEvidenceIndex(records);

    return records;
  }

  /**
   * Candidate Search: Deterministic Keyword & Metadata Search across Evidence Records
   */
  static searchEvidenceCandidates(
    query: string,
    category?: EvidenceCategory,
    evidenceType?: EvidenceType
  ): EvidenceRecord[] {
    const allRecords = this.getSavedEvidenceIndex();
    if (!query && !category && !evidenceType) return allRecords;

    const qLower = (query || '').toLowerCase();

    return allRecords.filter(rec => {
      if (category && rec.category !== category) return false;
      if (evidenceType && rec.evidenceType !== evidenceType) return false;

      if (!query) return true;

      const titleMatch = rec.title.toLowerCase().includes(qLower);
      const quoteMatch = rec.sourceQuote.toLowerCase().includes(qLower);
      const factMatch = rec.extractedFacts.some(f => f.value.toLowerCase().includes(qLower));

      return titleMatch || quoteMatch || factMatch;
    });
  }

  static saveEvidenceIndex(records: EvidenceRecord[]): void {
    try {
      localStorage.setItem(INDEX_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('Failed to save Evidence Index to localStorage:', e);
    }
  }

  static getSavedEvidenceIndex(): EvidenceRecord[] {
    try {
      const raw = localStorage.getItem(INDEX_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to read Evidence Index from localStorage:', e);
    }
    return this.buildEvidenceIndex(); // Build default if none found
  }
}
