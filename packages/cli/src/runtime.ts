/// <reference path="../../core/src/types/prompt_type.d.ts" />

/**
 * GenAIScript supporting runtime
 */
import { delay, uniq, uniqBy, chunk, groupBy } from "es-toolkit"
import { z } from "zod"
import { pipeline } from "@huggingface/transformers"
import type { submit as GradioSubmit } from "@gradio/client"

// symbols exported as is
export { delay, uniq, uniqBy, z, pipeline, chunk, groupBy }

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
 * Inspired by https://github.dev/prefecthq/marvin
 *
 * @param text text to classify
 * @param labels map from label to description. the label should be a single token
 * @param options prompt options, additional instructions, custom prompt contexst
 */
export async function classify<L extends Record<string, string>>(
    text: string | PromptGenerator,
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
            if (typeof text === "string") _.def("DATA", text)
            else await text(_)
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

export interface GradioSubmitOptions {
    endpoint?: string | number
    payload?: unknown[] | Record<string, unknown> | undefined
}

export interface GradioApiData {
    label: string
    parameter_name: string
    parameter_default?: any
    parameter_has_default?: boolean
    type: string
    description: string
    component: string
    example_input?: any
    serializer: string
    python_type: { type: string; description: string }
}
export interface GradioEndpointInfo {
    parameters: GradioApiData[]
    returns: GradioApiData[]
}

export interface GradioApiInfo {
    named_endpoints: Record<string, GradioEndpointInfo>
    unnamed_endpoints: Record<string, GradioEndpointInfo>
}

export interface GradioClientOptions {
    duplicate?: boolean
    private?: boolean
    timeout?: number
    hardware?:
        | "cpu-basic"
        | "cpu-upgrade"
        | "cpu-xl"
        | "t4-small"
        | "t4-medium"
        | "a10g-small"
        | "a10g-large"
        | "a10g-largex2"
        | "a10g-largex4"
        | "a100-large"
        | "zero-a10g"
        | "h100"
        | "h100x8"
}

/**
 * **Experimental**
 * Opens a client connection to a gradio space on Hugging Face
 * @param space user/name space
 * @returns a promise to the client
 */
export async function gradioConnect(
    space: string,
    options?: GradioClientOptions
) {
    const { duplicate } = options || {}
    const hf_token: `hf_${string}` = (process.env.HF_TOKEN ||
        process.env.HUGGINGFACE_TOKEN) as any
    const { Client, handle_file } = await import("@gradio/client")
    let app
    if (duplicate)
        app = await Client.duplicate(space, {
            hf_token,
            private: options?.private,
            timeout: options?.timeout,
            hardware: options?.hardware,
            status_callback: (status) => {
                console.debug(`gradio ${space}: ${status?.message || ""}`)
            },
        })
    else
        app = await Client.connect(space, {
            hf_token,
            status_callback: (status) => {
                console.debug(`gradio ${space}: ${status?.message || ""}`)
            },
        })

    const handleFile = (v: unknown) => {
        if (!v) return v
        if (v instanceof File || v instanceof Blob || v instanceof Buffer)
            return handle_file(v)
        const f = v as WorkspaceFile
        if (typeof f === "object" && f?.filename) {
            const { filename, content, encoding } = f
            if (!content) {
                const f = handle_file((v as WorkspaceFile).filename)
                return f
            } else {
                const bytes = Buffer.from(content, encoding || "utf8")
                return handle_file(bytes)
            }
        }
        return v
    }

    const handleFiles = (payload: unknown[] | Record<string, unknown>) => {
        if (!payload) return payload
        if (Array.isArray(payload)) {
            const result = []
            for (let i = 0; i < payload.length; ++i)
                result.push(handleFile(payload[i]))
            return result
        } else {
            const result: Record<string, any> = {}
            for (const [key, value] of Object.entries(payload))
                result[key] = handleFile(value)
            return result
        }
    }

    const submit = (
        options?: GradioSubmitOptions
    ): ReturnType<typeof GradioSubmit> => {
        const { endpoint = "/predict", payload = undefined } = options || {}
        const payloadWithFiles = handleFiles(payload)
        const submission = app.submit(endpoint, payloadWithFiles)
        return submission
    }
    const config = app.config
    const api: GradioApiInfo = await app.view_api()

    const predict = async (options?: GradioSubmitOptions): Promise<unknown> => {
        const { endpoint = "/predict", payload = undefined } = options || {}
        const payloadWithFiles = handleFiles(payload)
        const res = await app.predict(endpoint, payloadWithFiles)
        console.log(JSON.stringify({ res }, null, 0))
        return res.data
    }

    return {
        config,
        submit,
        handleFile,
        predict,
        api,
    }
}
export type GradioClient = Awaited<ReturnType<typeof gradioConnect>>

/**
 * **Experimental**
 * Defines a gradio tool
 */
export function defGradioTool(
    name: string,
    description: string,
    parameters: PromptParametersSchema | JSONSchemaObject,
    space: string,
    payloader: (
        args: Record<string, any>,
        endpointInfo?: GradioEndpointInfo
    ) => Awaitable<unknown[] | Record<string, unknown>>,
    renderer: (data: unknown) => Awaitable<ToolCallOutput>,
    options?: GradioClientOptions & Pick<GradioSubmitOptions, "endpoint">
) {
    const { endpoint = "/predict", ...restOptions } = options || {}
    let appPromise: Promise<GradioClient>

    const connect = async () => {
        if (!appPromise) appPromise = gradioConnect(space, restOptions)
        return appPromise
    }

    defTool(name, description, parameters, async (args) => {
        const { context, ...restArgs } = args
        const app = await connect()
        const info = app.api.named_endpoints[endpoint]
        const payload = await payloader(restArgs, info)
        const req = {
            endpoint,
            payload,
        }
        const data = await app.predict(req)
        return await renderer(data)
    })
}
