import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

// Configure pdfjs worker
try {
  if (typeof window !== 'undefined') {
    // Use unpkg/cdnjs worker CDN matching installed version to avoid Vite worker bundle path issues
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('[ClientDocumentParser] Could not set workerSrc:', e);
}

export interface ClientExtractionResult {
  markdown: string;
  pageCount: number;
  wordCount: number;
  charCount: number;
  source: 'client_pdfjs' | 'client_docx' | 'client_text' | 'client_stream';
}

export class ClientDocumentParser {
  /**
   * Main entry point to extract text from any file in the browser without requiring Python backend.
   */
  static async extractText(file: File): Promise<ClientExtractionResult> {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.pdf')) {
      return await this.extractPdfText(file);
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      return await this.extractDocxText(file);
    } else if (
      fileName.endsWith('.txt') ||
      fileName.endsWith('.md') ||
      fileName.endsWith('.json') ||
      fileName.endsWith('.csv') ||
      fileName.endsWith('.xml')
    ) {
      return await this.extractPlainText(file);
    } else {
      // Best-effort plain text read
      try {
        const text = await file.text();
        if (text && text.trim().length > 0) {
          return {
            markdown: text,
            pageCount: 1,
            wordCount: text.split(/\s+/).filter(Boolean).length,
            charCount: text.length,
            source: 'client_text'
          };
        }
      } catch (err) {
        console.warn('[ClientDocumentParser] Plain text read failed:', err);
      }

      throw new Error(`Unsupported binary format for direct browser extraction: ${file.name}`);
    }
  }

  /**
   * Extracts formatted text and layout from PDF using PDF.js with regex stream fallback
   */
  static async extractPdfText(file: File): Promise<ClientExtractionResult> {
    const arrayBuffer = await file.arrayBuffer();

    try {
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true
      });

      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const pageTexts: string[] = [];

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        let lastY: number | null = null;
        let pageStr = '';

        for (const item of textContent.items as any[]) {
          if (!('str' in item)) continue;
          
          // Check for line break based on Y-coordinate shift
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
            pageStr += '\n';
          } else if (pageStr.length > 0 && !pageStr.endsWith(' ') && !pageStr.endsWith('\n')) {
            pageStr += ' ';
          }

          pageStr += item.str;
          lastY = item.transform[5];
        }

        const cleanPageText = pageStr.trim();
        if (cleanPageText) {
          pageTexts.push(cleanPageText);
        }
      }

      const fullMarkdown = pageTexts.join('\n\n---\n\n');

      if (fullMarkdown.trim().length > 50) {
        return {
          markdown: fullMarkdown,
          pageCount: numPages,
          wordCount: fullMarkdown.split(/\s+/).filter(Boolean).length,
          charCount: fullMarkdown.length,
          source: 'client_pdfjs'
        };
      }
    } catch (pdfjsErr) {
      console.warn('[ClientDocumentParser] PDF.js extraction encountered issue, attempting fallback stream extraction:', pdfjsErr);
    }

    // Fallback: Raw byte stream text extraction for simple/uncompressed PDF text streams
    const streamText = this.extractPdfStreamFallback(arrayBuffer);
    if (streamText.length > 100) {
      return {
        markdown: streamText,
        pageCount: 1,
        wordCount: streamText.split(/\s+/).filter(Boolean).length,
        charCount: streamText.length,
        source: 'client_stream'
      };
    }

    throw new Error(`Could not extract readable text from PDF "${file.name}". The document may be a scanned image or encrypted.`);
  }

  /**
   * Extracts formatted text and tables from DOCX using JSZip and OpenXML DOM
   */
  static async extractDocxText(file: File): Promise<ClientExtractionResult> {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) {
      throw new Error(`Invalid DOCX structure in "${file.name}": word/document.xml not found.`);
    }

    const docXmlText = await docXmlFile.async('text');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXmlText, 'application/xml');

    const paragraphs: string[] = [];
    
    // Find all paragraphs and tables in sequence
    const body = xmlDoc.getElementsByTagName('w:body')[0];
    if (!body) {
      throw new Error(`Invalid DOCX structure: no body found in "${file.name}".`);
    }

    for (let i = 0; i < body.children.length; i++) {
      const node = body.children[i];
      const nodeName = node.nodeName;

      if (nodeName === 'w:p') {
        const pText = this.parseParagraph(node);
        if (pText) {
          paragraphs.push(pText);
        }
      } else if (nodeName === 'w:tbl') {
        const tableMd = this.parseTable(node);
        if (tableMd) {
          paragraphs.push(tableMd);
        }
      }
    }

    // Try reading page count from app.xml if available
    let pageCount = 1;
    try {
      const appXmlFile = zip.file('docProps/app.xml');
      if (appXmlFile) {
        const appXmlText = await appXmlFile.async('text');
        const appDoc = parser.parseFromString(appXmlText, 'application/xml');
        const pagesElem = appDoc.getElementsByTagName('Pages')[0];
        if (pagesElem && pagesElem.textContent) {
          const parsedPages = parseInt(pagesElem.textContent, 10);
          if (!isNaN(parsedPages) && parsedPages > 0) {
            pageCount = parsedPages;
          }
        }
      }
    } catch (e) {}

    const fullMarkdown = paragraphs.join('\n\n');
    return {
      markdown: fullMarkdown,
      pageCount,
      wordCount: fullMarkdown.split(/\s+/).filter(Boolean).length,
      charCount: fullMarkdown.length,
      source: 'client_docx'
    };
  }

  /**
   * Helper to parse DOCX paragraph into Markdown
   */
  private static parseParagraph(pNode: Element): string {
    const textNodes = pNode.getElementsByTagName('w:t');
    let text = '';
    for (let j = 0; j < textNodes.length; j++) {
      text += textNodes[j].textContent || '';
    }

    text = text.trim();
    if (!text) return '';

    // Detect heading styles if present
    const pStyle = pNode.getElementsByTagName('w:pStyle')[0];
    const styleVal = pStyle?.getAttribute('w:val')?.toLowerCase() || '';

    if (styleVal.includes('heading1') || styleVal === '1') {
      return `# ${text}`;
    } else if (styleVal.includes('heading2') || styleVal === '2') {
      return `## ${text}`;
    } else if (styleVal.includes('heading3') || styleVal === '3') {
      return `### ${text}`;
    }

    // Detect bullet lists
    const numPr = pNode.getElementsByTagName('w:numPr')[0];
    if (numPr) {
      return `- ${text}`;
    }

    return text;
  }

  /**
   * Helper to parse DOCX table into Markdown table
   */
  private static parseTable(tblNode: Element): string {
    const rows = tblNode.getElementsByTagName('w:tr');
    if (rows.length === 0) return '';

    const mdRows: string[] = [];
    let colCount = 0;

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const cells = row.getElementsByTagName('w:tc');
      const cellTexts: string[] = [];

      for (let c = 0; c < cells.length; c++) {
        const cell = cells[c];
        const tNodes = cell.getElementsByTagName('w:t');
        let cellStr = '';
        for (let t = 0; t < tNodes.length; t++) {
          cellStr += tNodes[t].textContent || '';
        }
        cellTexts.push(cellStr.trim().replace(/\|/g, '\\|') || ' ');
      }

      if (cellTexts.length > 0) {
        if (cellTexts.length > colCount) colCount = cellTexts.length;
        mdRows.push(`| ${cellTexts.join(' | ')} |`);

        // Insert header separator after first row
        if (r === 0) {
          const separator = Array(cellTexts.length).fill('---').join(' | ');
          mdRows.push(`| ${separator} |`);
        }
      }
    }

    return mdRows.join('\n');
  }

  /**
   * Extracts plain text from TXT, MD, CSV, JSON
   */
  static async extractPlainText(file: File): Promise<ClientExtractionResult> {
    const text = await file.text();
    return {
      markdown: text,
      pageCount: Math.max(1, Math.ceil(text.length / 3000)),
      wordCount: text.split(/\s+/).filter(Boolean).length,
      charCount: text.length,
      source: 'client_text'
    };
  }

  /**
   * Fallback raw text extractor for uncompressed PDF byte streams
   */
  private static extractPdfStreamFallback(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let str = '';
    const len = Math.min(bytes.length, 5000000); // 5MB limit
    for (let i = 0; i < len; i++) {
      const ch = bytes[i];
      if (ch >= 32 && ch <= 126) {
        str += String.fromCharCode(ch);
      } else if (ch === 10 || ch === 13) {
        str += '\n';
      }
    }

    const matches = str.match(/\(([^()]{3,})\)Tj|\[([^\[\]]{3,})\]TJ/g);
    if (matches && matches.length > 0) {
      return matches
        .map((m) => m.replace(/[()\[\]TjTJ]/g, '').trim())
        .filter((t) => t.length > 2)
        .join(' ');
    }

    return '';
  }
}
