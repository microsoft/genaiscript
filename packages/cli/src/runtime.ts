/// <reference path="../../core/src/types/prompt_type.d.ts" />

/**
 * GenAIScript supporting runtime
 * This module provides core functionality for text classification, data transformation,
 * PDF processing, and file system operations in the GenAIScript environment.
 */
import { delay, uniq, uniqBy, chunk, groupBy } from "es-toolkit"
import { z } from "zod"
import { pipeline } from "@huggingface/transformers"

/**
 * Utility functions exported for general use
 */
export { delay, uniq, uniqBy, z, pipeline, chunk, groupBy }

/**
 * Options for classifying data using AI models.
 *
 * @property {boolean} [other] - Inject a 'other' label.
 * @property {boolean} [explanations] - Explain answers before returning token.
 * @property {ChatGenerationContext} [ctx] - Options runPrompt context.
 */
export type ClassifyOptions = {
    /**
     * When true, adds an 'other' category to handle cases that don't match defined labels
     */
    other?: boolean
    /**
     * When true, provides explanatory text before the classification result
     */
    explanations?: boolean
    /**
     * Context for running the classification prompt
     */
    ctx?: ChatGenerationContext
} & Omit<PromptGeneratorOptions, "choices">

/**
 * Classifies input text into predefined categories using AI
 * Inspired by https://github.com/prefecthq/marvin
 * 
 * @param text - Text content to classify or a prompt generator function
 * @param labels - Object mapping label names to their descriptions
 * @param options - Configuration options for classification
 * @returns Classification result containing the chosen label and confidence metrics
 * @throws Error if fewer than two labels are provided
 */
export async function classify<L extends Record<string, string>>(
    text: StringLike | PromptGenerator,
    labels: L,
    options?: ClassifyOptions
): Promise<{
    label: keyof typeof labels | "other"
    entropy?: number
    logprob?: number
    probPercent?: number
    answer: string
    logprobs?: Record<keyof typeof labels | "other", Logprob>
}> {
    const { other, explanations, ...rest } = options || {}

    const entries = Object.entries({
        ...labels,
        ...(other
            ? {
                  other: "This label is used when the text does not fit any of the available labels.",
              }
            : {}),
    }).map(([k, v]) => [k.trim().toLowerCase(), v])

    if (entries.length < 2)
        throw Error("classify must have at least two label (including other)")

    const choices = entries.map(([k]) => k)
    const allChoices = uniq<keyof typeof labels | "other">(choices)
    const ctx = options?.ctx || env.generator

    const res = await ctx.runPrompt(
        async (_) => {
            _.$`## Expert Classifier
You are a specialized text classification system. 
Your task is to carefully read and classify any input text or image into one
of the predefined labels below. 
For each label, you will find a short description. Use these descriptions to guide your decision. 
`.role("system")
            _.$`## Labels
You must classify the data as one of the following labels. 
${entries.map(([id, descr]) => `- Label '${id}': ${descr}`).join("\n")}

## Output
${explanations ? "Provide a single short sentence justification for your choice." : ""}
Output the label as a single word on the last line (do not emit "Label").

`
            _.fence(
                `- Label 'yes': funny
- Label 'no': not funny

DATA:
Why did the chicken cross the road? Because moo.

Output:
${explanations ? "It's a classic joke but the ending does not relate to the start of the joke." : ""}
no

`,
                { language: "example" }
            )
            if (typeof text === "function") await text(_)
            else _.def("DATA", text)
        },
        {
            model: "classify",
            choices: choices,
            label: `classify ${choices.join(", ")}`,
            logprobs: true,
            topLogprobs: Math.min(3, choices.length),
            maxTokens: explanations ? 100 : 1,
            system: [
                "system.output_plaintext",
                "system.safety_jailbreak",
                "system.safety_harmful_content",
                "system.safety_protected_material",
            ],
            ...rest,
        }
    )

    // find the last label
    const answer = res.text.toLowerCase()
    const indexes = choices.map((l) => answer.lastIndexOf(l))
    const labeli = indexes.reduce((previ, label, i) => {
        if (indexes[i] > indexes[previ]) return i
        else return previ
    }, 0)
    const label = entries[labeli][0]
    const logprobs = res.choices
        ? (Object.fromEntries(
              res.choices
                  .map((c, i) => [allChoices[i], c])
                  .filter(([k, v]) => !isNaN(v?.logprob))
          ) as Record<keyof typeof labels | "other", Logprob>)
        : undefined
    const logprob = logprobs?.[label]

    return {
        label,
        entropy: logprob?.entropy,
        logprob: logprob?.logprob,
        probPercent: logprob?.probPercent,
        answer,
        logprobs,
    }
}

