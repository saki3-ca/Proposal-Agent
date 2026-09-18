import { SUPABASE_CONFIG } from './supabaseClient';
import { LibraryDocumentItem } from './documentLibraryData';
import { ProjectDocument } from '../types';

/**
 * Supabase Storage & Database Service
 * Automatically uploads raw files (PDF, DOCX, Images) to Supabase Storage Bucket
 * and syncs document records with markdown to Supabase Database.
 */
export class SupabaseStorageService {
  private static BUCKET_NAME = 'documents';

  /**
   * Uploads a raw file (PDF, DOCX, Image) to Supabase Storage.
   * Returns the permanent public or accessible URL.
   */
  static async uploadRawFile(
    file: File | Blob,
    fileName: string,
    folderPath: string = 'general'
  ): Promise<{ success: boolean; url: string; error?: string }> {
    if (!SUPABASE_CONFIG.isConfigured) {
      // Return local object URL if Supabase is not configured yet
      return {
        success: true,
        url: URL.createObjectURL(file),
        error: 'Supabase credentials not set; cached locally.'
      };
    }

    try {
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const cleanFolder = folderPath.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${cleanFolder}/${Date.now()}_${sanitizedName}`;

      const uploadUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/${this.BUCKET_NAME}/${storagePath}`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
          apikey: SUPABASE_CONFIG.anonKey,
          'Content-Type': file.type || 'application/octet-stream',
          'x-upsert': 'true'
        },
        body: file
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[Supabase Storage] Upload failed (${response.status}):`, errText);
        // Fallback to local object URL
        return { success: false, url: URL.createObjectURL(file), error: errText };
      }

      // Public URL format
      const publicUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/public/${this.BUCKET_NAME}/${storagePath}`;
      return { success: true, url: publicUrl };
    } catch (err: any) {
      console.error('[Supabase Storage] Error uploading file:', err);
      return { success: false, url: URL.createObjectURL(file), error: err?.message };
    }
  }

  /**
   * Inserts or upserts a document record into Supabase `documents` table.
   */
  static async saveDocumentRecord(doc: LibraryDocumentItem | ProjectDocument): Promise<boolean> {
    if (!SUPABASE_CONFIG.isConfigured) {
      return false;
    }

    try {
      const restUrl = `${SUPABASE_CONFIG.url}/rest/v1/documents`;
      const payload = {
        id: doc.id,
        file_name: doc.fileName,
        file_type: doc.fileType,
        file_size_mb: doc.fileSizeMb,
        uploaded_by: doc.uploadedBy || 'SAKIB',
        upload_date: doc.uploadDate,
        processing_status: doc.processingStatus,
        ocr_required: doc.ocrRequired || false,
        ocr_completed: doc.ocrCompleted || true,
        page_count: doc.pageCount || 1,
        source_path: doc.sourcePath,
        ai_confidence: doc.aiConfidence || 0.95,
        version: doc.version || '1.0',
        markdown_content: doc.markdownContent || '',
        category: (doc as any).kbCategory || 'Other',
        folder_name: (doc as any).folderName || 'General',
        tags: (doc as any).tags || [],
        description: (doc as any).description || ''
      };

      const res = await fetch(restUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
          apikey: SUPABASE_CONFIG.anonKey,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify(payload)
      });

      return res.ok;
    } catch (e) {
      console.warn('[Supabase DB] Error syncing document record:', e);
      return false;
    }
  }

  /**
   * Fetches all documents from Supabase `documents` table if online.
   */
  static async fetchAllDocuments(): Promise<LibraryDocumentItem[]> {
    if (!SUPABASE_CONFIG.isConfigured) {
      return [];
    }

    try {
      const restUrl = `${SUPABASE_CONFIG.url}/rest/v1/documents?select=*&order=created_at.desc`;
      const res = await fetch(restUrl, {
        headers: {
          Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
          apikey: SUPABASE_CONFIG.anonKey
        }
      });

      if (!res.ok) return [];

      const rows = await res.json();
      if (!Array.isArray(rows)) return [];

      return rows.map((r: any) => ({
        id: r.id,
        fileName: r.file_name,
        fileType: r.file_type,
        fileSizeMb: r.file_size_mb,
        uploadedBy: r.uploaded_by,
        uploadDate: r.upload_date,
        processingStatus: r.processing_status,
        ocrRequired: r.ocr_required,
        ocrCompleted: r.ocr_completed,
        isSearchable: true,
        pageCount: r.page_count,
        sourcePath: r.source_path,
        sourceFileRelativePath: r.source_path,
        folderName: r.folder_name,
        aiConfidence: r.ai_confidence,
        version: r.version,
        kbCategory: r.category,
        tags: r.tags || [],
        description: r.description,
        markdownContent: r.markdown_content
      }));
    } catch (e) {
      console.warn('[Supabase DB] Could not fetch documents from Supabase:', e);
      return [];
    }
  }
}
