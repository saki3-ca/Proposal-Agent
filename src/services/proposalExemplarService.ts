/**
 * ACNABIN Gold-Standard Reference Proposal Exemplars Service
 * Encodes authentic winning proposal structures, phrasing, tables, team profiles,
 * and experience suites based on the official PKSF, North Bengal, and BYC proposals.
 */

export interface ProposalExemplarSection {
  sectionTitle: string;
  sectionNumber: string;
  writingStyle: string;
  exemplarContent: string;
  sampleTables?: {
    caption?: string;
    headers: string[];
    rows: string[][];
  }[];
}

export class ProposalExemplarService {
  /**
   * Firm Core Profile Facts
   */
  static readonly FIRM_PROFILE = {
    name: 'ACNABIN, Chartered Accountants',
    affiliation: 'An Independent Member Firm of Baker Tilly International',
    establishedYear: 'February 1985 (41+ Years of Practice)',
    partnershipRegistration: 'RJSC (# PF 27897/86) under Section 58(1) of Partnership Act 1932',
    address: 'BDBL Bhaban (Level-13 & 15), 12 Kawran Bazar Commercial Area, Dhaka-1215, Bangladesh',
    chattogramOffice: 'World Trade Centre (Level-03), 102/103 Agrabad Commercial Area, Chattogram',
    phone: '(+88-02) 41020030 to 35',
    email: 'acnabin@bangla.net',
    website: 'www.acnabin.com',
    totalPersonnel: 490,
    partnerCount: 8,
    icabPresidents: 2,
    safaPresidents: 1,
    cisaSpecialists: 5,
    inHouseLawyers: 2,
    globalPresence: '147 countries across 1,400+ offices with 43,000+ professionals worldwide'
  };

  /**
   * Primary and Secondary Contact Persons for Proposals
   */
  static readonly CONTACT_PERSONS = {
    primary: {
      name: 'Abdullah-Al-Mamun, FCA',
      designation: 'Director, Audit & Consultancy',
      email: 'mamun.abdullah@acnabin-bd.com',
      mobile: '+8801915561888'
    },
    secondary: {
      name: 'Nusrat Maria, FCCA, ACA (ICAEW)',
      designation: 'Deputy Director, Audit & Consultancy',
      email: 'nusrat@acnabin-bd.com',
      mobile: '+8801791317795'
    }
  };

  /**
   * 8 FCA Partners Profile Matrix
   */
  static readonly PARTNERS_MATRIX: { sl: number; name: string; qualifications: string; experience: string }[] = [
    { sl: 1, name: 'Abu Sayed Mohammed Nayeem', qualifications: 'B.Com. (Hons.), M.Com., M.Sc. (UK), FCCA (UK), ACA (ICAEW), FCA', experience: '45+ Years' },
    { sl: 2, name: 'Iftekhar Hossain', qualifications: 'B.Com., FCA', experience: '45+ Years' },
    { sl: 3, name: 'Abu Taher Mohammed Abdul Bari', qualifications: 'B.Com., FCA, FCEA (London)', experience: '45+ Years' },
    { sl: 4, name: 'Md. Moniruzzaman', qualifications: 'B.Com. (Hons.), M.Com., FCA', experience: '30+ Years' },
    { sl: 5, name: 'Md. Rokonuzzaman', qualifications: 'B.Com., M.Com., FCA', experience: '28+ Years' },
    { sl: 6, name: 'Md. Mominul Karim', qualifications: 'B.Com. (Hons.), M.Com., FCA', experience: '25+ Years' },
    { sl: 7, name: 'Md. Reajul Islam', qualifications: 'B.B.M (University of Mysore, India), FCA', experience: '22+ Years' },
    { sl: 8, name: 'Muhammad Aminul Hoque', qualifications: 'BBA, MBA (DU), FCA', experience: '21+ Years' }
  ];

