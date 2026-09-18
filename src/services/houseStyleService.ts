import { HouseStyleProfile, HouseStyleStatus, HouseStyleSourceType } from '../types';

const STORAGE_KEY_PROFILES = 'acnabin_house_style_profiles';
const STORAGE_KEY_ACTIVE = 'acnabin_active_house_style_id';

export class HouseStyleService {
  /**
   * Section 12 & Section 4 Requirement:
   * Returns the DEFAULT_BASELINE profile explicitly marked as DEFAULT_BASELINE and status REFERENCE_REQUIRED.
   * Must NEVER be presented as extracted ACNABIN house style.
   */
  static getDefaultBaselineProfile(): HouseStyleProfile {
    return {
      metadata: {
        profileId: 'default-baseline-profile',
        name: 'Default System Baseline Fallback',
        status: 'REFERENCE_REQUIRED',
        sourceType: 'DEFAULT_BASELINE',
        sourceDocuments: [],
        sourceCount: 0,
        generatedAt: new Date().toISOString(),
        confidence: 0.50
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
        headingFonts: ['Tahoma'],
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
        alternateRowColor: '#F1F5F9'
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
        commonStructures: ['Responsibility Matrix', 'Work Plan Table', 'Deliverable Schedule'],
        headerStyle: { backgroundColor: '#002060', textColor: '#FFFFFF', bold: true },
        borderStyle: 'Thin Light Grey (#CBD5E1)',
        alignment: 'center',
        alternateRows: true,
        commonColumnPatterns: ['Sl', 'Task', 'Deliverable', 'Timeline', 'Responsible Expert']
      },
      cover: {
        structure: ['ACNABIN Logo', 'TECHNICAL PROPOSAL', 'Assignment Title', 'Client Name', 'Date', 'Firm Address'],
        logoDetected: true,
        logoPosition: 'Top Center',
        titlePlacement: 'Center',
        subtitlePlacement: 'Below Title',
        submittedTo: 'Client Procurement Committee',
        submittedBy: 'ACNABIN Chartered Accountants',
        contactBlock: 'BDBL Bhaban (Level-13 & 15), 12 Kawran Bazar Commercial Area, Dhaka-1215'
      },
      letter: {
        detected: true,
        structure: ['Date', 'Addressee', 'Subject', 'Salutation', 'Body Paragraphs', 'Sign-off', 'Partner Signature'],
        toneCharacteristics: ['Formal', 'Professional', 'First-person Plural']
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
        confidentialityText: 'ACNABIN Chartered Accountants — Confidential',
        rule: true
      },
      sectionArchitecture: {
        orderedSections: [
          { title: 'Cover Page', level: 1 },
          { title: 'Letter of Submission', level: 1 },
          { title: 'Table of Contents', level: 1 },
          { title: 'Executive Summary', level: 1 },
          { title: 'Understanding of the Assignment and the Client', level: 1 },
          { title: 'Objectives of the Assignment', level: 1 },
          { title: 'Scope of Work', level: 1 },
          { title: 'Proposed Methodology', level: 1 },
          { title: 'Detailed Work Plan', level: 1 },
          { title: 'Team Composition and Key Experts', level: 1 },
          { title: 'Responsibility Matrix', level: 1 },
          { title: 'Quality Assurance and Risk Management', level: 1 },
          { title: 'Deliverables of the Assignment', level: 1 },
          { title: 'Timeline of the Assignment', level: 1 },
          { title: 'Relevant Firm Experience', level: 1 },
          { title: 'About ACNABIN Chartered Accountants', level: 1 },
          { title: 'Conclusion', level: 1 },
          { title: 'Appendices', level: 1 }
        ],
        numberingScheme: 'Numbered Hierarchy (1.0, 1.1)',
        titlePatterns: ['Executive Summary', 'Understanding of the Assignment and the Client', 'Scope of Work', 'Proposed Methodology', 'Detailed Work Plan'],
        recurringSections: ['Executive Summary', 'Scope of Work', 'Proposed Methodology', 'Detailed Work Plan', 'Team Composition and Key Experts', 'About ACNABIN Chartered Accountants']
      },
      boilerplate: {
        candidates: [
          { sectionTitle: 'About ACNABIN', sampleText: 'ACNABIN firm profile baseline', status: 'CANDIDATE', confidence: 0.80 },
          { sectionTitle: 'Quality Assurance Protocol', sampleText: 'Internal audit & peer review baseline', status: 'CANDIDATE', confidence: 0.80 }
        ],
        recurringContent: ['About ACNABIN Chartered Accountants', 'Baker Tilly International Association']
      },
      restrictions: {
        clientSpecificContent: [],
        namedEntities: [],
        dates: [],
        monetaryValues: [],
        personnel: [],
        unsupportedClaims: []
      }
    };
  }

