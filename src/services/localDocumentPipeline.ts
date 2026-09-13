import { ProjectDocument, Requirement, ProposalSection } from '../types';
import { AiService } from './aiService';

export type ClassifiedDocType =
  | 'TOR/EOI'
  | 'Financial Template / RFP'
  | 'Past Proposal / Reference'
  | 'CV / Key Expert Profile'
  | 'Firm Certification / Legal'
  | 'General Supporting Attachment';

export interface ProcessedPipelineResult {
  documentId: string;
  normalizedMarkdown: string;
  classification: ClassifiedDocType;
  extractedRequirements: Partial<Requirement>[];
  suggestedModelRouting: {
    primary: 'Gemini' | 'DeepSeek' | 'Claude' | 'Groq';
    reason: string;
  };
}

import { DocumentProcessingService, ProcessedDocumentResponse } from './documentProcessingService';
import { MarkdownNormalizer } from './markdownNormalizer';

export class LocalDocumentPipeline {
  /**
   * 1. MarkItDown (LOCAL): Connects to FastAPI service to execute real Microsoft MarkItDown extraction.
   */
  static async processWithMarkItDown(
    file: File | { name: string; type?: string }
  ): Promise<{ markdown: string; ocrRequired: boolean; qualityScore: number; isSuspicious?: boolean }> {
    if (file instanceof File) {
      const res: ProcessedDocumentResponse = await DocumentProcessingService.processDocument(file);
      if (res.success && res.document) {
        const norm = MarkdownNormalizer.normalize(res.document.markdown, file.name);
        return {
          markdown: norm.normalizedMarkdown,
          ocrRequired: res.document.ocrRequired || norm.ocrRecommended,
          qualityScore: res.document.quality.score,
          isSuspicious: norm.isSuspicious
        };
      } else {
        throw new Error(
          res.error?.message ||
            'MarkItDown extraction failed. Please ensure the local backend service is running on http://127.0.0.1:8000.'
        );
      }
    }

    return {
      markdown: '',
      ocrRequired: false,
      qualityScore: 0.0,
      isSuspicious: true
    };
  }

  /**
   * 2. Document Classification: Classifies document based on normalized Markdown keywords
   */
  static classifyDocument(normalizedMarkdown: string): ClassifiedDocType {
    const text = normalizedMarkdown.toLowerCase();

    if (text.includes('scope of work') || text.includes('terms of reference') || text.includes('eoi') || text.includes('eligibility')) {
      return 'TOR/EOI';
    }
    if (text.includes('unit rate') || text.includes('fee schedule') || text.includes('financial proposal')) {
      return 'Financial Template / RFP';
    }
    if (text.includes('curriculum vitae') || text.includes('key expert') || text.includes('educational qualification')) {
      return 'CV / Key Expert Profile';
    }
    if (text.includes('icab') || text.includes('tax clearance') || text.includes('trade license')) {
      return 'Firm Certification / Legal';
    }
    if (text.includes('technical proposal') || text.includes('past assignment')) {
      return 'Past Proposal / Reference';
    }

    return 'General Supporting Attachment';
  }

  /**
   * 3. AI Model Router: Intelligent Model Selection Matrix across Gemini, DeepSeek, Claude, and Groq
   */
  static selectBestModelForTask(
    classification: ClassifiedDocType,
    taskType: 'extraction' | 'drafting' | 'audit' | 'fast_edit'
  ): { primary: 'Gemini' | 'DeepSeek' | 'Claude' | 'Groq'; reason: string } {
    if (taskType === 'fast_edit') {
      return {
        primary: 'Groq',
        reason: 'Groq (Llama 3.3 70B) provides sub-second latency for inline draft rewrites and tone improvements.'
      };
    }

    if (taskType === 'audit') {
      return {
        primary: 'DeepSeek',
        reason: 'DeepSeek R1 reasoning model excels at finding discrepancies, missing annexes, and unevidenced claims.'
      };
    }

    if (classification === 'TOR/EOI' && taskType === 'drafting') {
      return {
        primary: 'Gemini',
        reason: 'Gemini 1.5 Pro handles ultra-long context ingestion (1M+ tokens) to draft complete ACNABIN technical proposals.'
      };
    }

    return {
      primary: 'Claude',
      reason: 'Claude 3.5 Sonnet provides highly structured, nuanced prose for executive summaries and complex technical methodologies.'
    };
  }

  /**
   * 4. Full PC Local Pipeline Execution Workflow
   */
  static async runFullPipeline(file: File): Promise<ProcessedPipelineResult> {
    // Step 1 & 2: MarkItDown Local Normalization via FastAPI backend
    const extraction = await this.processWithMarkItDown(file);
    const normalizedMarkdown = extraction.markdown;

    // Step 3: Classification
    const classification = this.classifyDocument(normalizedMarkdown);

    // Step 4: Requirement Extraction
    const extractedRequirements = await AiService.extractRequirements(normalizedMarkdown, file.name);

    // Step 5: AI Model Routing Selection
    const suggestedModelRouting = this.selectBestModelForTask(classification, 'drafting');

    return {
      documentId: `doc-${Date.now()}`,
      normalizedMarkdown,
      classification,
      extractedRequirements,
      suggestedModelRouting
    };
  }
}