  /**
   * 6 Core Key Experts Suite
   */
  static readonly CORE_TEAM_SUITE = [
    {
      position: 'Engagement Partner',
      name: 'Muhammad Aminul Hoque, FCA',
      designation: 'Partner',
      qualification: 'Fellow Chartered Accountant (FCA), ICAB, BBA & MBA (DU)',
      experienceYears: '21+',
      responsibilities: 'Overall engagement leadership, independence assessment, quality review, and final sign-off.'
    },
    {
      position: 'Engagement Director / Team Lead',
      name: 'Abdullah-Al-Mamun, FCA',
      designation: 'Director, Audit & Consultancy',
      qualification: 'Fellow Chartered Accountant (FCA), ICAB, BBA & MBA',
      experienceYears: '20+',
      responsibilities: 'Day-to-day engagement management, methodology execution, and technical supervision.'
    },
    {
      position: 'Tax Specialist',
      name: 'Mohammad Mutasim Hossain, FCA',
      designation: 'Director',
      qualification: 'Fellow Chartered Accountant (FCA), ICAB, BBA & MBA',
      experienceYears: '16+',
      responsibilities: 'TDS, VAT, Income Tax Act 2023 compliance, withholding tax reconciliation, and NBR returns.'
    },
    {
      position: 'IT / System Control Specialist',
      name: 'Hasan-Al-Monsur',
      designation: 'Associate Director',
      qualification: 'CISA, ISMS-LA, CEH, CPISI, B.Sc. in Computer Science',
      experienceYears: '15+',
      responsibilities: 'Automation controls testing, database integrity, audit log extraction, and DRP/BCP validation.'
    },
    {
      position: 'Engagement Manager',
      name: 'Nusrat Maria, FCCA, ACA (ICAEW)',
      designation: 'Deputy Director, Audit & Consultancy',
      qualification: 'FCCA (ACCA, UK), ACA (ICAEW)',
      experienceYears: '10+',
      responsibilities: 'Fieldwork coordination, IFRS compliance, working paper review, and draft report compilation.'
    },
    {
      position: 'Financial & Accounting Specialist',
      name: 'Md. Shif All Mostakin',
      designation: 'Assistant Director',
      qualification: 'Chartered Accountancy Final Level, BBA - AIUB',
      experienceYears: '15+',
      responsibilities: 'Substantive testing, ratio analysis, fund flow verification, and schedule cross-casting.'
    }
  ];

  /**
   * 8-Stage Standard Reporting Cycle Table
   */
  static readonly REPORTING_CYCLE_STAGES = [
    { stage: 'Stage 1', milestone: 'Fieldwork Completion', description: 'Completion of head-office, branch and field-level audit procedures and verification.' },
    { stage: 'Stage 2', milestone: 'Exit Meeting', description: 'Formal exit meeting with client management to discuss observations and obtain management responses.' },
    { stage: 'Stage 3', milestone: 'Draft Reports', description: 'Submission of draft Audit/Consultancy Report, Financial Statements and supporting annexures.' },
    { stage: 'Stage 4', milestone: 'Draft Management Report', description: 'Submission of draft Management Report setting out observations, impact and prioritized recommendations.' },
    { stage: 'Stage 5', milestone: 'Audit / Validation Discussion', description: 'Joint discussion with client leadership and steering committee to resolve outstanding points.' },
    { stage: 'Stage 6', milestone: 'Incorporation of Decisions', description: 'Evidence-supported corrections and feedback from validation sessions are incorporated.' },
    { stage: 'Stage 7', milestone: 'Final Report & Financials', description: 'Submission of final Independent Report, Statements and complete annexures package within stipulated time.' },
    { stage: 'Stage 8', milestone: 'Final Management Report', description: 'Formal submission of final Management Letter and Roadmap.' }
  ];

  /**
   * 8-Point Standard RACI Matrix
   */
  static readonly RACI_MATRIX = [
    { activity: 'Provision of records, policies, and system access', auditTeam: 'C', clientAuthority: 'I', clientFocal: 'R / A' },
    { activity: 'Field access and coordination with branch/field units', auditTeam: 'C', clientAuthority: 'I', clientFocal: 'A / R' },
    { activity: 'Performance of technical audit/consultancy procedures', auditTeam: 'R / A', clientAuthority: 'I', clientFocal: 'C' },
    { activity: 'Attendance at Exit Meeting & Management Responses', auditTeam: 'R', clientAuthority: 'I', clientFocal: 'R / A' },
    { activity: 'Submission of Draft Reports & Statements', auditTeam: 'R / A', clientAuthority: 'I', clientFocal: 'I' },
    { activity: 'Steering Committee / Validation Discussion', auditTeam: 'R', clientAuthority: 'R / A', clientFocal: 'C' },
    { activity: 'Incorporation of Agreed Decisions & Corrections', auditTeam: 'R / A', clientAuthority: 'C', clientFocal: 'C' },
    { activity: 'Submission of Final Official Deliverables Package', auditTeam: 'R / A', clientAuthority: 'I', clientFocal: 'I' }
  ];

