import { ProjectDocument } from '../types';
import { LibraryCategory } from '../pages/DocumentLibraryPage';

export interface LibraryDocumentItem extends ProjectDocument {
  kbCategory: LibraryCategory;
  folderName: string;
  sourceFileRelativePath: string;
  description?: string;
  tags: string[];
}

export const REAL_TEST_DATA_DOCUMENTS: LibraryDocumentItem[] = [
  // 1. Company Profile
  {
    id: 'kb-org-profile-2026',
    fileName: 'Org Profile_June 2026.pdf',
    fileType: 'PDF',
    fileSizeMb: 3.45,
    uploadedBy: 'ACNABIN Corporate Knowledge Base',
    uploadDate: '01 Jun 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 28,
    sourcePath: '/test_data/Detailed Organizational Profile/Org Profile_June 2026.pdf',
    sourceFileRelativePath: 'test_data/Detailed Organizational Profile/Org Profile_June 2026.pdf',
    folderName: 'Detailed Organizational Profile',
    aiConfidence: 0.98,
    version: '2026.1',
    kbCategory: 'Company Profile',
    tags: ['Firm Profile', 'History 1985', 'Baker Tilly', 'Partners', 'Services', 'ICAB'],
    description: 'Comprehensive institutional profile of ACNABIN Chartered Accountants detailing 40-year history since 1985, Baker Tilly International affiliation, partner profiles, service lines, and sector footprint.',
    markdownContent: `# ACNABIN Chartered Accountants — Firm Profile (June 2026)

**Established**: February 1985
**Affiliation**: Independent Member Firm of Baker Tilly International
**Registration**: ICAB Practice License & Registration
**Offices**: Dhaka (BDBL Bhaban, Kawran Bazar) & Chattogram

## Overview of Services
- Statutory & Financial Audit
- Management Consulting & Institutional Advisory
- Internal Control Reviews & SOP Formulation
- Corporate & Individual Taxation Advisory
- Forensic Audits & Special Investigations
- Non-Profit & Development Partner Governance Restructuring

## Global Network Reach
Baker Tilly International network spans 140+ territories worldwide with 43,000+ professionals, ensuring IFAC and ISQM 1 quality standards across all engagements.`
  },

  // 2. TOR
  {
    id: 'kb-byc-tor-2026',
    fileName: 'BYC_Governance_TOR.pdf',
    fileType: 'PDF',
    fileSizeMb: 1.82,
    uploadedBy: 'Procurement / YFC-BD',
    uploadDate: '01 Sep 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 17,
    sourcePath: '/test_data/TOR/BYC_Governance_TOR.pdf',
    sourceFileRelativePath: 'test_data/TOR/BYC_Governance_TOR.pdf',
    folderName: 'TOR',
    aiConfidence: 0.99,
    version: '1.0',
    kbCategory: 'Other',
    tags: ['TOR', 'BYC', 'YFC-BD', 'Governance', 'MoU', '8 Annexures', 'Plan International'],
    description: 'Official Terms of Reference for Consultancy for Strengthening Governance and Institutional Framework of Bangladesh Youth Coalition (BYC) issued by Youth For Change Bangladesh Foundation (YFC-BD).',
    markdownContent: `# Terms of Reference (ToR)
## Consultancy for Strengthening the Governance and Institutional Framework of Bangladesh Youth Coalition (BYC)

**Issuing Organization**: Youth For Change Bangladesh Foundation (YFC-BD)
**Target Platform**: Bangladesh Youth Coalition (BYC) — 102 member organizations across 8 divisions
**Supported By**: Plan International Bangladesh and Embassy of the Kingdom of the Netherlands
**Submission Deadline**: 09 September 2026, 11:59 PM
**Duration**: 3 Calendar Months (Sep 2026 – Nov 2026)

### Scope of Work (Annexures 1–8):
- Annexure 1: Core MoU (Annexes A–E)
- Annexure 2: Executive Committee Elections & Accountability
- Annexure 3: Secretariat Duties & Operational Limits
- Annexure 4: Membership Categories & Due Diligence
- Annexure 5: Financial Governance & Liability Ring-Fencing
- Annexure 6: Communication & Representation Rules
- Annexure 7: Day-to-Day Operations, Grievance & Risk Management
- Annexure 8: Safeguarding, Integrity & Ethical Conduct`
  },

  // 3. Certificates & Credentials
  {
    id: 'kb-icab-cert-2026',
    fileName: 'Muhammad Aminul Hoque FCA Practice Certificate.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.65,
    uploadedBy: 'Compliance & Registration',
    uploadDate: '15 Jan 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 1,
    sourcePath: '/test_data/ICAB Practice Certificate/Muhammad Aminul Hoque FCA Prcatice Certificate.pdf',
    sourceFileRelativePath: 'test_data/ICAB Practice Certificate/Muhammad Aminul Hoque FCA Prcatice Certificate.pdf',
    folderName: 'ICAB Practice Certificate',
    aiConfidence: 0.97,
    version: '2026',
    kbCategory: 'Certificates & Credentials',
    tags: ['ICAB', 'Practice Certificate', 'FCA', 'Partner', 'Statutory License'],
    description: 'Valid Certificate of Practice issued by the Institute of Chartered Accountants of Bangladesh (ICAB) for Senior Partner Muhammad Aminul Hoque FCA.',
    markdownContent: `# Institute of Chartered Accountants of Bangladesh (ICAB)
## Certificate of Practice — 2026

**Member Name**: Muhammad Aminul Hoque, FCA
**Firm**: ACNABIN, Chartered Accountants
**Status**: Valid & Active Practice License
**Authorized Engagement Scope**: Statutory Audit, Governance Advisory, Financial Assurance & Consulting Services across Bangladesh.`
  },
  {
    id: 'kb-incorporation-cert',
    fileName: 'Incorporation Certificate.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.52,
    uploadedBy: 'Compliance & Registration',
    uploadDate: '10 Feb 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 1,
    sourcePath: '/test_data/Certificate of Incorporation/Incorporation Certificate.pdf',
    sourceFileRelativePath: 'test_data/Certificate of Incorporation/Incorporation Certificate.pdf',
    folderName: 'Certificate of Incorporation',
    aiConfidence: 0.96,
    version: '1.0',
    kbCategory: 'Certificates & Credentials',
    tags: ['RJSC', 'Incorporation', 'Legal Entity', 'Statutory Registration'],
    description: 'Certificate of Incorporation and statutory registration record for ACNABIN legal operations.',
    markdownContent: `# Statutory Registration & Legal Certificate
**Entity**: ACNABIN Chartered Accountants / Related Advisory Practice
**Authority**: Registrar of Joint Stock Companies and Firms (RJSC) / ICAB
**Verification**: Verified active registration in Bangladesh.`
  },
  {
    id: 'kb-bank-solvency',
    fileName: 'Solvency Certificate.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.48,
    uploadedBy: 'Finance Division',
    uploadDate: '12 May 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 1,
    sourcePath: '/test_data/Bank Solvency Certificate/Solvency Certificate.pdf',
    sourceFileRelativePath: 'test_data/Bank Solvency Certificate/Solvency Certificate.pdf',
    folderName: 'Bank Solvency Certificate',
    aiConfidence: 0.97,
    version: '2026',
    kbCategory: 'Certificates & Credentials',
    tags: ['Bank Solvency', 'Financial Standing', 'Credit Rating', 'Standard Chartered / Commercial Bank'],
    description: 'Official Bank Solvency Certificate confirming sound financial health, operational liquidity, and satisfactory account maintenance of ACNABIN.',
    markdownContent: `# Bank Solvency Certificate
**Account Holder**: ACNABIN, Chartered Accountants
**Account Status**: Satisfactorily maintained with robust financial solvency and credit standing.
**Issued For**: Tender submission and client procurement qualification.`
  },
  {
    id: 'kb-tax-ack-return',
    fileName: 'Acknowledgement of ACNABIN for the AY 2025-2026.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.78,
    uploadedBy: 'Taxation Division',
    uploadDate: '20 Nov 2025',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 2,
    sourcePath: '/test_data/Acknowledgement of Return/Acknowledgement of ACNABIN for the AY 2025-2026.pdf',
    sourceFileRelativePath: 'test_data/Acknowledgement of Return/Acknowledgement of ACNABIN for the AY 2025-2026.pdf',
    folderName: 'Acknowledgement of Return',
    aiConfidence: 0.98,
    version: 'AY 2025-2026',
    kbCategory: 'Legal & Tax',
    tags: ['Income Tax', 'NBR', 'Tax Return', 'AY 2025-2026', 'TIN', 'Tax Compliance'],
    description: 'National Board of Revenue (NBR) Official Income Tax Return Submission Acknowledgement for Assessment Year 2025–2026.',
    markdownContent: `# National Board of Revenue (NBR) — Bangladesh
## Acknowledgement of Income Tax Return Submission

**Assessment Year**: 2025–2026
**Assessee**: ACNABIN, Chartered Accountants
**Taxes Circle**: Large Taxpayers Unit (LTU) / Circle-11
**Status**: Duly Submitted & Fully Tax Compliant.`
  },
  {
    id: 'kb-trade-license-tin-bin',
    fileName: 'Trade License, TIN and BIN Suite.pdf',
    fileType: 'PDF',
    fileSizeMb: 1.25,
    uploadedBy: 'Compliance & Legal',
    uploadDate: '01 Jul 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 3,
    sourcePath: '/test_data/Trade License, TIN and BIN/Trade License.pdf',
    sourceFileRelativePath: 'test_data/Trade License, TIN and BIN/Trade License.pdf',
    folderName: 'Trade License, TIN and BIN',
    aiConfidence: 0.99,
    version: '2026–2027',
    kbCategory: 'Legal & Tax',
    tags: ['Trade License', 'e-TIN', 'e-BIN', 'VAT 13-digit', 'Dhaka North City Corporation'],
    description: 'Combined statutory package comprising Dhaka North City Corporation Trade License, e-TIN 12-digit certificate, and 13-digit Value Added Tax (VAT) BIN registration certificate.',
    markdownContent: `# Statutory Registration Suite
1. **Trade License**: Dhaka North City Corporation (DNCC), Kawran Bazar Commercial Area (Valid through FY 2026–2027).
2. **e-TIN Certificate**: 12-digit Taxpayer Identification Number registered under Taxes Zone-05, Dhaka.
3. **e-BIN Certificate**: 13-digit VAT Registration Number under Customs, Excise & VAT Commissionerate (Dhaka South/North).`
  },

  // 4. Sample Proposals & Previous Winning Bids
  {
    id: 'kb-north-bengal-proposal',
    fileName: 'Technical Proposal for North Bengal FA Revaluation.docx',
    fileType: 'DOCX',
    fileSizeMb: 0.22,
    uploadedBy: 'Advisory Practice',
    uploadDate: '15 Aug 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 22,
    sourcePath: '/test_data/Sample_Proposals/North_Bengal_Sample_Proposal.docx',
    sourceFileRelativePath: 'test_data/Sample_Proposals/North_Bengal_Sample_Proposal.docx',
    folderName: 'Sample_Proposals',
    aiConfidence: 0.99,
    version: 'Final v1.0',
    kbCategory: 'Previous Proposals',
    tags: ['Benchmark', 'Sample Proposal', 'North Bengal', 'Advisory', 'Fixed Assets', 'Methodology'],
    description: 'Gold-standard reference technical proposal establishing ACNABIN house style typography, 13-section structure, detailed work plan, responsibility matrix, and ISQM 1 QA controls.',
    markdownContent: `# Technical Proposal for North Bengal Sugar Mills Fixed Asset Revaluation
**Firm**: ACNABIN, Chartered Accountants
**Structure**: 13 Standard Sections (Understanding, Objectives, Scope, Methodology, Detailed Work Plan, Team, Matrix, QA & Risk, Deliverables, Timeline, Experience, About ACNABIN, Conclusion).`
  },
  {
    id: 'kb-byc-prev-draft',
    fileName: 'BYC_Governance_Technical_Proposal.docx',
    fileType: 'DOCX',
    fileSizeMb: 0.15,
    uploadedBy: 'Governance Advisory',
    uploadDate: '06 Sep 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 20,
    sourcePath: '/test_data/BYC_Governance_Technical_Proposal.docx',
    sourceFileRelativePath: 'test_data/BYC_Governance_Technical_Proposal.docx',
    folderName: 'test_data',
    aiConfidence: 0.99,
    version: 'Substantive v1.0',
    kbCategory: 'Previous Proposals',
    tags: ['BYC', 'Technical Proposal', 'Governance', 'MoU', 'YFC-BD', 'Substantive'],
    description: 'Substantive Technical Proposal for Bangladesh Youth Coalition (BYC) Governance Framework development featuring 12-week phased methodology and full 8-annexure scope.',
    markdownContent: `# Technical Proposal: Strengthening Governance and Institutional Framework of Bangladesh Youth Coalition (BYC)
**Client**: Bangladesh Youth Coalition (BYC) / Youth For Change Bangladesh Foundation (YFC-BD)
**Firm**: ACNABIN, Chartered Accountants
**Engagement Duration**: 12 Weeks across 5 Phases.`
  },
  {
    id: 'kb-brac-bank-iso',
    fileName: 'BRAC_Bank_ISO-27001_Technical_Proposal.docx',
    fileType: 'DOCX',
    fileSizeMb: 0.45,
    uploadedBy: 'IT Audit & Advisory',
    uploadDate: '10 Apr 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 35,
    sourcePath: '/test_data/Sample_Proposals/BRAC_Bank_ISO-27001_Technical_Proposal.docx',
    sourceFileRelativePath: 'test_data/Sample_Proposals/BRAC_Bank_ISO-27001_Technical_Proposal.docx',
    folderName: 'Sample_Proposals',
    aiConfidence: 0.95,
    version: 'Final',
    kbCategory: 'Previous Proposals',
    tags: ['BRAC Bank', 'ISO 27001', 'ISMS', 'Banking Audit', 'IT Governance'],
    description: 'Technical proposal for ISO 27001 Information Security Management System implementation and audit for BRAC Bank PLC.',
    markdownContent: `# Technical Proposal: ISO 27001 Implementation & Audit for BRAC Bank PLC
**Client**: BRAC Bank PLC
**Scope**: Enterprise Information Security Management System, gap analysis, policy design, risk assessment, and certification support.`
  },
  {
    id: 'kb-start-bd-hub',
    fileName: 'Technical Proposal for Start Bangladesh Hub - Finance and Procurement Policies.docx',
    fileType: 'DOCX',
    fileSizeMb: 0.38,
    uploadedBy: 'NGO Advisory Practice',
    uploadDate: '18 Mar 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 26,
    sourcePath: '/test_data/Sample_Proposals/Technical Proposal for Start Bangladesh Hub - Finance and Procurement Policies.docx',
    sourceFileRelativePath: 'test_data/Sample_Proposals/Technical Proposal for Start Bangladesh Hub - Finance and Procurement Policies.docx',
    folderName: 'Sample_Proposals',
    aiConfidence: 0.97,
    version: 'v2.0',
    kbCategory: 'Previous Proposals',
    tags: ['Start Network', 'NGO Hub', 'Financial Manual', 'Procurement Policy', 'Sub-granting'],
    description: 'Technical Proposal for drafting comprehensive Finance, HR, and Procurement manuals for Start Fund Bangladesh and member CSO network.',
    markdownContent: `# Technical Proposal: Finance and Procurement Policies for Start Bangladesh Hub
**Client**: Start Fund Bangladesh / Multi-Agency Coalition
**Scope**: Institutional policies, delegation of financial powers, sub-grant management, procurement guidelines, and compliance framework.`
  },
  {
    id: 'kb-faridpur-pf',
    fileName: 'Technical Proposal for Faridpur PF Forensic Audit V4.docx',
    fileType: 'DOCX',
    fileSizeMb: 0.29,
    uploadedBy: 'Forensic Audit Division',
    uploadDate: '22 Feb 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 24,
    sourcePath: '/test_data/Sample_Proposals/Technical Proposal for Faridpur PF Forensic Audit V4.docx',
    sourceFileRelativePath: 'test_data/Sample_Proposals/Technical Proposal for Faridpur PF Forensic Audit V4.docx',
    folderName: 'Sample_Proposals',
    aiConfidence: 0.96,
    version: 'v4.0',
    kbCategory: 'Previous Proposals',
    tags: ['Forensic Audit', 'Provident Fund', 'Investigation', 'Special Audit'],
    description: 'Technical proposal for forensic investigation and special audit of employee provident fund governance.',
    markdownContent: `# Technical Proposal: Forensic Audit of Provident Fund Accounts
**Scope**: Fraud risk assessment, transaction tracing, reconciliation, and internal control enhancement recommendations.`
  },
  {
    id: 'kb-jaago-vendor',
    fileName: 'JAAGO Vendor Enlistment Application Form.docx',
    fileType: 'DOCX',
    fileSizeMb: 0.39,
    uploadedBy: 'Civil Society & NGO Practice',
    uploadDate: '05 May 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 8,
    sourcePath: '/test_data/JAAGO Vendor Enlistment Application Form.docx',
    sourceFileRelativePath: 'test_data/JAAGO Vendor Enlistment Application Form.docx',
    folderName: 'test_data',
    aiConfidence: 0.98,
    version: '2026',
    kbCategory: 'Certificates & Credentials',
    tags: ['JAAGO Foundation', 'Vendor Enlistment', 'NGO Enlistment', 'Audit & Advisory'],
    description: 'Completed corporate enlistment package for JAAGO Foundation covering audit, tax, and institutional consultancy services.',
    markdownContent: `# JAAGO Foundation — Vendor Enlistment Application
**Applicant**: ACNABIN, Chartered Accountants
**Service Categories**: Statutory Audit, Project Audit, Policy Review, Tax & VAT Advisory.`
  },

  // 5. Similar Experience & Work Orders
  {
    id: 'kb-unilever-el',
    fileName: 'Engagement Letter of Unilever.pdf',
    fileType: 'PDF',
    fileSizeMb: 1.12,
    uploadedBy: 'Corporate Assurance',
    uploadDate: '14 Jan 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 4,
    sourcePath: '/test_data/Similar Experience With Fees/Engagement Letter of Unilever .pdf',
    sourceFileRelativePath: 'test_data/Similar Experience With Fees/Engagement Letter of Unilever .pdf',
    folderName: 'Similar Experience With Fees',
    aiConfidence: 0.99,
    version: '1.0',
    kbCategory: 'Company Experience',
    tags: ['Unilever', 'MNC', 'Assurance', 'Internal Controls', 'Corporate Experience'],
    description: 'Executed engagement letter with Unilever Bangladesh Limited for specialized assurance, review, and internal control evaluation.',
    markdownContent: `# Unilever Bangladesh Limited — Engagement Letter
**Client**: Unilever Bangladesh Limited
**Consultant**: ACNABIN, Chartered Accountants
**Scope**: Operational review, distribution compliance testing, and financial governance checks.`
  },
  {
    id: 'kb-berger-paints',
    fileName: 'Appointment letter- Berger Paints Bangladesh Ltd.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.85,
    uploadedBy: 'Corporate Assurance',
    uploadDate: '08 Mar 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 3,
    sourcePath: '/test_data/Similar Experience With Fees/Appointment letter- Berger Paints Bangladesh Ltd.PDF',
    sourceFileRelativePath: 'test_data/Similar Experience With Fees/Appointment letter- Berger Paints Bangladesh Ltd.PDF',
    folderName: 'Similar Experience With Fees',
    aiConfidence: 0.98,
    version: '1.0',
    kbCategory: 'Company Experience',
    tags: ['Berger Paints', 'Listed MNC', 'Internal Audit', 'Corporate Governance'],
    description: 'Appointment letter from Berger Paints Bangladesh Ltd for corporate audit and advisory services.',
    markdownContent: `# Berger Paints Bangladesh Limited — Appointment Letter
**Appointed Firm**: ACNABIN, Chartered Accountants
**Scope**: Internal audit, risk-based operational review, and business process assessment.`
  },
  {
    id: 'kb-walton-cert',
    fileName: 'Completion Certificate - Walton Hi-Tech Industries Ltd.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.92,
    uploadedBy: 'Advisory Division',
    uploadDate: '28 Feb 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 2,
    sourcePath: '/test_data/Similar Experience With Fees/Completion Certificate - Walton Hi-Tech Industries Ltd.pdf',
    sourceFileRelativePath: 'test_data/Similar Experience With Fees/Completion Certificate - Walton Hi-Tech Industries Ltd.pdf',
    folderName: 'Similar Experience With Fees',
    aiConfidence: 0.99,
    version: '1.0',
    kbCategory: 'Company Experience',
    tags: ['Walton Hi-Tech', 'Completion Certificate', 'Valuation', 'Advisory', 'Large Corporate'],
    description: 'Formal assignment completion certificate from Walton Hi-Tech Industries Ltd praising timely, rigorous advisory deliverables.',
    markdownContent: `# Walton Hi-Tech Industries PLC — Completion Certificate
**Certified**: ACNABIN, Chartered Accountants successfully executed and delivered the advisory assignment to the highest professional standards with full client satisfaction.`
  },
  {
    id: 'kb-titas-gas',
    fileName: 'Acceptance of Appointment - Titas Gas Transmission Ltd.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.74,
    uploadedBy: 'Public Sector Practice',
    uploadDate: '19 Jan 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 2,
    sourcePath: '/test_data/Similar Experience With Fees/Acceptance of Appointment- Titas Gas Transmission Ltd.pdf',
    sourceFileRelativePath: 'test_data/Similar Experience With Fees/Acceptance of Appointment- Titas Gas Transmission Ltd.pdf',
    folderName: 'Similar Experience With Fees',
    aiConfidence: 0.97,
    version: '1.0',
    kbCategory: 'Company Experience',
    tags: ['Titas Gas', 'Petrobangla', 'State-Owned Enterprise', 'Public Sector Audit'],
    description: 'Appointment and acceptance documentation for state-owned energy utility Titas Gas Transmission and Distribution Company Limited.',
    markdownContent: `# Titas Gas Transmission and Distribution Company Limited
**Scope**: Statutory audit, fixed asset verification, and financial reporting review.`
  },
  {
    id: 'kb-dcci-work-order',
    fileName: 'Work Order of ACNABIN from DCCI.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.68,
    uploadedBy: 'Institutional Practice',
    uploadDate: '10 Jun 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 2,
    sourcePath: '/test_data/Similar Experience With Fees/Work Order of ACNABIN from DCCI.pdf',
    sourceFileRelativePath: 'test_data/Similar Experience With Fees/Work Order of ACNABIN from DCCI.pdf',
    folderName: 'Similar Experience With Fees',
    aiConfidence: 0.98,
    version: '1.0',
    kbCategory: 'Company Experience',
    tags: ['DCCI', 'Dhaka Chamber of Commerce', 'Institutional Review', 'Trade Body'],
    description: 'Official Work Order from Dhaka Chamber of Commerce & Industry (DCCI) for governance, internal controls, and financial management consultancy.',
    markdownContent: `# Dhaka Chamber of Commerce & Industry (DCCI) — Work Order
**Client**: DCCI (Apex Chamber in Bangladesh)
**Consultant**: ACNABIN, Chartered Accountants
**Scope**: Financial process automation review, internal control enhancement, and policy manual updates.`
  },
  {
    id: 'kb-mrdi-work-order',
    fileName: 'Work Order - Media Resources Development Initiative.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.62,
    uploadedBy: 'NGO & Civil Society Practice',
    uploadDate: '15 Jul 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 2,
    sourcePath: '/test_data/Similar Experience With Fees/Work Order- Media Resources Development Initiative.pdf',
    sourceFileRelativePath: 'test_data/Similar Experience With Fees/Work Order- Media Resources Development Initiative.pdf',
    folderName: 'Similar Experience With Fees',
    aiConfidence: 0.99,
    version: '1.0',
    kbCategory: 'Company Experience',
    tags: ['MRDI', 'Media & Civil Society', 'NGO Audit', 'Governance Review', 'Swedish SIDA'],
    description: 'Work order from Media Resources Development Initiative (MRDI) for institutional governance review, donor compliance, and financial management.',
    markdownContent: `# Media Resources Development Initiative (MRDI) — Work Order
**Client**: MRDI (Leading Media & Development Non-Profit in Bangladesh)
**Consultant**: ACNABIN, Chartered Accountants
**Scope**: Governance restructuring, financial policy formulation, and donor reporting compliance.`
  },
  {
    id: 'kb-sirajganj-ez',
    fileName: 'Engagement Letter - Sirajganj Economic Zone Limited.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.81,
    uploadedBy: 'Infrastructure Advisory',
    uploadDate: '04 Mar 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 3,
    sourcePath: '/test_data/Similar Experience With Fees/Engagement Letter- Sirajganj Economic Zone Limited.pdf',
    sourceFileRelativePath: 'test_data/Similar Experience With Fees/Engagement Letter- Sirajganj Economic Zone Limited.pdf',
    folderName: 'Similar Experience With Fees',
    aiConfidence: 0.97,
    version: '1.0',
    kbCategory: 'Company Experience',
    tags: ['Sirajganj Economic Zone', 'BEZA', 'Infrastructure', 'Feasibility & SOP'],
    description: 'Engagement Letter for Sirajganj Economic Zone Limited covering institutional financial structuring, SOP design, and governance frameworks.',
    markdownContent: `# Sirajganj Economic Zone Limited — Engagement Letter
**Scope**: Private Economic Zone governance framework, financial policies, and investor compliance SOPs.`
  }
];
