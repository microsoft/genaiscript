/* eslint-disable @typescript-eslint/no-unused-expressions */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * GenAIScript supporting runtime
 * This module provides core functionality for text classification, data transformation,
 * PDF processing, and file system operations in the GenAIScript environment.
 */
import type {
  ChatGenerationContext,
  ParsePDFOptions,
  PromptGenerator,
  PromptGeneratorOptions,
  WorkspaceFile,
} from "@genaiscript/core";
import { resolveChatGenerationContext } from "./runtime.js";

/**
 * Converts a PDF file to markdown format with intelligent formatting preservation.
 *
 * @param file - PDF file to convert.
 * @param options - Configuration options for PDF processing and markdown conversion, including instructions, context, and additional settings. The options can include rendering images, providing custom instructions, and specifying the context for processing. The text and images from the PDF are analyzed to ensure accurate markdown formatting.
 * @returns An object containing the original pages, rendered images, and markdown content for each page.
 */
export async function markdownifyPdf(
  file: WorkspaceFile,
  options?: PromptGeneratorOptions &
    ChatGenerationContext &
    Omit<ParsePDFOptions, "renderAsImage"> & {
      instructions?: string | PromptGenerator;
      ctx?: ChatGenerationContext;
    },
) {
  const generator: ChatGenerationContext = resolveChatGenerationContext(options);
  const {
    label = `markdownify PDF`,
    model = "ocr",
    responseType = "markdown",
    instructions,
    ...rest
  } = options || {};

  // extract text and render pages as images
  const { pages, images = [] } = await parsers.PDF(file, {
    ...rest,
    renderAsImage: true,
  });
  const markdowns: string[] = [];
  for (let i = 0; i < pages.length; ++i) {
    const page = pages[i];
    const image = images[i];
    // mix of text and vision
    const res = await generator.runPrompt(
      async (_) => {
        const previousPages = markdowns.slice(-2).join("\n\n");
        if (previousPages.length) _.def("PREVIOUS_PAGES", previousPages);
        if (page) _.def("PAGE", page);
        if (image) _.defImages(image, { autoCrop: true, greyscale: true });
        _.$`You are an expert at converting PDFs to markdown.
                
                ## Task
                Your task is to analyze the image and extract textual content in markdown format.

                The image is a screenshot of the current page in the PDF document.
                We used pdfjs-dist to extract the text of the current page in <PAGE>, use it to help with the conversion.
                The text from the previous pages is in <PREVIOUS_PAGES>, use it to ensure consistency in the conversion.

                ## Instructions
                - Ensure markdown text formatting for the extracted text is applied properly by analyzing the image.
                - Do not change any content in the original extracted text while applying markdown formatting and do not repeat the extracted text.
                - Preserve markdown text formatting if present such as horizontal lines, header levels, footers, bullet points, links/urls, or other markdown elements.
                - Extract source code snippets in code fences.
                - Do not omit any textual content from the markdown formatted extracted text.
                - Do not generate page breaks
                - Do not repeat the <PREVIOUS_PAGES> content.
                - Do not include any additional explanations or comments in the markdown formatted extracted text.
                `;
        if (image) _.$`- For images, generate a short alt-text description.`;
        if (typeof instructions === "string") _.$`${instructions}`;
        else if (typeof instructions === "function") await instructions(_);
      },
      {
        ...rest,
        model,
        label: `${label}: page ${i + 1}`,
        responseType,
        system: ["system", "system.assistant"],
      },
    );
    if (res.error) throw new Error(res.error?.message);
    markdowns.push(res.text);
  }

  return { pages, images, markdowns };
}
