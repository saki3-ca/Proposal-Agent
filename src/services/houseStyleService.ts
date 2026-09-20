import { HouseStyleProfile, HouseStyleStatus, HouseStyleSourceType, BoilerplateCandidate } from '../types';

const STORAGE_KEY_PROFILES = 'acnabin_house_style_profiles';
const STORAGE_KEY_ACTIVE = 'acnabin_active_house_style_id';

export class HouseStyleService {
  /**
   * Standard ACNABIN Corporate House Style Baseline Profile
   * Formatted with authentic corporate typography, Navy (#002060) color palette,
   * 18-section technical architecture, and ISQM 1 governance.
   */
  static getDefaultBaselineProfile(): HouseStyleProfile {
    return {
      metadata: {
        profileId: 'default-baseline-profile',
        name: 'ACNABIN Benchmark Corporate House Style',
        status: 'ACTIVE',
        sourceType: 'CONSOLIDATED',
        sourceDocuments: [
          'ACNABIN_SNV_Technical_Proposal_Draft.docx',
          'Technical Proposal For PKSF.docx',
          'BRAC_Bank_AI_Strategy_Proposal_ACNABIN_CipherShield.docx',
          'Technical Proposal for North Bengal FA Revaluation.docx',
          'Technical Proposal for Faridpur PF Forensic Audit.docx'
        ],
        sourceCount: 5,
        generatedAt: new Date().toISOString(),
        confidence: 0.98
      },
      document: {
        pageSize: 'A4 (210mm x 297mm)',
        orientation: 'portrait',
        margins: { top: '0.75 in', bottom: '0.5 in', left: '0.75 in', right: '0.75 in' },
        headerDistance: '0.5 in',
        footerDistance: '0.5 in',
        sectionBehavior: 'Continuous with H1 Page Breaks'
      },
      typography: {
        bodyFont: 'Tahoma',
        bodyFontSize: '10.5 pt',
        headingFonts: ['Tahoma', 'Segoe UI'],
        headingSizes: { title: '22 pt', h1: '13 pt', h2: '11.5 pt', h3: '11 pt' },
        headingWeights: { h1: 'Bold', h2: 'Bold', h3: 'Bold' },
        bodyColor: '#1E293B',
        commonTextStyles: ['Regular', 'Bold', 'Italic']
      },
      colors: {
        primary: '#002060',
        secondary: '#0F4761',
        accent: '#002060',
        headingColors: {
          title: '#002060',
          h1: '#002060',
          h2: '#002060',
          h3: '#002060'
        },
        tableHeaderColor: '#002060',
        tableHeaderTextColor: '#FFFFFF',
        alternateRowColor: '#F8FAFC'
      },
      headings: {
        hierarchy: ['H1', 'H2', 'H3'],
        numberingPattern: '1.0, 1.1, 1.1.1',
        h1: { font: 'Tahoma', size: '13 pt', color: '#002060', bold: true, pageBreakBefore: true },
        h2: { font: 'Tahoma', size: '11.5 pt', color: '#002060', bold: true },
        h3: { font: 'Tahoma', size: '11 pt', color: '#002060', bold: true },
        spacingRules: { before: '12 pt', after: '6 pt', lineSpacing: '1.15' }
      },
      paragraphs: {
        alignment: 'left',
        lineSpacing: '1.15',
        spaceBefore: '0 pt',
        spaceAfter: '6 pt',
        indentation: '0 pt'
      },
      tables: {
        commonStructures: [
          'Responsibility Matrix (RACI)',
          'Work Plan & Timeline Table',
          'Deliverables Acceptance Schedule',
          'Risk Assessment & Mitigation Matrix',
          'Team Resource Allocation Matrix'
        ],
        headerStyle: { backgroundColor: '#002060', textColor: '#FFFFFF', bold: true },
        borderStyle: 'Thin Light Grey (#CBD5E1)',
        alignment: 'center',
        alternateRows: true,
        commonColumnPatterns: ['Sl', 'Phase / Task', 'Deliverable', 'Timeline', 'Responsible Expert', 'Key Stakeholders']
      },
      cover: {
        structure: ['ACNABIN Logo', 'TECHNICAL PROPOSAL', 'Assignment Title', 'Client Name', 'Date', 'Firm Address'],
        logoDetected: true,
        logoPosition: 'Top Center',
        titlePlacement: 'Center',
        subtitlePlacement: 'Below Title',
        submittedTo: 'Client Procurement Committee / Executive Evaluation Board',
        submittedBy: 'ACNABIN Chartered Accountants (An Independent Member Firm of Baker Tilly International)',
        contactBlock: 'BDBL Bhaban (Level-13 & 15), 12 Kawran Bazar Commercial Area, Dhaka-1215'
      },
      letter: {
        detected: true,
        structure: ['Date', 'Addressee', 'Subject', 'Salutation', 'Body Paragraphs', 'Sign-off', 'Partner Signature'],
        toneCharacteristics: ['Formal', 'Authoritative', 'First-person Plural (\'we/our\')', 'Rigorous', 'Client-centric']
      },
      toc: {
        detected: true,
        style: 'Native Word TOC Field',
        depth: 3
      },
      header: {
        detected: true,
        layout: 'Two-Line Right-Aligned Running Header',
        logoDetected: false,
        runningTitleDetected: true,
        rule: false
      },
      footer: {
        detected: true,
        pageNumbering: true,
        confidentialityText: 'ACNABIN Chartered Accountants — Confidential & Proprietary',
        rule: true
      },
      sectionArchitecture: {
        orderedSections: [
          { title: 'Cover Page', level: 1 },
          { title: 'Letter of Submission', level: 1 },
          { title: 'Table of Contents', level: 1 },
          { title: 'Executive Summary', level: 1 },
          { title: '1. Understanding of the Assignment and the Client', level: 1 },
          { title: '2. Objectives of the Assignment', level: 1 },
          { title: '3. Scope of Work', level: 1 },
          { title: '4. Proposed Methodology', level: 1 },
          { title: '5. Detailed Work Plan', level: 1 },
          { title: '6. Team Composition and Key Experts', level: 1 },
          { title: '7. Responsibility Matrix', level: 1 },
          { title: '8. Quality Assurance and Risk Management', level: 1 },
          { title: '9. Deliverables of the Assignment', level: 1 },
          { title: '10. Timeline of the Assignment', level: 1 },
          { title: '11. Relevant Firm Experience', level: 1 },
          { title: '12. About ACNABIN Chartered Accountants', level: 1 },
          { title: '13. Conclusion', level: 1 },
          { title: 'Appendices', level: 1 }
        ],
        numberingScheme: 'Numbered Hierarchy (1.0, 1.1, 1.1.1)',
        titlePatterns: [
          'Executive Summary',
          'Understanding of the Assignment and the Client',
          'Objectives of the Assignment',
          'Scope of Work',
          'Proposed Methodology',
          'Detailed Work Plan',
          'Team Composition and Key Experts',
          'Responsibility Matrix',
          'Quality Assurance and Risk Management',
          'Deliverables of the Assignment',
          'Timeline of the Assignment',
          'Relevant Firm Experience',
          'About ACNABIN Chartered Accountants'
        ],
        recurringSections: [
          'Executive Summary',
          'Scope of Work',
          'Proposed Methodology',
          'Detailed Work Plan',
          'Team Composition and Key Experts',
          'Quality Assurance and Risk Management',
          'About ACNABIN Chartered Accountants'
        ]
      },
      boilerplate: {
        candidates: [
          {
            sectionTitle: 'About ACNABIN Chartered Accountants',
            sampleText: 'Established in February 1985, ACNABIN Chartered Accountants is one of the premier chartered accountancy and management consulting practices in Bangladesh. With over 40 years of continuous service, the firm comprises 8 Fellow Chartered Accountant (FCA) partners—including a former President of SAFA and two former Presidents of ICAB—supported by a multidisciplinary team of over 170 qualified accountants, CISA certified IT auditors, tax specialists, and management consultants. ACNABIN is an independent member firm of Baker Tilly International, ranked among the top 10 global accountancy networks with over 43,000 professionals across 140+ territories, providing global technical reach combined with deep local regulatory expertise.',
            status: 'VERIFIED_REUSABLE',
            confidence: 0.99
          },
          {
            sectionTitle: 'Why ACNABIN for This Assignment',
            sampleText: 'ACNABIN brings an unmatched combination of institutional seniority, multidisciplinary advisory depth, and proven track record across both private commercial enterprises and international development partners. Our key advantages include: (1) Direct Senior Partner engagement throughout all phases; (2) Full compliance with International Standard on Quality Management (ISQM 1) with independent Engagement Quality Reviews; (3) Pre-enlistment and active standing with Bangladesh Bank (Grade-A), BSEC, and the NGO Affairs Bureau (NOAB); and (4) Extensive hands-on experience delivering complex governance frameworks, forensic investigations, and institutional advisory.',
            status: 'VERIFIED_REUSABLE',
            confidence: 0.98
          },
          {
            sectionTitle: 'Quality Assurance & ISQM 1 Protocol',
            sampleText: 'ACNABIN operates under a comprehensive Quality Management System compliant with International Standard on Quality Management (ISQM 1) and Baker Tilly International Global Audit Methodology. Quality is embedded through a two-tier review hierarchy: the Engagement Partner maintains continuous supervision of fieldwork, while an independent Senior Partner conducts the Engagement Quality Review (EQR) prior to final deliverable issuance. All documentation undergoes rigorous evidence validation, cross-referencing, and multi-layered peer scrutiny to ensure zero non-conformances.',
            status: 'VERIFIED_REUSABLE',
            confidence: 0.98
          },
          {
            sectionTitle: 'Independence and Conflict of Interest Declaration',
            sampleText: 'ACNABIN confirms that neither the firm nor any proposed team member has any commercial, financial, or personal interest that could compromise independent professional judgment. In accordance with the ICAB Code of Ethics and Baker Tilly Global Independence System (GIS), our teams maintain strict objectivity, confidentiality, and data privacy safeguards throughout the assignment life cycle.',
            status: 'VERIFIED_REUSABLE',
            confidence: 0.99
          }
        ],
        recurringContent: [
          'About ACNABIN Chartered Accountants',
          'Baker Tilly International Global Association',
          'ISQM 1 Quality Management System',
          'Independence & Ethical Standards'
        ]
      },
      restrictions: {
        clientSpecificContent: [
          'Bangladesh Youth Coalition (BYC)',
          'Youth For Change Bangladesh Foundation (YFC-BD)',
          'SNV Netherlands Development Organisation',
          'Palli Karma-Sahayak Foundation (PKSF)',
          'City Bank PLC',
          'BRAC Bank PLC',
          'North Bengal Sugar Mills Ltd.',
          'Faridpur Sugar Mills Ltd.'
        ],
        namedEntities: [
          'Plan International Bangladesh',
          'Embassy of the Kingdom of the Netherlands',
          'GIZ Bangladesh',
          'BSFIC',
          'Titas Gas',
          'Unilever Bangladesh'
        ],
        dates: ['September 2026', 'FY 2026–2027', 'AY 2025–2026'],
        monetaryValues: ['BDT 4,500,000', 'BDT 8,500,000', 'BDT 5,200,000'],
        personnel: ['Partner', 'Team Leader', 'Deputy Team Leader', 'Engagement Lead'],
        unsupportedClaims: ['Specific past assignment metrics not verified against Knowledge Base evidence']
      }
    };
  }