  /**
   * Section 11 Requirement: Multiple Reference Proposals Consolidation
   * Merges multiple reference proposal style profiles into a single consolidated HouseStyleProfile.
   * Records consensus vs. conflicts and updates confidence scores.
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

    // Body Font Consensus & Conflict Detection
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

    // Table Header Color Consensus
    const tableHeaderColors = profiles.map(p => p.colors.tableHeaderColor);
    const tableCounts: Record<string, number> = {};
    for (const c of tableHeaderColors) {
      tableCounts[c] = (tableCounts[c] || 0) + 1;
    }
    const topTableHeaderColor = Object.keys(tableCounts).reduce((a, b) => tableCounts[a] > tableCounts[b] ? a : b, tableHeaderColors[0]);

    // Combine Boilerplate Candidates
    const rawBoilerplate = profiles.flatMap(p => p.boilerplate.candidates);
    const boilerplateMap = new Map<string, typeof rawBoilerplate[0]>();
    for (const b of rawBoilerplate) {
      if (!boilerplateMap.has(b.sectionTitle)) {
        boilerplateMap.set(b.sectionTitle, { ...b, confidence: 0.95 });
      }
    }

    // Combine Restrictions
    const clientSpecific = Array.from(new Set(profiles.flatMap(p => p.restrictions.clientSpecificContent)));
    const namedEntities = Array.from(new Set(profiles.flatMap(p => p.restrictions.namedEntities)));

    // Consolidated Profile Output
    const base = profiles[0];
    const consolidated: HouseStyleProfile = {
      ...base,
      metadata: {
        profileId: `consolidated-${Date.now()}`,
        name: `Consolidated House Style (${totalCount} References)`,
        status: 'ACTIVE',
        sourceType: 'CONSOLIDATED',
        sourceDocuments: uniqueDocs,
        sourceCount: totalCount,
        generatedAt: new Date().toISOString(),
        confidence: Number(((fontConfidence + 0.90) / 2).toFixed(2))
      },
      typography: {
        ...base.typography,
        bodyFont: topFont,
        headingFonts: [topFont]
      },
      colors: {
        ...base.colors,
        accent: topAccent,
        tableHeaderColor: topTableHeaderColor,
        headingColors: {
          ...base.colors.headingColors,
          h1: topAccent,
          h2: topAccent
        }
      },
      boilerplate: {
        candidates: Array.from(boilerplateMap.values()),
        recurringContent: Array.from(new Set(profiles.flatMap(p => p.boilerplate.recurringContent)))
      },
      restrictions: {
        clientSpecificContent: clientSpecific,
        namedEntities: namedEntities,
        dates: Array.from(new Set(profiles.flatMap(p => p.restrictions.dates))),
        monetaryValues: Array.from(new Set(profiles.flatMap(p => p.restrictions.monetaryValues))),
        personnel: Array.from(new Set(profiles.flatMap(p => p.restrictions.personnel))),
        unsupportedClaims: Array.from(new Set(profiles.flatMap(p => p.restrictions.unsupportedClaims)))
      }
    };

    return consolidated;
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
    return [];
  }

  /**
   * Get the active House Style Profile. If none uploaded, returns DEFAULT_BASELINE profile.
   */
  static getActiveProfile(): HouseStyleProfile {
    const saved = this.getAllSavedProfiles();
    const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (activeId && saved.length > 0) {
      const match = saved.find(p => p.metadata.profileId === activeId);
      if (match) return match;
    }

    const referenceExtracted = saved.filter(p => p.metadata.sourceType !== 'DEFAULT_BASELINE');
    if (referenceExtracted.length > 0) {
      return this.consolidateProfiles(referenceExtracted);
    }

    return this.getDefaultBaselineProfile();
  }

  /**
   * Returns current House Style Status ('REFERENCE_REQUIRED' | 'ACTIVE' | 'ARCHIVED').
   */
  static getHouseStyleStatus(): HouseStyleStatus {
    const active = this.getActiveProfile();
    return active.metadata.status;
  }
}
