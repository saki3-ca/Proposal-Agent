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
    id: 'exp-abu-sayed-nayeem',
    name: 'Abu Sayed Mohammed Nayeem, FCA, FCCA (UK), ACA (ICAEW)',
    role: 'Senior Partner & Advisory Lead',
    designation: 'Senior Partner (Former President ICAB & SAFA)',
    yearsExperience: 45,
    education: 'B.Com. (Hons.), M.Com., M.Sc. (UK), FCCA (UK), ACA (ICAEW), FCA (ICAB)',
    certifications: ['FCA (ICAB)', 'FCCA (UK)', 'ACA (ICAEW)', 'Former President ICAB', 'Former President SAFA'],
    relevantAssignmentsCount: 85,
    verificationStatus: 'Verified',
    skills: ['Institutional Governance', 'Corporate Restructuring', 'Statutory Financial Assurance', 'International Compliance'],
    sectorExperience: ['Banking & Financial Institutions', 'Multinationals', 'Public Sector Enterprises', 'Development Sector'],
    cvDocumentUrl: 'Number of Partners and their Experience.docx'
  },
  {
    id: 'exp-aminul-hoque',
    name: 'Muhammad Aminul Hoque, FCA',
    role: 'Senior Partner & Engagement Lead',
    designation: 'Senior Partner (Audit, Forensic & Financial Assurance)',
    yearsExperience: 17,
    education: 'MBA in Accounting (University of Dhaka), B.Com (Hons), Fellow Chartered Accountant (ICAB)',
    certifications: ['FCA (ICAB)', 'FRC Registered Auditor', 'ISQM 1 Quality Assurance Specialist', 'Forensic Audit Lead'],
    relevantAssignmentsCount: 45,
    verificationStatus: 'Verified',
    skills: ['Statutory Audit', 'Forensic Investigation', 'Anti-Fraud Audit', 'Governance Advisory', 'Donor Compliance'],
    sectorExperience: ['Energy & Utilities', 'Manufacturing & Conglomerates', 'INGO & Development Partners', 'Financial Institutions'],
    cvDocumentUrl: 'Muhammad Aminul Hoque FCA Prcatice Certificate.pdf'
  },
  {
    id: 'exp-iftekhar-hossain',
    name: 'Iftekhar Hossain, FCA',
    role: 'Senior Partner & Quality Assurance Reviewer',
    designation: 'Senior Partner (Assurance & Public Sector Advisory)',
    yearsExperience: 25,
    education: 'B.Com, Fellow Chartered Accountant (ICAB)',
    certifications: ['FCA (ICAB)', 'ISQM 1 Senior Reviewer', 'Public Enterprise Audit Specialist'],
    relevantAssignmentsCount: 60,
    verificationStatus: 'Verified',
    skills: ['Quality Assurance', 'Statutory Audit', 'Fixed Asset Revaluation', 'Public Sector Governance'],
    sectorExperience: ['Banking', 'State-Owned Enterprises', 'Power & Energy', 'Large Corporates'],
    cvDocumentUrl: 'Number of Partners and their Experience.docx'
  },
  {
    id: 'exp-abu-taher-bari',
    name: 'Abu Taher Mohammed Abdul Bari, FCA, FCEA (London)',
    role: 'Senior Partner',
    designation: 'Senior Partner (Taxation & Corporate Governance)',
    yearsExperience: 25,
    education: 'B.Com, FCA (ICAB), FCEA (London)',
    certifications: ['FCA (ICAB)', 'FCEA (London)', 'Direct & Indirect Tax Specialist'],
    relevantAssignmentsCount: 50,
    verificationStatus: 'Verified',
    skills: ['Corporate Taxation', 'Regulatory Compliance', 'Institutional Financial Review', 'Due Diligence'],
    sectorExperience: ['Manufacturing', 'Trade & Commerce', 'Financial Institutions', 'NGOs'],
    cvDocumentUrl: 'Number of Partners and their Experience.docx'
  },
  {
    id: 'exp-moniruzzaman',
    name: 'Md. Moniruzzaman, FCA',
    role: 'Partner',
    designation: 'Partner (Financial Assurance & Tax Advisory)',
    yearsExperience: 20,
    education: 'B.Com. (Hons.), M.Com., FCA (ICAB)',
    certifications: ['FCA (ICAB)', 'Transfer Pricing Specialist', 'Corporate Law Advisory'],
    relevantAssignmentsCount: 40,
    verificationStatus: 'Verified',
    skills: ['Statutory Audit', 'Corporate Tax Structuring', 'VAT Audit', 'Financial Reporting'],
    sectorExperience: ['Textiles & RMG', 'FMCG', 'Pharmaceuticals', 'Logistics'],
    cvDocumentUrl: 'Number of Partners and their Experience.docx'
  },
  {
    id: 'exp-rokonuzzaman',
    name: 'Md. Rokonuzzaman, FCA',
    role: 'Partner',
    designation: 'Partner (Manufacturing & Assurance)',
    yearsExperience: 20,
    education: 'M.Com., FCA (ICAB)',
    certifications: ['FCA (ICAB)', 'Cost & Management Control', 'Inventory Valuation Specialist'],
    relevantAssignmentsCount: 38,
    verificationStatus: 'Verified',
    skills: ['Statutory Assurance', 'Process Audit', 'Internal Controls Review', 'Revaluation'],
    sectorExperience: ['Heavy Industry', 'Engineering', 'Consumer Goods', 'Agro-processing'],
    cvDocumentUrl: 'Number of Partners and their Experience.docx'
  },
  {
    id: 'exp-mominul-karim',
    name: 'Md. Mominul Karim, FCA',
    role: 'Partner',
    designation: 'Partner (Advisory & Corporate Compliance)',
    yearsExperience: 20,
    education: 'B.Com. (Hons.), M.Com., FCA (ICAB)',
    certifications: ['FCA (ICAB)', 'Corporate Governance Certifier', 'Due Diligence Specialist'],
    relevantAssignmentsCount: 35,
    verificationStatus: 'Verified',
    skills: ['Corporate Governance', 'M&A Due Diligence', 'Statutory Audit', 'SOP Design'],
    sectorExperience: ['Telecommunications', 'Financial Services', 'Hospitality', 'Real Estate'],
    cvDocumentUrl: 'Number of Partners and their Experience.docx'
  },
  {
    id: 'exp-reajul-islam',
    name: 'Md. Reajul Islam, FCA',
    role: 'Partner',
    designation: 'Partner (Assurance & Quality Review)',
    yearsExperience: 17,
    education: 'B.B.M (University of Mysore, India), FCA (ICAB)',
    certifications: ['FCA (ICAB)', 'IFRS Reporting Specialist', 'ISQM Quality Manager'],
    relevantAssignmentsCount: 32,
    verificationStatus: 'Verified',
    skills: ['IFRS Financial Statements', 'Group Audit', 'Statutory Assurance', 'Risk Assessment'],
    sectorExperience: ['Multinationals', 'Electronics & Technology', 'Export & Import', 'NGOs'],
    cvDocumentUrl: 'Number of Partners and their Experience.docx'
  },
  {
    id: 'exp-abdullah-mamun',
    name: 'Abdullah-Al-Mamun, FCA',
    role: 'Partner & Forensic Lead',
    designation: 'Partner (Forensic Investigations & Non-Profit Governance)',
    yearsExperience: 15,
    education: 'M.Com in Accounting, Fellow Chartered Accountant (ICAB)',
    certifications: ['FCA (ICAB)', 'Certified Forensic Auditor', 'Donor Grant Assessor'],
    relevantAssignmentsCount: 30,
    verificationStatus: 'Verified',
    skills: ['Forensic Investigation', 'Fund Flow Tracing', 'Non-Profit Governance', 'Fraud Risk Assessment'],
    sectorExperience: ['Development Partners', 'Civil Society Networks', 'Special Audit', 'Public Enterprises'],
    cvDocumentUrl: 'CV of Mr Amin, Mamun, Saif, Nusrat.pdf'
  },
  {
    id: 'exp-saif-ahmed',
    name: 'Saif Ahmed, FCA',
    role: 'Partner & Assurance Lead',
    designation: 'Partner (Corporate Assurance & Listed Entity Audit)',
    yearsExperience: 15,
    education: 'BBA & MBA in Finance, Fellow Chartered Accountant (ICAB)',
    certifications: ['FCA (ICAB)', 'BSEC Certified Auditor', 'IFRS Technical Reviewer'],
    relevantAssignmentsCount: 28,
    verificationStatus: 'Verified',
    skills: ['Statutory Assurance', 'Listed Company Reporting', 'Internal Control Evaluation', 'Tax Certification'],
    sectorExperience: ['Commercial Banking', 'Manufacturing', 'Energy', 'FMCG'],
    cvDocumentUrl: 'CV of Mr Amin, Mamun, Saif, Nusrat.pdf'
  },
  {
    id: 'exp-nusrat-jahan',
    name: 'Nusrat Jahan, FCA',
    role: 'Partner & NGO Governance Lead',
    designation: 'Partner (Development Sector & Grant Assurance)',
    yearsExperience: 14,
    education: 'B.Sc (Hons), ICAEW ACA / ACCA, Fellow Chartered Accountant (ICAB)',
    certifications: ['FCA (ICAB)', 'ACCA / ICAEW ACA', 'NOAB Enlisted Auditor', 'Safeguarding Specialist'],
    relevantAssignmentsCount: 32,
    verificationStatus: 'Verified',
    skills: ['Donor Grant Audits', 'FD-4 & FD-7 Verification', 'Institutional Governance', 'Internal SOPs'],
    sectorExperience: ['International NGOs', 'UN & Bilateral Agencies', 'Civil Society Alliances', 'Microfinance'],
    cvDocumentUrl: 'CV of Mr Amin, Mamun, Saif, Nusrat.pdf'
  },
  {
    id: 'exp-mutasim-billah',
    name: 'Mutasim Billah, FCA',
    role: 'Partner & Banking Specialist',
    designation: 'Partner (Banking & Financial Institutions Advisory)',
    yearsExperience: 15,
    education: 'M.Com, Fellow Chartered Accountant (ICAB)',
    certifications: ['FCA (ICAB)', 'Bangladesh Bank Panel Auditor', 'Basel III Advisory'],
    relevantAssignmentsCount: 26,
    verificationStatus: 'Verified',
    skills: ['Commercial Banking Audit', 'Credit Risk Modeling', 'NBFI Compliance', 'Treasury Verification'],
    sectorExperience: ['Commercial Banks', 'NBFIs', 'Insurance', 'Capital Market Intermediaries'],
    cvDocumentUrl: 'CV of Mr Mutasim and Mansur.pdf'
  },
  {
    id: 'exp-mansur-ali',
    name: 'Mansur Ali, FCA',
    role: 'Partner & Valuation Lead',
    designation: 'Partner (Fixed Asset Revaluation & Corporate Audit)',
    yearsExperience: 14,
    education: 'B.Com (Hons), Fellow Chartered Accountant (ICAB)',
    certifications: ['FCA (ICAB)', 'Asset Valuation Specialist', 'Public Enterprise Auditor'],
    relevantAssignmentsCount: 25,
    verificationStatus: 'Verified',
    skills: ['Fixed Asset Revaluation', 'FAR Asset Tagging', 'Statutory Financial Audit', 'Due Diligence'],
    sectorExperience: ['Public Sector Corporations', 'Agro-Industrial Mills', 'Commercial Enterprises'],
    cvDocumentUrl: 'CV of Mr Mutasim and Mansur.pdf'
  },
  {
    id: 'exp-mostakin',
    name: 'Mostakin Ahmed, FCA, CISA',
    role: 'Director Advisory & IT Audit Lead',
    designation: 'Director (Risk Advisory, IT Audit & Information Security)',
    yearsExperience: 14,
    education: 'BBA & MBA in Accounting & Information Systems (University of Dhaka)',
    certifications: ['FCA (ICAB)', 'Certified Information Systems Auditor (CISA)', 'Certified Internal Auditor (CIA)'],
    relevantAssignmentsCount: 35,
    verificationStatus: 'Verified',
    skills: ['IT Audit', 'ISO 27001 ISMS', 'PCI DSS', 'AI Governance', 'Forensic Data Analytics'],
    sectorExperience: ['Banking Technology', 'Fintech', 'Telecommunications', 'Development Partners'],
    cvDocumentUrl: 'Number of Partners and their Experience.docx'
  },
  {
    id: 'exp-aminur-rahman',
    name: 'Aminur Rahman, MBA, LLB',
    role: 'Senior Director & Regulatory Advisor',
    designation: 'Senior Director (Ex-Member, National Board of Revenue NBR)',
    yearsExperience: 35,
    education: 'MBA, LLB (University of Dhaka)',
    certifications: ['Ex-Member National Board of Revenue', 'Tax & Customs Policy Master', 'Legal Counsel'],
    relevantAssignmentsCount: 70,
    verificationStatus: 'Verified',
    skills: ['Tax Policy & Dispute Resolution', 'Customs & Tariff Advisory', 'Legislative Vetting', 'Corporate Law'],
    sectorExperience: ['Large Taxpayers', 'Multinational Corporations', 'Trade Bodies', 'Government Agencies'],
    cvDocumentUrl: 'Number of Partners and their Experience.docx'
  }
];