  /**
   * 7 Core Engagement Risks and Mitigations Table
   */
  static readonly ENGAGEMENT_RISKS = [
    { risk: 'Incomplete or delayed access to client records/systems', impact: 'Delay to assignment timetable; scope limitation', mitigation: 'Early comprehensive document request list at kick-off; immediate escalation to designated focal person.' },
    { risk: 'Restricted field/branch access', impact: 'Reduced field-level corroborative evidence', mitigation: 'Pre-schedule field-visit itinerary with management in advance; document access limitations transparently.' },
    { risk: 'Indicators of financial irregularities or fund diversion', impact: 'Financial misstatement; reputational & compliance risk', mitigation: 'Heightened-risk substantive procedures; prompt confidential escalation to Engagement Partner.' },
    { risk: 'System manipulation or data-integrity concerns', impact: 'Unreliable MIS/AIS automated evidence', mitigation: 'Direct database/log queries, independent reconciliation to manual records and physical vouchers.' },
    { risk: 'Delayed management responses at Exit Meeting', impact: 'Delay to draft/final reporting schedule', mitigation: 'Fix Exit Meeting date during planning; document management feedback and action points in real-time.' },
    { risk: 'Complex tax, VAT or regulatory interpretation issues', impact: 'Inconsistent compliance evaluation', mitigation: 'Review by Senior Tax Specialist and Engagement Partner before final report inclusion.' },
    { risk: 'Reporting-cycle and validation bottlenecks', impact: 'Delay to final contract closure', mitigation: 'Early scheduling of joint validation sessions and pre-circulation of draft deliverables.' }
  ];

