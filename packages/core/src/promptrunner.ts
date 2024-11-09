// Import necessary modules and functions for handling chat sessions, templates, file management, etc.
import { executeChatSession, tracePromptResult } from "./chat"
import { Project, PromptScript } from "./ast"
import { stringToPos } from "./parser"
import { arrayify, assert, logError, logVerbose, relativePath } from "./util"
import { runtimeHost } from "./host"
import { applyLLMDiff, applyLLMPatch, parseLLMDiffs } from "./diff"
import { MarkdownTrace } from "./trace"
import { applyChangeLog, parseChangeLogs } from "./changelog"
import { CORE_VERSION } from "./version"
import { expandFiles, fileExists, readText } from "./fs"
import { CSVToMarkdown } from "./csv"
import { Fragment, GenerationOptions } from "./generation"
import { traceCliArgs } from "./clihelp"
import { GenerationResult } from "./generation"
import { resolveModelConnectionInfo } from "./models"
import { RequestError, errorMessage } from "./error"
import { renderFencedVariables, unquote } from "./fence"
import { parsePromptParameters } from "./parameters"
import { resolveFileContent } from "./file"
import { isGlobMatch } from "./glob"
import { validateJSONWithSchema } from "./schema"
import { YAMLParse } from "./yaml"
import { expandTemplate } from "./expander"
import { resolveLanguageModel } from "./lm"

// Asynchronously resolve expansion variables needed for a template
/**
 * Resolves variables required for the expansion of a template.
 * @param project The project context.
 * @param trace The markdown trace for logging.
 * @param template The prompt script template.
 * @param frag The fragment containing files and metadata.
 * @param vars The user-provided variables.
 * @returns An object containing resolved variables.
 */
async function resolveExpansionVars(
    project: Project,
    trace: MarkdownTrace,
    template: PromptScript,
    frag: Fragment,
    vars: Record<string, string | number | boolean | object>
) {
    const root = runtimeHost.projectFolder()

    const files: WorkspaceFile[] = []
    const fr = frag
    const templateFiles = arrayify(template.files)
    const referenceFiles = fr.files.slice(0)
    const filenames = await expandFiles(
        referenceFiles?.length ? referenceFiles : templateFiles
    )
    for (let filename of filenames) {
        filename = relativePath(root, filename)

        // Skip if file already in the list
        if (files.find((lk) => lk.filename === filename)) continue
        const file: WorkspaceFile = { filename }
        await resolveFileContent(file)
        files.push(file)
    }

    // Parse and obtain attributes from prompt parameters
    const attrs = parsePromptParameters(project, template, vars)
    const secrets: Record<string, string> = {}

    // Read secrets defined in the template
    for (const secret of template.secrets || []) {
        const value = await runtimeHost.readSecret(secret)
        if (value) {
            trace.item(`secret \`${secret}\` used`)
            secrets[secret] = value
        } else trace.error(`secret \`${secret}\` not found`)
    }

    // Create and return an object containing resolved variables
    const meta: PromptDefinition & ModelConnectionOptions = Object.freeze(
        structuredClone({
            id: template.id,
            title: template.title,
            description: template.description,
            group: template.group,
            model: template.model,
            defTools: template.defTools,
        })
    )
    const res = {
        dir: ".",
        files,
        meta,
        vars: attrs,
        secrets,
    } satisfies Partial<ExpansionVariables>
    return res
}

// Main function to run a template with given options
/**
 * Executes a prompt template with specified options.
 * @param prj The project context.
 * @param template The prompt script template.
 * @param fragment The fragment containing additional context.
 * @param options Options for generation, including model and trace.
 * @returns A generation result with details of the execution.
 */
