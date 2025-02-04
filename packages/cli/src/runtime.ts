/// <reference path="../../core/src/types/prompt_type.d.ts" />

/**
 * GenAIScript supporting runtime
 */
import { delay, uniq, uniqBy, chunk, groupBy } from "es-toolkit"
import { z } from "zod"
import { pipeline } from "@huggingface/transformers"
import { readFile } from "fs/promises"

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

function parseTeamsChannelUrl(url: string) {
    const m =
        /^https:\/\/teams.microsoft.com\/*.\/channel\/(?<channelId>.+)\/.*\?groupId=(?<teamId>([a-z0-9\-])+)$/.exec(
            url
        )
    if (!m) throw new Error("Invalid Teams channel URL")
    const { teamId, channelId } = m.groups
    return { teamId, channelId }
}

let _azureToken: string
async function azureGetToken(): Promise<string> {
    if (!_azureToken) { // TODO: refresh?
        const { DefaultAzureCredential } = await import("@azure/identity")
        const credential = new DefaultAzureCredential()
        const tokenResponse = await credential.getToken(
            "https://graph.microsoft.com/.default"
        )
        if (!tokenResponse) throw new Error("Failed to retrieve access token.")
        _azureToken = tokenResponse.token
    }
    return _azureToken
}

export interface MicrosoftTeamsEntity {
    webUrl: string
    name: string
}

/**
 * Uploads a file to the files storage of a Microsoft Teams channel.
 * @param channelUrl
 * @param folder
 * @param filename
 * @returns
 */
export async function microsoftTeamsUploadFile(
    channelUrl: string,
    folder: string,
    filename: string
) {
    const { teamId, channelId } = parseTeamsChannelUrl(channelUrl)
    const token = await azureGetToken()

    // resolve channel folder name
    const file = await readFile(filename)
    const folder = "folder"
    const url = `https://graph.microsoft.com/v1.0/groups/${teamId}/drive/root:/${folder}/${path.basename(
        filename
    )}:/content`
    const res = await fetch(url, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/octet-stream",
        },
        body: file,
    })
    if (!res.ok) {
        console.debug(await res.text())
        throw new Error(
            `Failed to upload file: ${res.status} ${res.statusText}`
        )
    }
    const j = (await res.json()) as MicrosoftTeamsEntity
    return j
}

export async function teamsPostMessage(
    channelUrl: string,
    subject: string,
    message: string,
    videoFilename: string
): Promise<void> {
    const token = await azureGetToken()

    const body = {
        body: {
            contentType: "html",
            content: message,
        },
        subject,
        attachments: [],
    }

    if (videoFilename) {
        console.debug(`Uploading video ${videoFilename}...`)
        const videoRes = await microsoftTeamsUploadFile(channelUrl, videoFilename)
        console.log(videoRes)
        const guid = crypto.randomUUID()
        body.body.content += "\n" + `<attachment id=\"${guid}\"></attachment>`
        body.attachments = [
            {
                id: guid,
                contentType: "reference",
                contentUrl: videoRes.webUrl,
                name: videoRes.name,
                thumbnailUrl: null,
            },
        ]
    }

    const url = `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages`
    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    })

    if (!response.ok) {
        const err: any = await response.text()
        console.debug(err)
        throw new Error(
            `Failed to post message: ${response.status} ${response.statusText}`
        )
    }

    {
        const data: any = await response.json()
        const { webUrl } = data
        console.log(`message created at ${webUrl}`)
        console.debug(data)
        return data
    }
}

const segments = await workspace.readJSON(env.files[0])
for (const segment of segments) {
    const { id, summary, video } = segment

    const lines = summary.split(/\n/g)
    const subject = lines[0]
    const message = lines.slice(1).join("\n<br/>").trim()

    console.log(`Uploading ${id} to Teams...`)
    await teamsPostMessage(subject, message, video)
}