  /**
   * 4 Major Categorized Experience Tables (104 authentic clients)
   */
  static readonly EXPERIENCE_DATA = {
    developmentProjects: [
      { sl: 1, name: 'Genomics Research Capacity Development Project', partner: 'icddr,b', location: 'Mohakhali, Dhaka', period: '2022-23', funding: 'SIDA' },
      { sl: 2, 'name': 'Research for Decision Makers (RDM) & Alliance for Combating TB', partner: 'icddr,b', location: 'Mohakhali, Dhaka', period: '2023', funding: 'USAID' },
      { sl: 3, name: 'Integrated Management of Childhood Illness (IMCI) & TB Treatment', partner: 'icddr,b', location: 'Mohakhali, Dhaka', period: '2022-2025', funding: 'Stop TB / UNOPS' },
      { sl: 4, name: 'Rohingya Refugee Community Sanitation Improvement Project', partner: 'ACTED Bangladesh', location: 'Cox’s Bazar', period: '2023', funding: 'ACTED HQ Paris' },
      { sl: 5, name: 'Refugee Protection, Health and Resilience Project', partner: 'ACTED Bangladesh', location: 'Cox’s Bazar', period: '2023-2024', funding: 'ACTED HQ Paris' },
      { sl: 6, name: 'Disaster Risk Reduction Stakeholder Engagement (UNDRR-SEM)', partner: 'ActionAid Bangladesh', location: 'Gulshan 1, Dhaka', period: '2023', funding: 'ActionAid International' },
      { sl: 7, name: 'Poverty Alleviation through Sustainable Approach', partner: 'ActionAid Bangladesh', location: 'Gulshan 1, Dhaka', period: '2023-2025', funding: 'AA International & AA Denmark' },
      { sl: 8, name: 'InSPIRE Project (Governance & Institutional Development)', partner: 'Swisscontact Bangladesh', location: 'Baridhara, Dhaka', period: '2023-2024', funding: 'SDC (Swiss Agency for Development)' },
      { sl: 9, name: 'Sarathi-Improving Financial Health Project', partner: 'Swisscontact / YPSA', location: 'Baridhara, Dhaka', period: '2022-2024', funding: 'Swisscontact HQ' },
      { sl: 10, name: 'Defending Environmental Rights (2nd phase)', partner: 'BELA', location: 'Dhanmondi, Dhaka', period: '2024', funding: 'SIDA' },
      { sl: 11, name: 'Resilience and Adaptation Fund (RAF) for Disability Services', partner: 'Handicap International', location: 'Gulshan-2, Dhaka', period: '2025-2026', funding: 'FCDO (UK Foreign Office)' },
      { sl: 12, name: 'Nature Based Adaptation towards Prosperous Livelihoods (NABAPALLAB)', partner: 'iDE Bangladesh', location: 'Gulshan 2, Dhaka', period: '2025', funding: 'iDE USA / USAID' }
    ],
    banksAndFinancial: [
      { sl: 1, name: 'Bangladesh Bank', address: 'Motijheel C/A, Dhaka', years: '2023-24', type: 'Central Bank of Bangladesh' },
      { sl: 2, name: 'Grameen Bank', address: 'Mirpur-2, Dhaka', years: '2023-2025', type: 'Specialized Microfinance Apex Bank' },
      { sl: 3, name: 'Islami Bank Bangladesh PLC', address: 'Dilkusha C/A, Dhaka', years: '2023', type: 'Scheduled Islamic Commercial Bank' },
      { sl: 4, name: 'Prime Bank PLC', address: 'Motijheel C/A, Dhaka', years: '2023-24', type: 'Scheduled Commercial Bank' },
      { sl: 5, name: 'United Commercial Bank PLC (UCB)', address: 'Gulshan Avenue, Dhaka', years: '2023-24', type: 'Scheduled Commercial Bank' },
      { sl: 6, name: 'Dhaka Bank PLC', address: 'Gulshan-1, Dhaka', years: '2023-24', type: 'Scheduled Commercial Bank' },
      { sl: 7, name: 'National Credit & Commerce Bank PLC (NCCB)', address: 'Motijheel C/A, Dhaka', years: '2024-25', type: 'Scheduled Commercial Bank' },
      { sl: 8, name: 'Shimanto Bank PLC', address: 'Dhanmondi, Dhaka', years: '2024-25', type: 'Scheduled Commercial Bank' },
      { sl: 9, name: 'State Bank of India (BD Operations)', address: 'Gulshan Avenue, Dhaka', years: '2024-25', type: 'Foreign Commercial Bank' },
      { sl: 10, name: 'Unilever Bangladesh Limited', address: 'Tejgaon I/A, Dhaka', years: '2024-25', type: 'Multinational FMCG Giant' }
    ],
    ngosAndMfisArray: [
      { sl: 1, name: 'BRAC (Core & Specialized Programs)', address: 'BRAC Centre, 75 Mohakhali, Dhaka', years: '2022-2024' },
      { sl: 2, name: 'ActionAid Bangladesh', address: 'Gulshan 1, Dhaka', years: '2023-2024' },
      { sl: 3, name: 'Marie Stopes Bangladesh', address: 'Lalmatia, Dhaka', years: '2024-2025' },
      { sl: 4, name: 'Community Development Association (CDA)', address: 'Upashahar, Dinajpur', years: '2023-2024' },
      { sl: 5, name: 'Palli Daridro Bimochon Foundation (PDBF)', address: 'Kawran Bazar, Dhaka', years: '2023-2024' },
      { sl: 6, name: 'Social Development Foundation (SDF)', address: 'Mohammadpur, Dhaka', years: '2024-2025' },
      { sl: 7, name: 'Credit and Development Forum (CDF)', address: 'Mirpur-12, Dhaka', years: '2024-2025' },
      { sl: 8, name: 'Plan International Bangladesh', address: 'Uttara, Dhaka', years: '2024-2026' },
      { sl: 9, name: 'Helen Keller International - Bangladesh', address: 'Gulshan-2, Dhaka', years: '2025-2026' },
      { sl: 10, name: 'Bangladesh Youth Leadership Center (BYLC)', address: 'Mohakhali, Dhaka', years: '2023-2024' }
    ],
    itAndSystemAudits: [
      { sl: 1, name: 'National Credit & Commerce Bank PLC', period: '2024-2025', scope: 'IS Audit as per Bangladesh Bank ICT Security Guidelines (Core Banking, DRP, Logs)' },
      { sl: 2, name: 'MIDAS Financing PLC', period: '2025-2026', scope: 'System Audit since Inception (Lending software logic, automated interest, security controls)' },
      { sl: 3, name: 'Walton Hi-Tech Industries PLC', period: '2023-2026', scope: 'Oracle ERP System Review (EBS-12.2.5) (Configuration controls, SOD, consolidation)' }
    ]
  };