/**
 * Enhances content generation by applying iterative improvements
 * 
 * @param options - Configuration for the improvement process
 * @param options.ctx - Chat generation context to use
 * @param options.repeat - Number of improvement iterations to perform
 * @param options.instructions - Custom instructions for improvement
 */
export function makeItBetter(options?: {
    ctx?: ChatGenerationContext
    repeat?: number
    instructions?: string
}) {
    const { repeat = 1, instructions = "Make it better!" } = options || {}
    const ctx = options?.ctx || env.generator

    let round = 0
    ctx.defChatParticipant((cctx) => {
        if (round++ < repeat) {
            cctx.console.log(`make it better (round ${round})`)
            cctx.$`${instructions}`
        }
    })
}

/**
 * Converts unstructured text or data into structured JSON format
 * Inspired by https://github.com/prefecthq/marvin
 * 
 * @param data - Input text or prompt generator to convert
 * @param itemSchema - JSON schema defining the target data structure
 * @param options - Configuration options for the conversion
 * @returns Object containing the converted data or error information
 */
export async function cast(
    data: StringLike | PromptGenerator,
    itemSchema: JSONSchema,
    options?: PromptGeneratorOptions & {
        multiple?: boolean
        instructions?: string | PromptGenerator
        ctx?: ChatGenerationContext
    }
): Promise<{ data?: unknown; error?: string; text: string }> {
    const {
        ctx = env.generator,
        multiple,
        instructions,
        label = `cast text to schema`,
        ...rest
    } = options || {}
    const responseSchema = multiple
        ? ({
              type: "array",
              items: itemSchema,
          } satisfies JSONSchemaArray)
        : itemSchema
    const res = await ctx.runPrompt(
        async (_) => {
            if (typeof data === "function") await data(_)
            else _.def("SOURCE", data)
            _.defSchema("SCHEMA", responseSchema, { format: "json" })
            _.$`You are an expert data converter specializing in transforming unstructured text source into structured data.
            Convert the contents of <SOURCE> to JSON using schema <SCHEMA>.
            - Treat images as <SOURCE> and convert them to JSON.
            - Make sure the returned data matches the schema in <SCHEMA>.`
            if (typeof instructions === "string") _.$`${instructions}`
            else if (typeof instructions === "function") await instructions(_)
        },
        {
            responseType: "json",
            responseSchema,
            ...rest,
            label,
        }
    )
    const text = parsers.unfence(res.text, "json")
    return res.json
        ? { text, data: res.json }
        : { text, error: res.error?.message }
}

/**
 * Converts a PDF file to markdown format with intelligent formatting preservation
 * 
 * @param file - PDF file to convert
 * @param options - Configuration options for PDF processing and markdown conversion
 * @returns Object containing original pages, rendered images, and markdown content
 */
