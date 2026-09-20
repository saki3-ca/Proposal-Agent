npm run buildexport interface ProcessingQuality {
  score: number;
  status: 'good' | 'acceptable' | 'poor' | 'failed';
  characterCount: number;
  wordCount: number;
  lineCount: number;
  headingCount: number;
  tableCount: number;
  suspiciousCharacterRatio: number;
  ocrRequired: boolean;
}

export interface ProcessedDocumentData {
  filename: string;
  extension: string;
  mimeType?: string;
  source: string;
  markdown: string;
  quality: ProcessingQuality;
  ocrRequired: boolean;
  ocrCompleted?: boolean;
  processingTimeMs: number;
  processedAt?: string;
}

export interface ProcessedDocumentResponse {
  success: boolean;
  document?: ProcessedDocumentData;
  error?: {
    code: string;
    stage?: string;
    message: string;
  };
}

import { ClientDocumentParser } from './clientDocumentParser';

const FASTAPI_BASE_URL = (import.meta as any).env?.VITE_DOCUMENT_PROCESSOR_URL || 'http://127.0.0.1:8000';

export class DocumentProcessingService {
  /**
   * Health check to verify local FastAPI backend server status
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${FASTAPI_BASE_URL}/health`, { method: 'GET' });
      if (!response.ok) return false;
      const data = await response.json();
      return data.status === 'ok';
    } catch {
      return false;
    }
  }

  /**
   * Sends binary file FormData to FastAPI /process-document endpoint for real MarkItDown extraction
   */
  static async processDocument(file: File): Promise<ProcessedDocumentResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes timeout for heavy OCR

    try {
      const formData = new FormData();
      formData.append('file', file, file.name);

      const response = await fetch(`${FASTAPI_BASE_URL}/process-document`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || {
            code: `HTTP_${response.status}`,
            stage: 'Microsoft MarkItDown',
            message: `Server returned error status ${response.status} (${response.statusText || 'Extraction failed'})`
          }
        };
      }

      const data: ProcessedDocumentResponse = await response.json();
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'EXTRACTION_TIMEOUT',
            stage: 'Microsoft MarkItDown',
            message: 'Document extraction timed out after 3 minutes. The document may be extremely large or complex.'
          }
        };
      }

      const isFetchFailure =
        err instanceof TypeError ||
        (err?.message &&
          (err.message.includes('fetch') ||
            err.message.includes('NetworkError') ||
            err.message.includes('Failed') ||
            err.message.includes('Load failed')));

      // Run client-side PDF / DOCX / Text extraction if backend is unreachable (e.g., on Vercel deployment)
      if (isFetchFailure) {
        console.log(`[DocumentProcessingService] Backend unreachable. Running client-side browser extractor for ${file.name}...`);
        try {
          const clientRes = await ClientDocumentParser.extractText(file);
          const ext = file.name.split('.').pop() || '';
          return {
            success: true,
            document: {
              filename: file.name,
              extension: ext,
              source: clientRes.source,
              markdown: clientRes.markdown,
              quality: {
                score: 0.95,
                status: 'good',
                characterCount: clientRes.charCount,
                wordCount: clientRes.wordCount,
                lineCount: clientRes.markdown.split('\n').length,
                headingCount: (clientRes.markdown.match(/^#{1,4}\s+/gm) || []).length,
                tableCount: (clientRes.markdown.match(/\|/g) || []).length > 4 ? 1 : 0,
                suspiciousCharacterRatio: 0,
                ocrRequired: false
              },
              ocrRequired: false,
              ocrCompleted: false,
              pagesProcessed: clientRes.pageCount,
              processingTimeMs: 150,
              processedAt: new Date().toISOString()
            } as any
          };
        } catch (clientErr: any) {
          console.error(`[DocumentProcessingService] Client extraction error for ${file.name}:`, clientErr);
          return {
            success: false,
            error: {
              code: 'CLIENT_EXTRACTION_FAILED',
              stage: 'Browser Client Parser',
              message: clientErr?.message || `Could not parse text from ${file.name}.`
            }
          };
        }
      }

      return {
        success: false,
        error: {
          code: 'EXTRACTION_ERROR',
          stage: 'FastAPI Processing',
          message: err?.message || 'Could not process document with local MarkItDown engine.'
        }
      };
    }
  }
}