  /**
   * Consolidate multiple reference proposal style profiles into a unified profile.
   */
  static consolidateProfiles(profiles: HouseStyleProfile[]): HouseStyleProfile {
    if (!profiles || profiles.length === 0) {
      return this.getDefaultBaselineProfile();
    }

    if (profiles.length === 1) {
      return profiles[0];
    }

    const sourceDocs = profiles.flatMap(p => p.metadata.sourceDocuments);
    const uniqueDocs = Array.from(new Set(sourceDocs));
    const totalCount = profiles.length;

    // Body Font Consensus
    const bodyFonts = profiles.map(p => p.typography.bodyFont);
    const fontCounts: Record<string, number> = {};
    for (const f of bodyFonts) {
      fontCounts[f] = (fontCounts[f] || 0) + 1;
    }
    const topFont = Object.keys(fontCounts).reduce((a, b) => fontCounts[a] > fontCounts[b] ? a : b, bodyFonts[0]);
    const fontConsensusCount = fontCounts[topFont];
    const fontConfidence = Math.min(0.99, Number((fontConsensusCount / totalCount).toFixed(2)));

    // Accent Color Consensus
    const accentColors = profiles.map(p => p.colors.accent);
    const accentCounts: Record<string, number> = {};
    for (const c of accentColors) {
      accentCounts[c] = (accentCounts[c] || 0) + 1;
    }
    const topAccent = Object.keys(accentCounts).reduce((a, b) => accentCounts[a] > accentCounts[b] ? a : b, accentColors[0]);

    // Combine Boilerplates
    const rawBoilerplate = profiles.flatMap(p => p.boilerplate.candidates);
    const boilerplateMap = new Map<string, BoilerplateCandidate>();
    for (const b of rawBoilerplate) {
      if (!boilerplateMap.has(b.sectionTitle)) {
        boilerplateMap.set(b.sectionTitle, { ...b, confidence: 0.98 });
      }
    }

    // Consolidated Profile Output
    const base = this.getDefaultBaselineProfile();
    return {
      ...base,
      metadata: {
        profileId: `consolidated-${Date.now()}`,
        name: `Consolidated ACNABIN House Style (${totalCount} References)`,
        status: 'ACTIVE',
        sourceType: 'CONSOLIDATED',
        sourceDocuments: uniqueDocs,
        sourceCount: totalCount,
        generatedAt: new Date().toISOString(),
        confidence: Number(((fontConfidence + 0.95) / 2).toFixed(2))
      },
      typography: {
        ...base.typography,
        bodyFont: topFont || 'Tahoma',
        headingFonts: [topFont || 'Tahoma', 'Segoe UI']
      },
      colors: {
        ...base.colors,
        accent: topAccent || '#002060',
        tableHeaderColor: '#002060',
        headingColors: {
          ...base.colors.headingColors,
          h1: topAccent || '#002060',
          h2: topAccent || '#002060'
        }
      },
      boilerplate: {
        candidates: Array.from(boilerplateMap.values()),
        recurringContent: Array.from(new Set(profiles.flatMap(p => p.boilerplate.recurringContent)))
      }
    };
  }

