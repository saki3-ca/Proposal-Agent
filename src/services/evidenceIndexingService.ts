import {
  EvidenceRecord,
  EvidenceCategory,
  EvidenceType,
  EvidenceVerificationStatus,
  ProjectDocument,
  CompanyExperience,
  Expert
} from '../types';
import { MOCK_COMPANY_EXPERIENCE, MOCK_EXPERTS } from './mockData';

const INDEX_STORAGE_KEY = 'acnabin_evidence_index_records';

export class EvidenceIndexingService {
  /**
   * Main entry point to build or refresh the Evidence Index from Document Library and Project Documents.
   */
  static buildEvidenceIndex(
    documents: ProjectDocument[] = [],
    companyExperiences: CompanyExperience[] = MOCK_COMPANY_EXPERIENCE,
    experts: Expert[] = MOCK_EXPERTS
  ): EvidenceRecord[] {
    const records: EvidenceRecord[] = [];

    // 1. Index Company Experience Records (Verified Firm Experience)
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

    // 2. Index Expert CVs
    experts.forEach((exp, idx) => {
      const rec: EvidenceRecord = {
        id: `ev-cv-${exp.id}`,
        documentId: `doc-cv-${exp.id}`,
        category: 'CV',
        title: `CV — ${exp.name} (${exp.designation})`,
        sourceFile: exp.cvDocumentUrl || `${exp.name.replace(/\s+/g, '_')}_CV.pdf`,
        sourcePage: 1,
        sourceSection: 'Curriculum Vitae',
        sourceQuote: `${exp.name}, ${exp.designation}. Education: ${exp.education}. PQE Years: ${exp.yearsExperience}. Certifications: ${exp.certifications.join(', ')}.`,
        evidenceType: 'CV',
        extractedFacts: [
          { id: `fc-1-${idx}`, field: 'ROLE', value: exp.role, sourceQuote: exp.role, confidence: 1.0 },
          { id: `fc-2-${idx}`, field: 'YEARS_EXPERIENCE', value: `${exp.yearsExperience} years`, sourceQuote: `${exp.yearsExperience} yrs`, confidence: 1.0 },
          { id: `fc-3-${idx}`, field: 'QUALIFICATION', value: exp.education, sourceQuote: exp.education, confidence: 1.0 },
          { id: `fc-4-${idx}`, field: 'CERTIFICATION', value: exp.certifications.join(', '), sourceQuote: exp.certifications.join(', '), confidence: 1.0 }
        ],
        validity: { isExpired: false, confidence: 1.0 },
        relevanceScore: 0.95,
        confidenceScore: 0.98,
        verificationStatus: exp.verificationStatus === 'Verified' ? 'VERIFIED' : 'CANDIDATE',
        indexedAt: new Date().toISOString()
      };
      records.push(rec);
    });

    // 3. Index Standard Legal & Firm Credentials
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

    // 4. Index Project Documents if provided
    documents.forEach((doc, idx) => {
      if (doc.markdownContent && !records.some(r => r.documentId === doc.id)) {
        const cat: EvidenceCategory = doc.fileName.toLowerCase().includes('proposal') ? 'PREVIOUS_PROPOSAL' : 'OTHER';
        const rec: EvidenceRecord = {
          id: `ev-doc-${doc.id}`,
          documentId: doc.id,
          category: cat,
          title: doc.fileName,
          sourceFile: doc.fileName,
          sourcePage: 1,
          sourceSection: 'Extracted Document',
          sourceQuote: doc.markdownContent.substring(0, 300),
          evidenceType: 'OTHER',
          extractedFacts: [],
          validity: { isExpired: false, confidence: 0.9 },
          relevanceScore: 0.85,
          confidenceScore: doc.aiConfidence || 0.9,
          verificationStatus: 'CANDIDATE',
          indexedAt: new Date().toISOString()
        };
        records.push(rec);
      }
    });

    // Save index
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
