/**
 * Markdown Normalization & Artifact Cleaning Engine
 * Cleans extraction artifacts from Microsoft MarkItDown without silently altering or inventing content:
 * - Collapses repeated blank lines (>2 newlines)
 * - Trims trailing whitespace
 * - Detects and cleans repeating header/footer watermarks
 * - Normalizes numbered section headings (e.g., "1. Scope of Work" -> "## 1. Scope of Work")
 * - Sanitizes malformed table lines
 * - Flags suspicious/incomplete extractions
 */

export interface NormalizationResult {
  normalizedMarkdown: string;
  originalCharCount: number;
  normalizedCharCount: number;
  cleanedArtifactsCount: number;
  repeatingHeadersRemoved: string[];
  warnings: string[];
  isSuspicious: boolean;
  ocrRecommended: boolean;
}

export class MarkdownNormalizer {
  /**
   * Normalizes raw MarkItDown extracted markdown text.
   */
  static normalize(rawMarkdown: string, filename?: string): NormalizationResult {
    if (!rawMarkdown || !rawMarkdown.trim()) {
      return {
        normalizedMarkdown: '',
        originalCharCount: 0,
        normalizedCharCount: 0,
        cleanedArtifactsCount: 0,
        repeatingHeadersRemoved: [],
        warnings: ['Document content is empty.'],
        isSuspicious: true,
        ocrRecommended: true
      };
    }

    const originalCharCount = rawMarkdown.length;
    const warnings: string[] = [];
    let cleanedArtifactsCount = 0;

    // 1. Detect repeating header/footer patterns
    const lines = rawMarkdown.split('\n');
    const lineFrequency: Record<string, number> = {};

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      // Only check non-trivial lines (between 8 and 100 characters)
      if (trimmed.length >= 8 && trimmed.length <= 100 && !trimmed.startsWith('#') && !trimmed.startsWith('|')) {
        lineFrequency[trimmed] = (lineFrequency[trimmed] || 0) + 1;
      }
    }

    // Lines that repeat 3+ times across the document are candidates for headers/footers
    const repeatingHeaders = Object.keys(lineFrequency).filter((line) => {
      const freq = lineFrequency[line];
      return (
        freq >= 3 &&
        (line.includes('|') ||
          line.toLowerCase().includes('.org') ||
          line.toLowerCase().includes('.com') ||
          line.toLowerCase().includes('page ') ||
          line.toLowerCase().includes('confidential') ||
          /^[A-Z0-9\s|.\-_/]+$/i.test(line))
      );
    });

    const repeatingSet = new Set(repeatingHeaders);

    // 2. Process lines
    const processedLines: string[] = [];
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Track code blocks
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        processedLines.push(line);
        continue;
      }

      if (inCodeBlock) {
        processedLines.push(line);
        continue;
      }

      const trimmed = line.trim();

      // Remove repeating header/footer lines (except the first occurrence)
      if (repeatingSet.has(trimmed)) {
        // Keep only if it's the very first occurrence in the first 5 lines
        if (i < 5) {
          processedLines.push(line);
        } else {
          cleanedArtifactsCount++;
          continue; // Skip repeated header/footer
        }
      }

      // Remove standalone page number lines like "1", "12", "Page 4 of 20"
      if (/^(page\s+\d+(\s+of\s+\d+)?|\d{1,3})$/i.test(trimmed)) {
        cleanedArtifactsCount++;
        continue;
      }

      // Clean trailing whitespace
      line = line.replace(/[ \t]+$/, '');

      // Normalize numbered section headings (e.g. "5. Scope of Work" -> "## 5. Scope of Work")
      // Only apply if not inside table or list item and not already a header
      if (!line.startsWith('#') && !line.startsWith('|') && !line.startsWith('- ') && !line.startsWith('* ')) {
        const sectionMatch = line.match(/^(\d+(\.\d+)*)\s+([A-Z][A-Za-z0-9\s,:\-&()/'"]{3,100})$/);
        if (sectionMatch && sectionMatch[1]) {
          const depth = sectionMatch[1].split('.').length;
          const prefix = depth === 1 ? '## ' : depth === 2 ? '### ' : '#### ';
          line = `${prefix}${line.trim()}`;
          cleanedArtifactsCount++;
        }
      }

      // Clean table lines where separator row might have broken pipes
      if (line.includes('|') && line.includes('---')) {
        line = line.replace(/\|?\s*---\s*\|?/g, '---|').replace(/^---/, '|---');
        if (!line.startsWith('|')) line = '|' + line;
        if (!line.endsWith('|')) line = line + '|';
      }

      processedLines.push(line);
    }

    // 3. Collapse multiple consecutive empty lines (max 2)
    let joined = processedLines.join('\n');
    const multiNewlineRegex = /\n{3,}/g;
    if (multiNewlineRegex.test(joined)) {
      joined = joined.replace(multiNewlineRegex, '\n\n');
      cleanedArtifactsCount++;
    }

    // 4. Quality Assessment
    const normalizedCharCount = joined.length;
    let isSuspicious = false;
    let ocrRecommended = false;

    // Check for replacement character \ufffd or null bytes
    const suspiciousCharCount = (joined.match(/[\ufffd\x00-\x08\x0b\x0c\x0e-\x1f]/g) || []).length;
    if (suspiciousCharCount > 10) {
      warnings.push(`Detected ${suspiciousCharCount} malformed or non-printable characters.`);
      isSuspicious = true;
    }

    // Check for low character count on PDFs
    if (filename && filename.toLowerCase().endsWith('.pdf') && normalizedCharCount < 300) {
      warnings.push('Extracted text is very short (< 300 characters). Document may be a scanned image.');
      isSuspicious = true;
      ocrRecommended = true;
    }

    if (normalizedCharCount === 0) {
      warnings.push('Extraction yielded zero text.');
      isSuspicious = true;
      ocrRecommended = true;
    }

    return {
      normalizedMarkdown: joined.trim(),
      originalCharCount,
      normalizedCharCount,
      cleanedArtifactsCount,
      repeatingHeadersRemoved: repeatingHeaders,
      warnings,
      isSuspicious,
      ocrRecommended
    };
  }
}