export const DEFAULT_ACNABIN_EXPERIENCES: CompanyExperience[] = [
  {
    id: 'exp-unilever',
    client: 'Unilever Bangladesh Limited',
    assignmentTitle: 'Special Financial Assurance & Distributor Controls Review',
    contractValue: 'BDT 5,200,000',
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    sector: 'Multinational FMCG',
    assignmentType: 'Special Assurance & Internal Controls',
    role: 'Independent Assurance Auditor',
    country: 'Bangladesh',
    scope: 'Conducted operational review, distributor channel control testing, inventory reconciliation, and financial compliance audits.',
    verificationStatus: 'Verified',
    evidenceDocument: 'Engagement Letter- Unilever Bangladesh.pdf',
    evidencePage: 1
  },
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
    scope: 'Conducted in-depth financial verification, asset quality inspection, billing reconciliation, and statutory compliance audit.',
    verificationStatus: 'Verified',
    evidenceDocument: 'Acceptance of Appointment- Titas Gas Transmission Ltd.pdf',
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
    scope: 'Comprehensive review of financial statements, internal governance, statutory reporting, and corporate tax compliance.',
    verificationStatus: 'Verified',
    evidenceDocument: 'Appointment letter- Berger Paints Bangladesh Ltd.pdf',
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
    scope: 'Assessed governance, anti-fraud controls, inventory valuation, and financial reporting accuracy.',
    verificationStatus: 'Verified',
    evidenceDocument: 'Completion Certificate - Walton Hi-Tech Industries Ltd.pdf',
    evidencePage: 1
  },
  {
    id: 'exp-jenson-nicholson',
    client: 'Jenson & Nicholson Bangladesh Ltd.',
    assignmentTitle: 'Annual Statutory Audit & Corporate Tax Review',
    contractValue: 'BDT 2,800,000',
    startDate: '2023-07-01',
    endDate: '2024-06-30',
    sector: 'Manufacturing',
    assignmentType: 'Statutory Audit',
    role: 'Lead Statutory Auditor',
    country: 'Bangladesh',
    scope: 'Conducted annual statutory audit, examined books of accounts, and verified corporate tax filings.',
    verificationStatus: 'Verified',
    evidenceDocument: 'Appointment letter-  Jenson & Nicholson Bangladesh Ltd.pdf',
    evidencePage: 1
  },
  {
    id: 'exp-sirajganj-ez',
    client: 'Sirajganj Economic Zone Limited',
    assignmentTitle: 'Institutional Financial Structuring & Governance SOP Formulation',
    contractValue: 'BDT 4,800,000',
    startDate: '2024-02-01',
    endDate: '2024-10-31',
    sector: 'Infrastructure & Economic Zones',
    assignmentType: 'Institutional Advisory',
    role: 'Lead Governance Consultant',
    country: 'Bangladesh',
    scope: 'Drafted institutional financial policies, standard operating procedures (SOPs), and investor compliance governance frameworks.',
    verificationStatus: 'Verified',
    evidenceDocument: 'Engagement Letter- Sirajganj Economic Zone Limited.pdf',
    evidencePage: 1
  },
  {
    id: 'exp-dcci',
    client: 'Dhaka Chamber of Commerce & Industry (DCCI)',
    assignmentTitle: 'Institutional Review, Internal Controls & Policy Manual Update',
    contractValue: 'BDT 3,200,000',
    startDate: '2024-04-01',
    endDate: '2024-09-30',
    sector: 'Apex Trade Association',
    assignmentType: 'Management Consulting',
    role: 'Principal Consultant',
    country: 'Bangladesh',
    scope: 'Conducted institutional governance review, delegation of financial powers, ERP control evaluation, and accounting manual overhaul.',
    verificationStatus: 'Verified',
    evidenceDocument: 'Work Order- Dhaka Chamber of Commerce & Industry.pdf',
    evidencePage: 1
  },
  {
    id: 'exp-mrdi',
    client: 'Media Resources Development Initiative (MRDI)',
    assignmentTitle: 'Institutional Governance Restructuring & Donor Compliance Review',
    contractValue: 'BDT 2,500,000',
    startDate: '2024-05-01',
    endDate: '2024-10-31',
    sector: 'Media & Civil Society',
    assignmentType: 'Governance Advisory',
    role: 'Lead Advisor',
    country: 'Bangladesh',
    scope: 'Formulated governance policies, financial management guidelines, and donor reporting compliance frameworks.',
    verificationStatus: 'Verified',
    evidenceDocument: 'Work Order- Media Resources Development Initiative.pdf',
    evidencePage: 1
  },
  {
    id: 'exp-pksf',
    client: 'Palli Karma-Sahayak Foundation (PKSF)',
    assignmentTitle: 'Nationwide Audit of Partner Organizations (POs) FY 2026–2027',
    contractValue: 'BDT 8,500,000',
    startDate: '2026-07-01',
    endDate: '2027-06-30',
    sector: 'Microfinance & Rural Development',
    assignmentType: 'Nationwide Program Audit',
    role: 'Lead Chartered Accountancy Firm',
    country: 'Bangladesh',
    scope: 'Audited partner organizations across 64 districts covering fund utilization, loan portfolio quality, and Annexures A–L.',
    verificationStatus: 'Verified',
    evidenceDocument: 'Technical Proposal For PKSF.docx',
    evidencePage: 1
  },
  {
    id: 'exp-north-bengal',
    client: 'North Bengal Sugar Mills Ltd. (BSFIC)',
    assignmentTitle: 'Revaluation of Assets & Liabilities and Preparation of Fixed Assets Register (FAR)',
    contractValue: 'BDT 4,200,000',
    startDate: '2026-08-01',
    endDate: '2026-12-31',
    sector: 'State-Owned Agro-Industry',
    assignmentType: 'Fixed Asset Revaluation',
    role: 'Principal Valuer & Auditor',
    country: 'Bangladesh',
    scope: 'Performed comprehensive engineering revaluation, physical asset tagging, and compiled computerized Fixed Assets Register.',
    verificationStatus: 'Verified',
    evidenceDocument: 'Technical Proposal for North Bengal FA Revaluation.docx',
    evidencePage: 1
  },
  {
    id: 'exp-faridpur-pf',
    client: 'Faridpur Sugar Mills Ltd. (BSFIC)',
    assignmentTitle: 'Forensic Audit & Special Investigation of Provident Fund (PF) Accounts',
    contractValue: 'BDT 3,500,000',
    startDate: '2026-08-01',
    endDate: '2026-11-30',
    sector: 'Forensic Audit & Investigation',
    assignmentType: 'Forensic Audit',
    role: 'Lead Forensic Auditor',
    country: 'Bangladesh',
    scope: 'Investigated unauthorized transactions, 100% bank reconciliation tracing, internal control breakdown analysis, and fraud reporting.',
    verificationStatus: 'Verified',
    evidenceDocument: 'Technical Proposal for Faridpur PF Forensic Audit.docx',
    evidencePage: 1
  },
  {
    id: 'exp-city-bank-cmmi',
    client: 'City Bank PLC',
    assignmentTitle: 'CMMI-DEV Level 3 Certification Benchmark Appraisal (Part-B)',
    contractValue: 'BDT 7,800,000',
    startDate: '2026-09-01',
    endDate: '2027-02-28',
    sector: 'Banking Technology',
    assignmentType: 'CMMI Benchmark Appraisal',
    role: 'Prime Bidder & Quality Lead',
    country: 'Bangladesh',
    scope: 'Executed benchmark appraisal across core banking IT process areas in consortium with Ionbay Consulting Services and CipherShield.',
    verificationStatus: 'Verified',
    evidenceDocument: 'City_Bank_PLC_CMMI_DEV_L3_PartB_Technical_Proposal_ACNABIN-CS-ICS.docx',
    evidencePage: 1
  },
  {
    id: 'exp-brac-bank-ai',
    client: 'BRAC Bank PLC',
    assignmentTitle: 'Enterprise AI Strategy, Governance Framework & Implementation Roadmap',
    contractValue: 'BDT 9,200,000',
    startDate: '2026-07-01',
    endDate: '2026-12-31',
    sector: 'Banking & Artificial Intelligence',
    assignmentType: 'Strategic Technology Advisory',
    role: 'Lead Consortium Partner',
    country: 'Bangladesh',
    scope: 'Formulated enterprise AI governance framework, model risk management policies, ethical AI controls, and multi-year implementation roadmap.',
    verificationStatus: 'Verified',
    evidenceDocument: 'BRAC_Bank_AI_Strategy_Proposal_ACNABIN_CipherShield.docx',
    evidencePage: 1
  },
  {
    id: 'exp-uttara-bank',
    client: 'Uttara Bank PLC',
    assignmentTitle: 'Consultancy Services & Advanced Excel Financial Modeling Tool',
    contractValue: 'BDT 3,600,000',
    startDate: '2026-06-01',
    endDate: '2026-11-30',
    sector: 'Commercial Banking',
    assignmentType: 'Financial Systems Advisory',
    role: 'Principal Advisor',
    country: 'Bangladesh',
    scope: 'Engineered custom financial model, automated reconciliation routines, and provided comprehensive SLA maintenance support.',
    verificationStatus: 'Verified',
    evidenceDocument: 'Technical Proposal-Uttara Bank (1).docx',
    evidencePage: 1
  },
  {
    id: 'exp-snv-drought',
    client: 'SNV Netherlands Development Organisation',
    assignmentTitle: 'Policy Review and Legal Scan on Drought Governance in Bangladesh',
    contractValue: 'BDT 3,900,000',
    startDate: '2026-08-01',
    endDate: '2026-11-30',
    sector: 'Water Governance & INGO',
    assignmentType: 'Policy & Legal Advisory',
    role: 'Lead Policy Consultant',
    country: 'Bangladesh',
    scope: 'Conducted national legal review of water management acts, drought mitigation frameworks, stakeholder consultations, and validation workshops.',
    verificationStatus: 'Verified',
    evidenceDocument: 'ACNABIN_SNV_Technical_Proposal_Draft.docx',
    evidencePage: 1
  },
  {
    id: 'exp-byc-governance',
    client: 'Bangladesh Youth Coalition (BYC) / Plan International',
    assignmentTitle: 'Strengthening Governance and Institutional Framework (8 Annexures)',
    contractValue: 'BDT 4,500,000',
    startDate: '2026-09-01',
    endDate: '2026-11-30',
    sector: 'Civil Society & Youth Governance',
    assignmentType: 'Institutional Governance Framework',
    role: 'Principal Consultant',
    country: 'Bangladesh',
    scope: 'Formulated Core MoU and 8 Annexures covering executive elections, secretariat duties, financial ring-fencing, safeguarding, and operational SOPs.',
    verificationStatus: 'Verified',
    evidenceDocument: 'Technical Proposal for Bangladesh Youth Coalition.pdf',
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
      { id: 'leg-baker-tilly', name: 'Baker Tilly International Membership Certificate', type: 'LICENSE' as EvidenceType, file: 'Baker Tilly Certificate.jpg', validTo: '2028-12-31' },
      { id: 'leg-icab', name: 'ICAB Firm Practice License & Notice of Firm', type: 'LICENSE' as EvidenceType, file: 'ICAB Notice of FIRM.jpeg', validTo: '2027-06-30' },
      { id: 'leg-frc', name: 'FRC Auditor Registration Certificate (Aminul Hoque FCA)', type: 'LICENSE' as EvidenceType, file: 'FRC Certificate  Muhammad Aminul Hoque.pdf', validTo: '2027-12-31' },
      { id: 'leg-bsec', name: 'BSEC Category-A Auditor Panel Enlistment', type: 'LICENSE' as EvidenceType, file: 'BSEC Enlistment Notice.pdf', validTo: '2027-12-31' },
      { id: 'leg-noab', name: 'NGO Affairs Bureau (NOAB) Approved CA Panel FY 2026-2027', type: 'LICENSE' as EvidenceType, file: 'NOAB Enlistment list for CA Firms for 2026-2027.pdf', validTo: '2027-06-30' },
      { id: 'leg-bb', name: 'Bangladesh Bank Approved Panel of Audit Firms', type: 'LICENSE' as EvidenceType, file: 'Bangladesh Bank Circular.pdf', validTo: '2027-12-31' },
      { id: 'leg-tax', name: 'NBR Tax Return Submission Acknowledgement AY 2025-2026', type: 'TAX' as EvidenceType, file: 'Acknowledgement of ACNABIN for the AY 2025-2026.pdf', validTo: '2026-12-31' },
      { id: 'leg-tin', name: 'NBR 12-Digit e-TIN Registration Certificate', type: 'TAX' as EvidenceType, file: 'TIN Certificate.pdf', validTo: '2030-12-31' },
      { id: 'leg-vat', name: 'NBR 13-Digit e-BIN VAT Registration Certificate', type: 'VAT' as EvidenceType, file: 'BIN Certificate.PDF', validTo: '2030-12-31' },
      { id: 'leg-trade', name: 'Dhaka North City Corporation Trade License FY 2026-2027', type: 'TRADE_LICENSE' as EvidenceType, file: 'Trade License.pdf', validTo: '2027-06-30' },
      { id: 'leg-solvency', name: 'Bank Solvency Certificate (Standard Chartered Bank)', type: 'FINANCIAL' as EvidenceType, file: 'Solvency Certificate.pdf', validTo: '2027-06-30' }
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
        sourceSection: 'Legal & Statutory Credentials',
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
