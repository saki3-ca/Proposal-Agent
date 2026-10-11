import JSZip from 'jszip';

export interface ClientExtractionResult {
  markdown: string;
  pageCount: number;
  wordCount: number;
  charCount: number;
  source: 'client_pdfjs' | 'client_docx' | 'client_text' | 'client_stream';
}

/**
 * Ensures PDF.js library is loaded in the browser window on demand without bundler conflicts.
 */
async function loadPdfJsInBrowser(): Promise<any> {
  if (typeof window === 'undefined') return null;

  if ((window as any).pdfjsLib) {
    return (window as any).pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById('pdfjs-cdn-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve((window as any).pdfjsLib));
      existingScript.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.id = 'pdfjs-cdn-script';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;

    script.onload = () => {
      const pdfjs = (window as any).pdfjsLib;
      if (pdfjs) {
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(pdfjs);
      } else {
        reject(new Error('PDF.js loaded but window.pdfjsLib is undefined'));
      }
    };

    script.onerror = (err) => {
      console.warn('[ClientDocumentParser] Failed to load PDF.js from CDN:', err);
      reject(err);
    };

    document.head.appendChild(script);
  });
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
    } else if (fileName.endsWith('.pptx')) {
      return await this.extractPptxText(file);
    } else if (fileName.endsWith('.xlsx')) {
      return await this.extractXlsxText(file);
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
   * Extracts text and slides from PowerPoint (.pptx) using JSZip and XML parsing
   */
  static async extractPptxText(file: File): Promise<ClientExtractionResult> {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const parser = new DOMParser();
    const slides: string[] = [];

    // Find all slide XML files
    const slideFileNames = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
      .sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10);
        const numB = parseInt(b.replace(/\D/g, ''), 10);
        return numA - numB;
      });

    for (let idx = 0; idx < slideFileNames.length; idx++) {
      const slideFile = zip.file(slideFileNames[idx]);
      if (!slideFile) continue;

      const slideXml = await slideFile.async('text');
      const xmlDoc = parser.parseFromString(slideXml, 'application/xml');
      const textNodes = xmlDoc.getElementsByTagName('a:t');
      const slideTexts: string[] = [];

      for (let j = 0; j < textNodes.length; j++) {
        const txt = textNodes[j].textContent?.trim();
        if (txt) slideTexts.push(txt);
      }

      if (slideTexts.length > 0) {
        slides.push(`## Slide ${idx + 1}\n\n${slideTexts.join('\n\n')}`);
      }
    }

    const fullMarkdown = slides.length > 0 ? slides.join('\n\n---\n\n') : `# ${file.name}\n*(No text extracted from slides)*`;
    return {
      markdown: fullMarkdown,
      pageCount: Math.max(1, slideFileNames.length),
      wordCount: fullMarkdown.split(/\s+/).filter(Boolean).length,
      charCount: fullMarkdown.length,
      source: 'client_docx'
    };
  }

  /**
   * Extracts sheet text from Excel (.xlsx) using JSZip and SharedStrings XML
   */
  static async extractXlsxText(file: File): Promise<ClientExtractionResult> {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const parser = new DOMParser();

    // 1. Read shared strings
    const sharedStrings: string[] = [];
    const sharedStringsFile = zip.file('xl/sharedStrings.xml');
    if (sharedStringsFile) {
      const ssXml = await sharedStringsFile.async('text');
      const ssDoc = parser.parseFromString(ssXml, 'application/xml');
      const tNodes = ssDoc.getElementsByTagName('t');
      for (let i = 0; i < tNodes.length; i++) {
        sharedStrings.push(tNodes[i].textContent || '');
      }
    }

    // 2. Read sheets
    const sheetFiles = Object.keys(zip.files)
      .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name))
      .sort();

    const mdSheets: string[] = [];

    for (let sIdx = 0; sIdx < sheetFiles.length; sIdx++) {
      const sheetFile = zip.file(sheetFiles[sIdx]);
      if (!sheetFile) continue;

      const sheetXml = await sheetFile.async('text');
      const sheetDoc = parser.parseFromString(sheetXml, 'application/xml');
      const rowNodes = sheetDoc.getElementsByTagName('row');
      const tableRows: string[] = [];

      for (let r = 0; r < Math.min(rowNodes.length, 200); r++) {
        const row = rowNodes[r];
        const cellNodes = row.getElementsByTagName('c');
        const cellValues: string[] = [];

        for (let c = 0; c < cellNodes.length; c++) {
          const cell = cellNodes[c];
          const cellType = cell.getAttribute('t');
          const vNode = cell.getElementsByTagName('v')[0];
          let val = vNode?.textContent || '';

          if (cellType === 's') {
            const idx = parseInt(val, 10);
            val = !isNaN(idx) && sharedStrings[idx] ? sharedStrings[idx] : val;
          }
          cellValues.push(val.trim().replace(/\|/g, '\\|') || ' ');
        }

        if (cellValues.length > 0) {
          tableRows.push(`| ${cellValues.join(' | ')} |`);
          if (r === 0) {
            const sep = Array(cellValues.length).fill('---').join(' | ');
            tableRows.push(`| ${sep} |`);
          }
        }
      }

      if (tableRows.length > 0) {
        mdSheets.push(`## Sheet ${sIdx + 1}\n\n${tableRows.join('\n')}`);
      }
    }

    const fullMarkdown = mdSheets.length > 0 ? mdSheets.join('\n\n---\n\n') : `# ${file.name}\n*(Empty spreadsheet)*`;
    return {
      markdown: fullMarkdown,
      pageCount: Math.max(1, sheetFiles.length),
      wordCount: fullMarkdown.split(/\s+/).filter(Boolean).length,
      charCount: fullMarkdown.length,
      source: 'client_docx'
    };
  }

  /**
   * Extracts formatted text and layout from PDF using browser PDF.js with regex stream fallback
   */
  static async extractPdfText(file: File): Promise<ClientExtractionResult> {
    const arrayBuffer = await file.arrayBuffer();

    // 1. Try browser PDF.js
    try {
      const pdfjs = await loadPdfJsInBrowser();
      if (pdfjs) {
        const loadingTask = pdfjs.getDocument({
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
            
            // Line break detection based on vertical shift
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
      }
    } catch (pdfjsErr) {
      console.warn('[ClientDocumentParser] Browser PDF.js extraction notice, trying stream fallback:', pdfjsErr);
    }

    // 2. Fallback: Fast client-side byte stream text extraction
    const streamText = this.extractPdfStreamFallback(arrayBuffer);
    if (streamText.length > 80) {
      return {
        markdown: streamText,
        pageCount: Math.max(1, Math.ceil(streamText.length / 2500)),
        wordCount: streamText.split(/\s+/).filter(Boolean).length,
        charCount: streamText.length,
        source: 'client_stream'
      };
    }

    throw new Error(`Could not extract readable text from PDF "${file.name}". If this is a scanned document, please upload a digital PDF or DOCX file.`);
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

    // Read page count from docProps/app.xml if available
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
