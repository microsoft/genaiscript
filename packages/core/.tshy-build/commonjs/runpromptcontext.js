"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChatTurnGenerationContext = createChatTurnGenerationContext;
exports.createChatGenerationContext = createChatGenerationContext;
// cspell: disable
const promptdom_js_1 = require("./promptdom.js");
const parameters_js_1 = require("./parameters.js");
const logging_js_1 = require("./logging.js");
const glob_js_1 = require("./glob.js");
const assert_js_1 = require("./assert.js");
const cleaners_js_1 = require("./cleaners.js");
const util_js_1 = require("./util.js");
const chatrender_js_1 = require("./chatrender.js");
const jinja_js_1 = require("./jinja.js");
const mustache_js_1 = require("./mustache.js");
const image_js_1 = require("./image.js");
const es_toolkit_1 = require("es-toolkit");
const chat_js_1 = require("./chat.js");
const cancellation_js_1 = require("./cancellation.js");
const models_js_1 = require("./models.js");
const constants_js_1 = require("./constants.js");
const systems_js_1 = require("./systems.js");
const expander_js_1 = require("./expander.js");
const error_js_1 = require("./error.js");
const lm_js_1 = require("./lm.js");
const concurrency_js_1 = require("./concurrency.js");
const ast_js_1 = require("./ast.js");
const indent_js_1 = require("./indent.js");
const fileedits_js_1 = require("./fileedits.js");
const agent_js_1 = require("./agent.js");
const yaml_js_1 = require("./yaml.js");
const vars_js_1 = require("./vars.js");
const ffmpeg_js_1 = require("./ffmpeg.js");
const bufferlike_js_1 = require("./bufferlike.js");
const host_js_1 = require("./host.js");
const transcription_js_1 = require("./transcription.js");
const crypto_js_1 = require("./crypto.js");
const filetype_js_1 = require("./filetype.js");
const cleaners_js_2 = require("./cleaners.js");
const tidy_js_1 = require("./tidy.js");
const base64_js_1 = require("./base64.js");
const consolecolor_js_1 = require("./consolecolor.js");
const terminal_js_1 = require("./terminal.js");
const stdio_js_1 = require("./stdio.js");
const workdir_js_1 = require("./workdir.js");
const pretty_js_1 = require("./pretty.js");
const cache_js_1 = require("./cache.js");
const performance_js_1 = require("./performance.js");
const debug_js_1 = require("./debug.js");
const debug_1 = __importDefault(require("debug"));
const dbg = (0, debug_js_1.genaiscriptDebug)("prompt:context");
/**
 * Creates a chat turn generation context object for building prompt nodes and utilities in a chat session.
 *
 * @param options - Generation options that configure prompt and model behaviors.
 * @param trace - Trace logger for output and debugging; collects logs and tracing information for the turn.
 * @param cancellationToken - Token used for supporting cancellation of asynchronous operations within this context.
 *
 * @returns Chat turn generation context with a prompt node for composition and methods:
 *   - node: The root prompt node for this chat turn.
 *   - writeText: Adds a text (or assistant/system) message node, with optional configuration.
 *   - assistant: Shortcut for adding a message as assistant.
 *   - $: Tagged template for string templates. Returns a PromptTemplateString for further configuration (setting priority, jinja/mustache transforms, roles, caching, etc.).
 *   - def: Defines a named prompt artifact (text, file, etc.) in the prompt context.
 *   - defImages: Defines image input(s) as prompt nodes, supports tiling and various source types.
 *   - defData: Defines structured data input as a prompt node.
 *   - defDiff: Defines a diff between two items and appends as a prompt node.
 *   - fence: Wraps body in a code fence and defines as a prompt artifact.
 *   - importTemplate: Imports and expands a prompt template.
 *   - console: Logging interface for messages, warnings, errors, and debugging within the context.
 *
 * This context is generally used by higher-level orchestration to build structured prompt data,
 * images, and system messages suitable for multi-turn chat generations.
 */