  /**
   * Retrieves gold-standard exemplar writing and tables for a given proposal section title.
   */
  static getSectionExemplar(sectionTitle: string, clientName: string = 'Client', assignmentTitle: string = 'Assignment'): ProposalExemplarSection {
    const titleLower = sectionTitle.toLowerCase();

    // 1. Cover Page & Letter of Transmittal
    if (titleLower.includes('transmittal') || titleLower.includes('letter of submission')) {
      return {
        sectionTitle: 'Letter of Transmittal',
        sectionNumber: '',
        writingStyle: 'Formal, authoritative, legally sound transmittal signed by Engagement Director.',
        exemplarContent: `The Executive Authority
${clientName}
Dhaka, Bangladesh

**Subject: Technical Proposal for ${assignmentTitle}**

Dear Sir/Madam,

We submit our Technical Proposal for **${assignmentTitle}** in response to your Terms of Reference (ToR) and invitation. Our proposal addresses all requirements, technical scopes, and prescribed annexures.

ACNABIN, Chartered Accountants is an independent member firm of Baker Tilly International. Our multidisciplinary team combines 41+ years of professional distinction since 1985, deep sector expertise, and rigorous quality assurance.

We confirm our firm's commitments to:
- **Independence and Objectivity**: In accordance with the International Ethics Standards Board for Accountants (IESBA) Code of Ethics and applicable national regulations;
- **Professional Standards Compliance**: Full alignment with International Standards on Auditing (ISA), IFRS, and relevant national statutes;
- **Confidentiality**: Strict data protection and non-disclosure of all information obtained during the assignment;
- **Professional Competence and Due Care**: Direct supervision by senior FCA partners and multi-tier quality control;
- **Full Scope Execution**: Complete delivery of all technical milestones, reports, and capacity building sessions within agreed timelines.

We look forward to serving ${clientName} and remain available for any clarifications required.

Yours faithfully,
**For and on behalf of ACNABIN, Chartered Accountants**

**Abdullah-Al-Mamun, FCA**
Director, Audit & Consultancy
ACNABIN, Chartered Accountants`
      };
    }

    // 2. Executive Summary
    if (titleLower.includes('executive summary')) {
      return {
        sectionTitle: 'Executive Summary',
        sectionNumber: '1',
        writingStyle: 'Structured 8-part synthesis with key objectives and clear value proposition.',
        exemplarContent: `### 1.1 Understanding of the Assignment
ACNABIN Chartered Accountants understands that ${clientName} requires specialized technical services for **${assignmentTitle}**. Our approach combines institutional governance review, risk-based substantive testing, automated controls validation, and participatory capacity building to ensure sustainable outcomes.

### 1.2 Key Objectives
- Evaluate institutional governance, operational workflows, and statutory compliance;
- Assess automation, software systems, and data-integrity safeguards;
- Review fund flow mechanisms, budgetary discipline, and procurement trails;
- Formulate standardized policy manuals, templates, and reporting annexures;
- Conduct participatory validation sessions and Training of Trainers (ToT) workshops.

### 1.3 Major Scope Areas
Our technical scope covers: (1) Governance & Policy Review; (2) Financial Operations & Internal Control; (3) Automation & MIS Assurance; (4) Procurement & Asset Management; (5) Risk Management & Safeguards; and (6) Institutional Rollout & Training.

### 1.4 Proposed Technical Approach
We propose a risk-based, evidence-grounded 4-phase methodology executing in accordance with International Professional Standards. Our approach surfaces operational gaps, establishes clear internal controls, and delivers actionable tools tailored to ${clientName}'s operating context.

### 1.5 Quality Assurance & Value Proposition
- **Independent Partner Review**: Multi-level supervisory oversight backed by Baker Tilly International QA protocols;
- **Multi-Sector Credentials**: Proven track record across 104+ institutional, corporate, and development partner assignments in Bangladesh;
- **Actionable Deliverables**: Editable toolkits, standardized formats, and dedicated post-assignment support.`
      };
    }

    // 3. Technical Methodology
    if (titleLower.includes('methodology') || titleLower.includes('approach')) {
      return {
        sectionTitle: 'Detailed Technical Methodology',
        sectionNumber: '4',
        writingStyle: 'Four-phase iterative execution with multi-level verification (Head Office, Branch, Field).',
        exemplarContent: `ACNABIN's technical methodology is structured across four progressive, iterative phases designed to ensure complete technical rigor and stakeholder buy-in:

### Phase 1: Inception, Scoping & Diagnostic Planning
- Conduct formal kick-off meeting with ${clientName} leadership and steering committee;
- Comprehensive review of existing policies, MoA/AoA, statutory licenses, and past audit reports;
- Formulate detailed Inception Report, sampling strategy, data collection tools, and stakeholder engagement matrix.

### Phase 2: Detailed Assessment, Substantive Testing & Stakeholder Consultations
- **Head Office Procedures**: Review governance minutes, financial ledgers, bank reconciliations, and central tax/VAT filings;
- **Branch / Field-Level Verification**: Cross-check loan/project registers, physical asset existence, and direct beneficiary corroboration;
- **IT & Automation Testing**: Audit web software configuration, user access privileges, audit trail logs, and DRP/BCP safeguards;
- Key informant interviews (KIIs) and focus group discussions (FGDs) with management, field staff, and program beneficiaries.

### Phase 3: Drafting, Gap Synthesis & Toolkit Formulation
- Consolidate diagnostic findings into an Evidence-Based Gap Analysis Matrix;
- Draft comprehensive Policy Manuals, Operating Guidelines, and Standardized Forms Pack;
- Ensure full cross-referencing with national regulatory statutes (Income Tax Act 2023, VAT Act 2012, Anti-Money Laundering Act 2012).

### Phase 4: Validation, Stakeholder Workshops & Institutional Rollout
- Facilitate participatory review and validation workshops with ${clientName} management;
- Conduct Training of Trainers (ToT) and staff policy orientation workshops;
- Submit final editable Word/Excel toolkits and consolidated submission package.`,
        sampleTables: [
          {
            caption: 'Multi-Tier Verification Framework',
            headers: ['Verification Level', 'Key Focus Areas', 'Evidence & Documentation Produced'],
            rows: [
              ['Head Office Level', 'Governance, policy approval, consolidated AIS/MIS, bank reconciliations, statutory tax/VAT compliance.', 'Board minutes inspection, GL-to-trial balance reconciliation, tax deposit challans.'],
              ['Branch / Unit Level', 'Cash books, sub-ledgers, staff loan adjustments, local procurement vouchers, physical cash counts.', 'Branch reconciliation reports, cash count certificates, sample voucher audit trails.'],
              ['Field / Beneficiary Level', 'Direct beneficiary verification, passbook cross-checks, asset physical tagging, project activity monitoring.', 'Signed verification sheets, beneficiary feedback notes, physical inspection photos.']
            ]
          }
        ]
      };
    }

    // 4. Relevant Experience
    if (titleLower.includes('experience') || titleLower.includes('firm credentials')) {
      return {
        sectionTitle: 'Relevant Firm Experience',
        sectionNumber: '11',
        writingStyle: 'Tabular client credentials categorized by sector with donor affiliations.',
        exemplarContent: `ACNABIN Chartered Accountants possesses 41+ years of demonstrated distinction delivering high-impact audit, financial management, governance restructuring, and advisory assignments across Bangladesh.

Our track record encompasses over 104 major institutional clients, including bilateral/multilateral development partners, financial institutions, microfinance apex bodies, and premier corporate enterprises.`,
        sampleTables: [
          {
            caption: 'Experience in Development Partner & Institutional Assignments',
            headers: ['Sl.', 'Project / Assignment Name', 'Client / Partner', 'Location', 'Period', 'Funding Agency'],
            rows: this.EXPERIENCE_DATA.developmentProjects.map(p => [String(p.sl), p.name, p.partner, p.location, p.period, p.funding])
          },
          {
            caption: 'Experience in Statutory Audit of Financial Institutions & Apex Bodies',
            headers: ['Sl.', 'Client Name', 'Registered Address', 'Audit Year(s)', 'Entity Classification'],
            rows: this.EXPERIENCE_DATA.banksAndFinancial.map(b => [String(b.sl), b.name, b.address, b.years, b.type])
          },
          {
            caption: 'Experience in NGO, MFI & Governance Engagements',
            headers: ['Sl.', 'Client Name', 'Registered Address', 'Period'],
            rows: this.EXPERIENCE_DATA.ngosAndMfisArray.map(n => [String(n.sl), n.name, n.address, n.years])
          }
        ]
      };
    }

    // 5. Team Composition
    if (titleLower.includes('team') || titleLower.includes('key experts') || titleLower.includes('personnel')) {
      return {
        sectionTitle: 'Team Structure and Key Experts',
        sectionNumber: '6',
        writingStyle: 'Authoritative named senior personnel table with qualifications and role assignments.',
        exemplarContent: `ACNABIN has mobilized a dedicated, multidisciplinary team of senior Fellows of the Institute of Chartered Accountants of Bangladesh (FCA), internationally certified specialists (FCCA, ACA ICAEW, CISA), and experienced field audit associates.`,
        sampleTables: [
          {
            caption: 'Proposed Core Key Experts Suite',
            headers: ['Position', 'Name of Personnel', 'Designation', 'Professional Qualification', 'Experience'],
            rows: this.CORE_TEAM_SUITE.map(t => [t.position, t.name, t.designation, t.qualification, t.experienceYears])
          }
        ]
      };
    }

    // 6. Responsibility (RACI) Matrix
    if (titleLower.includes('raci') || titleLower.includes('responsibility matrix')) {
      return {
        sectionTitle: 'Responsibility (RACI) Matrix',
        sectionNumber: '7',
        writingStyle: 'Structured 8-activity responsibility division between ACNABIN, Client Leadership, and Focal Points.',
        exemplarContent: `The matrix below clearly distinguishes between management's operational responsibilities, steering committee oversight, and ACNABIN's independent advisory and audit obligations.`,
        sampleTables: [
          {
            caption: 'Assignment RACI Responsibility Matrix',
            headers: ['Assignment Activity', 'ACNABIN Team', 'Client Leadership / Board', 'Client Focal / Staff'],
            rows: this.RACI_MATRIX.map(r => [r.activity, r.auditTeam, r.clientAuthority, r.clientFocal])
          }
        ]
      };
    }

    // 7. Quality Assurance & Risk Management
    if (titleLower.includes('quality assurance') || titleLower.includes('risk management')) {
      return {
        sectionTitle: 'Quality Assurance and Risk Management',
        sectionNumber: '8',
        writingStyle: 'Baker Tilly ISQM 1 QA controls with 7-point engagement risk mitigation matrix.',
        exemplarContent: `ACNABIN operates under the Baker Tilly International Global Quality Assurance Framework and the International Standard on Quality Management 1 (ISQM 1). Every engagement is subjected to independent multi-tier quality reviews.`,
        sampleTables: [
          {
            caption: 'Engagement Risk Management and Mitigation Matrix',
            headers: ['Identified Risk Area', 'Potential Impact', 'Proposed Mitigation Strategy'],
            rows: this.ENGAGEMENT_RISKS.map(r => [r.risk, r.impact, r.mitigation])
          }
        ]
      };
    }

    // 8. About ACNABIN
    if (titleLower.includes('about acnabin') || titleLower.includes('firm profile')) {
      return {
        sectionTitle: 'About ACNABIN Chartered Accountants',
        sectionNumber: '12',
        writingStyle: 'Comprehensive 41-year institutional profile with 8 FCA Partners matrix.',
        exemplarContent: `ACNABIN, Chartered Accountants is an independent member firm of Baker Tilly International. Established in February 1985, ACNABIN has maintained over 41 years of professional excellence, operating with 490 personnel and 8 FCA Partners across Dhaka and Chattogram.

### Global Affiliation & Standing
- Independent Member Firm of Baker Tilly International (Ranked Top 10 globally, 147 countries, 43,000+ professionals);
- Enlisted as Eligible CA Firm for Bank Audits by Bangladesh Bank (Serial #03);
- Enlisted with NGO Affairs Bureau (Serial #12), Financial Reporting Council (FRC), and BSEC;
- Representation on the ICAB Council since inception, including 2 Past ICAB Presidents and 1 Past SAFA President.`,
        sampleTables: [
          {
            caption: 'ACNABIN Partners Profile & Professional Standing',
            headers: ['Sl.', 'Partner Name', 'Educational & Professional Qualifications', 'Years of Experience'],
            rows: this.PARTNERS_MATRIX.map(p => [String(p.sl), p.name, p.qualifications, p.experience])
          }
        ]
      };
    }

    // Default Fallback
    return {
      sectionTitle,
      sectionNumber: '',
      writingStyle: 'Evidence-backed, active voice, professional ACNABIN house style.',
      exemplarContent: `ACNABIN will execute this section with direct reference to the ToR scope, applicable regulatory statutes, and verified institutional evidence.`
    };
  }
}
