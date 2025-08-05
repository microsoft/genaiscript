/**
 * GenAIScript supporting runtime
 * This module provides core functionality for text classification, data transformation,
 * PDF processing, and file system operations in the GenAIScript environment.
 */
import type { ChatGenerationContextOptions, ParsePDFOptions, PromptGenerator, PromptGeneratorOptions, WorkspaceFile } from "@genaiscript/core";
/**
 * Converts a PDF file to markdown format with intelligent formatting preservation.
 *
 * @param file - PDF file to convert.
 * @param options - Configuration options for PDF processing and markdown conversion, including instructions, context, and additional settings. The options can include rendering images, providing custom instructions, and specifying the context for processing. The text and images from the PDF are analyzed to ensure accurate markdown formatting.
 * @returns An object containing the original pages, rendered images, and markdown content for each page.
 */
export declare function markdownifyPdf(file: WorkspaceFile, options?: PromptGeneratorOptions & ChatGenerationContextOptions & Omit<ParsePDFOptions, "renderAsImage"> & {
    instructions?: string | PromptGenerator;
}): Promise<{
    pages: string[];
    images: string[];
    markdowns: string[];
}>;
//# sourceMappingURL=markdownifypdf.d.ts.map