"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTemplate = runTemplate;
// Import necessary modules and functions for handling chat sessions, templates, file management, etc.
const chat_js_1 = require("./chat.js");
const cleaners_js_1 = require("./cleaners.js");
const util_js_1 = require("./util.js");
const assert_js_1 = require("./assert.js");
const host_js_1 = require("./host.js");
const version_js_1 = require("./version.js");
const fs_js_1 = require("./fs.js");
const csv_js_1 = require("./csv.js");
const models_js_1 = require("./models.js");
const error_js_1 = require("./error.js");
const fence_js_1 = require("./fence.js");
const vars_js_1 = require("./vars.js");
const file_js_1 = require("./file.js");
const expander_js_1 = require("./expander.js");
const lm_js_1 = require("./lm.js");
const cancellation_js_1 = require("./cancellation.js");
const chatrender_js_1 = require("./chatrender.js");
const think_js_1 = require("./think.js");
const cleaners_js_2 = require("./cleaners.js");
const constants_js_1 = require("./constants.js");
const debug_js_1 = require("./debug.js");
const debug_1 = __importDefault(require("debug"));
const dispose_js_1 = require("./dispose.js");
const runnerDbg = (0, debug_js_1.genaiscriptDebug)("promptrunner");
const dbg = (0, debug_js_1.genaiscriptDebug)("env");
// Asynchronously resolve expansion variables needed for a template
/**
 * Resolves variables required for the expansion of a template.
 * @param project The project context.
 * @param trace The markdown trace for logging.
 * @param template The prompt script template.
 * @param fragment The fragment containing files and metadata.
 * @param vars The user-provided variables.
 * @returns An object containing resolved variables.
 */
async function resolveExpansionVars(project, template, fragment, output, options) {
    const { vars, runDir, runId, trace, applyGitIgnore } = options;
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const root = runtimeHost.projectFolder();
    (0, assert_js_1.assert)(!!vars);
    (0, assert_js_1.assert)(!!runDir);
    (0, assert_js_1.assert)(!!runId);
    const files = [];
    const templateFiles = (0, cleaners_js_1.arrayify)(template.files);
    dbg(`template files: %O`, templateFiles);
    const referenceFiles = fragment.files.slice(0);
    const workspaceFiles = fragment.workspaceFiles?.slice(0) || [];
    const filenames = await (0, fs_js_1.expandFiles)(referenceFiles.length || workspaceFiles.length ? referenceFiles : templateFiles, {
        applyGitIgnore,
        accept: template.accept,
    });
    for (let filename of filenames) {
        filename = (0, util_js_1.relativePath)(root, filename);
        dbg(`filenames: %O`, filenames);
        // Skip if file already in the list
        if (files.find((lk) => lk.filename === filename))
            continue;
        const file = { filename };
        await (0, file_js_1.resolveFileContent)(file);
        files.push(file);
    }
    for (const wf of workspaceFiles) {
        if (!files.find((f) => f.filename === wf.filename)) {
            await (0, file_js_1.resolveFileContent)(wf);
            files.push(wf);
        }
    }
    // Parse and obtain attributes from prompt parameters
    const attrs = (0, vars_js_1.parsePromptParameters)(project, template, vars);
    const secrets = {};
    // Read secrets defined in the template
    for (const secret of template.secrets || []) {
        const value = await runtimeHost.readSecret(secret);
        if (value) {
            trace.item(`secret \`${secret}\` used`);
            secrets[secret] = value;
        }
        else
            trace.error(`secret \`${secret}\` not found`);
    }
    // Create and return an object containing resolved variables
    const meta = structuredClone({
        id: template.id,
        title: template.title,
        description: template.description,
        group: template.group,
        model: template.model,
        defTools: template.defTools,
    }); // frozen later
    const res = {
        dir: ".",
        files,
        meta,
        vars: attrs,
        secrets,
        output,
        generator: undefined,
        runDir,
        runId,
        dbg: (0, debug_1.default)(constants_js_1.DEBUG_SCRIPT_CATEGORY),
    };
    return res;
}
// Main function to run a template with given options
/**
 * Executes a prompt template with specified options.
 *
 * @param prj The project context providing runtime and configuration.
 * @param template The prompt script template to execute.
 * @param fragment Additional context such as files, workspace files, and metadata.
 * @param options Configuration for generation, including model, trace, output trace, cancellation token, stats, and other generation parameters.
 * @returns A generation result containing execution details, outputs, and potential errors, including status, messages, edits, annotations, file changes, and usage statistics.
 */
