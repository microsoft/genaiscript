/* eslint-disable @typescript-eslint/no-unused-expressions */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * GenAIScript supporting runtime
 * This module provides core functionality for text classification, data transformation,
 * PDF processing, and file system operations in the GenAIScript environment.
 */
import type {
  Awaitable,
  ChatGenerationContext,
  ElementOrArray,
  FileStats,
  JSONSchema,
  JSONSchemaArray,
  OptionsOrString,
  ParsePDFOptions,
  PromptContext,
  PromptGenerator,
  PromptGeneratorOptions,
  StringLike,
  WorkspaceFile,
  WorkspaceGrepOptions,
} from "@genaiscript/core";

const globalPromptContext: PromptContext = globalThis as unknown as PromptContext;

/**
 * Enhances content generation by applying iterative improvements.
 *
 * @param options - Configuration for the improvement process.
 * @param options.ctx - Chat generation context to use. Defaults to the environment generator if not provided.
 * @param options.repeat - Number of improvement iterations to perform. Defaults to 1.
 * @param options.instructions - Custom instructions for improvement. Defaults to "Make it better!".
 * The instructions are applied in each iteration.
 */
export function makeItBetter(options?: {
  ctx?: ChatGenerationContext;
  repeat?: number;
  instructions?: string;
}) {
  const { repeat = 1, instructions = "Make it better!" } = options || {};
  const ctx = options?.ctx || globalPromptContext.env.generator;

  let round = 0;
  ctx.defChatParticipant((cctx) => {
    if (round++ < repeat) {
      cctx.console.log(`make it better (round ${round})`);
      cctx.$`${instructions}`;
    }
  });
}

/**
 * Converts unstructured text or data into structured JSON format.
 * Inspired by https://github.com/prefecthq/marvin.
 *
 * @param data - Input text or a prompt generator function to convert.
 * @param itemSchema - JSON schema defining the target data structure. If `multiple` is true, this will be treated as an array schema.
 * @param options - Configuration options for the conversion process, including context, instructions, label, and additional settings. If `multiple` is true, the schema will be treated as an array schema.
 * @returns An object containing the converted data, error information if applicable, and the raw text response.
 */