export async function markdownifyPdf(
    file: WorkspaceFile,
    options?: PromptGeneratorOptions &
        Omit<ParsePDFOptions, "renderAsImage"> & {
            instructions?: string | PromptGenerator
            ctx?: ChatGenerationContext
        }
) {
    const {
        ctx = env.generator,
        label = `markdownify PDF`,
        model = "ocr",
        responseType = "markdown",
        systemSafety = true,
        instructions,
        ...rest
    } = options || {}

    // extract text and render pages as images
    const { pages, images = [] } = await parsers.PDF(file, {
        ...rest,
        renderAsImage: true,
    })
    const markdowns: string[] = []
    for (let i = 0; i < pages.length; ++i) {
        const page = pages[i]
        const image = images[i]
        // mix of text and vision
        const res = await ctx.runPrompt(
            async (_) => {
                const previousPages = markdowns.slice(-2).join("\n\n")
                if (previousPages.length) _.def("PREVIOUS_PAGES", previousPages)
                if (page) _.def("PAGE", page)
                if (image)
                    _.defImages(image, { autoCrop: true, greyscale: true })
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
                `
                if (image)
                    $`- For images, generate a short alt-text description.`
                if (typeof instructions === "string") _.$`${instructions}`
                else if (typeof instructions === "function")
                    await instructions(_)
            },
            {
                ...rest,
                model,
                label: `${label}: page ${i + 1}`,
                responseType,
                system: ["system", "system.assistant"],
            }
        )
        if (res.error) throw new Error(res.error?.message)
        markdowns.push(res.text)
    }

    return { pages, images, markdowns }
}

/**
 * Creates a tree representation of files in the workspace
 * 
 * @param glob - Glob pattern to match files
 * @param options - Configuration options for tree generation
 * @param options.query - Optional search query to filter files
 * @param options.size - Include file sizes in output
 * @param options.ignore - Patterns to exclude from results
 * @param options.frontmatter - Frontmatter fields to extract from markdown
 * @param options.preview - Custom function to generate file previews
 * @returns Formatted string representing the file tree
 */
export async function fileTree(
    glob: string,
    options?: WorkspaceGrepOptions & {
        query?: string | RegExp
        size?: boolean
        ignore?: ElementOrArray<string>
        frontmatter?: OptionsOrString<
            "title" | "description" | "keywords" | "tags"
        >[]
        preview?: (file: WorkspaceFile, stats: FileStats) => Awaitable<unknown>
    }
): Promise<string> {
    const { frontmatter, preview, query, size, ignore, ...rest } = options || {}
    const readText = !!(frontmatter || preview)
    // TODO
    const files = query
        ? (await workspace.grep(query, glob, { ...rest, readText })).files
        : await workspace.findFiles(glob, {
              ignore,
              readText,
          })
    const tree = await buildTree(files)
    return renderTree(tree)

    type TreeNode = {
        filename: string
        children?: TreeNode[]
        stats: FileStats
        metadata: string
    }
    async function buildTree(files: WorkspaceFile[]): Promise<TreeNode[]> {
        const root: TreeNode[] = []

        for (const file of files) {
            const { filename } = file
            const parts = filename.split(/[/\\]/)
            let currentLevel = root
            for (let index = 0; index < parts.length; index++) {
                const part = parts[index]
                let node = currentLevel.find((n) => n.filename === part)
                if (!node) {
                    const stats = await workspace.stat(filename)
                    let metadata: unknown[] = []
                    if (frontmatter && /\.mdx?$/i.test(filename)) {
                        const fm = parsers.frontmatter(file) || {}
                        if (fm)
                            metadata.push(
                                ...frontmatter
                                    .map((field) => [field, fm[field]])
                                    .filter(([_, v]) => v !== undefined)
                                    .map(
                                        ([k, v]) => `${k}: ${JSON.stringify(v)}`
                                    )
                            )
                    }
                    if (preview) metadata.push(await preview(file, stats))
                    node = {
                        filename: part,
                        metadata: metadata
                            .filter((f) => f !== undefined)
                            .map((s) => String(s))
                            .map((s) => s.replace(/\n/g, " "))
                            .join(", "),
                        stats,
                    }
                    currentLevel.push(node)
                }
                if (index < parts.length - 1) {
                    if (!node.children) {
                        node.children = []
                    }
                    currentLevel = node.children
                }
            }
        }

        return root
    }

    function renderTree(nodes: TreeNode[], prefix = ""): string {
        return nodes
            .map((node, index) => {
                const isLast = index === nodes.length - 1
                const newPrefix = prefix + (isLast ? "  " : "│ ")
                const children = node.children?.length
                    ? renderTree(node.children, newPrefix)
                    : ""
                const meta = [
                    size
                        ? `${Math.ceil(node.stats.size / 1000)}kb `
                        : undefined,
                    node.metadata,
                ]
                    .filter((s) => !!s)
                    .join(", ")
                return `${prefix}${isLast ? "└ " : "├ "}${node.filename}${meta ? ` - ${meta}` : ""}\n${children}`
            })
            .join("")
    }
}