export async function runTemplate(
    prj: Project,
    template: PromptScript,
    fragment: Fragment,
    options: GenerationOptions
): Promise<GenerationResult> {
    assert(fragment !== undefined)
    assert(options !== undefined)
    assert(options.trace !== undefined)
    const { label, cliInfo, trace, cancellationToken, model } = options
    const version = CORE_VERSION
    assert(model !== undefined)

    runtimeHost.project = prj

    try {
        trace.heading(3, `🧠 running ${template.id} with model ${model ?? ""}`)
        if (cliInfo) traceCliArgs(trace, template, options)

        // Resolve expansion variables for the template
        const vars = await resolveExpansionVars(
            prj,
            trace,
            template,
            fragment,
            options.vars
        )
        let {
            messages,
            schemas,
            tools,
            fileMerges,
            outputProcessors,
            chatParticipants,
            fileOutputs,
            status,
            statusText,
            temperature,
            topP,
            maxTokens,
            seed,
            responseType,
            responseSchema,
            logprobs,
            topLogprobs,
        } = await expandTemplate(
            prj,
            template,
            options,
            vars as ExpansionVariables,
            trace
        )

        const { ok } = await runtimeHost.models.pullModel(options.model, {
            trace,
        })

        // Handle failed expansion scenario
        if (status !== "success" || !ok || !messages.length) {
            trace.renderErrors()
            return <GenerationResult>{
                status,
                statusText,
                messages,
                vars,
                text: "",
                edits: [],
                annotations: [],
                changelogs: [],
                fileEdits: {},
                label,
                version,
                fences: [],
                frames: [],
            }
        }

        // Resolve model connection information
        const connection = await resolveModelConnectionInfo(
            { model },
            { trace, token: true }
        )
        if (connection.info.error)
            throw new Error(errorMessage(connection.info.error))
        if (!connection.configuration)
            throw new RequestError(
                403,
                `LLM configuration missing for model ${model}`,
                connection.info
            )
        const { completer } = await resolveLanguageModel(
            connection.configuration.provider
        )

        // Execute chat session with the resolved configuration
        const genOptions: GenerationOptions = {
            ...options,
            choices: template.choices,
            responseType,
            responseSchema,
            model,
            temperature,
            maxTokens,
            topP,
            seed,
            logprobs,
            topLogprobs,
            stats: options.stats.createChild(connection.info.model),
        }
        const output = await executeChatSession(
            connection.configuration,
            cancellationToken,
            messages,
            tools,
            schemas,
            fileOutputs,
            outputProcessors,
            fileMerges,
            completer,
            chatParticipants,
            genOptions
        )
        tracePromptResult(trace, output)

        const {
            json,
            fences,
            frames,
            genVars = {},
            error,
            finishReason,
            usages,
            fileEdits,
            changelogs,
            edits,
        } = output
        let { text, annotations } = output

        // Reporting and tracing output
        if (fences?.length)
            trace.details("📩 code regions", renderFencedVariables(fences))
        if (fileEdits && Object.keys(fileEdits).length) {
            trace.startDetails("📝 file edits")
            for (const [f, e] of Object.entries(fileEdits))
                trace.detailsFenced(f, e.after)
            trace.endDetails()
        }
        if (annotations?.length)
            trace.details(
                "⚠️ annotations",
                CSVToMarkdown(
                    annotations.map((a) => ({
                        ...a,
                        line: a.range?.[0]?.[0],
                        endLine: a.range?.[1]?.[0] ?? "",
                        code: a.code ?? "",
                    })),
                    {
                        headers: [
                            "severity",
                            "filename",
                            "line",
                            "endLine",
                            "code",
                            "message",
                        ],
                    }
                )
            )

        trace.renderErrors()
        const res: GenerationResult = {
            status:
                finishReason === "cancel"
                    ? "cancelled"
                    : error
                      ? "error"
                      : finishReason === "stop"
                        ? "success"
                        : "error",
            finishReason,
            error,
            messages,
            vars,
            edits,
            annotations,
            changelogs,
            fileEdits,
            text,
            version,
            fences,
            frames,
            genVars,
            schemas,
            json,
            logprobs: output.logprobs,
            stats: {
                cost: options.stats.cost(),
                ...options.stats.usage,
            },
        }

        // If there's an error, provide status text
        if (res.status === "error" && !res.statusText && res.finishReason) {
            res.statusText = `LLM finish reason: ${res.finishReason}`
        }
        return res
    } finally {
        // Cleanup any resources like running containers or browsers
        await runtimeHost.removeContainers()
        await runtimeHost.removeBrowsers()
    }
}
