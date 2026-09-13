import { LibraryCategory } from '../pages/DocumentLibraryPage';
import { ClassifiedDocType } from './localDocumentPipeline';

export interface DocumentClassificationResult {
  category: LibraryCategory;
  classifiedType: ClassifiedDocType;
  confidence: number;
  isCv: boolean;
  isOrgProfile: boolean;
  reason: string;
  detectedTags: string[];
}

export class DocumentClassificationService {
  /**
   * Deterministically and accurately classifies a document based on its file name and extracted text.
   * Special emphasis on differentiating Individual CVs / Resumes from Company / Institutional Profiles.
   */
  static classify(fileName: string, rawText: string = ''): DocumentClassificationResult {
    const nameLower = (fileName || '').toLowerCase();
    const textLower = (rawText || '').toLowerCase();
    const combined = `${nameLower} \n ${textLower}`;

    // -------------------------------------------------------------
    // 1. Scoring Engine for CV vs Company Profile vs Other
    // -------------------------------------------------------------
    let cvScore = 0;
    let orgProfileScore = 0;
    let expScore = 0;
    let certLegalScore = 0;
    let proposalScore = 0;
    let torScore = 0;

    const cvSignals: string[] = [];
    const orgSignals: string[] = [];

    // --- CV / RESUME INDICATORS ---
    if (/\b(cv|resume|curriculum\s*vitae|bio[- ]?data|biodata)\b/i.test(nameLower)) {
      cvScore += 60;
      cvSignals.push('File name contains CV/Resume keyword');
    }
    if (/\b(curriculum\s+vitae|curriculum-vitae|resume|bio\s*data)\b/i.test(textLower)) {
      cvScore += 50;
      cvSignals.push('Document heading contains Curriculum Vitae / Resume');
    }
    if (/\b(educational?\s+(background|qualification|attainment)|academic\s+qualification)\b/i.test(textLower)) {
      cvScore += 30;
      cvSignals.push('Educational / Academic Qualifications section');
    }
    if (/\b(employment\s+(record|history)|career\s+summary|work\s+experience|professional\s+experience|positions\s+held)\b/i.test(textLower)) {
      cvScore += 25;
      cvSignals.push('Employment History / Work Experience section');
    }
    if (/\b(date\s+of\s+birth|nationality|marital\s+status|father'?s\s+name|mother'?s\s+name)\b/i.test(textLower)) {
      cvScore += 35;
      cvSignals.push('Personal biographical fields (DOB, Nationality)');
    }
    if (/\b(i,\s+the\s+undersigned|certify\s+that\s+to\s+the\s+best\s+of\s+my\s+knowledge|expert\s+declaration)\b/i.test(textLower)) {
      cvScore += 35;
      cvSignals.push('Standard Expert Signature / Certification statement');
    }
    if (/\b(key\s+expert|lead\s+consultant|engagement\s+partner|team\s+leader|senior\s+auditor)\b/i.test(combined)) {
      cvScore += 15;
    }
    if (/\b(years\s+of\s+experience|pqe\s+years|post[- ]qualification\s+experience)\b/i.test(textLower)) {
      cvScore += 20;
    }
    if (/\b(language\s+proficiency|referees|references|hobbies|extracurricular)\b/i.test(textLower)) {
      cvScore += 20;
    }

    // --- COMPANY / ORGANIZATIONAL PROFILE INDICATORS ---
    if (/\b(org(anizational)?\s*profile|firm\s*profile|company\s*profile|corporate\s*profile)\b/i.test(nameLower)) {
      orgProfileScore += 60;
      orgSignals.push('File name contains Organizational / Firm Profile keyword');
    }
    if (/\b(about\s+the\s+firm|about\s+acnabin|firm\s+overview|corporate\s+profile|organizational\s+profile|firm\s+profile)\b/i.test(textLower)) {
      orgProfileScore += 45;
      orgSignals.push('Firm Overview / Corporate Profile section header');
    }
    if (/\b(established\s+in\s+1985|history\s+since\s+1985|40\s+years\s+of\s+excellence|founding\s+partners)\b/i.test(textLower)) {
      orgProfileScore += 40;
      orgSignals.push('Institutional history / 1985 founding milestones');
    }
    if (/\b(baker\s+tilly\s+international|independent\s+member\s+firm|global\s+network|worldwide\s+network)\b/i.test(textLower)) {
      orgProfileScore += 35;
      orgSignals.push('Baker Tilly network / International institutional affiliation');
    }
    if (/\b(service\s+lines|overview\s+of\s+services|statutory\s+audit\s+practice|consulting\s+division|partner\s+directory|our\s+partners|leadership\s+team)\b/i.test(textLower)) {
      orgProfileScore += 30;
      orgSignals.push('Firm service lines, partner directory & practice divisions');
    }
    if (/\b(organogram|governance\s+structure|firm\s+management\s+committee|isqm\s*1|quality\s+control\s+system)\b/i.test(textLower)) {
      orgProfileScore += 25;
      orgSignals.push('Institutional governance, organogram, ISQM standards');
    }

    // --- EXPERIENCE & WORK ORDERS ---
    if (/\b(appointment\s+letter|work\s+order|engagement\s+letter|completion\s+certificate|acceptance\s+of\s+appointment)\b/i.test(nameLower)) {
      expScore += 70;
    }
    if (/\b(we\s+are\s+pleased\s+to\s+appoint|contract\s+value|scope\s+of\s+services\s+rendered|satisfactorily\s+completed)\b/i.test(textLower)) {
      expScore += 40;
    }

    // --- CERTIFICATES & LEGAL / TAX ---
    if (/\b(tin\s*certificate|bin\s*certificate|trade\s*license|tax\s*clearance|acknowledgement\s*of\s*return|icab.*practice|incorporation\s*certificate|solvency\s*certificate)\b/i.test(nameLower)) {
      certLegalScore += 70;
    }
    if (/\b(national\s+board\s+of\s+revenue|certificate\s+of\s+practice|institute\s+of\s+chartered\s+accountants\s+of\s+bangladesh|e-tin|taxpayer\s+identification)\b/i.test(textLower)) {
      certLegalScore += 45;
    }

    // --- PREVIOUS PROPOSALS ---
    if (/\b(technical\s*proposal|financial\s*proposal|eoi\s*submission|proposal\s*draft|sample\s*proposal)\b/i.test(nameLower)) {
      proposalScore += 60;
    }
    if (/\b(executive\s+summary|technical\s+approach|methodology\s+and\s+work\s+plan|firm\s+credentials\s+for\s+assignment)\b/i.test(textLower)) {
      proposalScore += 35;
    }

    // --- TOR / RFP ---
    if (/\b(tor|terms\s*of\s*reference|rfp|request\s*for\s*proposal)\b/i.test(nameLower)) {
      torScore += 60;
    }
    if (/\b(terms\s+of\s+reference|scope\s+of\s+work\s+for\s+the\s+consultant|bidding\s+instructions|submission\s+deadline\s+for\s+proposals)\b/i.test(textLower)) {
      torScore += 40;
    }

    // -------------------------------------------------------------
    // 2. Decision Logic with Clear Disambiguation
    // -------------------------------------------------------------

    // DECISION 1: Is it definitely a CV?
    // A CV must NOT be classified as Company Profile even if it mentions ACNABIN or Baker Tilly in experience.
    if (cvScore >= 45 && cvScore > orgProfileScore) {
      const tags = ['CV', 'Key Expert', 'Individual Profile'];
      if (textLower.includes('fca') || textLower.includes('icab')) tags.push('FCA / ICAB');
      if (textLower.includes('audit')) tags.push('Auditor');

      return {
        category: 'CVs',
        classifiedType: 'CV / Key Expert Profile',
        confidence: Math.min(0.99, 0.75 + cvScore * 0.003),
        isCv: true,
        isOrgProfile: false,
        reason: `Classified as Key Expert CV (${cvSignals.join('; ') || 'Personal CV format detected'}).`,
        detectedTags: tags
      };
    }

    // DECISION 2: Is it an Organizational / Company Profile?
    if (orgProfileScore >= 45 && orgProfileScore > cvScore) {
      return {
        category: 'Company Profile',
        classifiedType: 'Company / Organizational Profile',
        confidence: Math.min(0.99, 0.75 + orgProfileScore * 0.003),
        isCv: false,
        isOrgProfile: true,
        reason: `Classified as Institutional Company Profile (${orgSignals.join('; ') || 'Firm profile detected'}).`,
        detectedTags: ['Firm Profile', 'Baker Tilly', 'Institutional Credentials', 'ACNABIN']
      };
    }

    // DECISION 3: Certificates, Legal & Tax
    if (certLegalScore >= 40) {
      const isTaxOrLicense = nameLower.includes('tin') || nameLower.includes('bin') || nameLower.includes('trade') || nameLower.includes('tax');
      const category: LibraryCategory = isTaxOrLicense ? 'Legal & Tax' : 'Certificates & Credentials';
      return {
        category,
        classifiedType: 'Firm Certification / Legal',
        confidence: 0.95,
        isCv: false,
        isOrgProfile: false,
        reason: 'Statutory government certificate or professional practice license.',
        detectedTags: ['Statutory Document', 'Registration', 'Compliance']
      };
    }

    // DECISION 4: Company Experience / Work Order
    if (expScore >= 40) {
      return {
        category: 'Company Experience',
        classifiedType: 'Past Proposal / Reference',
        confidence: 0.92,
        isCv: false,
        isOrgProfile: false,
        reason: 'Client appointment letter, engagement letter, or project completion certificate.',
        detectedTags: ['Experience Record', 'Appointment Letter', 'Track Record']
      };
    }

    // DECISION 5: Previous Proposal
    if (proposalScore >= 40) {
      return {
        category: 'Previous Proposals',
        classifiedType: 'Past Proposal / Reference',
        confidence: 0.90,
        isCv: false,
        isOrgProfile: false,
        reason: 'Previous technical/financial proposal or EOI submission.',
        detectedTags: ['Proposal Benchmark', 'Technical Proposal']
      };
    }

    // DECISION 6: TOR / RFP
    if (torScore >= 35) {
      return {
        category: 'Other',
        classifiedType: 'TOR/EOI',
        confidence: 0.92,
        isCv: false,
        isOrgProfile: false,
        reason: 'Terms of Reference (ToR) or client RFP tender documentation.',
        detectedTags: ['TOR', 'Tender Requirements']
      };
    }

    // Default Fallback
    return {
      category: 'Other',
      classifiedType: 'General Supporting Attachment',
      confidence: 0.70,
      isCv: false,
      isOrgProfile: false,
      reason: 'General supporting attachment or annexure.',
      detectedTags: ['General Document']
    };
  }
}