export async function cast(
  data: StringLike | PromptGenerator,
  itemSchema: JSONSchema,
  options?: PromptGeneratorOptions & {
    multiple?: boolean;
    instructions?: string | PromptGenerator;
    ctx?: ChatGenerationContext;
  },
): Promise<{ data?: unknown; error?: string; text: string }> {
  const {
    ctx = globalPromptContext.env.generator,
    multiple,
    instructions,
    label = `cast text to schema`,
    ...rest
  } = options || {};
  const responseSchema = multiple
    ? ({
        type: "array",
        items: itemSchema,
      } satisfies JSONSchemaArray)
    : itemSchema;
  const res = await ctx.runPrompt(
    async (_) => {
      if (typeof data === "function") await data(_);
      else _.def("SOURCE", data);
      _.defSchema("SCHEMA", responseSchema, { format: "json" });
      _.$`You are an expert data converter specializing in transforming unstructured text source into structured data.
            Convert the contents of <SOURCE> to JSON using schema <SCHEMA>.
            - Treat images as <SOURCE> and convert them to JSON.
            - Make sure the returned data matches the schema in <SCHEMA>.`;
      if (typeof instructions === "string") _.$`${instructions}`;
      else if (typeof instructions === "function") await instructions(_);
    },
    {
      responseSchema,
      ...rest,
      label,
    },
  );
  const text = globalPromptContext.parsers.unfence(res.text, "json");
  return res.json ? { text, data: res.json } : { text, error: res.error?.message };
}

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
    Omit<ParsePDFOptions, "renderAsImage"> & {
      instructions?: string | PromptGenerator;
      ctx?: ChatGenerationContext;
    },
) {
  const {
    ctx = globalPromptContext.env.generator,
    label = `markdownify PDF`,
    model = "ocr",
    responseType = "markdown",
    instructions,
    ...rest
  } = options || {};

  // extract text and render pages as images
  const { pages, images = [] } = await globalPromptContext.parsers.PDF(file, {
    ...rest,
    renderAsImage: true,
  });
  const markdowns: string[] = [];
  for (let i = 0; i < pages.length; ++i) {
    const page = pages[i];
    const image = images[i];
    // mix of text and vision
    const res = await ctx.runPrompt(
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
        if (image) globalPromptContext.$`- For images, generate a short alt-text description.`;
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

/**
 * Creates a tree representation of files in the workspace.
 *
 * @param glob - Glob pattern to match files.
 * @param options - Configuration options for tree generation.
 * @param options.query - Optional search query to filter files.
 * @param options.size - Whether to include file sizes in the output.
 * @param options.ignore - Patterns to exclude from the results.
 * @param options.frontmatter - Frontmatter fields to extract from markdown files. Only applies to markdown files.
 * @param options.preview - Custom function to generate file previews based on file and stats.
 * @returns A formatted string representing the file tree structure, including metadata and file sizes if specified.
 */
export async function fileTree(
  glob: string,
  options?: WorkspaceGrepOptions & {
    query?: string | RegExp;
    size?: boolean;
    ignore?: ElementOrArray<string>;
    frontmatter?: OptionsOrString<"title" | "description" | "keywords" | "tags">[];
    preview?: (file: WorkspaceFile, stats: FileStats) => Awaitable<unknown>;
  },
): Promise<string> {
  const { frontmatter, preview, query, size, ignore, ...rest } = options || {};
  const readText = !!(frontmatter || preview);
  // TODO
  const files = query
    ? (await globalPromptContext.workspace.grep(query, glob, { ...rest, readText })).files
    : await globalPromptContext.workspace.findFiles(glob, {
        ignore,
        readText,
      });
  const tree = await buildTree(files);
  return renderTree(tree);

  type TreeNode = {
    filename: string;
    children?: TreeNode[];
    stats: FileStats;
    metadata: string;
  };
  async function buildTree(files: WorkspaceFile[]): Promise<TreeNode[]> {
    const root: TreeNode[] = [];

    for (const file of files) {
      const { filename } = file;
      const parts = filename.split(/[/\\]/);
      let currentLevel = root;
      for (let index = 0; index < parts.length; index++) {
        const part = parts[index];
        let node = currentLevel.find((n) => n.filename === part);
        if (!node) {
          const stats = await globalPromptContext.workspace.stat(filename);
          const metadata: unknown[] = [];
          if (frontmatter && /\.mdx?$/i.test(filename)) {
            const fm = globalPromptContext.parsers.frontmatter(file) || {};
            if (fm)
              metadata.push(
                ...frontmatter
                  .map((field) => [field, fm[field]])
                  .filter(([, v]) => v !== undefined)
                  .map(([k, v]) => `${k}: ${JSON.stringify(v)}`),
              );
          }
          if (preview) metadata.push(await preview(file, stats));
          node = {
            filename: part,
            metadata: metadata
              .filter((f) => f !== undefined)
              .map((s) => String(s))
              .map((s) => s.replace(/\n/g, " "))
              .join(", "),
            stats,
          };
          currentLevel.push(node);
        }
        if (index < parts.length - 1) {
          if (!node.children) {
            node.children = [];
          }
          currentLevel = node.children;
        }
      }
    }

    return root;
  }

  function renderTree(nodes: TreeNode[], prefix = ""): string {
    return nodes
      .map((node, index) => {
        const isLast = index === nodes.length - 1;
        const newPrefix = prefix + (isLast ? "  " : "│ ");
        const children = node.children?.length ? renderTree(node.children, newPrefix) : "";
        const meta = [size ? `${Math.ceil(node.stats.size / 1000)}kb ` : undefined, node.metadata]
          .filter((s) => !!s)
          .join(", ");
        return `${prefix}${isLast ? "└ " : "├ "}${node.filename}${meta ? ` - ${meta}` : ""}\n${children}`;
      })
      .join("");
  }
}
