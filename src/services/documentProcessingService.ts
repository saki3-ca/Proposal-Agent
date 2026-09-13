export interface ProcessingQuality {
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

      // Check for network errors / server unreachable / failed to fetch
      const isFetchFailure =
        err instanceof TypeError ||
        (err?.message &&
          (err.message.includes('fetch') ||
            err.message.includes('NetworkError') ||
            err.message.includes('Failed') ||
            err.message.includes('Load failed')));

      return {
        success: false,
        error: {
          code: isFetchFailure ? 'BACKEND_UNREACHABLE' : 'EXTRACTION_ERROR',
          stage: 'FastAPI Connection',
          message: isFetchFailure
            ? 'Cannot connect to Proposal Agent server. Make sure the FastAPI backend is running.'
            : err?.message || 'Could not connect to local document processing server at http://127.0.0.1:8000.'
        }
      };
    }
  }
}