async function runTemplate(prj, template, fragment, options) {
    (0, assert_js_1.assert)(fragment !== undefined);
    (0, assert_js_1.assert)(options !== undefined);
    (0, assert_js_1.assert)(options.trace !== undefined);
    (0, assert_js_1.assert)(options.outputTrace !== undefined);
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const { label, trace, outputTrace, cancellationToken, model, runId } = options;
    const version = version_js_1.CORE_VERSION;
    (0, assert_js_1.assert)(model !== undefined);
    runtimeHost.project = prj;
    try {
        // Resolve expansion variables for the template
        const env = await resolveExpansionVars(prj, template, fragment, outputTrace, options);
        const { messages, schemas, tools, fileMerges, outputProcessors, chatParticipants, fileOutputs, prediction, status, statusText, temperature, reasoningEffort, topP, maxTokens, fallbackTools, seed, responseType, responseSchema, logprobs, topLogprobs, disposables, cache, metadata, disableChatPreview, } = await (0, expander_js_1.expandTemplate)(prj, template, options, env);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { output, generator, secrets, dbg: envDbg, ...restEnv } = env;
        runnerDbg(`messages ${messages.length}`);
        // Handle failed expansion scenario
        if (status !== "success" || !messages.length) {
            trace.renderErrors();
            return {
                status: status,
                statusText,
                messages,
                env: restEnv,
                label,
                version,
                text: (0, think_js_1.unthink)(outputTrace?.content),
                reasoning: (0, chatrender_js_1.lastAssistantReasoning)(messages),
                edits: [],
                annotations: [],
                changelogs: [],
                fileEdits: {},
                fences: [],
                frames: [],
                schemas: {},
                usage: undefined,
                runId,
            };
        }
        // Resolve model connection information
        const connection = await (0, models_js_1.resolveModelConnectionInfo)({ model }, { trace, token: true });
        if (connection.info.error)
            throw new Error((0, error_js_1.errorMessage)(connection.info.error));
        if (!connection.configuration)
            throw new error_js_1.RequestError(403, `LLM configuration missing for model ${model}`, connection.info);
        (0, cancellation_js_1.checkCancelled)(cancellationToken);
        const { ok } = await runtimeHost.pullModel(connection.configuration, options);
        if (!ok) {
            trace.renderErrors();
            return (0, cleaners_js_2.deleteUndefinedValues)({
                status: "error",
                statusText: "",
                messages,
                env: restEnv,
                label,
                version,
                text: (0, think_js_1.unthink)(outputTrace?.content),
                reasoning: (0, chatrender_js_1.lastAssistantReasoning)(messages),
                edits: [],
                annotations: [],
                changelogs: [],
                fileEdits: {},
                fences: [],
                frames: [],
                schemas: {},
                usage: undefined,
                runId,
            });
        }
        const { completer } = await (0, lm_js_1.resolveLanguageModel)(connection.configuration.provider);
        // Execute chat session with the resolved configuration
        const runStats = options.stats.createChild(connection.info.model);
        const genOptions = {
            ...options,
            cache,
            choices: template.choices,
            responseType,
            responseSchema,
            model,
            temperature,
            reasoningEffort,
            maxTokens,
            topP,
            seed,
            logprobs,
            topLogprobs,
            fallbackTools,
            metadata,
            stats: runStats,
            disableChatPreview,
        };
        const chatResult = await (0, chat_js_1.executeChatSession)(connection.configuration, cancellationToken, messages, tools, schemas, fileOutputs, outputProcessors, fileMerges, prediction, completer, chatParticipants, disposables, genOptions);
        (0, chat_js_1.tracePromptResult)(trace, chatResult);
        const { json, fences, frames, error, finishReason, fileEdits, changelogs, edits } = chatResult;
        const { annotations } = chatResult;
        // Reporting and tracing output
        if (fences?.length)
            trace.details("📩 code regions", (0, fence_js_1.renderFencedVariables)(fences));
        if (fileEdits && Object.keys(fileEdits).length) {
            trace.startDetails("📝 file edits");
            for (const [f, e] of Object.entries(fileEdits))
                trace.detailsFenced(f, e.after);
            trace.endDetails();
        }
        if (annotations?.length)
            trace.details("⚠️ annotations", (0, csv_js_1.dataToMarkdownTable)(annotations.map((a) => ({
                ...a,
                line: a.range?.[0]?.[0],
                endLine: a.range?.[1]?.[0] ?? "",
                code: a.code ?? "",
            })), {
                headers: ["severity", "filename", "line", "endLine", "code", "message"],
            }));
        trace.renderErrors();
        const res = {
            status: finishReason === "cancel"
                ? "cancelled"
                : error
                    ? "error"
                    : finishReason === "stop"
                        ? "success"
                        : "error",
            finishReason,
            error,
            messages,
            env: restEnv,
            edits,
            annotations,
            changelogs,
            fileEdits,
            text: (0, think_js_1.unthink)(outputTrace?.content),
            reasoning: (0, chatrender_js_1.lastAssistantReasoning)(messages),
            version,
            fences,
            frames,
            schemas,
            json,
            choices: chatResult.choices,
            logprobs: chatResult.logprobs,
            perplexity: chatResult.perplexity,
            uncertainty: chatResult.uncertainty,
            usage: chatResult.usage,
            runId,
        };
        // If there's an error, provide status text
        if (res.status === "error" && !res.statusText && res.finishReason) {
            res.statusText = `LLM finish reason: ${res.finishReason}`;
        }
        return res;
    }
    finally {
        // Cleanup any resources like running containers or browsers
        await (0, dispose_js_1.dispose)(Object.values(runtimeHost.userState), options);
        runtimeHost.userState = {};
        await runtimeHost.removeContainers();
    }
}
//# sourceMappingURL=promptrunner.js.map