import { TraceOptions } from "./trace.js";
import { CancellationOptions } from "./cancellation.js";
/**
 * Parses a PDF file or buffer and extracts its pages, content, and metadata.
 * @param filenameOrBuffer - Path to the PDF file or a buffer containing PDF data.
 * @param options - Optional settings for filtering, tracing, caching, rendering, and cancellation.
 * @returns A promise resolving to an object with parsed pages, concatenated content, and metadata. Returns empty pages and content if an error occurs. Metadata may be undefined if not present.
 */
export declare function parsePdf(
  filenameOrBuffer: string | Uint8Array,
  options?: ParsePDFOptions & TraceOptions & CancellationOptions,
): Promise<{
  pages: PDFPage[];
  content: string;
  metadata?: Record<string, any>;
}>;
//# sourceMappingURL=pdf.d.ts.map
