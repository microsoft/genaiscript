"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.callExpander = callExpander;
exports.expandTemplate = expandTemplate;
const ast_js_1 = require("./ast.js");
const assert_js_1 = require("./assert.js");
const error_js_1 = require("./error.js");
const constants_js_1 = require("./constants.js");
const promptdom_js_1 = require("./promptdom.js");
const promptcontext_js_1 = require("./promptcontext.js");
const evalprompt_js_1 = require("./evalprompt.js");
const chat_js_1 = require("./chat.js");
const importprompt_js_1 = require("./importprompt.js");
const host_js_1 = require("./host.js");
const systems_js_1 = require("./systems.js");
const dispose_js_1 = require("./dispose.js");
const cleaners_js_1 = require("./cleaners.js");
const vars_js_1 = require("./vars.js");
const globals_js_1 = require("./globals.js");
const performance_js_1 = require("./performance.js");
const nodepackage_js_1 = require("./nodepackage.js");
const metadata_js_1 = require("./metadata.js");
const debug_js_1 = require("./debug.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("expander");
/**
 * Executes a prompt expansion process based on the provided prompt script, variables, and options.
 *
 * @param prj - The project instance in which the prompt script is executed.
 * @param r - The prompt script to be evaluated, containing the logic and structure of the prompt.
 * @param ev - Expansion variables to customize the prompt script evaluation.
 * @param trace - The trace object used for generating logs and debugging details.
 * @param options - Configuration options that influence the prompt expansion and evaluation.
 * @param installGlobally - Specifies whether the prompt context should be installed globally.
 * @returns An object containing the status of the operation, generated messages, images, schema definitions, tools, logs, and other related outputs.
 */
async function callExpander(prj, r, ev, options, installGlobally) {
    (0, performance_js_1.mark)("prompt.expand.main");
    (0, assert_js_1.assert)(!!options.model);
    const trace = options.trace;
    const modelId = r.model ?? options.model;
    const ctx = await (0, promptcontext_js_1.createPromptContext)(prj, ev, options, modelId);
    if (installGlobally)
        (0, globals_js_1.installGlobalPromptContext)(ctx);
    let status = undefined;
    let statusText = undefined;
    let logs = "";
    let messages = [];
    let images = [];
    let schemas = {};
    let functions = [];
    let fileMerges = [];
    let outputProcessors = [];
    let chatParticipants = [];
    let fileOutputs = [];
    let disposables = [];
    let prediction;
    const logCb = (msg) => {
        logs += msg + "\n";
    };
    // package.json { type: "module" }
    const isModule = await (0, nodepackage_js_1.nodeIsPackageTypeModule)();
    const isJs = constants_js_1.JS_REGEX.test(r.filename);
    const isTs = constants_js_1.TS_IMPORT_REGEX.test(r.filename);
    dbg(`module: %s`, isModule);
    dbg(`js: %s`, isJs);
    dbg(`ts: %s`, isTs);
    try {
        if (r.filename && (isTs || (isModule && isJs))) {
            await (0, importprompt_js_1.importPrompt)(ctx, r, { logCb, trace });
        }
        else {
            await (0, evalprompt_js_1.evalPrompt)(ctx, r, {
                sourceMaps: true,
                logCb,
            });
        }
        const node = ctx.node;
        const { messages: msgs, images: imgs, errors, schemas: schs, tools: fns, fileMerges: fms, outputProcessors: ops, chatParticipants: cps, fileOutputs: fos, prediction: pred, disposables: mcps, } = await (0, promptdom_js_1.renderPromptNode)(modelId, node, {
            flexTokens: options.flexTokens,
            fenceFormat: options.fenceFormat,
            trace,
        });
        messages = msgs;
        images = imgs;
        schemas = schs;
        functions = fns;
        fileMerges = fms;
        outputProcessors = ops;
        chatParticipants = cps;
        fileOutputs = fos;
        disposables = mcps;
        prediction = pred;
        if (errors?.length) {
            if (trace)
                for (const error of errors)
                    trace?.error(``, error);
            status = "error";
            statusText = errors.map((e) => (0, error_js_1.errorMessage)(e)).join("\n");
        }
        else {
            status = "success";
        }
    }
    catch (e) {
        status = "error";
        statusText = (0, error_js_1.errorMessage)(e);
        if ((0, error_js_1.isCancelError)(e)) {
            status = "cancelled";
            trace?.note(statusText);
        }
        else {
            trace?.error(undefined, e);
        }
    }
    return Object.freeze({
        logs,
        status,
        statusText,
        messages,
        images,
        schemas,
        functions: Object.freeze(functions),
        fileMerges,
        outputProcessors,
        chatParticipants,
        fileOutputs,
        disposables,
        prediction,
    });
}
function traceEnv(model, trace, env) {
    // nothing to show
    if (!env.files?.length &&
        !Object.keys(env.vars || {}).length &&
        !Object.keys(env.secrets || {}).length)
        return;
    trace?.startDetails("🏡 env");
    trace?.files(env.files, {
        title: "💾 files",
        model,
        skipIfEmpty: true,
        secrets: env.secrets,
        maxLength: 0,
    });
    const vars = Object.entries(env.vars || {});
    if (vars.length) {
        trace?.startDetails("🧮 vars");
        for (const [k, v] of vars) {
            trace?.itemValue(k, v);
        }
        trace?.endDetails();
    }
    const secrets = Object.keys(env.secrets || {});
    if (secrets.length) {
        trace?.itemValue(`🔐 secrets`, secrets.join(", "));
    }
    trace?.endDetails();
}
/**
 * /**
 *  * Expands a template into a structured prompt to be used for generation.
 *  *
 *  * @param prj The project context for resolution of scripts and systems.
 *  * @param template The template script to be expanded.
 *  * @param options Configuration options for template expansion and generation.
 *  * @param env The environment variables and metadata for the template expansion process.
 *  * @returns An object containing the expanded prompt details, including messages, images, schemas, tools, and more.
 *  *
 *  * Parameters:
 *  * @param prj
 *  * - The current project instance, used to resolve associated systems and scripts.
 *  *
 *  * @param template
 *  * - The source template script containing configurations and definitions for prompt generation.
 *  *
 *  * @param  - has parameters/options i
 */
async function expandTemplate(prj, template, options, env) {
    (0, performance_js_1.mark)("prompt.expand.script");
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const trace = options.trace;
    const model = options.model;
    (0, assert_js_1.assert)(!!trace);
    (0, assert_js_1.assert)(!!model);
    const cancellationToken = options.cancellationToken;
    // update options
    const lineNumbers = options.lineNumbers ??
        template.lineNumbers ??
        (0, systems_js_1.resolveSystems)(prj, template, undefined)
            .map((s) => (0, ast_js_1.resolveScript)(prj, s))
            .some((t) => t?.lineNumbers);
    const temperature = options.temperature ??
        (0, cleaners_js_1.normalizeFloat)(env.vars["temperature"]) ??
        template.temperature ??
        runtimeHost.modelAliases.large.temperature;
    options.fallbackTools =
        options.fallbackTools ?? template.fallbackTools ?? runtimeHost.modelAliases.large.fallbackTools;
    const reasoningEffort = options.reasoningEffort ??
        env.vars["reasoning_effort"] ??
        template.reasoningEffort ??
        runtimeHost.modelAliases.large.reasoningEffort;
    const topP = options.topP ?? (0, cleaners_js_1.normalizeFloat)(env.vars["top_p"]) ?? template.topP;
    const maxTokens = options.maxTokens ??
        (0, cleaners_js_1.normalizeInt)(env.vars["maxTokens"]) ??
        (0, cleaners_js_1.normalizeInt)(env.vars["max_tokens"]) ??
        template.maxTokens;
    const maxToolCalls = options.maxToolCalls ??
        (0, cleaners_js_1.normalizeInt)(env.vars["maxToolCalls"]) ??
        (0, cleaners_js_1.normalizeInt)(env.vars["max_tool_calls"]) ??
        template.maxToolCalls ??
        constants_js_1.MAX_TOOL_CALLS;
    const flexTokens = options.flexTokens ??
        (0, cleaners_js_1.normalizeInt)(env.vars["flexTokens"]) ??
        (0, cleaners_js_1.normalizeInt)(env.vars["flex_tokens"]) ??
        template.flexTokens;
    const fenceFormat = options.fenceFormat ?? template.fenceFormat;
    const cache = options.cache ?? template.cache;
    const metadata = (0, metadata_js_1.metadataMerge)(template, options.metadata);
    let seed = options.seed ?? (0, cleaners_js_1.normalizeInt)(env.vars["seed"]) ?? template.seed;
    if (seed !== undefined)
        seed = seed >> 0;
    let logprobs = options.logprobs || template.logprobs;
    let topLogprobs = Math.max(options.topLogprobs || 0, template.topLogprobs || 0);
    const disableChatPreview = options.disableChatPreview === true || template.disableChatPreview === true;
    // finalize options
    env.meta.model = model;
    Object.freeze(env.meta);
    trace?.startDetails("💾 script", { expanded: true });
    traceEnv(model, trace, env);
    trace?.startDetails("🧬 prompt", { expanded: true });
    if (template.filename)
        trace?.item(template.filename);
    trace?.detailsFenced("💻 script source", template.jsSource, "js");
    const prompt = await callExpander(prj, template, env, {
        ...options,
        trace,
        maxTokens,
        maxToolCalls,
        flexTokens,
        seed,
        topP,
        temperature,
        reasoningEffort,
        lineNumbers,
        fenceFormat,
    }, true);
    const { status, statusText, messages } = prompt;
    const images = prompt.images.slice(0);
    const schemas = structuredClone(prompt.schemas);
    const tools = prompt.functions.slice(0);
    const fileMerges = prompt.fileMerges.slice(0);
    const outputProcessors = prompt.outputProcessors.slice(0);
    const chatParticipants = prompt.chatParticipants.slice(0);
    const fileOutputs = prompt.fileOutputs.slice(0);
    const prediction = prompt.prediction;
    const disposables = prompt.disposables.slice(0);
    if (prompt.logs?.length)
        trace?.details("📝 console.log", prompt.logs);
    trace?.endDetails();
    if (cancellationToken?.isCancellationRequested || status === "cancelled") {
        await (0, dispose_js_1.dispose)(disposables, { trace });
        return {
            status: "cancelled",
            statusText: "user cancelled",
            messages,
        };
    }
    if (status !== "success" || prompt.messages.length === 0) {
        // cancelled
        await (0, dispose_js_1.dispose)(disposables, { trace });
        return {
            status,
            statusText,
            messages,
        };
    }
    const addSystemMessage = (content) => {
        (0, chat_js_1.appendSystemMessage)(messages, content);
        trace?.fence(content, "markdown");
    };
    const systems = (0, systems_js_1.resolveSystems)(prj, template, tools);
    if (systems.length)
        if (messages[0].role === "system")
            // there's already a system message. add empty before
            messages.unshift({ role: "system", content: "" });
    if ((0, systems_js_1.addFallbackToolSystems)(systems, tools, template, options)) {
        dbg("added fallback tools");
        (0, assert_js_1.assert)(!Object.isFrozen(options));
        options.fallbackTools = true;
    }
    try {
        trace?.startDetails("👾 systems");
        for (let i = 0; i < systems.length; ++i) {
            if (cancellationToken?.isCancellationRequested) {
                await (0, dispose_js_1.dispose)(disposables, { trace });
                return {
                    status: "cancelled",
                    statusText: "user cancelled",
                    messages,
                };
            }
            const systemId = systems[i];
            dbg(`system ${systemId.id}`);
            const system = (0, ast_js_1.resolveScript)(prj, systemId);
            if (!system)
                throw new Error(`system template ${systemId.id} not found`);
            trace?.startDetails(`👾 ${system.id}`);
            const sysr = await callExpander(prj, system, (0, vars_js_1.mergeEnvVarsWithSystem)(env, systemId), { ...options, trace }, false);
            if (sysr.images)
                images.push(...sysr.images);
            if (sysr.schemas)
                Object.assign(schemas, sysr.schemas);
            if (sysr.functions)
                tools.push(...sysr.functions);
            if (sysr.fileMerges)
                fileMerges.push(...sysr.fileMerges);
            if (sysr.outputProcessors)
                outputProcessors.push(...sysr.outputProcessors);
            if (sysr.chatParticipants)
                chatParticipants.push(...sysr.chatParticipants);
            if (sysr.fileOutputs)
                fileOutputs.push(...sysr.fileOutputs);
            if (sysr.disposables?.length)
                disposables.push(...sysr.disposables);
            if (sysr.logs?.length)
                trace?.details("📝 console.log", sysr.logs);
            for (const smsg of sysr.messages) {
                if (smsg.role === "user" && typeof smsg.content === "string") {
                    addSystemMessage(smsg.content);
                }
                else
                    throw new error_js_1.NotSupportedError("only string user messages supported in system");
            }
            logprobs = logprobs || system.logprobs;
            topLogprobs = Math.max(topLogprobs, system.topLogprobs || 0);
            trace?.detailsFenced("💻 script source", system.jsSource, "js");
            trace?.endDetails();
            if (sysr.status !== "success") {
                await (0, dispose_js_1.dispose)(disposables, options);
                return {
                    status: sysr.status,
                    statusText: sysr.statusText,
                    messages,
                };
            }
        }
    }
    finally {
        trace?.endDetails();
    }
    if (options.fallbackTools) {
        (0, chat_js_1.addToolDefinitionsMessage)(messages, tools);
    }
    const { responseType, responseSchema } = (0, promptdom_js_1.finalizeMessages)(model, messages, {
        ...template,
        fileOutputs,
        trace,
    });
    trace?.endDetails();
    return {
        cache,
        messages,
        images,
        schemas,
        tools,
        status: status,
        statusText: statusText,
        model,
        temperature,
        reasoningEffort,
        topP,
        maxTokens,
        maxToolCalls,
        seed,
        responseType,
        responseSchema,
        fileMerges,
        prediction,
        outputProcessors,
        chatParticipants,
        fileOutputs,
        logprobs,
        topLogprobs,
        disposables,
        metadata,
        fallbackTools: options.fallbackTools,
        disableChatPreview,
    };
}
//# sourceMappingURL=expander.js.map