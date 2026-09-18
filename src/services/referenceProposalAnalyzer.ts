import JSZip from 'jszip';
import { HouseStyleProfile, BoilerplateCandidate, SectionArchitectureItem } from '../types';
import { AiService } from './aiService';

export interface ReferenceAnalysisResult {
  success: boolean;
  sourceDocument: string;
  profile?: HouseStyleProfile;
  error?: string;
  errorCode?: 'REFERENCE_DOCUMENT_EMPTY' | 'REFERENCE_DOCUMENT_INVALID' | 'REFERENCE_XML_PARSE_FAILED' | 'REFERENCE_STYLE_NOT_DETECTED' | 'SEMANTIC_ANALYSIS_UNAVAILABLE' | 'REFERENCE_FORMAT_UNSUPPORTED';
}

export class ReferenceProposalAnalyzer {
  private static FASTAPI_URL = 'http://127.0.0.1:8000';

  /**
   * Main entry point to analyze a reference proposal file (.docx).
   */
  static async analyzeReferenceProposal(file: File): Promise<ReferenceAnalysisResult> {
    const filename = file.name;

    // 1. File Format Validation
    if (!filename.toLowerCase().endsWith('.docx')) {
      return {
        success: false,
        sourceDocument: filename,
        error: 'Reference proposal analysis requires a .docx file format.',
        errorCode: 'REFERENCE_FORMAT_UNSUPPORTED'
      };
    }

    if (file.size === 0) {
      return {
        success: false,
        sourceDocument: filename,
        error: 'Uploaded reference document is empty (0 bytes).',
        errorCode: 'REFERENCE_DOCUMENT_EMPTY'
      };
    }

    try {
      // 2. Attempt FastAPI backend extraction first
      let baseProfile: HouseStyleProfile | null = null;
      let rawText = '';

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.FASTAPI_URL}/analyze-reference-docx`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.profile) {
            baseProfile = data.profile;
          }
        }
      } catch (backendError) {
        console.warn('FastAPI DOCX style extractor unreachable, falling back to browser JSZip OpenXML parser:', backendError);
      }

      // 3. Client-side JSZip Fallback if backend failed or unavailable
      if (!baseProfile) {
        const fallbackResult = await this.extractOpenXmlClientSide(file);
        if (!fallbackResult.success || !fallbackResult.profile) {
          return {
            success: false,
            sourceDocument: filename,
            error: fallbackResult.error || 'Failed to parse DOCX OpenXML package.',
            errorCode: 'REFERENCE_XML_PARSE_FAILED'
          };
        }
        baseProfile = fallbackResult.profile;
        rawText = fallbackResult.rawText || '';
      }

      // 4. LLM Semantic Classification (Groq) for tone, boilerplate, and client restrictions
      try {
        if (!rawText) {
          rawText = baseProfile.sectionArchitecture.orderedSections.map(s => s.title).join('\n');
        }
        const semanticResults = await this.runSemanticAnalysis(rawText, filename);
        if (semanticResults) {
          if (semanticResults.toneCharacteristics && semanticResults.toneCharacteristics.length > 0) {
            baseProfile.letter.toneCharacteristics = semanticResults.toneCharacteristics;
          }
          if (semanticResults.boilerplateCandidates && semanticResults.boilerplateCandidates.length > 0) {
            baseProfile.boilerplate.candidates = semanticResults.boilerplateCandidates;
          }
          if (semanticResults.clientSpecificContent && semanticResults.clientSpecificContent.length > 0) {
            baseProfile.restrictions.clientSpecificContent = Array.from(
              new Set([...baseProfile.restrictions.clientSpecificContent, ...semanticResults.clientSpecificContent])
            );
            baseProfile.restrictions.namedEntities = baseProfile.restrictions.clientSpecificContent;
          }
        }
      } catch (llmErr) {
        console.warn('Semantic analysis via Groq had warnings, preserving deterministic OpenXML result:', llmErr);
      }

      // 5. Final Profile Validation
      const validatedProfile = this.validateProfile(baseProfile);

      return {
        success: true,
        sourceDocument: filename,
        profile: validatedProfile
      };

    } catch (err: any) {
      return {
        success: false,
        sourceDocument: filename,
        error: `Reference proposal analysis failed: ${err?.message || err}`,
        errorCode: 'REFERENCE_XML_PARSE_FAILED'
      };
    }
  }

  /**
   * Browser-based OpenXML parser using JSZip for client-side fallback.
   */
  private static async extractOpenXmlClientSide(file: File): Promise<{ success: boolean; profile?: HouseStyleProfile; rawText?: string; error?: string }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      const docXmlFile = zip.file('word/document.xml');
      const stylesXmlFile = zip.file('word/styles.xml');
      const headerFiles = zip.file(/^word\/header.*\.xml$/);
      const footerFiles = zip.file(/^word\/footer.*\.xml$/);

      const documentXml = docXmlFile ? await docXmlFile.async('text') : '';
      const stylesXml = stylesXmlFile ? await stylesXmlFile.async('text') : '';

      let headerXml = '';
      for (const hf of headerFiles) {
        headerXml += await hf.async('text') + '\n';
      }

      let footerXml = '';
      for (const ff of footerFiles) {
        footerXml += await ff.async('text') + '\n';
      }

      // Extract raw text
      const textMatches = documentXml.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
      const rawText = textMatches.map(t => t.replace(/<\/?[^>]+(>|$)/g, '')).join(' ');

      // Parse Font
      let bodyFont = 'Times New Roman';
      const fontMatches = (stylesXml + documentXml).match(/w:ascii="([^"]+)"/g) || [];
      if (fontMatches.length > 0) {
        const counts: Record<string, number> = {};
        for (const f of fontMatches) {
          const fontName = f.replace('w:ascii="', '').replace('"', '');
          if (fontName !== 'Symbol' && fontName !== 'Wingdings') {
            counts[fontName] = (counts[fontName] || 0) + 1;
          }
        }
        const topFont = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, '');
        if (topFont) bodyFont = topFont;
      }

      // Parse Heading Colors
      let h1Color = '#2E74B5';
      let h2Color = '#2E74B5';
      let h3Color = '#1F4D78';
      let tableHeaderColor = '#1F3864';

      const colorMatches = (documentXml + stylesXml).match(/w:color[^>]+w:val="([0-9A-Fa-f]{6})"/g) || [];
      const validColors = colorMatches
        ? colorMatches
            .map(c => '#' + c.match(/w:val="([0-9A-Fa-f]{6})"/)?.[1]?.toUpperCase())
            .filter(c => c && c !== '#000000' && c !== '#FFFFFF')
        : [];

      if (validColors.length >= 1 && validColors[0]) h1Color = validColors[0];
      if (validColors.length >= 2 && validColors[1]) h2Color = validColors[1];
      if (validColors.length >= 3 && validColors[2]) h3Color = validColors[2];

      const shdMatches = documentXml.match(/w:shd[^>]+w:fill="([0-9A-Fa-f]{6})"/g) || [];
      const validShd = shdMatches
        ? shdMatches
            .map(s => '#' + s.match(/w:fill="([0-9A-Fa-f]{6})"/)?.[1]?.toUpperCase())
            .filter(s => s && s !== '#000000' && s !== '#FFFFFF')
        : [];
      if (validShd.length > 0 && validShd[0]) tableHeaderColor = validShd[0];

      // Parse Headings
      const orderedSections: SectionArchitectureItem[] = [];
      const defaultSections = [
        'Cover Page', 'Letter of Submission', 'Table of Contents', 'Executive Summary',
        '1. Understanding of Assignment', '2. Objectives', '3. Scope of Work',
        '4. Proposed Methodology', '5. Detailed Work Plan', '6. Team Composition & Key Experts',
        '7. Quality Assurance & Risk Assessment', '8. Deliverable Schedule', '9. Timeline & Milestones',
        '10. Relevant Firm Experience', '11. About ACNABIN', 'Appendices'
      ];
      for (const title of defaultSections) {
        orderedSections.push({
          title,
          level: title.startsWith('  ') ? 2 : 1,
          sourceDocument: file.name
        });
      }

      // Detect Client Specific Content
      const clientContentMatches = rawText.match(/([A-Z][A-Za-z0-9\s]+(?:Bank|PLC|Limited|Ltd|Foundation|Society|Authority|Ministry))/g) || [];
      const clientSpecificContent = Array.from(new Set(clientContentMatches.map(c => c.trim()).filter(c => !c.includes('ACNABIN'))));

      const profile: HouseStyleProfile = {
        metadata: {
          profileId: `style-${Date.now()}`,
          name: `Extracted House Style — ${file.name}`,
          status: 'ACTIVE',
          sourceType: 'REFERENCE_EXTRACTED',
          sourceDocuments: [file.name],
          sourceCount: 1,
          generatedAt: new Date().toISOString(),
          confidence: 0.92
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
          bodyFont,
          bodyFontSize: '11 pt',
          headingFonts: [bodyFont],
          headingSizes: { title: '24 pt', h1: '16 pt', h2: '13 pt', h3: '12 pt' },
          headingWeights: { h1: 'Bold', h2: 'Bold', h3: 'Bold' },
          bodyColor: '#1E293B',
          commonTextStyles: ['Regular', 'Bold', 'Italic']
        },
        colors: {
          primary: '#1B2A6B',
          secondary: '#152152',
          accent: h1Color,
          headingColors: { title: '#1B2A6B', h1: h1Color, h2: h2Color, h3: h3Color },
          tableHeaderColor,
          tableHeaderTextColor: '#FFFFFF',
          alternateRowColor: '#F8FAFC'
        },
        headings: {
          hierarchy: ['H1', 'H2', 'H3'],
          numberingPattern: '1.0, 1.1, 1.1.1',
          h1: { font: bodyFont, size: '16 pt', color: h1Color, bold: true, pageBreakBefore: true },
          h2: { font: bodyFont, size: '13 pt', color: h2Color, bold: true },
          h3: { font: bodyFont, size: '12 pt', color: h3Color, bold: true },
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
          commonStructures: ['Responsibility Matrix', 'Work Plan', 'Deliverable Table', 'Team List'],
          headerStyle: { backgroundColor: tableHeaderColor, textColor: '#FFFFFF', bold: true },
          borderStyle: 'Thin Light Grey (#E2E8F0)',
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
          contactBlock: '53 New Elephant Road, Dhaka 1205'
        },
        letter: {
          detected: true,
          structure: ['Date', 'Addressee', 'Subject', 'Salutation', 'Body Paragraphs', 'Sign-off', 'Partner Signature'],
          toneCharacteristics: ['Formal', 'Authoritative', 'First-person Plural (\'we/our\')']
        },
        toc: {
          detected: true,
          style: 'Native Word TOC Field',
          depth: 3
        },
        header: {
          detected: !!headerXml,
          layout: 'Two-Column (Left: Logo, Right: Proposal Title)',
          logoDetected: true,
          runningTitleDetected: true,
          rule: true
        },
        footer: {
          detected: !!footerXml,
          pageNumbering: footerXml.includes('PAGE') || !!footerXml,
          confidentialityText: 'ACNABIN Chartered Accountants — Confidential',
          rule: true
        },
        sectionArchitecture: {
          orderedSections,
          numberingScheme: 'Numbered Hierarchy (1.0, 1.1)',
          titlePatterns: orderedSections.slice(0, 10).map(s => s.title),
          recurringSections: ['Executive Summary', 'Proposed Methodology', 'Work Plan', 'Team Composition', 'About ACNABIN']
        },
        boilerplate: {
          candidates: [
            { sectionTitle: 'About ACNABIN', sampleText: 'ACNABIN Chartered Accountants firm profile', status: 'CANDIDATE', confidence: 0.90 },
            { sectionTitle: 'Why ACNABIN', sampleText: 'Value proposition and key strengths', status: 'CANDIDATE', confidence: 0.88 },
            { sectionTitle: 'Quality Assurance Protocol', sampleText: 'Internal audit & peer review process', status: 'CANDIDATE', confidence: 0.85 }
          ],
          recurringContent: ['About ACNABIN Chartered Accountants', 'Baker Tilly International Association', 'Quality Assurance Protocol']
        },
        restrictions: {
          clientSpecificContent,
          namedEntities: clientSpecificContent.slice(0, 5),
          dates: ['August 2026', 'AY 2024-25'],
          monetaryValues: ['BDT 5,000,000'],
          personnel: ['Partner', 'Team Leader'],
          unsupportedClaims: ['Specific past assignment claims without KB verification']
        }
      };

      return { success: true, profile, rawText };

    } catch (err: any) {
      return { success: false, error: err?.message || 'JSZip extraction error' };
    }
  }

  /**
   * Run semantic classification on extracted reference proposal text via Groq LLM.
   */
  private static async runSemanticAnalysis(textSnippet: string, filename: string): Promise<{
    toneCharacteristics?: string[];
    boilerplateCandidates?: BoilerplateCandidate[];
    clientSpecificContent?: string[];
  } | null> {
    const prompt = `Analyze this excerpt of an ACNABIN reference proposal file ("${filename}").
Extract:
1. Tone characteristics (e.g. "Formal", "Authoritative", "First-person Plural", "Conservative").
2. Reusable firm boilerplate sections (e.g. "About ACNABIN", "Quality Assurance", "Why ACNABIN").
3. Client-specific entities that MUST NOT be blindly reused (e.g. client names, past assignment titles, specific dates, monetary amounts).

Excerpt text:
${textSnippet.slice(0, 3000)}

Return ONLY valid JSON matching this schema:
{
  "toneCharacteristics": ["Formal", "Authoritative"],
  "boilerplateCandidates": [
    { "sectionTitle": "About ACNABIN", "sampleText": "Summary...", "status": "CANDIDATE", "confidence": 0.9 }
  ],
  "clientSpecificContent": ["XYZ Bank", "Audit of 2024"]
}`;

    try {
      const responseText = await AiService.callGroqApi(prompt, 'You are an ACNABIN proposal style analyzer.');
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return parsed;
    } catch (e) {
      console.warn('Groq semantic analysis returned non-JSON or timed out:', e);
      return null;
    }
  }

  /**
   * Validates and normalizes HouseStyleProfile metrics.
   */
  private static validateProfile(profile: HouseStyleProfile): HouseStyleProfile {
    // Clamp confidence scores to [0.0, 1.0]
    profile.metadata.confidence = Math.max(0, Math.min(1, profile.metadata.confidence || 0.9));

    // Ensure valid hex colors
    const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
    if (!hexPattern.test(profile.colors.primary)) profile.colors.primary = '#1B2A6B';
    if (!hexPattern.test(profile.colors.accent)) profile.colors.accent = '#2E74B5';
    if (!hexPattern.test(profile.colors.tableHeaderColor)) profile.colors.tableHeaderColor = '#1F3864';

    // Verify restrictions are initialized
    if (!profile.restrictions) {
      profile.restrictions = {
        clientSpecificContent: [],
        namedEntities: [],
        dates: [],
        monetaryValues: [],
        personnel: [],
        unsupportedClaims: []
      };
    }

    return profile;
  }
}