  /**
   * Save House Style Profile into localStorage persistence.
   */
  static saveProfile(profile: HouseStyleProfile): void {
    try {
      const existing = this.getAllSavedProfiles();
      const idx = existing.findIndex(p => p.metadata.profileId === profile.metadata.profileId);
      if (idx >= 0) {
        existing[idx] = profile;
      } else {
        existing.push(profile);
      }
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(existing));
      localStorage.setItem(STORAGE_KEY_ACTIVE, profile.metadata.profileId);
    } catch (e) {
      console.warn('Failed to save HouseStyleProfile to localStorage:', e);
    }
  }

  /**
   * Get all saved House Style Profiles.
   */
  static getAllSavedProfiles(): HouseStyleProfile[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROFILES);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to read HouseStyleProfiles from localStorage:', e);
    }
    return [this.getDefaultBaselineProfile()];
  }

  /**
   * Get the active House Style Profile.
   */
  static getActiveProfile(): HouseStyleProfile {
    const saved = this.getAllSavedProfiles();
    const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (activeId && saved.length > 0) {
      const match = saved.find(p => p.metadata.profileId === activeId);
      if (match) return match;
    }

    if (saved.length > 0) {
      return saved[0];
    }

    return this.getDefaultBaselineProfile();
  }

  /**
   * Returns current House Style Status ('REFERENCE_REQUIRED' | 'ACTIVE' | 'ARCHIVED').
   */
  static getHouseStyleStatus(): HouseStyleStatus {
    const active = this.getActiveProfile();
    return active.metadata.status || 'ACTIVE';
  }
}
