/// <reference path="../../core/src/types/prompt_type.d.ts" />

/**
 * GenAIScript supporting runtime
 */
import { delay, uniq, uniqBy, chunk, groupBy } from "es-toolkit"
import { z } from "zod"
import { pipeline } from "@huggingface/transformers"

// symbols exported as is
export { delay, uniq, uniqBy, z, pipeline, chunk, groupBy }

/**
 * Options for classifying data.
 *
 * @property {boolean} [other] - Inject a 'other' label.
 * @property {boolean} [explanations] - Explain answers before returning token.
 * @property {ChatGenerationContext} [ctx] - Options runPrompt context.
 */
export type ClassifyOptions = {
    /**
     * Inject a 'other' label
     */
    other?: boolean
    /**
     * Explain answers before returning token
     */
    explanations?: boolean
    /**
     * Options runPrompt context
     */
    ctx?: ChatGenerationContext
} & Omit<PromptGeneratorOptions, "choices">

/**
 * Classify prompt
 *
 * Inspired by https://github.com/prefecthq/marvin
 *
 * @param text text to classify
 * @param labels map from label to description. the label should be a single token
 * @param options prompt options, additional instructions, custom prompt contexst
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
 * Enhances the provided context by repeating a set of instructions a specified number of times.
 *
 * @param options - Configuration options for the function.
 * @param options.ctx - The chat generation context to be used. If not provided, defaults to `env.generator`.
 * @param options.repeat - The number of times to repeat the instructions. Defaults to 1.
 * @param options.instructions - The instructions to be executed in each round. Defaults to "Make it better!".
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
 * Cast text to data using a JSON schema.
 * Inspired by https://github.com/prefecthq/marvin
 * @param data
 * @param itemSchema
 * @param options
 * @returns
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
 *
 * @param file
 * @param options
 * @returns
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
 * Generates a tree structure of files from a given glob pattern or directory path.
 *
 * @param pattern - The glob pattern or directory path to list files from.
 * @returns A tree structure representing the files.
 */
export async function renderFileTree(
    pattern: string,
    options?: {
        frontmatter?: (fm: Record<string, unknown>) => Awaitable<string>
        preview?: (filename: string, stats: FileStats) => Awaitable<string>
    }
): Promise<string> {
    const { frontmatter, preview } = options || {}
    const files = await workspace.findFiles(pattern)
    const tree = await buildTree(files.map(({ filename }) => filename))
    return renderTree(tree)

    type TreeNode = {
        filename: string
        children?: TreeNode[]
        stats: FileStats
        metadata: string[]
    }
    async function buildTree(filenames: string[]): Promise<TreeNode[]> {
        const root: TreeNode[] = []

        for (const filename of filenames) {
            const parts = filename.split(/[/\\]/)
            let currentLevel = root
            for (let index = 0; index < parts.length; index++) {
                const part = parts[index]
                let node = currentLevel.find((n) => n.filename === part)
                if (!node) {
                    const stats = await workspace.stat(filename)
                    let metadata: string[] = []
                    if (frontmatter && /\.mdx?$/.test(filename)) {
                        const value = parsers.frontmatter(filename) || {}
                        if (value) {
                            metadata.push(await frontmatter(value))
                        }
                    }
                    if (preview) metadata.push(await preview(filename, stats))
                    node = {
                        filename: part,
                        metadata: metadata
                            .filter((f) => !!f)
                            .map((s) => s.replace(/\n/g, " ")),
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
                const newPrefix = prefix + (isLast ? "    " : "│   ")
                const children = node.children
                    ? renderTree(node.children, newPrefix)
                    : ""
                return `${prefix}${isLast ? "└── " : "├── "}${node.filename} ${Math.ceil(node.stats.size / 1000)}kb ${node.metadata.join(",")}\n${children}`
            })
            .join("")
    }
}
