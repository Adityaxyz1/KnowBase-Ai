import * as pdfjsLib from 'pdfjs-dist';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface PDFParseResult {
  text: string;
  pageCount: number;
  metadata?: {
    title?: string;
    author?: string;
  };
}

export async function parsePDF(file: File): Promise<PDFParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const pageCount = pdf.numPages;
    const textParts: string[] = [];
    
    // Extract text from each page (limit to first 20 pages for performance)
    const maxPages = Math.min(pageCount, 20);
    
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      textParts.push(`[Page ${i}]\n${pageText}`);
    }
    
    if (pageCount > maxPages) {
      textParts.push(`\n[Note: PDF has ${pageCount} pages. Showing first ${maxPages} pages.]`);
    }

    // Get metadata
    const metadata = await pdf.getMetadata().catch(() => null);
    
    return {
      text: textParts.join('\n\n'),
      pageCount,
      metadata: metadata?.info ? {
        title: (metadata.info as any).Title,
        author: (metadata.info as any).Author,
      } : undefined,
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF. The file may be corrupted or password-protected.');
  }
}

export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