function createChatTurnGenerationContext(options, trace, cancellationToken) {
    const node = { children: [] };
    const fenceFormat = options.fenceFormat || (0, promptdom_js_1.resolveFenceFormat)(options.model);
    const lineNumbers = options.lineNumbers;
    const console = Object.freeze({
        log: (...args) => {
            const line = (0, logging_js_1.consoleLogFormat)(...args);
            if (line) {
                trace?.log(line);
                stdio_js_1.stdout.write(line + "\n");
            }
        },
        debug: (...args) => {
            const line = (0, logging_js_1.consoleLogFormat)(...args);
            if (line) {
                trace?.log(line);
                (0, util_js_1.logVerbose)(line);
            }
        },
        warn: (...args) => {
            const line = (0, logging_js_1.consoleLogFormat)(...args);
            if (line) {
                trace?.warn(line);
                (0, util_js_1.logWarn)(line);
            }
        },
        error: (...args) => {
            const line = (0, logging_js_1.consoleLogFormat)(...args);
            if (line) {
                trace?.error(line);
                (0, util_js_1.logError)(line);
            }
        },
    });
    const defImages = (files, defOptions) => {
        (0, cancellation_js_1.checkCancelled)(cancellationToken);
        if (files === undefined || files === null) {
            if (defOptions?.ignoreEmpty)
                return;
            throw new Error("no images provided");
        }
        if (Array.isArray(files)) {
            if (!files.length) {
                if (defOptions?.ignoreEmpty)
                    return;
                throw new Error("no images provided");
            }
            const sliced = (0, tidy_js_1.sliceData)(files, defOptions);
            if (!defOptions?.tiled)
                sliced.forEach((file) => defImages(file, defOptions));
            else {
                (0, promptdom_js_1.appendChild)(node, (0, promptdom_js_1.createImageNode)((async () => {
                    if (!files.length)
                        return undefined;
                    const encoded = await (0, image_js_1.imageTileEncodeForLLM)(files, {
                        ...defOptions,
                        cancellationToken,
                        trace,
                    });
                    return encoded;
                })()));
            }
        }
        else if (typeof files === "string" || files instanceof Blob || files instanceof Buffer) {
            const img = files;
            (0, promptdom_js_1.appendChild)(node, (0, promptdom_js_1.createImageNode)((async () => {
                const encoded = await (0, image_js_1.imageEncodeForLLM)(img, {
                    ...defOptions,
                    cancellationToken,
                    trace,
                });
                return encoded;
            })()));
        }
        else {
            const file = files;
            (0, promptdom_js_1.appendChild)(node, ...(0, promptdom_js_1.createFileImageNodes)(undefined, file, defOptions, {
                trace,
                cancellationToken,
            }));
        }
    };
    const ctx = {
        node,
        writeText: (body, options) => {
            if (body !== undefined && body !== null) {
                const { priority, maxTokens } = options || {};
                const role = options?.assistant ? "assistant" : options?.role || "user";
                (0, promptdom_js_1.appendChild)(node, role === "assistant"
                    ? (0, promptdom_js_1.createAssistantNode)(body, { priority, maxTokens })
                    : role === "system"
                        ? (0, promptdom_js_1.createSystemNode)(body, { priority, maxTokens })
                        : (0, promptdom_js_1.createTextNode)(body, { priority, maxTokens }));
            }
        },
        assistant: (body, options) => ctx.writeText(body, {
            ...options,
            role: "assistant",
        }),
        $: (strings, ...args) => {
            const current = (0, promptdom_js_1.createStringTemplateNode)(strings, args);
            (0, promptdom_js_1.appendChild)(node, current);
            const res = Object.freeze({
                priority: (priority) => {
                    current.priority = priority;
                    return res;
                },
                flex: (value) => {
                    current.flex = value;
                    return res;
                },
                jinja: (data) => {
                    current.transforms.push((t) => (0, jinja_js_1.jinjaRender)(t, data));
                    return res;
                },
                mustache: (data) => {
                    current.transforms.push((t) => (0, mustache_js_1.mustacheRender)(t, data));
                    return res;
                },
                maxTokens: (tokens) => {
                    current.maxTokens = tokens;
                    return res;
                },
                role: (r) => {
                    current.role = r;
                    return res;
                },
                cacheControl: (cc) => {
                    current.cacheControl = cc;
                    return res;
                },
            });
            return res;
        },
        def: (name, body, defOptions) => {
            name = name ?? "";
            const doptions = { ...(defOptions || {}), trace };
            doptions.lineNumbers = doptions.lineNumbers ?? lineNumbers;
            doptions.fenceFormat = doptions.fenceFormat ?? fenceFormat;
            // shortcuts
            if (body === undefined || body === null) {
                if (!doptions.ignoreEmpty)
                    throw new Error(`def ${name} is ${body}. See ${constants_js_1.DOCS_DEF_FILES_IS_EMPTY_URL}`);
                return undefined;
            }
            else if (Array.isArray(body)) {
                if (body.length === 0 && !doptions.ignoreEmpty)
                    throw new Error(`def ${name} is empty. See ${constants_js_1.DOCS_DEF_FILES_IS_EMPTY_URL}`);
                body.forEach((f) => ctx.def(name, f, defOptions));
            }
            else if (typeof body === "string") {
                if (body.trim() === "" && !doptions.ignoreEmpty)
                    throw new Error(`def ${name} is empty. See ${constants_js_1.DOCS_DEF_FILES_IS_EMPTY_URL}`);
                (0, promptdom_js_1.appendChild)(node, (0, promptdom_js_1.createDef)(name, { filename: "", content: body }, doptions));
            }
            else if (typeof body === "object" && body.filename) {
                const file = body;
                const { glob } = defOptions || {};
                const endsWith = (0, cleaners_js_1.arrayify)(defOptions?.endsWith);
                const { filename } = file;
                if (glob && filename) {
                    if (!(0, glob_js_1.isGlobMatch)(filename, glob))
                        return undefined;
                }
                if (endsWith.length && !endsWith.some((ext) => filename.endsWith(ext)))
                    return undefined;
                // more robust check
                if (/\.(png|jpeg|jpg|gif|webp)$/i.test(filename)) {
                    (0, promptdom_js_1.appendChild)(node, ...(0, promptdom_js_1.createFileImageNodes)(name, file, doptions, {
                        trace,
                        cancellationToken,
                    }));
                }
                else
                    (0, promptdom_js_1.appendChild)(node, (0, promptdom_js_1.createDef)(name, file, doptions));
            }
            else if (typeof body === "object" && body.exitCode !== undefined) {
                (0, promptdom_js_1.appendChild)(node, (0, promptdom_js_1.createDef)(name, {
                    filename: "",
                    content: (0, chatrender_js_1.renderShellOutput)(body),
                }, { ...doptions, lineNumbers: false }));
            }
            else if (typeof body === "object" && body.content) {
                const fenced = body;
                (0, promptdom_js_1.appendChild)(node, (0, promptdom_js_1.createDef)(name, { filename: "", content: fenced.content }, { language: fenced.language, ...(doptions || {}) }));
            }
            else if (typeof body === "object" && body.text) {
                const res = body;
                const fence = res.fences?.length === 1 ? res.fences[0] : undefined;
                (0, promptdom_js_1.appendChild)(node, (0, promptdom_js_1.createDef)(name, { filename: "", content: fence?.content ?? res.text }, { language: fence?.language, ...(doptions || {}) }));
            }
            return (0, promptdom_js_1.toDefRefName)(name, doptions);
        },
        defImages,
        defData: (name, data, defOptions) => {
            name = name ?? "";
            const doptions = { ...(defOptions || {}), trace };
            doptions.fenceFormat = doptions.fenceFormat ?? fenceFormat;
            (0, promptdom_js_1.appendChild)(node, (0, promptdom_js_1.createDefData)(name, data, doptions));
            return (0, promptdom_js_1.toDefRefName)(name, doptions);
        },
        defDiff: (name, left, right, defDiffOptions) => {
            name = name ?? "";
            const doptions = { ...(defDiffOptions || {}), trace };
            doptions.fenceFormat = doptions.fenceFormat ?? fenceFormat;
            (0, promptdom_js_1.appendChild)(node, (0, promptdom_js_1.createDefDiff)(name, left, right, doptions));
            return (0, promptdom_js_1.toDefRefName)(name, doptions);
        },
        fence(body, options) {
            const doptions = { ...(options || {}), trace };
            doptions.fenceFormat = doptions.fenceFormat ?? fenceFormat;
            ctx.def("", body, doptions);
            return undefined;
        },
        importTemplate: (template, data, options) => {
            (0, promptdom_js_1.appendChild)(node, (0, promptdom_js_1.createImportTemplate)(template, data, options));
            return undefined;
        },
        console,
    };
    return ctx;
}
function createChatGenerationContext(options, trace, projectOptions) {
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const { cancellationToken, infoCb, userState } = options || {};
    const { prj, env } = projectOptions;
    (0, assert_js_1.assert)(!!env.output, "output missing");
    const turnCtx = createChatTurnGenerationContext(options, trace, cancellationToken);
    const node = turnCtx.node;
    // Default output processor for the prompt
    const defOutputProcessor = (fn) => {
        (0, cancellation_js_1.checkCancelled)(cancellationToken);
        if (fn)
            (0, promptdom_js_1.appendChild)(node, (0, promptdom_js_1.createOutputProcessor)(fn));
    };
    const defTool = (name, description, parameters, fn, defOptions) => {
        (0, cancellation_js_1.checkCancelled)(cancellationToken);
        if (name === undefined || name === null)
            throw new Error("tool name is missing");
        dbg(`tool %s`, name);
        if (typeof name === "string") {
            if (typeof description !== "string")
                throw new Error("tool description is missing");
            const parameterSchema = (0, parameters_js_1.promptParametersSchemaToJSONSchema)(parameters);
            (0, promptdom_js_1.appendChild)(node, (0, promptdom_js_1.createToolNode)(name, description, parameterSchema, fn, defOptions, ctx));
        }
        else if (typeof name === "object" && name.impl) {
            const tool = name;
            (0, promptdom_js_1.appendChild)(node, (0, promptdom_js_1.createToolNode)(tool.spec.name, tool.spec.description, 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tool.spec.parameters, tool.impl, defOptions, ctx));
        }
        else if (typeof name === "object" && name.config) {
            const client = name;
            (0, promptdom_js_1.appendChild)(node, (0, promptdom_js_1.createMcpClient)(client));
        }
        else if (typeof name === "object") {
            dbg(`mcp: %o`, Object.keys(name));
            for (const kv of Object.entries(name)) {
                const [id, def] = kv;
                const serverConfig = def;
                (0, promptdom_js_1.appendChild)(node, (0, promptdom_js_1.createMcpServer)(id, serverConfig, defOptions, ctx));
            }
        }
    };
    const adbgm = (0, debug_1.default)(`agent:memory`);
    const defAgent = (name, description, fn, options) => {
        (0, cancellation_js_1.checkCancelled)(cancellationToken);
        const { variant, tools, system, disableMemory, disableMemoryQuery, ...rest } = options || {};
        const memory = disableMemory ? undefined : (0, agent_js_1.agentCreateCache)({ userState });
        name = name.replace(/^agent_/i, "");
        const adbg = (0, debug_1.default)(`agent:${name}`);
        adbg(`created ${variant || ""}`);
        const agentName = `agent_${name}${variant ? "_" + variant : ""}`;
        const agentLabel = `agent ${name}${variant ? " " + variant : ""}`;
        const agentSystem = (0, es_toolkit_1.uniq)([
            "system.assistant",
            "system.tools",
            "system.explanations",
            "system.safety_jailbreak",
            "system.safety_harmful_content",
            "system.safety_protected_material",
            ...(0, cleaners_js_1.arrayify)(system),
        ]);
        const agentTools = (0, systems_js_1.resolveTools)(runtimeHost.project, agentSystem, (0, cleaners_js_1.arrayify)(tools));
        const agentDescription = (0, util_js_1.ellipse)(`Agent that uses an LLM to ${description}.\nAvailable tools:${agentTools.map((t) => `- ${t.description}`).join("\n")}`, 1020); // DO NOT LEAK TOOL ID HERE
        dbg(`description: ${agentDescription}`);
        defTool(agentName, agentDescription, {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "Query to answer by the LLM agent.",
                },
            },
            required: ["query"],
        }, async (args) => {
            // the LLM automatically adds extract arguments to the context
            (0, cancellation_js_1.checkCancelled)(cancellationToken);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { context, ...argsRest } = args;
            const { query, ...argsNoQuery } = argsRest;
            infoCb?.({
                text: `${agentLabel}: ${query} ${(0, vars_js_1.parametersToVars)(argsNoQuery)}`,
            });
            adbg(`query: ${query}`);
            const hasExtraArgs = Object.keys(argsNoQuery).length > 0;
            if (hasExtraArgs)
                adbg(`extra args: %O`, argsNoQuery);
            let memoryAnswer;
            if (memory && query && !disableMemoryQuery) {
                memoryAnswer = await (0, agent_js_1.agentQueryMemory)(memory, ctx, query + (hasExtraArgs ? `\n${(0, yaml_js_1.YAMLStringify)(argsNoQuery)}` : ""));
                if (memoryAnswer)
                    adbgm(`found ${memoryAnswer}`);
            }
            const res = await ctx.runPrompt(async (_) => {
                if (typeof fn === "string")
                    _.writeText((0, indent_js_1.dedent)(fn), { role: "system" });
                else
                    await fn(_, args);
                _.$ `Make a plan and solve the task described in <QUERY>.
                        
                        - Assume that your answer will be analyzed by an LLM, not a human.
                        - If you are missing information, reply "${constants_js_1.TOKEN_MISSING_INFO}: <what is missing>".
                        - If you cannot answer the query, return "${constants_js_1.TOKEN_NO_ANSWER}: <reason>".
                        - Be concise. Minimize output to the most relevant information to save context tokens.
                        `.role("system");
                if (memoryAnswer)
                    _.$ `- The <QUERY> applied to the agent memory is in <MEMORY>.`.role("system");
                _.def("QUERY", query);
                if (Object.keys(argsNoQuery).length)
                    _.defData("QUERY_CONTEXT", argsNoQuery, {
                        format: "yaml",
                    });
                if (memoryAnswer)
                    _.def("MEMORY", memoryAnswer);
                if (memory)
                    _.defOutputProcessor(async ({ text }) => {
                        if (text &&
                            !(text.startsWith(constants_js_1.TOKEN_MISSING_INFO) || text.startsWith(constants_js_1.TOKEN_NO_ANSWER))) {
                            adbgm(`add ${text}`);
                            await (0, agent_js_1.agentAddMemory)(memory, agentName, query, text, {
                                trace,
                            });
                        }
                    });
            }, {
                model: "agent",
                label: agentLabel,
                system: agentSystem,
                tools: agentTools.map(({ id }) => id),
                ...rest,
            });
            if (res.error) {
                adbg(`error: ${res.error}`);
                throw res.error;
            }
            const response = res.text;
            adbgm(`response: %O`, response);
            return response;
        });
    };
    const defSchema = (name, schema, defOptions) => {
        (0, cancellation_js_1.checkCancelled)(cancellationToken);
        (0, promptdom_js_1.appendChild)(node, (0, promptdom_js_1.createSchemaNode)(name, schema, defOptions));
        return name;
    };
    const defChatParticipant = (generator, options) => {
        (0, cancellation_js_1.checkCancelled)(cancellationToken);
        if (generator)
            (0, promptdom_js_1.appendChild)(node, (0, promptdom_js_1.createChatParticipant)({ generator, options }));
    };
    const defFileOutput = (pattern, description, options) => {
        (0, cancellation_js_1.checkCancelled)(cancellationToken);
        if (pattern)
            (0, promptdom_js_1.appendChild)(node, (0, promptdom_js_1.createFileOutput)({
                pattern: (0, cleaners_js_1.arrayify)(pattern).map((p) => (typeof p === "string" ? p : p.filename)),
                description,
                options,
            }));
    };
    const prompt = (strings, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args) => {
        (0, cancellation_js_1.checkCancelled)(cancellationToken);
        const options = {};
        const p = new Promise(async (resolve, reject) => {
            try {
                await (0, es_toolkit_1.delay)(0);
                // data race for options
                const res = await ctx.runPrompt(async (_) => {
                    _.$(strings, ...args);
                }, options);
                resolve(res);
            }
            catch (e) {
                reject(e);
            }
        });
        p.options = (v) => {
            if (v !== undefined)
                Object.assign(options, v);
            return p;
        };
        return p;
    };
    const transcribe = async (audio, options) => {
        (0, cancellation_js_1.checkCancelled)(cancellationToken);
        const { cache, ...rest } = options || {};
        const transcriptionTrace = trace?.startTraceDetails("🎤 transcribe");
        try {
            const conn = {
                model: options?.model,
            };
            const { info, configuration } = await (0, models_js_1.resolveModelConnectionInfo)(conn, {
                trace: transcriptionTrace,
                defaultModel: constants_js_1.TRANSCRIPTION_MODEL_ID,
                cancellationToken,
                token: true,
            });
            if (info.error)
                throw new Error(info.error);
            if (!configuration)
                throw new Error("model configuration not found");
            (0, cancellation_js_1.checkCancelled)(cancellationToken);
            const { ok } = await runtimeHost.pullModel(configuration, {
                trace: transcriptionTrace,
                cancellationToken,
            });
            if (!ok)
                throw new Error(`failed to pull model ${conn}`);
            (0, cancellation_js_1.checkCancelled)(cancellationToken);
            const { transcriber } = await (0, lm_js_1.resolveLanguageModel)(configuration.provider);
            if (!transcriber)
                throw new Error("audio transcribe not found for " + info.model);
            const ffmpeg = new ffmpeg_js_1.FFmepgClient();
            const audioFile = await ffmpeg.extractAudio(audio, {
                transcription: true,
                cache,
            });
            const file = await (0, bufferlike_js_1.BufferToBlob)(await runtimeHost.readFile(audioFile), "audio/ogg");
            const update = async () => {
                transcriptionTrace?.itemValue(`model`, configuration.model);
                transcriptionTrace?.itemValue(`file size`, (0, pretty_js_1.prettyBytes)(file.size));
                transcriptionTrace?.itemValue(`file type`, file.type);
                const res = await transcriber({
                    file,
                    model: configuration.model,
                    language: options?.language,
                    translate: options?.translate,
                }, configuration, {
                    trace: transcriptionTrace,
                    cancellationToken,
                });
                (0, transcription_js_1.srtVttRender)(res);
                return res;
            };
            let res;
            const _cache = (0, cache_js_1.createCache)(cache === true ? constants_js_1.TRANSCRIPTION_CACHE_NAME : typeof cache === "string" ? cache : undefined, { type: "fs" });
            if (cache) {
                const hit = await _cache.getOrUpdate({ file, ...rest }, update, (res) => !res.error);
                transcriptionTrace?.itemValue(`cache ${hit.cached ? "hit" : "miss"}`, hit.key);
                res = hit.value;
            }
            else
                res = await update();
            transcriptionTrace?.fence(res.text, "markdown");
            if (res.error)
                transcriptionTrace?.error((0, error_js_1.errorMessage)(res.error));
            if (res.segments)
                transcriptionTrace?.fence(res.segments, "yaml");
            return res;
        }
        catch (e) {
            (0, util_js_1.logError)(e);
            transcriptionTrace?.error(e);
            return {
                text: undefined,
                error: (0, error_js_1.serializeError)(e),
            };
        }
        finally {
            transcriptionTrace?.endDetails();
        }
    };
    const speak = async (input, options) => {
        (0, cancellation_js_1.checkCancelled)(cancellationToken);
        const { cache, voice, instructions, ...rest } = options || {};
        const speechTrace = trace?.startTraceDetails("🦜 speak");
        try {
            const conn = {
                model: options?.model || constants_js_1.SPEECH_MODEL_ID,
            };
            const { info, configuration } = await (0, models_js_1.resolveModelConnectionInfo)(conn, {
                trace: speechTrace,
                defaultModel: constants_js_1.SPEECH_MODEL_ID,
                cancellationToken,
                token: true,
            });
            if (info.error)
                throw new Error(info.error);
            if (!configuration)
                throw new Error("model configuration not found");
            (0, cancellation_js_1.checkCancelled)(cancellationToken);
            const { ok } = await runtimeHost.pullModel(configuration, {
                trace: speechTrace,
                cancellationToken,
            });
            if (!ok)
                throw new Error(`failed to pull model ${conn}`);
            (0, cancellation_js_1.checkCancelled)(cancellationToken);
            const { speaker } = await (0, lm_js_1.resolveLanguageModel)(configuration.provider);
            if (!speaker)
                throw new Error("speech converter not found for " + info.model);
            speechTrace?.itemValue(`model`, configuration.model);
            const req = (0, cleaners_js_2.deleteUndefinedValues)({
                input,
                model: configuration.model,
                voice,
                instructions: (0, indent_js_1.dedent)(instructions),
            });
            const res = await speaker(req, configuration, {
                trace: speechTrace,
                cancellationToken,
            });
            if (res.error) {
                speechTrace?.error((0, error_js_1.errorMessage)(res.error));
                return { error: res.error };
            }
            const h = await (0, crypto_js_1.hash)(res.audio, { length: 20 });
            const { ext } = (await (0, filetype_js_1.fileTypeFromBuffer)(res.audio)) || {};
            const filename = (0, workdir_js_1.dotGenaiscriptPath)("speech", h + "." + ext);
            await runtimeHost.writeFile(filename, res.audio);
            return {
                filename,
            };
        }
        catch (e) {
            (0, util_js_1.logError)(e);
            speechTrace?.error(e);
            return {
                filename: undefined,
                error: (0, error_js_1.serializeError)(e),
            };
        }
        finally {
            speechTrace?.endDetails();
        }
    };
    const defFileMerge = (fn) => {
        (0, cancellation_js_1.checkCancelled)(cancellationToken);
        (0, promptdom_js_1.appendChild)(node, (0, promptdom_js_1.createFileMerge)(fn));
    };
    const runPrompt = async (generator, runOptions) => {
        (0, cancellation_js_1.checkCancelled)(cancellationToken);
        Object.freeze(runOptions);
        const { label, applyEdits, throwOnError } = runOptions || {};
        const runTrace = trace?.startTraceDetails(`🎁 ${label || "prompt"}`);
        const messages = [];
        try {
            infoCb?.({ text: label || "prompt" });
            const genOptions = (0, chat_js_1.mergeGenerationOptions)(options, runOptions);
            genOptions.inner = true;
            genOptions.trace = runTrace;
            const { info, configuration } = await (0, models_js_1.resolveModelConnectionInfo)(genOptions, {
                trace: runTrace,
                defaultModel: constants_js_1.LARGE_MODEL_ID,
                cancellationToken,
                token: true,
            });
            if (info.error)
                throw new Error(info.error);
            if (!configuration)
                throw new Error("model configuration not found");
            genOptions.model = info.model;
            genOptions.stats = genOptions.stats.createChild(genOptions.model, label);
            const { ok } = await runtimeHost.pullModel(configuration, {
                trace: runTrace,
                cancellationToken,
            });
            if (!ok)
                throw new Error(`failed to pull model ${genOptions.model}`);
            const runCtx = createChatGenerationContext(genOptions, runTrace, projectOptions);
            if (typeof generator === "string")
                runCtx.node.children.push((0, promptdom_js_1.createTextNode)(generator));
            else
                await generator(runCtx);
            const node = runCtx.node;
            (0, cancellation_js_1.checkCancelled)(cancellationToken);
            let tools = undefined;
            let schemas = undefined;
            let chatParticipants = undefined;
            const images = [];
            const fileMerges = [];
            const outputProcessors = [];
            const fileOutputs = [];
            const disposables = [];
            // expand template
            const { errors, schemas: scs, tools: fns, messages: msgs, chatParticipants: cps, fileMerges: fms, outputProcessors: ops, fileOutputs: fos, images: imgs, prediction, disposables: dps, } = await (0, promptdom_js_1.renderPromptNode)(genOptions.model, node, {
                flexTokens: genOptions.flexTokens,
                fenceFormat: genOptions.fenceFormat,
                trace: runTrace,
                cancellationToken,
            });
            schemas = scs;
            tools = fns;
            chatParticipants = cps;
            messages.push(...msgs);
            fileMerges.push(...fms);
            outputProcessors.push(...ops);
            fileOutputs.push(...fos);
            images.push(...imgs);
            disposables.push(...dps);
            if (errors?.length) {
                (0, util_js_1.logError)(errors.map((err) => (0, error_js_1.errorMessage)(err)).join("\n"));
                throw new Error("errors while running prompt");
            }
            const systemScripts = (0, systems_js_1.resolveSystems)(prj, runOptions ?? {}, tools);
            if ((0, systems_js_1.addFallbackToolSystems)(systemScripts, tools, runOptions, genOptions)) {
                (0, assert_js_1.assert)(!Object.isFrozen(genOptions));
                genOptions.fallbackTools = true;
                dbg(`fallback tools added ${genOptions.fallbackTools}`);
            }
            if (systemScripts.length)
                try {
                    runTrace?.startDetails("👾 systems");
                    for (const systemId of systemScripts) {
                        (0, cancellation_js_1.checkCancelled)(cancellationToken);
                        dbg(`system ${systemId.id}`, {
                            fallbackTools: genOptions.fallbackTools,
                        });
                        const system = (0, ast_js_1.resolveScript)(prj, systemId);
                        if (!system)
                            throw new Error(`system template ${systemId.id} not found`);
                        runTrace?.startDetails(`👾 ${system.id}`);
                        if (systemId.parameters)
                            runTrace?.detailsFenced(`parameters`, (0, yaml_js_1.YAMLStringify)(systemId.parameters));
                        const sysr = await (0, expander_js_1.callExpander)(prj, system, (0, vars_js_1.mergeEnvVarsWithSystem)(env, systemId), genOptions, false);
                        if (sysr.images?.length)
                            throw new error_js_1.NotSupportedError("images");
                        if (sysr.schemas)
                            Object.assign(schemas, sysr.schemas);
                        if (sysr.functions)
                            tools.push(...sysr.functions);
                        if (sysr.fileMerges?.length)
                            fileMerges.push(...sysr.fileMerges);
                        if (sysr.outputProcessors?.length)
                            outputProcessors.push(...sysr.outputProcessors);
                        if (sysr.chatParticipants)
                            chatParticipants.push(...sysr.chatParticipants);
                        if (sysr.fileOutputs?.length)
                            fileOutputs.push(...sysr.fileOutputs);
                        if (sysr.disposables?.length)
                            disposables.push(...sysr.disposables);
                        if (sysr.logs?.length)
                            runTrace?.details("📝 console.log", sysr.logs);
                        for (const smsg of sysr.messages) {
                            if (smsg.role === "user" && typeof smsg.content === "string") {
                                (0, chat_js_1.appendSystemMessage)(messages, smsg.content);
                                runTrace?.fence(smsg.content, "markdown");
                            }
                            else
                                throw new error_js_1.NotSupportedError("only string user messages supported in system");
                        }
                        genOptions.logprobs = genOptions.logprobs || system.logprobs;
                        runTrace?.detailsFenced("💻 script source", system.jsSource, "js");
                        runTrace?.endDetails();
                        if (sysr.status !== "success")
                            throw new Error(`system ${system.id} failed ${sysr.status} ${sysr.statusText}`);
                    }
                }
                finally {
                    runTrace?.endDetails();
                }
            if (genOptions.fallbackTools) {
                dbg(`fallback tools definitions added`);
                (0, chat_js_1.addToolDefinitionsMessage)(messages, tools);
            }
            (0, promptdom_js_1.finalizeMessages)(genOptions.model, messages, {
                ...genOptions,
                fileOutputs,
                trace: runTrace,
            });
            const { completer } = await (0, lm_js_1.resolveLanguageModel)(configuration.provider);
            if (!completer)
                throw new Error("model driver not found for " + info.model);
            (0, cancellation_js_1.checkCancelled)(cancellationToken);
            const modelConcurrency = options.modelConcurrency?.[genOptions.model] ?? constants_js_1.CHAT_REQUEST_PER_MODEL_CONCURRENT_LIMIT;
            const modelLimit = (0, concurrency_js_1.concurrentLimit)("model:" + genOptions.model, modelConcurrency);
            dbg(`run ${genOptions.model}`);
            const resp = await modelLimit(() => (0, chat_js_1.executeChatSession)(configuration, cancellationToken, messages, tools, schemas, fileOutputs, outputProcessors, fileMerges, prediction, completer, chatParticipants, disposables, genOptions));
            (0, chat_js_1.tracePromptResult)(runTrace, resp);
            await (0, fileedits_js_1.writeFileEdits)(resp.fileEdits, {
                applyEdits,
                trace: runTrace,
            });
            if (resp.error && throwOnError)
                throw new Error((0, error_js_1.errorMessage)(resp.error));
            return resp;
        }
        catch (e) {
            runTrace?.error(e);
            if (throwOnError)
                throw e;
            return {
                messages,
                text: "",
                reasoning: (0, chatrender_js_1.lastAssistantReasoning)(messages),
                finishReason: (0, error_js_1.isCancelError)(e) ? "cancel" : "fail",
                error: (0, error_js_1.serializeError)(e),
            };
        }
        finally {
            runTrace?.endDetails();
        }
    };
    const generateImage = async (prompt, imageOptions) => {
        if (!prompt)
            throw new Error("prompt is missing");
        const imgTrace = trace?.startTraceDetails("🖼️ generate image");
        try {
            const { style, quality, size, outputFormat, mime, mode, image, mask, ...rest } = imageOptions || {};
            const conn = {
                model: imageOptions?.model || constants_js_1.IMAGE_GENERATION_MODEL_ID,
            };
            const { info, configuration } = await (0, models_js_1.resolveModelConnectionInfo)(conn, {
                trace: imgTrace,
                defaultModel: constants_js_1.IMAGE_GENERATION_MODEL_ID,
                cancellationToken,
                token: true,
            });
            if (info.error)
                throw new Error(info.error);
            if (!configuration)
                throw new Error(`model configuration not found for ${conn.model}`);
            const stats = options.stats.createChild(info.model, "generate image");
            (0, cancellation_js_1.checkCancelled)(cancellationToken);
            const { ok } = await runtimeHost.pullModel(configuration, {
                trace: imgTrace,
                cancellationToken,
            });
            if (!ok)
                throw new Error(`failed to pull model '${conn}'`);
            (0, cancellation_js_1.checkCancelled)(cancellationToken);
            const { imageGenerator } = await (0, lm_js_1.resolveLanguageModel)(configuration.provider);
            if (!imageGenerator)
                throw new Error("image generator not found for " + info.model);
            imgTrace?.itemValue(`model`, configuration.model);
            // Validate mode-specific requirements
            if (mode === "edit" && !image) {
                throw new Error("Image is required for edit mode");
            }
            const req = (0, cleaners_js_2.deleteUndefinedValues)({
                model: configuration.model,
                prompt: (0, indent_js_1.dedent)(prompt),
                size,
                quality,
                style,
                outputFormat,
                mode,
                image,
                mask,
            });
            const m = (0, performance_js_1.measure)("img.generate", `${req.model} -> image`);
            const res = await imageGenerator(req, configuration, {
                trace: imgTrace,
                cancellationToken,
                ...rest,
            });
            const duration = m();
            if (res.error) {
                imgTrace?.error((0, error_js_1.errorMessage)(res.error));
                throw new Error((0, error_js_1.errorMessage)(res.error));
            }
            dbg(`usage: %o`, res.usage);
            stats.addImageGenerationUsage(res.usage, duration);
            const h = await (0, crypto_js_1.hash)(res.image, { length: 20 });
            const buf = await (0, image_js_1.imageTransform)(res.image, {
                ...(imageOptions || {}),
                mime: mime ??
                    (outputFormat === "jpeg" || outputFormat === "webp"
                        ? `image/jpeg`
                        : outputFormat === "png"
                            ? `image/png`
                            : undefined),
                cancellationToken,
                trace: imgTrace,
            });
            const { ext } = (await (0, filetype_js_1.fileTypeFromBuffer)(buf)) || {};
            const filename = (0, workdir_js_1.dotGenaiscriptPath)("image", h + "." + ext);
            await runtimeHost.writeFile(filename, buf);
            if (consolecolor_js_1.consoleColors) {
                const size = (0, terminal_js_1.terminalSize)();
                stdio_js_1.stderr.write(await (0, image_js_1.renderImageToTerminal)(buf, {
                    ...size,
                    label: filename,
                    usage: res.usage,
                    modelId: info.model,
                }));
            }
            else
                (0, util_js_1.logVerbose)(`image: ${filename}`);
            imgTrace?.image(filename, `generated image`);
            imgTrace?.detailsFenced(`🔀 revised prompt`, res.revisedPrompt);
            return {
                image: {
                    filename,
                    encoding: "base64",
                    content: (0, base64_js_1.toBase64)(res.image),
                },
                revisedPrompt: res.revisedPrompt,
            };
        }
        finally {
            imgTrace?.endDetails();
        }
    };
    const ctx = Object.freeze({
        ...turnCtx,
        defAgent,
        defTool,
        defSchema,
        defChatParticipant,
        defFileOutput,
        defOutputProcessor,
        defFileMerge,
        prompt,
        runPrompt,
        transcribe,
        speak,
        generateImage,
        env,
    });
    return ctx;
}
//# sourceMappingURL=runpromptcontext.js.map