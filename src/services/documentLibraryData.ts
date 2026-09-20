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
  // ==========================================
  // 1. COMPANY PROFILES & INSTITUTIONAL CAPABILITY
  // ==========================================
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
    aiConfidence: 0.99,
    version: '2026.1',
    kbCategory: 'Company Profile',
    tags: ['Firm Profile', 'History 1985', 'Baker Tilly', '8 Partners', 'ICAB', 'IFAC'],
    description: 'Comprehensive institutional profile of ACNABIN Chartered Accountants detailing 40-year history since Feb 1985, Baker Tilly International affiliation, 8 FCA partners, service lines, and sector footprint.',
    markdownContent: `# ACNABIN Chartered Accountants — Firm Profile (June 2026)
**Established**: February 1985 (40+ Years of Professional Distinction)
**Global Affiliation**: Independent Member Firm of Baker Tilly International (Ranked Top 10 globally, 140+ territories, 43,000+ professionals)
**Professional Standing**: ICAB Practice License, FRC Registered, Enlisted with Bangladesh Bank, BSEC, NGO Affairs Bureau (NOAB), and major development agencies.
**Offices**: Dhaka (BDBL Bhaban, Kawran Bazar) & Chattogram.

## Core Capabilities
- Statutory & Financial Assurance (ISA, IFRS compliant)
- Forensic Investigations, Special Audits & Fraud Risk Assessment
- Management Consulting, SOP Formulation & Institutional Governance Restructuring
- Corporate & Personal Taxation, Transfer Pricing & VAT Advisory
- IT Audit, ISMS (ISO 27001), PCI DSS & AI Governance Roadmaps`
  },
  {
    id: 'kb-acnabin-chartered-accountants',
    fileName: 'ACNABIN Chartered Accountants.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.80,
    uploadedBy: 'ACNABIN Executive Office',
    uploadDate: '10 Jun 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 12,
    sourcePath: '/test_data/Relevent Documents/ACNABIN Chartered Accountants.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/ACNABIN Chartered Accountants.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.98,
    version: '2026',
    kbCategory: 'Company Profile',
    tags: ['Firm Overview', 'Partnership', 'Governance', 'Assurance & Advisory'],
    description: 'Institutional capability overview highlighting ACNABIN leadership, quality control under ISQM 1, and multidisciplinary advisory track record across public, private, and donor sectors.',
    markdownContent: `# ACNABIN Chartered Accountants — Institutional Capability
ACNABIN is one of the premier chartered accountancy and management consulting firms in Bangladesh, providing world-class assurance, tax, and governance advisory services since 1985.
- **Leadership**: 8 Full-Time Fellow Chartered Accountant (FCA) Partners.
- **Multidisciplinary Talent**: Over 170 professionals including FCAs, ACAs, CISAs, ACCAs, and specialized legal/IT consultants.
- **Quality System**: Stringent ISQM 1 compliant Engagement Quality Reviews.`
  },

  // ==========================================
  // 2. CVS, PARTNERS & KEY EXPERT ROSTERS
  // ==========================================
  {
    id: 'kb-cv-amin-mamun-saif-nusrat',
    fileName: 'CV of Mr Amin, Mamun, Saif, Nusrat.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.11,
    uploadedBy: 'HR & Partner Resource Division',
    uploadDate: '01 Jul 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 8,
    sourcePath: '/test_data/Relevent Documents/CV of Mr Amin, Mamun, Saif, Nusrat.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/CV of Mr Amin, Mamun, Saif, Nusrat.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.99,
    version: '2026',
    kbCategory: 'CVs',
    tags: ['CV', 'Muhammad Aminul Hoque', 'Abdullah-Al-Mamun', 'Saif Ahmed', 'Nusrat Jahan', 'FCA', 'Partners'],
    description: 'Verified executive CVs of Senior Partner Muhammad Aminul Hoque FCA, Abdullah-Al-Mamun FCA, Saif Ahmed FCA, and Nusrat Jahan FCA detailing over 70+ combined years of audit, forensic, and governance experience.',
    markdownContent: `# Partner Curriculum Vitae Suite
## 1. Muhammad Aminul Hoque, FCA — Senior Partner & Engagement Lead
- **Qualifications**: Fellow Chartered Accountant (ICAB), MBA (University of Dhaka), B.Com (Hons). FRC Practice License.
- **Experience**: 17+ Years Post-Qualification. Lead Partner for Special Audits, Forensic Investigations, and Large Corporate Engagements.
- **Key Engagements**: Unilever, Titas Gas, Walton Hi-Tech, Berger Paints, PKSF, BYC.

## 2. Abdullah-Al-Mamun, FCA — Partner (Forensic & Governance)
- **Qualifications**: Fellow Chartered Accountant (ICAB), M.Com.
- **Specialization**: Forensic Audits, Fraud Risk Tracing, Internal Controls, and Non-Profit Institutional Governance.

## 3. Saif Ahmed, FCA — Partner (Corporate Assurance)
- **Qualifications**: Fellow Chartered Accountant (ICAB), BBA / MBA.
- **Specialization**: Statutory Assurance, IFRS Conversions, Due Diligence, and Multinational Compliance.

## 4. Nusrat Jahan, FCA — Partner (Advisory & Compliance)
- **Qualifications**: Fellow Chartered Accountant (ICAB), B.Sc (Hons), ICAEW ACA / ACCA.
- **Specialization**: NGO/Donor Grant Verification, Development Program Governance, and Risk Assessment.`
  },
  {
    id: 'kb-cv-mutasim-mansur',
    fileName: 'CV of Mr Mutasim and Mansur.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.08,
    uploadedBy: 'HR & Partner Resource Division',
    uploadDate: '01 Jul 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 6,
    sourcePath: '/test_data/Relevent Documents/CV of Mr Mutasim and Mansur.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/CV of Mr Mutasim and Mansur.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.98,
    version: '2026',
    kbCategory: 'CVs',
    tags: ['CV', 'Mutasim Billah', 'Mansur Ali', 'FCA', 'Banking', 'Assurance Partners'],
    description: 'Curriculum Vitae for Partner Mutasim Billah FCA and Partner Mansur Ali FCA specializing in financial institutions, banking compliance, and fixed asset revaluation.',
    markdownContent: `# Partner Curriculum Vitae: Mutasim Billah FCA & Mansur Ali FCA
## 1. Mutasim Billah, FCA — Partner (Financial Institutions & Banking)
- **Qualifications**: FCA (ICAB), M.Com. 15+ years experience.
- **Specialization**: Commercial Banking Audits, Basel III compliance, Credit Risk Assessments.

## 2. Mansur Ali, FCA — Partner (Audit & Valuation)
- **Qualifications**: FCA (ICAB), B.Com (Hons). 14+ years experience.
- **Specialization**: Fixed Asset Revaluation, Public Sector Enterprise Assurance, Forensic Investigations.`
  },
  {
    id: 'kb-number-of-partners-and-experience',
    fileName: 'Number of Partners and their Experience.docx',
    fileType: 'DOCX',
    fileSizeMb: 0.13,
    uploadedBy: 'HR & Practice Management',
    uploadDate: '15 Jul 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 14,
    sourcePath: '/test_data/Previous Proposal/Number of Partners and their Experience.docx',
    sourceFileRelativePath: 'test_data/Previous Proposal/Number of Partners and their Experience.docx',
    folderName: 'Previous Proposal',
    aiConfidence: 0.99,
    version: '2026',
    kbCategory: 'CVs',
    tags: ['All 8 Partners', 'Staff Roster', '168 Personnel', 'Directors', 'Managers', 'Article Students'],
    description: 'Authoritative firm roster detailing all 8 Fellow Chartered Accountant partners (including former ICAB & SAFA Presidents), 168 professional staff, Directors, Managers, and specialized consultants.',
    markdownContent: `# ACNABIN Partners and Professional Staff Roster
## The 8 Fellow Chartered Accountant (FCA) Partners:
1. **Abu Sayed Mohammed Nayeem, FCA, FCCA (UK), ACA (ICAEW)** — 45+ Years Exp. (Former President of ICAB & Former President of SAFA).
2. **Iftekhar Hossain, FCA** — 25+ Years Exp.
3. **Abu Taher Mohammed Abdul Bari, FCA, FCEA (London)** — 25+ Years Exp.
4. **Md. Moniruzzaman, FCA** — 20+ Years Exp.
5. **Md. Rokonuzzaman, FCA** — 20+ Years Exp.
6. **Md. Mominul Karim, FCA** — 20+ Years Exp.
7. **Md. Reajul Islam, FCA** — 17+ Years Exp.
8. **Muhammad Aminul Hoque, FCA** — 17+ Years Exp.

## Key Directors & Specialists:
- **Mostakin Ahmed, FCA, CISA** — Director (Risk Advisory, IT Audit & Fraud Risk)
- **Farhan Hyder, MBA, FCA** — Director (Audit & Assurance)
- **Mohammad Golam Shahriar, FCA** — Director (Financial Advisory)
- **Aminur Rahman, MBA, LLB** — Senior Director (Ex-Member, National Board of Revenue NBR)
- **Dr. Md. Abdur Rouf, Ph.D** — Lead Governance Specialist
- **168 Total Qualified & Professional Staff** across Dhaka and Chattogram.`
  },
  {
    id: 'kb-annexure-manpower-info',
    fileName: "Annexure - Acnabin's manpower info.pdf",
    fileType: 'PDF',
    fileSizeMb: 0.36,
    uploadedBy: 'HR Department',
    uploadDate: '10 Jun 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 4,
    sourcePath: "/test_data/Relevent Documents/Annexure - Acnabin's manpower info.pdf",
    sourceFileRelativePath: "test_data/Relevent Documents/Annexure - Acnabin's manpower info.pdf",
    folderName: 'Relevent Documents',
    aiConfidence: 0.97,
    version: '2026',
    kbCategory: 'CVs',
    tags: ['Manpower Info', 'Staff Strength', 'Audit Teams', 'Consultants'],
    description: 'Official manpower statement demonstrating organizational depth with 170+ professionals available for simultaneous deployment.',
    markdownContent: `# ACNABIN Manpower Information
- Total Partners: 8 FCAs
- Qualified Chartered Accountants (FCA / ACA): 22
- Information Systems Auditors (CISA / CIA): 5
- Audit Managers & Supervisors: 38
- Article Students & Trainees: 110+
- Total Human Resource Strength: 170+ Personnel.`
  },

  // ==========================================
  // 3. STATUTORY LICENSES, ACCREDITATIONS & CERTIFICATES
  // ==========================================
  {
    id: 'kb-baker-tilly-cert',
    fileName: 'Baker Tilly Certificate.jpg',
    fileType: 'Image',
    fileSizeMb: 0.60,
    uploadedBy: 'Compliance Division',
    uploadDate: '01 Jan 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: true,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 1,
    sourcePath: '/test_data/Relevent Documents/Baker Tilly Certificate.jpg',
    sourceFileRelativePath: 'test_data/Relevent Documents/Baker Tilly Certificate.jpg',
    folderName: 'Relevent Documents',
    aiConfidence: 0.99,
    version: '2026',
    kbCategory: 'Certificates & Credentials',
    tags: ['Baker Tilly International', 'Global Affiliation', 'Network Member', 'IFAC Forum of Firms'],
    description: 'Official Membership Certificate confirming ACNABIN as an Independent Member Firm of Baker Tilly International Limited (UK).',
    markdownContent: `# Baker Tilly International — Certificate of Membership
This certifies that **ACNABIN, Chartered Accountants** is an Independent Member Firm of Baker Tilly International Limited.
- Member of the Forum of Firms (IFAC).
- Global network access to technical methodologies across 140+ countries.`
  },
  {
    id: 'kb-icab-firm-notice',
    fileName: 'ICAB Notice of FIRM.jpeg',
    fileType: 'Image',
    fileSizeMb: 0.43,
    uploadedBy: 'Compliance & Legal',
    uploadDate: '15 Jan 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: true,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 1,
    sourcePath: '/test_data/Relevent Documents/ICAB Notice of FIRM.jpeg',
    sourceFileRelativePath: 'test_data/Relevent Documents/ICAB Notice of FIRM.jpeg',
    folderName: 'Relevent Documents',
    aiConfidence: 0.98,
    version: '2026',
    kbCategory: 'Certificates & Credentials',
    tags: ['ICAB', 'Firm Registration', 'CA License', 'Practicing Firm'],
    description: 'Official Institute of Chartered Accountants of Bangladesh (ICAB) Firm Registration and Practice Authorization record.',
    markdownContent: `# Institute of Chartered Accountants of Bangladesh (ICAB)
## Firm Registration Notice & Practicing Certificate
**Firm Name**: ACNABIN, Chartered Accountants
**Registration Status**: Valid & In Good Standing for all statutory assurance and consulting services.`
  },
  {
    id: 'kb-aminul-hoque-practice-cert',
    fileName: 'Muhammad Aminul Hoque FCA Prcatice Certificate.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.32,
    uploadedBy: 'Compliance & Registration',
    uploadDate: '15 Jan 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 1,
    sourcePath: '/test_data/Relevent Documents/Muhammad Aminul Hoque FCA Prcatice Certificate.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/Muhammad Aminul Hoque FCA Prcatice Certificate.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.99,
    version: '2026',
    kbCategory: 'Certificates & Credentials',
    tags: ['ICAB Practice Certificate', 'Muhammad Aminul Hoque', 'FCA', 'Partner'],
    description: 'Certificate of Practice issued by ICAB for Senior Partner Muhammad Aminul Hoque FCA authorizing statutory audit signing authority.',
    markdownContent: `# ICAB Certificate of Practice — Muhammad Aminul Hoque FCA
**Member**: Muhammad Aminul Hoque, Fellow Chartered Accountant (FCA)
**Firm**: ACNABIN, Chartered Accountants
**Validity**: FY 2025–2026 (Renewable annually, fully active).`
  },
  {
    id: 'kb-frc-cert-aminul-hoque',
    fileName: 'FRC Certificate  Muhammad Aminul Hoque.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.81,
    uploadedBy: 'Compliance & Regulatory',
    uploadDate: '20 Feb 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 2,
    sourcePath: '/test_data/Relevent Documents/FRC Certificate  Muhammad Aminul Hoque.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/FRC Certificate  Muhammad Aminul Hoque.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.99,
    version: '2026',
    kbCategory: 'Certificates & Credentials',
    tags: ['FRC', 'Financial Reporting Council', 'Statutory Auditor Enlistment', 'Public Interest Entity PIE'],
    description: 'Official Financial Reporting Council (FRC) Bangladesh registration certificate for Partner Muhammad Aminul Hoque FCA.',
    markdownContent: `# Financial Reporting Council (FRC) — Bangladesh
## Auditor Enlistment Certificate
**Auditor Name**: Muhammad Aminul Hoque, FCA
**Registration Authority**: Financial Reporting Council (FRC)
**Scope**: Authorized to audit Public Interest Entities (PIEs), listed companies, and financial institutions in Bangladesh.`
  },
  {
    id: 'kb-bsec-enlistment',
    fileName: 'BSEC Enlistment Notice.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.37,
    uploadedBy: 'Regulatory Affairs',
    uploadDate: '10 Feb 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 2,
    sourcePath: '/test_data/Relevent Documents/BSEC Enlistment Notice.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/BSEC Enlistment Notice.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.98,
    version: '2026',
    kbCategory: 'Certificates & Credentials',
    tags: ['BSEC', 'Securities & Exchange Commission', 'Panel Auditor', 'Capital Markets'],
    description: 'Bangladesh Securities and Exchange Commission (BSEC) Panel Enlistment Notice certifying ACNABIN as an eligible auditor for publicly listed companies.',
    markdownContent: `# Bangladesh Securities and Exchange Commission (BSEC)
## Panel Enlistment of Chartered Accountancy Firms
ACNABIN is an enlisted Category-A auditor permitted to conduct statutory audit, rights issue verification, and compliance audits for listed issuers.`
  },
  {
    id: 'kb-noab-enlistment',
    fileName: 'NOAB Enlistment list for CA Firms for 2026-2027.pdf',
    fileType: 'PDF',
    fileSizeMb: 14.07,
    uploadedBy: 'NGO & Civil Society Practice',
    uploadDate: '01 Aug 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 32,
    sourcePath: '/test_data/Relevent Documents/NOAB Enlistment list for CA Firms for 2026-2027.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/NOAB Enlistment list for CA Firms for 2026-2027.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.99,
    version: '2026–2027',
    kbCategory: 'Certificates & Credentials',
    tags: ['NGO Affairs Bureau', 'NOAB', 'Donor Audits', 'FD-4 Certification', 'FD-7 Certification'],
    description: "NGO Affairs Bureau (Prime Minister's Office) Official Approved CA Firms Panel List for FY 2026–2027 featuring ACNABIN for foreign donation project audits.",
    markdownContent: `# NGO Affairs Bureau (NOAB) — Prime Minister's Office
## Enlistment of Chartered Accountant Firms for FY 2026–2027
ACNABIN is fully enlisted on the NOAB Approved Panel to audit Foreign Donations (Voluntary Activities) Regulation Act (FD-4, FD-6, FD-7) projects.`
  },
  {
    id: 'kb-bangladesh-bank-circular',
    fileName: 'Bangladesh Bank Circular.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.11,
    uploadedBy: 'Banking Advisory',
    uploadDate: '05 Mar 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 2,
    sourcePath: '/test_data/Relevent Documents/Bangladesh Bank Circular.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/Bangladesh Bank Circular.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.97,
    version: '2026',
    kbCategory: 'Certificates & Credentials',
    tags: ['Bangladesh Bank', 'Central Bank Enlistment', 'Banking Auditor Panel', 'Grade-A'],
    description: 'Bangladesh Bank approved panel circular confirming ACNABIN as an eligible auditor for Scheduled Banks and Non-Bank Financial Institutions (NBFIs).',
    markdownContent: `# Bangladesh Bank — Department of Banking Inspection
## Approved Panel of Audit Firms
ACNABIN is classified in the topmost tier of auditors authorized to audit commercial banks, specialized banks, and NBFIs.`
  },
  {
    id: 'kb-solvency-cert',
    fileName: 'Solvency Certificate.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.36,
    uploadedBy: 'Finance Division',
    uploadDate: '12 May 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 1,
    sourcePath: '/test_data/Relevent Documents/Solvency Certificate.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/Solvency Certificate.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.98,
    version: '2026',
    kbCategory: 'Certificates & Credentials',
    tags: ['Bank Solvency', 'Financial Standing', 'Liquidity', 'Commercial Bank'],
    description: 'Bank Solvency Certificate verifying sound financial condition, high liquidity, and spotless banking track record.',
    markdownContent: `# Bank Solvency Certificate
**Account Name**: ACNABIN, Chartered Accountants
**Bank Evaluation**: Account is maintained with high financial solvency, robust transaction volume, and excellent creditworthiness.`
  },
  {
    id: 'kb-incorporation-certificate',
    fileName: 'Incorporation Certificate.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.20,
    uploadedBy: 'Compliance & Registration',
    uploadDate: '10 Feb 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 1,
    sourcePath: '/test_data/Relevent Documents/Incorporation Certificate.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/Incorporation Certificate.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.97,
    version: '1.0',
    kbCategory: 'Certificates & Credentials',
    tags: ['RJSC', 'Incorporation', 'Legal Entity', 'Statutory Registration'],
    description: 'Certificate of statutory registration and partnership deed validation with ICAB and RJSC.',
    markdownContent: `# Statutory Registration & Legal Certificate
**Entity**: ACNABIN Chartered Accountants / Related Advisory Practice
**Authority**: Registrar of Joint Stock Companies and Firms (RJSC) / ICAB.`
  },

  // ==========================================
  // 4. TAX & STATUTORY LICENSES
  // ==========================================
  {
    id: 'kb-tax-ack-2025-2026',
    fileName: 'Acknowledgement of ACNABIN for the AY 2025-2026.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.11,
    uploadedBy: 'Tax Division',
    uploadDate: '20 Nov 2025',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 1,
    sourcePath: '/test_data/Relevent Documents/Acknowledgement of ACNABIN for the AY 2025-2026.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/Acknowledgement of ACNABIN for the AY 2025-2026.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.99,
    version: 'AY 2025-2026',
    kbCategory: 'Legal & Tax',
    tags: ['NBR', 'Tax Return', 'Acknowledgement', 'AY 2025-2026', 'Large Taxpayers Unit'],
    description: 'Official NBR Income Tax Return Submission Acknowledgement for Assessment Year 2025–2026 confirming full statutory tax compliance.',
    markdownContent: `# National Board of Revenue (NBR) — Income Tax Acknowledgement
**Assessee**: ACNABIN, Chartered Accountants
**Assessment Year**: 2025–2026
**Circle**: Large Taxpayers Unit (LTU) / Circle-11
**Status**: Tax return successfully lodged and assessed.`
  },
  {
    id: 'kb-tin-certificate',
    fileName: 'TIN Certificate.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.24,
    uploadedBy: 'Tax Division',
    uploadDate: '10 Jan 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 1,
    sourcePath: '/test_data/Relevent Documents/TIN Certificate.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/TIN Certificate.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.99,
    version: '12-digit e-TIN',
    kbCategory: 'Legal & Tax',
    tags: ['e-TIN', 'Tax Identification', 'NBR', 'Taxes Zone-05'],
    description: '12-digit electronic Taxpayer Identification Number (e-TIN) certificate issued by National Board of Revenue.',
    markdownContent: `# e-TIN Certificate
**Taxpayer**: ACNABIN, Chartered Accountants
**TIN**: 12-digit valid e-TIN registered with Taxes Zone 05, Dhaka.`
  },
  {
    id: 'kb-bin-certificate',
    fileName: 'BIN Certificate.PDF',
    fileType: 'PDF',
    fileSizeMb: 0.36,
    uploadedBy: 'VAT & Indirect Tax Division',
    uploadDate: '10 Jan 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 1,
    sourcePath: '/test_data/Relevent Documents/BIN Certificate.PDF',
    sourceFileRelativePath: 'test_data/Relevent Documents/BIN Certificate.PDF',
    folderName: 'Relevent Documents',
    aiConfidence: 0.99,
    version: '13-digit e-BIN',
    kbCategory: 'Legal & Tax',
    tags: ['BIN', 'VAT Registration', '13-digit', 'Customs Excise & VAT'],
    description: '13-digit electronic Business Identification Number (e-BIN) VAT registration certificate under VAT Act 2012.',
    markdownContent: `# VAT Registration Certificate (e-BIN)
**Entity**: ACNABIN, Chartered Accountants
**BIN**: 13-digit Business Identification Number under Customs, Excise and VAT Commissionerate, Dhaka.`
  },
  {
    id: 'kb-trade-license',
    fileName: 'Trade License.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.26,
    uploadedBy: 'Compliance & Legal',
    uploadDate: '01 Jul 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 1,
    sourcePath: '/test_data/Relevent Documents/Trade License.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/Trade License.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.98,
    version: 'FY 2026–2027',
    kbCategory: 'Legal & Tax',
    tags: ['Trade License', 'DNCC', 'Dhaka North City Corporation', 'Kawran Bazar'],
    description: 'Valid Trade License issued by Dhaka North City Corporation (Zone-05) for Chartered Accountancy & Management Consultancy.',
    markdownContent: `# Dhaka North City Corporation — Trade License
**Business Nature**: Chartered Accountancy & Management Consulting
**Office Address**: BDBL Bhaban (Level-13 & 15), 12 Kawran Bazar C/A, Dhaka-1215
**Validity**: Valid through FY 2026–2027.`
  },

  // ==========================================
  // 5. APPOINTMENT LETTERS, WORK ORDERS & VERIFIED CLIENT EXPERIENCES
  // ==========================================
  {
    id: 'kb-el-unilever',
    fileName: 'Engagement Letter- Unilever Bangladesh.pdf',
    fileType: 'PDF',
    fileSizeMb: 2.15,
    uploadedBy: 'Corporate Assurance Practice',
    uploadDate: '14 Jan 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 4,
    sourcePath: '/test_data/Relevent Documents/Engagement Letter- Unilever Bangladesh.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/Engagement Letter- Unilever Bangladesh.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.99,
    version: '1.0',
    kbCategory: 'Company Experience',
    tags: ['Unilever Bangladesh', 'MNC', 'FMCG', 'Assurance', 'Internal Controls', 'Distribution Audit'],
    description: 'Executed Engagement Letter with Unilever Bangladesh Limited for specialized assurance, distributor controls testing, and financial compliance review.',
    markdownContent: `# Unilever Bangladesh Limited — Engagement Letter
**Client**: Unilever Bangladesh Limited (Leading FMCG Multinational)
**Auditor**: ACNABIN, Chartered Accountants
**Scope**: Operational review, distribution channel compliance, inventory reconciliation, and financial control testing.`
  },
  {
    id: 'kb-al-titas-gas',
    fileName: 'Acceptance of Appointment- Titas Gas Transmission Ltd.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.19,
    uploadedBy: 'Public Sector Practice',
    uploadDate: '19 Jan 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 2,
    sourcePath: '/test_data/Relevent Documents/Acceptance of Appointment- Titas Gas Transmission Ltd.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/Acceptance of Appointment- Titas Gas Transmission Ltd.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.98,
    version: '1.0',
    kbCategory: 'Company Experience',
    tags: ['Titas Gas', 'Petrobangla', 'State-Owned Enterprise', 'Energy & Utilities', 'Financial Audit'],
    description: 'Formal appointment and acceptance documentation for state-owned energy utility Titas Gas Transmission and Distribution Co. Ltd.',
    markdownContent: `# Titas Gas Transmission and Distribution Company Limited
**Client**: Titas Gas Transmission & Distribution Co. Ltd. (Petrobangla Enterprise)
**Scope**: Special statutory financial audit, fixed asset verification, billing controls, and compliance testing.`
  },
  {
    id: 'kb-al-berger-paints',
    fileName: 'Appointment letter- Berger Paints Bangladesh Ltd.pdf',
    fileType: 'PDF',
    fileSizeMb: 1.89,
    uploadedBy: 'Corporate Assurance',
    uploadDate: '08 Mar 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 3,
    sourcePath: '/test_data/Relevent Documents/Appointment letter- Berger Paints Bangladesh Ltd.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/Appointment letter- Berger Paints Bangladesh Ltd.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.99,
    version: '1.0',
    kbCategory: 'Company Experience',
    tags: ['Berger Paints', 'Listed MNC', 'Manufacturing', 'Statutory Assurance', 'Tax Compliance'],
    description: 'Appointment letter from Berger Paints Bangladesh Ltd for corporate audit and tax compliance assurance.',
    markdownContent: `# Berger Paints Bangladesh Limited — Appointment Letter
**Client**: Berger Paints Bangladesh Limited (Publicly Listed MNC)
**Scope**: Statutory financial assurance, internal controls review, and corporate taxation compliance.`
  },
  {
    id: 'kb-cert-walton',
    fileName: 'Completion Certificate - Walton Hi-Tech Industries Ltd.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.44,
    uploadedBy: 'Advisory Division',
    uploadDate: '28 Feb 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 2,
    sourcePath: '/test_data/Relevent Documents/Completion Certificate - Walton Hi-Tech Industries Ltd.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/Completion Certificate - Walton Hi-Tech Industries Ltd.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.99,
    version: '1.0',
    kbCategory: 'Company Experience',
    tags: ['Walton Hi-Tech', 'Completion Certificate', 'Manufacturing', 'Internal Controls', 'Special Audit'],
    description: 'Formal assignment completion certificate from Walton Hi-Tech Industries PLC praising high technical quality and on-time completion.',
    markdownContent: `# Walton Hi-Tech Industries PLC — Completion Certificate
**Client**: Walton Hi-Tech Industries PLC
**Service**: Internal control assessment, inventory valuation, and special investigation. Delivered successfully with highest rating.`
  },
  {
    id: 'kb-al-jenson-nicholson',
    fileName: 'Appointment letter-  Jenson & Nicholson Bangladesh Ltd.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.87,
    uploadedBy: 'Corporate Assurance',
    uploadDate: '12 Feb 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 3,
    sourcePath: '/test_data/Relevent Documents/Appointment letter-  Jenson & Nicholson Bangladesh Ltd.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/Appointment letter-  Jenson & Nicholson Bangladesh Ltd.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.98,
    version: '1.0',
    kbCategory: 'Company Experience',
    tags: ['Jenson & Nicholson', 'Manufacturing', 'Statutory Audit', 'Corporate Governance'],
    description: 'Appointment letter from Jenson & Nicholson Bangladesh Ltd for annual statutory audit and corporate compliance.',
    markdownContent: `# Jenson & Nicholson Bangladesh Ltd — Appointment Letter
**Appointed**: ACNABIN, Chartered Accountants
**Scope**: Annual financial statements audit, statutory registers inspection, and corporate tax certification.`
  },
  {
    id: 'kb-al-rising-group',
    fileName: 'Appointment Letter- Rising Group.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.41,
    uploadedBy: 'Garment & Industrial Practice',
    uploadDate: '18 Apr 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 2,
    sourcePath: '/test_data/Relevent Documents/Appointment Letter- Rising Group.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/Appointment Letter- Rising Group.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.98,
    version: '1.0',
    kbCategory: 'Company Experience',
    tags: ['Rising Group', 'RMG & Textiles', 'Group Audit', 'Export Supply Chain'],
    description: 'Appointment letter from Rising Group (leading RMG manufacturer & exporter) for multi-entity statutory audit and internal review.',
    markdownContent: `# Rising Group — Appointment Letter
**Client**: Rising Group (Garments & Textiles Conglomerate)
**Scope**: Group entity financial audit, export documentation verification, and supply chain control testing.`
  },
  {
    id: 'kb-al-nippon-mcdonald',
    fileName: 'Appointment letter- Nippon & McDonald.pdf',
    fileType: 'PDF',
    fileSizeMb: 1.90,
    uploadedBy: 'Corporate Practice',
    uploadDate: '22 Mar 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 3,
    sourcePath: '/test_data/Relevent Documents/Appointment letter- Nippon & McDonald.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/Appointment letter- Nippon & McDonald.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.97,
    version: '1.0',
    kbCategory: 'Company Experience',
    tags: ['Nippon & McDonald', 'Joint Venture', 'Corporate Audit', 'Tax Advisory'],
    description: 'Appointment letter from Nippon & McDonald Bangladesh for corporate statutory assurance and taxation consulting.',
    markdownContent: `# Nippon & McDonald — Appointment Letter
**Scope**: Statutory audit, foreign exchange compliance, transfer pricing review, and corporate tax return filing.`
  },
  {
    id: 'kb-al-inspace-architects',
    fileName: 'Appointment Letter - Inspace Architects Limited.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.71,
    uploadedBy: 'Advisory Practice',
    uploadDate: '11 May 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 2,
    sourcePath: '/test_data/Relevent Documents/Appointment Letter - Inspace Architects Limited.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/Appointment Letter - Inspace Architects Limited.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.97,
    version: '1.0',
    kbCategory: 'Company Experience',
    tags: ['Inspace Architects', 'Consulting', 'Financial Structuring', 'SOP Review'],
    description: 'Appointment letter from Inspace Architects Limited for financial systems review, accounting manual formulation, and compliance advisory.',
    markdownContent: `# Inspace Architects Limited — Appointment Letter
**Scope**: Financial workflow design, accounting SOP manual preparation, and corporate tax advisory.`
  },
  {
    id: 'kb-el-sirajganj-ez',
    fileName: 'Engagement Letter- Sirajganj Economic Zone Limited.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.94,
    uploadedBy: 'Infrastructure Practice',
    uploadDate: '04 Mar 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 3,
    sourcePath: '/test_data/Relevent Documents/Engagement Letter- Sirajganj Economic Zone Limited.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/Engagement Letter- Sirajganj Economic Zone Limited.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.98,
    version: '1.0',
    kbCategory: 'Company Experience',
    tags: ['Sirajganj Economic Zone', 'BEZA', 'Infrastructure', 'Feasibility & SOP', 'Financial Governance'],
    description: 'Executed Engagement Letter for Sirajganj Economic Zone Limited covering institutional financial structuring, SOP design, and governance frameworks.',
    markdownContent: `# Sirajganj Economic Zone Limited — Engagement Letter
**Client**: Sirajganj Economic Zone Limited (Largest Private EZ in Bangladesh)
**Scope**: Institutional financial policies, standard operating procedures (SOPs), and investor compliance governance framework.`
  },
  {
    id: 'kb-wo-dcci',
    fileName: 'Work Order- Dhaka Chamber of Commerce & Industry.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.41,
    uploadedBy: 'Institutional Advisory Practice',
    uploadDate: '10 Jun 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 2,
    sourcePath: '/test_data/Relevent Documents/Work Order- Dhaka Chamber of Commerce & Industry.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/Work Order- Dhaka Chamber of Commerce & Industry.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.99,
    version: '1.0',
    kbCategory: 'Company Experience',
    tags: ['DCCI', 'Dhaka Chamber of Commerce', 'Apex Chamber', 'Internal Controls', 'Policy Formulation'],
    description: 'Official Work Order from Dhaka Chamber of Commerce & Industry (DCCI) for institutional governance, internal controls, and financial management consultancy.',
    markdownContent: `# Dhaka Chamber of Commerce & Industry (DCCI) — Work Order
**Client**: DCCI (Apex Chamber in Bangladesh)
**Scope**: Institutional governance review, delegation of financial powers, automated ERP control evaluation, and accounting manual update.`
  },
  {
    id: 'kb-wo-mrdi',
    fileName: 'Work Order- Media Resources Development Initiative.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.25,
    uploadedBy: 'NGO & Civil Society Practice',
    uploadDate: '15 Jul 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 2,
    sourcePath: '/test_data/Relevent Documents/Work Order- Media Resources Development Initiative.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/Work Order- Media Resources Development Initiative.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.99,
    version: '1.0',
    kbCategory: 'Company Experience',
    tags: ['MRDI', 'Media & Civil Society', 'NGO Governance', 'Donor Compliance', 'Swedish SIDA'],
    description: 'Work order from Media Resources Development Initiative (MRDI) for institutional governance review, donor compliance, and financial management.',
    markdownContent: `# Media Resources Development Initiative (MRDI) — Work Order
**Client**: MRDI (Leading Media & Development Non-Profit in Bangladesh)
**Scope**: Institutional governance restructuring, financial policy formulation, and donor reporting compliance.`
  },
  {
    id: 'kb-wo-ispahani',
    fileName: 'Work Order- Ispahani Foods Limited.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.30,
    uploadedBy: 'Corporate Assurance',
    uploadDate: '01 Jun 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 2,
    sourcePath: '/test_data/Relevent Documents/Work Order- Ispahani Foods Limited.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/Work Order- Ispahani Foods Limited.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.98,
    version: '1.0',
    kbCategory: 'Company Experience',
    tags: ['Ispahani Foods', 'FMCG Conglomerate', 'Internal Audit', 'Supply Chain Controls'],
    description: 'Work order from Ispahani Foods Limited for risk-based operational audit and supply chain internal control review.',
    markdownContent: `# Ispahani Foods Limited — Work Order
**Client**: Ispahani Foods Limited (M.M. Ispahani Group)
**Scope**: Operational audit, raw material yield assessment, distribution warehouse controls, and financial reporting verification.`
  },
  {
    id: 'kb-previous-client-list-xlsx',
    fileName: 'Previous Client List.xlsx',
    fileType: 'XLSX',
    fileSizeMb: 1.11,
    uploadedBy: 'Knowledge Management',
    uploadDate: '01 Aug 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 15,
    sourcePath: '/test_data/Relevent Documents/Previous Client List.xlsx',
    sourceFileRelativePath: 'test_data/Relevent Documents/Previous Client List.xlsx',
    folderName: 'Relevent Documents',
    aiConfidence: 0.99,
    version: '2026.2',
    kbCategory: 'Company Experience',
    tags: ['Master Client List', '300+ Clients', 'Banking', 'NGOs', 'Manufacturing', 'Energy', 'Public Sector'],
    description: 'Comprehensive database of 300+ past client engagements across Banking & NBFIs, Multinational Corporations, Development Agencies, State-Owned Enterprises, and Manufacturing Leaders.',
    markdownContent: `# ACNABIN Master Client List (Selected Overview)
## 1. Development Agencies & INGOs
- World Bank, Asian Development Bank (ADB), GIZ, SNV Netherlands, Plan International, Start Fund Bangladesh, BRAC, PKSF, JAAGO Foundation, ActionAid, CARE.

## 2. Commercial Banking & Financial Institutions
- BRAC Bank PLC, City Bank PLC, Uttara Bank PLC, NCC Bank PLC, Sonali Bank PLC, Standard Chartered, Eastern Bank, IDLC Finance, IPDC.

## 3. Multinational Corporations (MNCs)
- Unilever Bangladesh, Berger Paints, British American Tobacco, Siemens, Nestle, Marico, Reckitt Benckiser, Heidelberg Cement.

## 4. Public Sector & State Enterprises
- Petrobangla, Titas Gas, BSFIC (North Bengal Sugar Mills, Faridpur Sugar Mills), Bangladesh Bank, BSEC.`
  },

  // ==========================================
  // 6. BENCHMARK WINNING PROPOSALS (TASK 2 KNOWLEDGE CORPUS)
  // ==========================================
  {
    id: 'kb-prop-snv-drought',
    fileName: 'ACNABIN_SNV_Technical_Proposal_Draft.docx',
    fileType: 'DOCX',
    fileSizeMb: 0.21,
    uploadedBy: 'Governance Advisory Practice',
    uploadDate: '15 Aug 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 38,
    sourcePath: '/test_data/Previous Proposal/ACNABIN_SNV_Technical_Proposal_Draft.docx',
    sourceFileRelativePath: 'test_data/Previous Proposal/ACNABIN_SNV_Technical_Proposal_Draft.docx',
    folderName: 'Previous Proposal',
    aiConfidence: 0.99,
    version: 'Final v1.0',
    kbCategory: 'Previous Proposals',
    tags: ['SNV Netherlands', 'Policy Review', 'Legal Scan', 'Drought Governance', 'Water Cycles', 'INGO Benchmark'],
    description: 'Technical Proposal for Policy Review and Legal Scan on Drought Governance in Bangladesh under Sustainable Urban Water Cycles Project submitted to SNV Netherlands Development Organisation.',
    markdownContent: `# Technical Proposal: Policy Review & Legal Scan on Drought Governance
**Client**: SNV Netherlands Development Organisation
**Key Structure**:
1. Understanding of the Assignment & Governance Challenge
2. Overall Objectives and Specific Results
3. Scope of Work & Policy/Legal Universe
4. Phased Technical Methodology (Inception -> Policy Scan -> Key Informant Interviews -> Validation Workshop -> Final Report)
5. Detailed Work Plan & Deliverables Acceptance Framework
6. Expert Team Composition & Quality Assurance under ISQM 1.`
  },
  {
    id: 'kb-prop-brac-bank-ai',
    fileName: 'BRAC_Bank_AI_Strategy_Proposal_ACNABIN_CipherShield.docx',
    fileType: 'DOCX',
    fileSizeMb: 0.14,
    uploadedBy: 'IT Advisory & Governance',
    uploadDate: '20 Jul 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 26,
    sourcePath: '/test_data/Previous Proposal/BRAC_Bank_AI_Strategy_Proposal_ACNABIN_CipherShield.docx',
    sourceFileRelativePath: 'test_data/Previous Proposal/BRAC_Bank_AI_Strategy_Proposal_ACNABIN_CipherShield.docx',
    folderName: 'Previous Proposal',
    aiConfidence: 0.99,
    version: 'Final v1.0',
    kbCategory: 'Previous Proposals',
    tags: ['BRAC Bank', 'AI Strategy', 'AI Governance', 'CipherShield Consortium', 'Banking IT'],
    description: 'Enterprise AI Strategy, Governance Framework and Implementation Roadmap proposal for BRAC Bank PLC in consortium with CipherShield.',
    markdownContent: `# BRAC Bank PLC — Enterprise AI Strategy & Governance Framework
**Consortium**: ACNABIN Chartered Accountants (Lead) & CipherShield Bangladesh
**Core Sections**:
- Executive Summary & Banking Transformation Context
- AI Readiness Assessment & Use-Case Prioritization Matrix
- Ethical AI Governance, Model Risk Management & Bangladesh Bank Regulatory Alignment
- Multi-Stream Delivery Roadmap (Strategy, Architecture, Governance, Implementation)
- Fixed Milestones, Deliverable Matrix & Expert Staffing Bench.`
  },
  {
    id: 'kb-prop-city-bank-tech',
    fileName: 'City_Bank_PLC_CMMI_DEV_L3_PartB_Technical_Proposal_ACNABIN-CS-ICS.docx',
    fileType: 'DOCX',
    fileSizeMb: 0.83,
    uploadedBy: 'IT Advisory & Assurance',
    uploadDate: '30 Aug 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 42,
    sourcePath: '/test_data/Previous Proposal/City_Bank_PLC_CMMI_DEV_L3_PartB_Technical_Proposal_ACNABIN-CS-ICS.docx',
    sourceFileRelativePath: 'test_data/Previous Proposal/City_Bank_PLC_CMMI_DEV_L3_PartB_Technical_Proposal_ACNABIN-CS-ICS.docx',
    folderName: 'Previous Proposal',
    aiConfidence: 0.99,
    version: 'Part B Technical',
    kbCategory: 'Previous Proposals',
    tags: ['City Bank PLC', 'CMMI DEV Level 3', 'Appraisal', 'Banking IT', 'Consortium Bid'],
    description: 'Technical Proposal for Capability Maturity Model Integration (CMMI)-DEV Level 3 Certification Benchmark Appraisal for City Bank PLC.',
    markdownContent: `# Technical Proposal: CMMI-DEV Level 3 Appraisal for City Bank PLC
**Prime Bidder**: ACNABIN Chartered Accountants
**Technical Appraisal Partner**: Ionbay Consulting Services (ICS) & CipherShield
**Structure**:
- Benchmark Appraisal Methodology (SCAMPI / CMMI v2.0)
- Process Area Mapping & Evidence Sampling Framework
- Appraisal Readiness Verification & Risk Mitigation
- Quality Assurance, Non-Disclosure & Conflict of Interest Protocols.`
  },
  {
    id: 'kb-prop-city-bank-fin',
    fileName: 'City_Bank_PLC_CMMI_DEV_L3_PartB_Financial_Proposal_ACNABIN-CS-ICS.docx',
    fileType: 'DOCX',
    fileSizeMb: 0.81,
    uploadedBy: 'Commercial Division',
    uploadDate: '30 Aug 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 16,
    sourcePath: '/test_data/Previous Proposal/City_Bank_PLC_CMMI_DEV_L3_PartB_Financial_Proposal_ACNABIN-CS-ICS.docx',
    sourceFileRelativePath: 'test_data/Previous Proposal/City_Bank_PLC_CMMI_DEV_L3_PartB_Financial_Proposal_ACNABIN-CS-ICS.docx',
    folderName: 'Previous Proposal',
    aiConfidence: 0.98,
    version: 'Part B Financial',
    kbCategory: 'Previous Proposals',
    tags: ['City Bank PLC', 'Financial Proposal', 'Commercial Fee Table', 'Tax & VAT', 'Milestones'],
    description: 'Commercial proposal structure presenting milestone-based professional fees, reimbursable expenses, and statutory VAT/tax breakdown.',
    markdownContent: `# Financial Proposal: City Bank PLC CMMI Level 3
- Clear Professional Fee Matrix linked directly to Deliverables.
- Explicit VAT (15%) and AIT (10%) statutory tax treatment.
- Payment milestones tied to formal appraisal acceptance.`
  },
  {
    id: 'kb-prop-pksf',
    fileName: 'Technical Proposal For PKSF.docx',
    fileType: 'DOCX',
    fileSizeMb: 0.18,
    uploadedBy: 'Public & Non-Profit Sector Practice',
    uploadDate: '05 Aug 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 52,
    sourcePath: '/test_data/Previous Proposal/Technical Proposal For PKSF.docx',
    sourceFileRelativePath: 'test_data/Previous Proposal/Technical Proposal For PKSF.docx',
    folderName: 'Previous Proposal',
    aiConfidence: 0.99,
    version: 'Final Winning Bid',
    kbCategory: 'Previous Proposals',
    tags: ['PKSF', 'PO Audit', 'Microfinance', 'Nationwide Field Audit', 'Risk-to-Procedure', 'Annexures A-L'],
    description: 'Major Technical Proposal for nationwide audit of Partner Organizations (POs) of Palli Karma-Sahayak Foundation (PKSF) across 64 districts.',
    markdownContent: `# Technical Proposal: PKSF Partner Organization Audit FY 2026–2027
**Client**: Palli Karma-Sahayak Foundation (PKSF)
**Distinctive Highlights**:
- In-depth Risk-to-Procedure Linkage Matrix (Section 2.4.2).
- Multi-tier Fieldwork Mobilization across 64 districts.
- Comprehensive Annexures A to L reporting framework.
- ISQM 1 Quality Review protocol ensuring zero non-conformances.`
  },
  {
    id: 'kb-prop-uttara-bank',
    fileName: 'Technical Proposal-Uttara Bank (1).docx',
    fileType: 'DOCX',
    fileSizeMb: 3.56,
    uploadedBy: 'Banking Advisory Practice',
    uploadDate: '12 Jul 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 45,
    sourcePath: '/test_data/Previous Proposal/Technical Proposal-Uttara Bank (1).docx',
    sourceFileRelativePath: 'test_data/Previous Proposal/Technical Proposal-Uttara Bank (1).docx',
    folderName: 'Previous Proposal',
    aiConfidence: 0.99,
    version: 'Final',
    kbCategory: 'Previous Proposals',
    tags: ['Uttara Bank', 'Financial Modeling', 'Excel Analytics', 'SLA', 'Post-Implementation Support'],
    description: 'Technical Proposal for Consultancy Services and Advanced Excel-Based Financial Tool for Uttara Bank PLC featuring comprehensive SLA and maintenance terms.',
    markdownContent: `# Technical Proposal: Financial Modeling & Analytical Tool for Uttara Bank PLC
**Client**: Uttara Bank PLC
**Core Sections**:
- Executive Summary & Banking Operational Context
- Detailed Tool Architecture & Automated Reconciliation Logic
- Service Level Agreement (SLA) & Post-Implementation Support (Section 6)
- Conflict of Interest & Data Privacy Declaration (Section 7)
- Phased Implementation & User Training Schedules.`
  },
  {
    id: 'kb-prop-north-bengal-fa',
    fileName: 'Technical Proposal for North Bengal FA Revaluation.docx',
    fileType: 'DOCX',
    fileSizeMb: 0.22,
    uploadedBy: 'Valuation & Advisory',
    uploadDate: '09 Aug 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 28,
    sourcePath: '/test_data/Previous Proposal/Technical Proposal for North Bengal FA Revaluation.docx',
    sourceFileRelativePath: 'test_data/Previous Proposal/Technical Proposal for North Bengal FA Revaluation.docx',
    folderName: 'Previous Proposal',
    aiConfidence: 0.99,
    version: 'Final',
    kbCategory: 'Previous Proposals',
    tags: ['North Bengal Sugar Mills', 'BSFIC', 'Fixed Assets Revaluation', 'FAR Tagging', 'State Enterprise'],
    description: 'Technical Proposal for Revaluation of Assets and Liabilities and Preparation of Fixed Assets Register (FAR) with Asset Tagging for North Bengal Sugar Mills Ltd.',
    markdownContent: `# Technical Proposal: Fixed Asset Revaluation & FAR for North Bengal Sugar Mills
**Client**: Bangladesh Sugar & Food Industries Corporation (BSFIC)
**Methodology Highlights**:
- Physical verification and technical inspection of plant, machinery, land, and buildings.
- Depreciated Replacement Cost (DRC) and Fair Market Value valuation methods.
- Barcode asset tagging and computerized Fixed Asset Register compilation.`
  },
  {
    id: 'kb-prop-faridpur-pf',
    fileName: 'Technical Proposal for Faridpur PF Forensic Audit.docx',
    fileType: 'DOCX',
    fileSizeMb: 0.22,
    uploadedBy: 'Forensic Audit Division',
    uploadDate: '13 Aug 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 26,
    sourcePath: '/test_data/Previous Proposal/Technical Proposal for Faridpur PF Forensic Audit.docx',
    sourceFileRelativePath: 'test_data/Previous Proposal/Technical Proposal for Faridpur PF Forensic Audit.docx',
    folderName: 'Previous Proposal',
    aiConfidence: 0.99,
    version: 'Final',
    kbCategory: 'Previous Proposals',
    tags: ['Faridpur Sugar Mills', 'Forensic Audit', 'Provident Fund', 'Fraud Investigation', 'Fund Tracing'],
    description: 'Technical Proposal for Forensic Audit of Provident Fund (PF) Accounts of Faridpur Sugar Mills Ltd.',
    markdownContent: `# Technical Proposal: Forensic Audit of Faridpur Sugar Mills PF Accounts
**Client**: Bangladesh Sugar & Food Industries Corporation (BSFIC)
**Forensic Audit Workflows**:
- 100% substantive transaction tracing of PF contributions and loans.
- Bank reconciliation reconstruction and unauthorized diversion checks.
- Internal control failure diagnosis and fraud risk mitigation measures.`
  },
  {
    id: 'kb-prop-brgewa-tech',
    fileName: 'Technical Proposal BRGEWA.docx',
    fileType: 'DOCX',
    fileSizeMb: 0.23,
    uploadedBy: 'Audit & Institutional Practice',
    uploadDate: '01 Jul 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 22,
    sourcePath: '/test_data/Previous Proposal/Technical Proposal BRGEWA.docx',
    sourceFileRelativePath: 'test_data/Previous Proposal/Technical Proposal BRGEWA.docx',
    folderName: 'Previous Proposal',
    aiConfidence: 0.98,
    version: 'Final',
    kbCategory: 'Previous Proposals',
    tags: ['BRGEWA', 'Welfare Association', 'Special Financial Audit', 'Constitutional Review'],
    description: 'Technical Proposal for Audit of Bangladesh Retired Government Employees\' Welfare Association.',
    markdownContent: `# Technical Proposal: Audit of BRGEWA
**Client**: Bangladesh Retired Government Employees' Welfare Association
**Scope**: Constitutional compliance, examination of sub-committee reports, and multi-year financial audit.`
  },
  {
    id: 'kb-prop-giz-data-exchange',
    fileName: 'EOI For Data Exchange Ecosystem of GIZ- ACNABIN CipherShield.docx',
    fileType: 'DOCX',
    fileSizeMb: 0.33,
    uploadedBy: 'Technology & Development Practice',
    uploadDate: '25 Jun 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 30,
    sourcePath: '/test_data/Previous Proposal/EOI For Data Exchange Ecosystem of GIZ- ACNABIN CipherShield.docx',
    sourceFileRelativePath: 'test_data/Previous Proposal/EOI For Data Exchange Ecosystem of GIZ- ACNABIN CipherShield.docx',
    folderName: 'Previous Proposal',
    aiConfidence: 0.99,
    version: 'Final EOI',
    kbCategory: 'Previous Proposals',
    tags: ['GIZ Bangladesh', 'Data Space', 'Data Exchange Ecosystem', 'STILE II', 'CipherShield'],
    description: 'Expression of Interest and Technical Capability Statement for Data Exchange Ecosystem Development under GIZ STILE II Project.',
    markdownContent: `# Technical Statement: Data Exchange Ecosystem for GIZ STILE II
**Client**: Deutsche Gesellschaft für Internationale Zusammenarbeit (GIZ) GmbH
**Consulting Consortium**: ACNABIN & CipherShield
**Scope**: Vendor-neutral shared data space architecture, interoperability standards, and 12-month pilot demonstration.`
  },
  {
    id: 'kb-prop-ncc-bank-pci',
    fileName: 'NCC_Bank_PCI_DSS_Commercial_Proposal (1).docx',
    fileType: 'DOCX',
    fileSizeMb: 0.02,
    uploadedBy: 'IT Assurance Practice',
    uploadDate: '10 May 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 6,
    sourcePath: '/test_data/Previous Proposal/NCC_Bank_PCI_DSS_Commercial_Proposal (1).docx',
    sourceFileRelativePath: 'test_data/Previous Proposal/NCC_Bank_PCI_DSS_Commercial_Proposal (1).docx',
    folderName: 'Previous Proposal',
    aiConfidence: 0.97,
    version: 'Final',
    kbCategory: 'Previous Proposals',
    tags: ['NCC Bank', 'PCI DSS', 'Commercial Proposal', 'Banking Security'],
    description: 'Commercial proposal for PCI DSS implementation and re-certification services for NCC Bank PLC.',
    markdownContent: `# Commercial Proposal: PCI DSS Re-Certification for NCC Bank PLC
**Client**: NCC Bank PLC
**Scope**: Cardholder data environment (CDE) gap assessment, remediation advisory, and QSA audit support.`
  },
  {
    id: 'kb-prop-trust-sonali-pci',
    fileName: 'Trust_Financial Proposal_20251222.docx',
    fileType: 'DOCX',
    fileSizeMb: 3.34,
    uploadedBy: 'Commercial Division',
    uploadDate: '22 Dec 2025',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 18,
    sourcePath: '/test_data/Previous Proposal/Trust_Financial Proposal_20251222.docx',
    sourceFileRelativePath: 'test_data/Previous Proposal/Trust_Financial Proposal_20251222.docx',
    folderName: 'Previous Proposal',
    aiConfidence: 0.98,
    version: 'Final',
    kbCategory: 'Previous Proposals',
    tags: ['Sonali Bank PLC', 'PCI DSS', 'Financial Proposal', 'Milestone Commercials'],
    description: 'Detailed financial proposal for PCI DSS consulting, implementation, and certification for Sonali Bank PLC.',
    markdownContent: `# Financial Proposal: Sonali Bank PLC PCI-DSS Certification
**Client**: Sonali Bank PLC
**Commercial Terms**: Milestone-linked fees, statutory taxes, and on-site technical testing budgets.`
  },
  {
    id: 'kb-prop-byc-technical-pdf',
    fileName: 'Technical Proposal for Bangladesh Youth Coalition.pdf',
    fileType: 'PDF',
    fileSizeMb: 1.39,
    uploadedBy: 'Governance Advisory Practice',
    uploadDate: '06 Sep 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 24,
    sourcePath: '/test_data/Relevent Documents/Technical Proposal for Bangladesh Youth Coalition.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/Technical Proposal for Bangladesh Youth Coalition.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.99,
    version: '1.0',
    kbCategory: 'Previous Proposals',
    tags: ['BYC', 'Technical Proposal', 'Governance Framework', 'MoU', 'Plan International'],
    description: 'Winning Technical Proposal for Strengthening Governance and Institutional Framework of Bangladesh Youth Coalition (BYC).',
    markdownContent: `# Technical Proposal: Bangladesh Youth Coalition (BYC) Governance Framework
**Client**: Bangladesh Youth Coalition (BYC) / Youth For Change Bangladesh Foundation (YFC-BD)
**Supported By**: Plan International Bangladesh & Embassy of the Kingdom of the Netherlands
**12-Week Delivery Phases**:
1. Inception & Desk Review of 102 Member CSOs
2. Consultative Dialogue & Division-Level Feedback Sessions
3. Drafting Core MoU & 8 Institutional Annexures
4. Validation Workshops & Consensus Building
5. Final Approval, Executive Toolkits & Handover.`
  },
  {
    id: 'kb-prop-technical-highlighted-pdf',
    fileName: 'TECHNICAL PROPOSAL Highlighted.pdf',
    fileType: 'PDF',
    fileSizeMb: 8.62,
    uploadedBy: 'Advisory Knowledge Base',
    uploadDate: '10 Aug 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 48,
    sourcePath: '/test_data/Relevent Documents/TECHNICAL PROPOSAL Highlighted.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/TECHNICAL PROPOSAL Highlighted.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.99,
    version: 'Highlighted Reference',
    kbCategory: 'Previous Proposals',
    tags: ['Gold Standard', 'Reference Proposal', 'Typography', 'Section Layout', 'Tables'],
    description: 'Gold-standard annotated reference proposal demonstrating optimal layout, table styling, RACI matrices, and ISQM 1 QA controls.',
    markdownContent: `# Annotated Reference Technical Proposal
Exemplary proposal benchmark demonstrating ACNABIN house style:
- Professional Tahoma/Segoe UI typography with Navy (#002060) accent headers.
- Structured Work Plan and Deliverable Acceptance Criteria.
- Comprehensive Responsibility Matrix and Risk Mitigation Table.`
  },

  // ==========================================
  // 7. ENLISTMENT APPLICATIONS & TEMPLATES
  // ==========================================
  {
    id: 'kb-jaago-enlistment',
    fileName: 'JAAGO Vendor Enlistment Application Form.docx',
    fileType: 'DOCX',
    fileSizeMb: 0.38,
    uploadedBy: 'NGO & Civil Society Practice',
    uploadDate: '29 Jul 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 8,
    sourcePath: '/test_data/Previous Proposal/JAAGO Vendor Enlistment Application Form.docx',
    sourceFileRelativePath: 'test_data/Previous Proposal/JAAGO Vendor Enlistment Application Form.docx',
    folderName: 'Previous Proposal',
    aiConfidence: 0.99,
    version: '2026',
    kbCategory: 'Certificates & Credentials',
    tags: ['JAAGO Foundation', 'Vendor Enlistment', 'Audit Enlistment', 'NGO Enlistment'],
    description: 'Completed corporate enlistment application for JAAGO Foundation Trust for Audit and Advisory Services.',
    markdownContent: `# JAAGO Foundation — Vendor Enlistment Application
**Applicant**: ACNABIN, Chartered Accountants
**Service Group**: Group-8, SG-8A: Audit Firm / Chartered Accountancy Firm
**Enlistment Year**: 2026–2027.`
  },
  {
    id: 'kb-annex-3-enlistment',
    fileName: "Annex 3 VENDOR'S ENLISTMENT FORM.docx",
    fileType: 'DOCX',
    fileSizeMb: 0.02,
    uploadedBy: 'Procurement Support',
    uploadDate: '29 Jul 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 3,
    sourcePath: "/test_data/Previous Proposal/Annex 3 VENDOR'S ENLISTMENT FORM.docx",
    sourceFileRelativePath: "test_data/Previous Proposal/Annex 3 VENDOR'S ENLISTMENT FORM.docx",
    folderName: 'Previous Proposal',
    aiConfidence: 0.98,
    version: '2026–2027',
    kbCategory: 'Certificates & Credentials',
    tags: ['Vendor Enlistment', 'Partner Declaration', 'TIN & BIN', 'Annex 3'],
    description: 'Executed vendor enlistment form containing official partner declarations, trade license numbers, and banking details.',
    markdownContent: `# Vendor Enlistment Form (Annex 3)
**Firm**: ACNABIN, Chartered Accountants
**Signatory Partner**: Muhammad Aminul Hoque, FCA
**Details**: DNCC Trade License, 12-digit e-TIN, 13-digit e-BIN, Standard Chartered Bank account info.`
  },
  {
    id: 'kb-submission-enlistment-doc',
    fileName: 'Submission of Application for Vendor Enlistment.docx',
    fileType: 'DOCX',
    fileSizeMb: 0.02,
    uploadedBy: 'Client Coordination',
    uploadDate: '29 Jul 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 2,
    sourcePath: '/test_data/Previous Proposal/Submission of Application for Vendor Enlistment.docx',
    sourceFileRelativePath: 'test_data/Previous Proposal/Submission of Application for Vendor Enlistment.docx',
    folderName: 'Previous Proposal',
    aiConfidence: 0.98,
    version: '1.0',
    kbCategory: 'Certificates & Credentials',
    tags: ['Enlistment Letter', 'Transmittal', 'Credentials Submission'],
    description: 'Formal cover letter transmitting complete firm credentials, trade licenses, partner CVs, and bank solvency for NGO enlistment.',
    markdownContent: `# Transmittal Letter: Application for Vendor Enlistment
**Addressee**: Sr. Manager, Finance and Admin, JAAGO Foundation Trust
**Submitted By**: ACNABIN, Chartered Accountants.`
  },
  {
    id: 'kb-proposal-submission-form-bsfic',
    fileName: 'Proposal Submission Form.docx',
    fileType: 'DOCX',
    fileSizeMb: 0.02,
    uploadedBy: 'Tender Operations',
    uploadDate: '13 Aug 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 2,
    sourcePath: '/test_data/Previous Proposal/Proposal Submission Form.docx',
    sourceFileRelativePath: 'test_data/Previous Proposal/Proposal Submission Form.docx',
    folderName: 'Previous Proposal',
    aiConfidence: 0.98,
    version: '1.0',
    kbCategory: 'Certificates & Credentials',
    tags: ['Submission Form', 'BSFIC', 'Declaration', 'Tender'],
    description: 'Official proposal submission form and declaration of validity for public enterprise procurement.',
    markdownContent: `# Proposal Submission Form
**To**: Chief Auditor, Bangladesh Sugar and Food Industries Corporation (BSFIC)
**Declaration**: Technical and financial proposal validity for statutory forensic and valuation tenders.`
  },

  // ==========================================
  // 8. TORS & REFERENCE SOLICITATIONS
  // ==========================================
  {
    id: 'kb-tor-byc-governance',
    fileName: 'TOR-Consultancy-_BYC-ST-3.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.60,
    uploadedBy: 'Procurement / YFC-BD',
    uploadDate: '01 Sep 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 17,
    sourcePath: '/test_data/Relevent Documents/TOR-Consultancy-_BYC-ST-3.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/TOR-Consultancy-_BYC-ST-3.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.99,
    version: '1.0',
    kbCategory: 'Other',
    tags: ['TOR', 'BYC', 'Youth For Change', 'Governance Framework', 'Plan International', '8 Annexures'],
    description: 'Official Terms of Reference for Consultancy for Strengthening Governance and Institutional Framework of Bangladesh Youth Coalition (BYC).',
    markdownContent: `# Terms of Reference (ToR): BYC Governance Framework
**Client**: Youth For Change Bangladesh Foundation (YFC-BD) / Bangladesh Youth Coalition (BYC)
**Supported By**: Plan International Bangladesh & Embassy of the Kingdom of the Netherlands
**Scope**: Formulation of Core MoU and 8 Institutional Governance Annexures across 102 youth organizations.`
  },
  {
    id: 'kb-tor-gnf-independent-audit',
    fileName: 'GNF-TOR-Independent Audit Bangladesh 01-09-2026.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.16,
    uploadedBy: 'Donor Audit Practice',
    uploadDate: '01 Sep 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 6,
    sourcePath: '/test_data/Relevent Documents/GNF-TOR-Independent Audit Bangladesh 01-09-2026.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/GNF-TOR-Independent Audit Bangladesh 01-09-2026.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.98,
    version: '1.0',
    kbCategory: 'Other',
    tags: ['GNF', 'Independent Audit', 'Donor Grant', 'Fund Verification', 'Anti-Fraud'],
    description: 'Terms of Reference for Independent Financial and Compliance Audit of donor-funded health and community projects in Bangladesh.',
    markdownContent: `# ToR: Independent Financial Audit (GNF Bangladesh)
**Scope**: In-depth transaction verification, procurement compliance, fund flow analysis, and internal control evaluation.`
  },
  {
    id: 'kb-tor-inspire-audit',
    fileName: 'InSPIRE_ToR_Annual Audit_2025-2026.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.12,
    uploadedBy: 'Development Practice',
    uploadDate: '15 Jul 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 5,
    sourcePath: '/test_data/Relevent Documents/InSPIRE_ToR_Annual Audit_2025-2026.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/InSPIRE_ToR_Annual Audit_2025-2026.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.98,
    version: '2025-2026',
    kbCategory: 'Other',
    tags: ['InSPIRE', 'Annual Audit', 'Donor Project', 'NGO Affairs Bureau'],
    description: 'Terms of Reference for Annual Financial Audit and NOAB FD-4 audit certification for the InSPIRE project.',
    markdownContent: `# ToR: InSPIRE Project Annual Audit (2025–2026)
**Scope**: Project financial statements audit, grant compliance review, and submission of FD-4 audit report to NGO Affairs Bureau.`
  },
  {
    id: 'kb-tor-net-zero-esg',
    fileName: 'ToR_Consultancy Services for Net Zero Target Setting and ESG Reporting_SFD.docx',
    fileType: 'DOCX',
    fileSizeMb: 0.02,
    uploadedBy: 'Sustainability & ESG Practice',
    uploadDate: '10 Aug 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 8,
    sourcePath: '/test_data/Previous Proposal/ToR_Consultancy Services for Net Zero Target Setting and ESG Reporting_SFD.docx',
    sourceFileRelativePath: 'test_data/Previous Proposal/ToR_Consultancy Services for Net Zero Target Setting and ESG Reporting_SFD.docx',
    folderName: 'Previous Proposal',
    aiConfidence: 0.98,
    version: '1.0',
    kbCategory: 'Other',
    tags: ['ESG Reporting', 'Net Zero Target', 'Sustainable Finance', 'GRI Standards', 'Banking ESG'],
    description: 'Terms of Reference for Consultancy Services for Net Zero Target Setting and ESG Reporting Enhancement for commercial banking operations.',
    markdownContent: `# ToR: Net Zero Target Setting & ESG Reporting
**Client**: Sustainable Finance Department (SFD)
**Scope**: Scope 1, 2 & 3 greenhouse gas baseline assessment, SBTi-aligned net zero roadmap, and GRI-compliant sustainability reporting.`
  },
  {
    id: 'kb-tor-heifer-vendor',
    fileName: 'ToR_heifer_141.docx',
    fileType: 'DOCX',
    fileSizeMb: 0.04,
    uploadedBy: 'Development Practice',
    uploadDate: '01 Aug 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 6,
    sourcePath: '/test_data/Previous Proposal/ToR_heifer_141.docx',
    sourceFileRelativePath: 'test_data/Previous Proposal/ToR_heifer_141.docx',
    folderName: 'Previous Proposal',
    aiConfidence: 0.98,
    version: '141',
    kbCategory: 'Other',
    tags: ['Heifer International', 'Vendor Enlistment', 'Audit & Tax Panel', 'INGO'],
    description: 'Terms of Reference for Vendor Enlistment for professional audit, taxation, and consulting services for Heifer International Bangladesh.',
    markdownContent: `# Heifer International Bangladesh — Vendor Enlistment ToR
**Scope**: Enlistment of top-tier chartered accountancy firms for annual project audits, tax filing, and advisory.`
  },
  {
    id: 'kb-tor-oxfam-123f',
    fileName: 'ToR_OXFAM_123f.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.46,
    uploadedBy: 'INGO Practice',
    uploadDate: '20 Jun 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 10,
    sourcePath: '/test_data/Relevent Documents/ToR_OXFAM_123f.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/ToR_OXFAM_123f.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.98,
    version: '123f',
    kbCategory: 'Other',
    tags: ['Oxfam Bangladesh', 'Humanitarian Audit', 'Partner NGO Review', 'Grant Compliance'],
    description: 'Terms of Reference for independent audit and financial review of partner NGOs implementing Oxfam humanitarian and resilience projects.',
    markdownContent: `# Oxfam Bangladesh — Independent Project Audit ToR
**Scope**: Partner NGO financial management verification, sample voucher testing, asset verification, and donor compliance reporting.`
  },
  {
    id: 'kb-tor-snv-268',
    fileName: 'ToR_SNV_268.pdf',
    fileType: 'PDF',
    fileSizeMb: 0.32,
    uploadedBy: 'Development Practice',
    uploadDate: '10 Aug 2026',
    processingStatus: 'markdown_converted',
    ocrRequired: false,
    ocrCompleted: true,
    isSearchable: true,
    pageCount: 8,
    sourcePath: '/test_data/Relevent Documents/ToR_SNV_268.pdf',
    sourceFileRelativePath: 'test_data/Relevent Documents/ToR_SNV_268.pdf',
    folderName: 'Relevent Documents',
    aiConfidence: 0.98,
    version: '268',
    kbCategory: 'Other',
    tags: ['SNV Netherlands', 'Urban Water', 'Legal Scan', 'Drought Policy', 'Consultancy ToR'],
    description: 'Official Terms of Reference for Legal and Policy Review on Drought Governance under SNV Urban Water Cycles Project.',
    markdownContent: `# SNV Netherlands — Drought Governance Policy ToR
**Scope**: Comprehensive legal review of national water acts, drought mitigation guidelines, and multi-stakeholder governance models.`
  }
];
