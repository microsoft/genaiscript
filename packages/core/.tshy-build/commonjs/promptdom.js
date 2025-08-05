"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTextNode = createTextNode;
exports.toDefRefName = toDefRefName;
exports.createDef = createDef;
exports.createDefDiff = createDefDiff;
exports.createAssistantNode = createAssistantNode;
exports.createSystemNode = createSystemNode;
exports.createStringTemplateNode = createStringTemplateNode;
exports.createImageNode = createImageNode;
exports.createFileImageNodes = createFileImageNodes;
exports.createSchemaNode = createSchemaNode;
exports.createToolNode = createToolNode;
exports.createFileMerge = createFileMerge;
exports.createOutputProcessor = createOutputProcessor;
exports.createChatParticipant = createChatParticipant;
exports.createFileOutput = createFileOutput;
exports.createImportTemplate = createImportTemplate;
exports.createMcpServer = createMcpServer;
exports.createMcpClient = createMcpClient;
exports.createDefData = createDefData;
exports.appendChild = appendChild;
exports.visitNode = visitNode;
exports.resolveFenceFormat = resolveFenceFormat;
exports.renderPromptNode = renderPromptNode;
exports.finalizeMessages = finalizeMessages;
// Importing various utility functions and constants from different modules.
const csv_js_1 = require("./csv.js");
const file_js_1 = require("./file.js");
const liner_js_1 = require("./liner.js");
const schema_js_1 = require("./schema.js");
const tokens_js_1 = require("./tokens.js");
const assert_js_1 = require("./assert.js");
const cleaners_js_1 = require("./cleaners.js");
const util_js_1 = require("./util.js");
const yaml_js_1 = require("./yaml.js");
const constants_js_1 = require("./constants.js");
const chat_js_1 = require("./chat.js");
const error_js_1 = require("./error.js");
const tidy_js_1 = require("./tidy.js");
const indent_js_1 = require("./indent.js");
const encoders_js_1 = require("./encoders.js");
const fs_js_1 = require("./fs.js");
const mustache_js_1 = require("./mustache.js");
const diff_js_1 = require("./diff.js");
const prompty_js_1 = require("./prompty.js");
const jinja_js_1 = require("./jinja.js");
const host_js_1 = require("./host.js");
const crypto_js_1 = require("./crypto.js");
const zod_js_1 = require("./zod.js");
const groq_js_1 = require("./groq.js");
const unwrappers_js_1 = require("./unwrappers.js");
const parameters_js_1 = require("./parameters.js");
const secretscanner_js_1 = require("./secretscanner.js");
const tools_js_1 = require("./tools.js");
const performance_js_1 = require("./performance.js");
const debug_1 = __importDefault(require("debug"));
const image_js_1 = require("./image.js");
const features_js_1 = require("./features.js");
const models_js_1 = require("./models.js");
const dbg = (0, debug_1.default)("genaiscript:prompt:dom");
const dbgMcp = (0, debug_1.default)("genaiscript:prompt:dom:mcp");
/**
 * Creates a text node with the specified value and optional context expansion options.
 *
 * @param value - The string value for the text node. Must not be undefined. Can be awaitable.
 * @param options - Configuration for context expansion. Optional.
 * @returns A text node object with the specified value and options.
 */
function createTextNode(value, options) {
    (0, assert_js_1.assert)(value !== undefined); // Ensure value is defined
    return { type: "text", value, ...(options || {}) };
}
/**
 * Converts a definition name to a reference name based on the fence format.
 *
 * @param name - The name of the definition. If null or empty, no conversion occurs.
 * @param options - Configuration options, including the desired fence format.
 *                  If the `fenceFormat` is "xml", the name is wrapped in XML-like tags.
 * @returns The converted reference name, wrapped in XML tags if applicable.
 */
function toDefRefName(name, options) {
    return name && options?.fenceFormat === "xml" ? `<${name}>` : name;
}
// Function to create a definition node.
function createDef(name, file, options) {
    name = name ?? "";
    const render = async () => {
        await (0, file_js_1.resolveFileContent)(file, options);
        const res = await (0, file_js_1.renderFileContent)(file, options);
        return res;
    };
    const value = render();
    return { type: "def", name, value, ...(options || {}) };
}
function cloneContextFields(n) {
    const r = {};
    r.maxTokens = n.maxTokens;
    r.priority = n.priority;
    r.flex = n.flex;
    r.cacheControl = n.cacheControl;
    return r;
}
/**
 * Creates a definition node representing a diff between two files or strings.
 *
 * @param name - The name of the diff node.
 * @param left - The left-hand input to compare, can be a string or a file.
 * @param right - The right-hand input to compare, can be a string or a file.
 * @param options - Additional options for rendering, tracing, and handling the diff node.
 * @returns A prompt definition node containing the diff results.
 */
function createDefDiff(name, left, right, options) {
    name = name ?? "";
    if (typeof left === "string")
        left = { filename: "", content: left };
    if (typeof right === "string")
        right = { filename: "", content: right };
    if (left?.content === undefined)
        left = { filename: "", content: (0, yaml_js_1.YAMLStringify)(left) };
    if (right?.content === undefined)
        right = { filename: "", content: (0, yaml_js_1.YAMLStringify)(right) };
    const render = async () => {
        await (0, file_js_1.resolveFileContent)(left, options);
        const l = await (0, file_js_1.renderFileContent)(left, options);
        await (0, file_js_1.resolveFileContent)(right, options);
        const r = await (0, file_js_1.renderFileContent)(right, options);
        return { filename: "", content: (0, diff_js_1.diffCreatePatch)(l, r) };
    };
    const value = render();
    return { type: "def", name, value, ...(options || {}) };
}
// Function to render a definition node to a string.
function renderDefNode(def) {
    const { name, resolved, language, lineNumbers, lineNumbersStart, schema, prediction } = def;
    const { filename, content = "" } = resolved;
    let fenceFormat = def.fenceFormat;
    const norm = (s, lang) => {
        let r = (s || "").replace(/\n*$/, "");
        if (r && lineNumbers && !prediction)
            r = (0, liner_js_1.addLineNumbers)(r, { language: lang, startLine: lineNumbersStart });
        if (r)
            r += "\n";
        return r;
    };
    const dtype = language || /\.([^.]+)$/i.exec(filename)?.[1] || "";
    let body = content;
    if (/^(c|t)sv$/i.test(dtype)) {
        const parsed = !/^\s*|/.test(content) && (0, csv_js_1.CSVTryParse)(content);
        if (parsed) {
            body = (0, csv_js_1.dataToMarkdownTable)(parsed);
            fenceFormat = "none";
        }
    }
    body = norm(body, dtype);
    const diffFormat = "";
    // body.length > 500 && !prediction
    //  ? " preferred_output_format=CHANGELOG"
    //    : ""
    let res;
    if (name && fenceFormat === "xml") {
        res = `\n<${name}${dtype ? ` lang="${dtype}"` : ""}${filename ? ` file="${filename}"` : ""}${schema ? ` schema=${schema}` : ""}${diffFormat}>\n${body}</${name}>\n`;
    }
    else if (fenceFormat === "none") {
        res = `\n${name ? name + ":\n" : ""}${body}\n`;
    }
    else {
        const fence = language === "markdown" || language === "mdx" ? constants_js_1.MARKDOWN_PROMPT_FENCE : constants_js_1.PROMPT_FENCE;
        let dfence = /\.mdx?$/i.test(filename) || content?.includes(fence) ? constants_js_1.MARKDOWN_PROMPT_FENCE : fence;
        while (dfence && body.includes(dfence)) {
            dfence += "`";
        }
        res =
            "\n" +
                (name ? name + ":\n" : "") +
                dfence +
                dtype +
                (filename ? ` file="${filename}"` : "") +
                (schema ? ` schema=${schema}` : "") +
                diffFormat +
                "\n" +
                body +
                dfence +
                "\n";
    }
    return res;
}
async function renderDefDataNode(n) {
    const { name, headers, priority, cacheControl, query } = n;
    let data = n.resolved;
    let format = n.format;
    if (!format &&
        Array.isArray(data) &&
        data.length &&
        (headers?.length || haveSameKeysAndSimpleValues(data)))
        format = "csv";
    else if (!format)
        format = "yaml";
    if (Array.isArray(data))
        data = (0, tidy_js_1.tidyData)(data, n);
    else if (typeof data === "object" && (n.sliceHead || n.sliceTail || n.sliceSample)) {
        const entries = Object.entries(data);
        const sliced = (0, tidy_js_1.sliceData)(entries, n);
        data = Object.fromEntries(sliced);
    }
    if (query)
        data = await (0, groq_js_1.GROQEvaluate)(query, data);
    let text;
    let lang;
    if (Array.isArray(data) && format === "csv") {
        text = (0, csv_js_1.dataToMarkdownTable)(data);
    }
    else if (format === "json") {
        text = JSON.stringify(data);
        lang = "json";
    }
    else {
        text = (0, yaml_js_1.YAMLStringify)(data);
        lang = "yaml";
    }
    const value = lang
        ? `<${name} lang="${lang}">
${(0, unwrappers_js_1.trimNewlines)(text)}
<${name}>
`
        : `${name}:
${(0, unwrappers_js_1.trimNewlines)(text)}
`;
    // TODO maxTokens does not work well with data
    return value;
}
/**
 * Creates a node representing an assistant message in a prompt.
 * @param value The content of the assistant message. Must be defined and resolvable.
 * @param options Optional settings for context expansion. Defaults to an empty object if not provided.
 * @returns The created assistant node.
 */
function createAssistantNode(value, options) {
    (0, assert_js_1.assert)(value !== undefined);
    return { type: "assistant", value, ...(options || {}) };
}
/**
 * Creates a system node with the specified content and optional context expansion settings.
 *
 * @param value - The content of the system node, which can be provided asynchronously. Must be defined.
 * @param options - Optional configuration for context expansion, including token limits and priority.
 * @returns A system node object containing the specified content and options.
 */
function createSystemNode(value, options) {
    (0, assert_js_1.assert)(value !== undefined);
    return { type: "system", value, ...(options || {}) };
}
/**
 * Creates a string template node with the given template strings, arguments, and optional settings.
 *
 * @param strings - The template literal strings to include in the node.
 * @param args - The arguments to interpolate into the template.
 * @param options - Optional settings for context expansion or additional properties to include in the node.
 * @returns The created string template node.
 */
function createStringTemplateNode(strings, args, options) {
    (0, assert_js_1.assert)(strings !== undefined);
    return {
        type: "stringTemplate",
        strings,
        args,
        transforms: [],
        ...(options || {}),
    };
}
/**
 * Creates an image node with the specified value and optional context expansion options.
 *
 * @param value - The image data or prompt used to create the node. Must not be null or undefined.
 * @param options - Optional context expansion options to include in the node.
 * @returns The created image node.
 */
function createImageNode(value, options) {
    (0, assert_js_1.assert)(value !== undefined);
    return { type: "image", value, ...(options || {}) };
}
function createFileImageNodes(name, file, defOptions, options) {
    const { trace, cancellationToken } = options || {};
    const filename = file.filename && !/^data:\/\//.test(file.filename) ? file.filename : undefined;
    return [
        name ? createTextNode(`<${name}${filename ? ` filename="${filename}"` : ``}>`) : undefined,
        createImageNode((async () => {
            const encoded = await (0, image_js_1.imageEncodeForLLM)(file, {
                ...(defOptions || {}),
                cancellationToken,
                trace,
            });
            return {
                filename: file.filename,
                ...encoded,
            };
        })()),
        name ? createTextNode(`</${name}>`) : undefined,
    ].filter((n) => !!n);
}
/**
 * Creates a schema node with a specified name, value, and optional configuration.
 *
 * Parameters:
 * - name: The name of the schema node. Must not be empty. Throws if empty.
 * - value: The schema definition or a Zod type to be converted to JSON Schema. Automatically converts Zod types if applicable. Must not be undefined. Throws if undefined.
 * - options: Optional configuration for the schema node.
 */
function createSchemaNode(name, value, options) {
    (0, assert_js_1.assert)(!!name);
    (0, assert_js_1.assert)(value !== undefined);
    // auto zod conversion
    value = (0, zod_js_1.tryZodToJsonSchema)(value) ?? value;
    return { type: "schema", name, value, options };
}
// Function to create a function node.
function createToolNode(name, description, parameters, impl, options, generator) {
    (0, assert_js_1.assert)(!!name);
    (0, assert_js_1.assert)(!!description);
    (0, assert_js_1.assert)(parameters !== undefined);
    (0, assert_js_1.assert)(impl !== undefined);
    return {
        type: "tool",
        name,
        description: (0, indent_js_1.dedent)(description),
        parameters,
        impl,
        options,
        generator,
    };
}
// Function to create a file merge node.
function createFileMerge(fn) {
    (0, assert_js_1.assert)(fn !== undefined);
    return { type: "fileMerge", fn };
}
/**
 * Creates and returns an output processor node with a specified handler function.
 *
 * @param fn - The handler function to process prompt outputs. Must not be undefined. Throws an error if undefined.
 * @returns An output processor node containing the handler function.
 */
function createOutputProcessor(fn) {
    (0, assert_js_1.assert)(fn !== undefined);
    return { type: "outputProcessor", fn };
}
/**
 * Creates a node representing a chat participant.
 * @param participant - The chat participant to represent in the node.
 * @returns A node object with the participant's details.
 */
function createChatParticipant(participant) {
    return { type: "chatParticipant", participant };
}
/**
 * Creates a file output node with the specified output.
 * @param output - The file output to include in the node.
 * @returns A file output node containing the specified output.
 */
function createFileOutput(output) {
    return { type: "fileOutput", output };
}
// Function to create an import template node.
function createImportTemplate(files, args, options) {
    (0, assert_js_1.assert)(!!files);
    return {
        type: "importTemplate",
        files,
        args: args || {},
        options,
    };
}
/**
 * Creates a node representing an MCP (Multiple Connection Protocol) server with specified configurations.
 *
 * @param id - Unique identifier for the MCP server.
 * @param config - Configuration object containing details necessary for the MCP server setup.
 * @param options - Optional additional parameters or settings for server configuration.
 * @returns An MCP server node configured with the provided details.
 */
function createMcpServer(id, config, options, generator) {
    return {
        type: "mcpServer",
        config: { ...config, generator, id, options },
    };
}
function createMcpClient(client) {
    return {
        type: "mcpServer",
        client,
    };
}
// Function to check if data objects have the same keys and simple values.
function haveSameKeysAndSimpleValues(data) {
    if (data.length === 0)
        return true;
    const headers = Object.entries(data[0]);
    return data.slice(1).every((obj) => {
        const keys = Object.entries(obj);
        return (headers.length === keys.length &&
            headers.every((h, i) => keys[i][0] === h[0] && /^(string|number|boolean|null|undefined)$/.test(typeof keys[i][1])));
    });
}
// Function to create a text node with data.
function createDefData(name, value, options) {
    if (value === undefined)
        return undefined;
    return {
        type: "defData",
        name,
        value,
        ...(options || {}),
    };
}
// Function to append a child node to a parent node.
function appendChild(parent, ...children) {
    if (!parent.children) {
        parent.children = [];
    }
    parent.children.push(...children);
}
// Function to visit nodes in the prompt tree.
async function visitNode(node, visitor) {
    await visitor.node?.(node);
    switch (node.type) {
        case "text":
            await visitor.text?.(node);
            break;
        case "def":
            await visitor.def?.(node);
            break;
        case "defData":
            await visitor.defData?.(node);
            break;
        case "image":
            await visitor.image?.(node);
            break;
        case "schema":
            await visitor.schema?.(node);
            break;
        case "tool":
            await visitor.tool?.(node);
            break;
        case "fileMerge":
            await visitor.fileMerge?.(node);
            break;
        case "outputProcessor":
            await visitor.outputProcessor?.(node);
            break;
        case "stringTemplate":
            await visitor.stringTemplate?.(node);
            break;
        case "assistant":
            await visitor.assistant?.(node);
            break;
        case "system":
            await visitor.system?.(node);
            break;
        case "chatParticipant":
            await visitor.chatParticipant?.(node);
            break;
        case "fileOutput":
            await visitor.fileOutput?.(node);
            break;
        case "importTemplate":
            await visitor.importTemplate?.(node);
            break;
        case "mcpServer":
            await visitor.mcpServer?.(node);
            break;
    }
    if (node.error)
        visitor.error?.(node);
    if (!node.error && !node.deleted && node.children) {
        for (const child of node.children) {
            await visitNode(child, visitor);
        }
        node.children = node.children?.filter((c) => !c.deleted);
    }
    await visitor.afterNode?.(node);
}
/**
 * Resolves and returns the default fence format.
 *
 * @param modelId - The identifier of the model. This parameter is currently unused.
 * @returns The default fence format.
 */
function resolveFenceFormat(modelId) {
    return constants_js_1.DEFAULT_FENCE_FORMAT;
}
// Function to resolve a prompt node.
async function resolvePromptNode(encoder, root, options) {
    const { trace } = options || {};
    let err = 0;
    const names = new Set();
    const uniqueName = (n_) => {
        let i = 1;
        let n = n_;
        while (names.has(n)) {
            n = `${n_}${i++}`;
        }
        names.add(n);
        return n;
    };
    await visitNode(root, {
        error: (node) => {
            (0, util_js_1.logError)(node.error);
            err++;
        },
        text: async (n) => {
            try {
                const value = await n.value;
                n.resolved = n.preview = value;
                n.tokens = (0, tokens_js_1.approximateTokens)(value);
            }
            catch (e) {
                n.error = e;
            }
        },
        def: async (n) => {
            try {
                names.add(n.name);
                const value = await n.value;
                n.resolved = value;
                n.resolved.content = (0, liner_js_1.extractRange)(n.resolved.content, n);
                const rendered = renderDefNode(n);
                n.preview = rendered;
                n.tokens = (0, tokens_js_1.approximateTokens)(rendered);
                n.children = [createTextNode(rendered, cloneContextFields(n))];
            }
            catch (e) {
                n.error = e;
            }
        },
        defData: async (n) => {
            try {
                names.add(n.name);
                const value = await n.value;
                n.resolved = value;
                const rendered = await renderDefDataNode(n);
                n.preview = rendered;
                n.tokens = (0, tokens_js_1.approximateTokens)(rendered);
                n.children = [createTextNode(rendered, cloneContextFields(n))];
            }
            catch (e) {
                n.error = e;
            }
        },
        system: async (n) => {
            try {
                const value = await n.value;
                n.resolved = n.preview = value;
                n.tokens = (0, tokens_js_1.approximateTokens)(value);
            }
            catch (e) {
                n.error = e;
            }
        },
        assistant: async (n) => {
            try {
                const value = await n.value;
                n.resolved = n.preview = value;
                n.tokens = (0, tokens_js_1.approximateTokens)(value);
            }
            catch (e) {
                n.error = e;
            }
        },
        stringTemplate: async (n) => {
            const { strings, args } = n;
            try {
                const resolvedStrings = await strings;
                const resolvedArgs = [];
                for (const arg of args) {
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        let ra = await arg;
                        if (typeof ra === "function")
                            ra = ra();
                        ra = await ra;
                        // Render files
                        if (typeof ra === "object") {
                            if (ra.filename) {
                                n.children = [
                                    ...(n.children ?? []),
                                    createDef(ra.filename, ra, {
                                        ignoreEmpty: true,
                                        maxTokens: constants_js_1.TEMPLATE_ARG_FILE_MAX_TOKENS,
                                    }),
                                ];
                                ra = ra.filename;
                            }
                            else if (
                            // env.files
                            Array.isArray(ra) &&
                                ra.every((r) => typeof r === "object" && r.filename)) {
                                // env.files
                                const fname = uniqueName("FILES");
                                n.children = n.children ?? [];
                                for (const r of ra) {
                                    n.children.push(createDef(fname, r, {
                                        ignoreEmpty: true,
                                        maxTokens: constants_js_1.TEMPLATE_ARG_FILE_MAX_TOKENS,
                                    }));
                                }
                                ra = fname;
                            }
                            else {
                                const dname = uniqueName("DATA");
                                n.children = [
                                    ...(n.children ?? []),
                                    createDefData(dname, ra, {
                                        sliceSample: constants_js_1.TEMPLATE_ARG_DATA_SLICE_SAMPLE,
                                    }),
                                ];
                                ra = dname;
                            }
                        }
                        resolvedArgs.push(ra ?? "");
                    }
                    catch (e) {
                        n.error = e;
                        resolvedArgs.push((0, error_js_1.errorMessage)(e));
                    }
                }
                let value = (0, indent_js_1.dedent)(resolvedStrings, ...resolvedArgs);
                if (n.transforms?.length)
                    for (const transform of n.transforms)
                        value = await transform(value);
                n.resolved = n.preview = value;
                n.tokens = (0, tokens_js_1.approximateTokens)(value);
            }
            catch (e) {
                n.error = e;
            }
        },
        importTemplate: async (n) => {
            try {
                const { files, args, options } = n;
                n.children = [];
                n.preview = "";
                const fs = await (0, fs_js_1.expandFileOrWorkspaceFiles)((0, cleaners_js_1.arrayify)(files));
                if (fs.length === 0)
                    throw new Error(`No files found for import: ${files}`);
                const resolvedArgs = {};
                for (const argkv of Object.entries(args || {})) {
                    // eslint-disable-next-line prefer-const
                    let [argk, argv] = argkv;
                    if (typeof argv === "function")
                        argv = argv();
                    resolvedArgs[argk] = await argv;
                }
                for (const f of fs) {
                    await (0, file_js_1.resolveFileContent)(f, {
                        ...(options || {}),
                        trace,
                    });
                    if (constants_js_1.PROMPTY_REGEX.test(f.filename))
                        await resolveImportPrompty(n, f, resolvedArgs, options);
                    else {
                        const rendered = await (0, mustache_js_1.interpolateVariables)(f.content, resolvedArgs, n.options);
                        n.children.push(createTextNode(rendered));
                        n.preview += rendered + "\n";
                    }
                }
                n.tokens = (0, tokens_js_1.approximateTokens)(n.preview);
            }
            catch (e) {
                n.error = e;
            }
        },
        image: async (n) => {
            try {
                const v = await n.value;
                n.resolved = v;
                n.preview = "image"; // TODO
            }
            catch (e) {
                n.error = e;
            }
        },
    });
    return { errors: err };
}
async function resolveImportPrompty(n, f, args, options) {
    const { allowExtraArguments } = options || {};
    const { messages, meta } = (0, prompty_js_1.promptyParse)(f.filename, f.content);
    const { parameters } = meta;
    args = args || {};
    const extra = Object.keys(args).find((arg) => !parameters?.[arg]);
    if (extra) {
        dbg(`extra argument ${extra} in ${f.filename}`);
        if (!allowExtraArguments) {
            const msg = `Extra input argument '${extra}'.`;
            throw new Error(msg);
        }
    }
    if (parameters) {
        const missings = Object.keys(parameters).filter((p) => args[p] === undefined);
        if (missings.length > 0)
            throw new Error(`Missing input argument for '${missings.join(", ")}' in ${f.filename}`);
    }
    for (const message of messages) {
        const txt = (0, jinja_js_1.jinjaRenderChatMessage)(message, args);
        if (message.role === "assistant")
            n.children.push(createAssistantNode(txt));
        else if (message.role === "system")
            n.children.push(createSystemNode(txt));
        else
            n.children.push(createTextNode(txt));
        n.preview += txt + "\n";
    }
}
// Function to handle truncation of prompt nodes based on token limits.
async function truncatePromptNode(encoder, node, options) {
    const { trace } = options || {};
    let truncated = false;
    const cap = (n) => {
        if (!n.error &&
            n.resolved !== undefined &&
            n.maxTokens !== undefined &&
            n.tokens > n.maxTokens) {
            n.resolved = n.preview = (0, tokens_js_1.truncateTextToTokens)(n.resolved, n.maxTokens, encoder, {
                tokens: n.tokens,
            });
            n.tokens = (0, tokens_js_1.approximateTokens)(n.resolved);
            truncated = true;
            trace?.log(`truncated text to ${n.tokens} tokens (max ${n.maxTokens})`);
        }
    };
    const capDef = (n) => {
        if (!n.error &&
            n.resolved !== undefined &&
            n.maxTokens !== undefined &&
            n.tokens > n.maxTokens) {
            n.resolved.content = (0, tokens_js_1.truncateTextToTokens)(n.resolved.content, n.maxTokens, encoder, {
                tokens: n.tokens,
            });
            n.tokens = (0, tokens_js_1.approximateTokens)(n.resolved.content);
            const rendered = renderDefNode(n);
            n.preview = rendered;
            n.children = [createTextNode(rendered, cloneContextFields(n))];
            truncated = true;
            trace?.log(`truncated def ${n.name} to ${n.tokens} tokens (max ${n.maxTokens})`);
        }
    };
    await visitNode(node, {
        text: cap,
        assistant: cap,
        stringTemplate: cap,
        def: capDef,
    });
    return truncated;
}
// Function to adjust token limits for nodes with flexibility.
async function flexPromptNode(root, options) {
    const PRIORITY_DEFAULT = 0;
    const { trace, flexTokens } = options || {};
    let log = "";
    // Collect all nodes
    const nodes = [];
    await visitNode(root, {
        node: (n) => {
            nodes.push(n);
        },
    });
    const totalTokens = nodes.reduce((total, node) => total + (node.tokens ?? 0), 0);
    if (totalTokens <= flexTokens) {
        // No need to flex
        return;
    }
    // Inspired from priompt, prompt-tsx, gpt-4
    // Sort by priority
    nodes.sort((a, b) => (a.priority ?? PRIORITY_DEFAULT) - (b.priority ?? PRIORITY_DEFAULT));
    const flexNodes = nodes.filter((n) => n.flex !== undefined);
    const totalFlexTokens = flexNodes.reduce((total, node) => total + (node.tokens ?? 0), 0);
    // checking flexNodes sizes
    if (totalFlexTokens <= flexTokens) {
        return;
    }
    const totalFlex = flexNodes.reduce((total, node) => total + node.flex, 0);
    const totalReserve = 0;
    const totalRemaining = Math.max(0, flexTokens - totalReserve);
    for (const node of flexNodes) {
        const proportion = node.flex / totalFlex;
        const tokenBudget = Math.min(node.maxTokens ?? Infinity, Math.floor(totalRemaining * proportion));
        node.maxTokens = tokenBudget;
        log += `- flexed ${node.type} ${node.name || ""} to ${tokenBudget} tokens\n`;
    }
    if (log)
        trace?.details(`flexing`, log);
}
// Function to trace the prompt node structure for debugging.
async function tracePromptNode(trace, root, options) {
    if (!trace || !root.children?.length)
        return;
    await visitNode(root, {
        node: (n) => {
            const error = (0, error_js_1.errorMessage)(n.error);
            let title = (0, util_js_1.toStringList)(n.type || `🌳 promptdom ${options?.label || ""}`, n.priority ? `#${n.priority}` : undefined);
            const value = (0, util_js_1.toStringList)(n.tokens ? `${n.tokens}${n.maxTokens ? `/${n.maxTokens}` : ""}t` : undefined, error);
            if (value.length > 0)
                title += `: ${value}`;
            if (n.children?.length || n.preview) {
                trace?.startDetails(title, {
                    success: n.error ? false : undefined,
                });
                if (n.preview)
                    trace?.fence((0, util_js_1.ellipse)(n.preview, constants_js_1.PROMPTDOM_PREVIEW_MAX_LENGTH), "markdown");
            }
            else
                trace?.resultItem(!n.error, title);
            if (n.error)
                trace?.error(undefined, n.error);
        },
        afterNode: (n) => {
            if (n.children?.length || n.preview)
                trace?.endDetails();
        },
    });
}
async function validateSafetyPromptNode(trace, root) {
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    let mod = false;
    let _contentSafety;
    const resolveContentSafety = async () => {
        if (!_contentSafety)
            _contentSafety = (await runtimeHost.contentSafety(undefined, {
                trace,
            })) || { id: undefined };
        return _contentSafety.detectPromptInjection;
    };
    await visitNode(root, {
        def: async (n) => {
            if (!n.detectPromptInjection || !n.resolved?.content)
                return;
            const detectPromptInjectionFn = await resolveContentSafety();
            if ((!detectPromptInjectionFn && n.detectPromptInjection === true) ||
                n.detectPromptInjection === "always")
                throw new Error("content safety service not available");
            const { attackDetected } = (await detectPromptInjectionFn?.(n.resolved)) || {};
            if (attackDetected) {
                mod = true;
                n.resolved = {
                    filename: n.resolved.filename,
                    content: constants_js_1.SANITIZED_PROMPT_INJECTION,
                };
                n.preview = constants_js_1.SANITIZED_PROMPT_INJECTION;
                n.children = [];
                n.error = `safety: prompt injection detected`;
                trace?.error(`safety: prompt injection detected in ${n.resolved.filename}`);
            }
        },
        defData: async (n) => {
            if (!n.detectPromptInjection || !n.preview)
                return;
            const detectPromptInjectionFn = await resolveContentSafety();
            if ((!detectPromptInjectionFn && n.detectPromptInjection === true) ||
                n.detectPromptInjection === "always")
                throw new Error("content safety service not available");
            const { attackDetected } = (await detectPromptInjectionFn?.(n.preview)) || {};
            if (attackDetected) {
                mod = true;
                n.children = [];
                n.preview = constants_js_1.SANITIZED_PROMPT_INJECTION;
                n.error = `safety: prompt injection detected`;
                trace?.error(`safety: prompt injection detected in data`);
            }
        },
    });
    return mod;
}
async function deduplicatePromptNode(trace, root) {
    let mod = false;
    const defs = new Set();
    await visitNode(root, {
        def: async (n) => {
            const key = await (0, crypto_js_1.hash)(n);
            if (defs.has(key)) {
                trace?.log(`duplicate definition and content: ${n.name}`);
                n.deleted = true;
                mod = true;
            }
            else {
                defs.add(key);
            }
        },
        defData: async (n) => {
            const key = await (0, crypto_js_1.hash)(n);
            if (defs.has(key)) {
                trace?.log(`duplicate definition and content: ${n.name}`);
                n.deleted = true;
                mod = true;
            }
            else {
                defs.add(key);
            }
        },
    });
    return mod;
}
/**
 * Main function to render a prompt node.
 *
 * Resolves, deduplicates, flexes, truncates, and validates the prompt node.
 * Handles various node types including text, system, assistant, schemas, tools, images, file merges, outputs, chat participants, MCP servers, and more.
 * Supports tracing, safety validation, token management, and MCP server integration.
 *
 * Parameters:
 * - modelId: Identifier for the model.
 * - node: The prompt node to render.
 * - options: Optional configurations for model templates, tracing, cancellation, token flexibility, and MCP server handling.
 *
 * Returns:
 * - A rendered prompt node with associated metadata, messages, resources, tools, errors, disposables, schemas, images, file outputs, and prediction.
 */
async function renderPromptNode(modelId, node, options) {
    const { trace, flexTokens } = options || {};
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const { encode: encoder } = await (0, encoders_js_1.resolveTokenEncoder)(modelId);
    let m = (0, performance_js_1.measure)("prompt.dom.resolve");
    await resolvePromptNode(encoder, node, options);
    await tracePromptNode(trace, node);
    m();
    m = (0, performance_js_1.measure)("prompt.dom.deduplicate");
    if (await deduplicatePromptNode(trace, node))
        await tracePromptNode(trace, node, { label: "deduplicate" });
    m();
    m = (0, performance_js_1.measure)("prompt.dom.flex");
    if (flexTokens)
        await flexPromptNode(node, {
            ...options,
            flexTokens,
        });
    m();
    m = (0, performance_js_1.measure)("prompt.dom.truncate");
    const truncated = await truncatePromptNode(encoder, node, options);
    if (truncated)
        await tracePromptNode(trace, node, { label: "truncated" });
    m();
    m = (0, performance_js_1.measure)("prompt.dom.validate");
    const safety = await validateSafetyPromptNode(trace, node);
    if (safety)
        await tracePromptNode(trace, node, { label: "safety" });
    m();
    const messages = [];
    const appendSystem = (content, options) => (0, chat_js_1.appendSystemMessage)(messages, content, options);
    const appendUser = (content, options) => (0, chat_js_1.appendUserMessage)(messages, content, options);
    const appendAssistant = (content, options) => (0, chat_js_1.appendAssistantMessage)(messages, content, options);
    const images = [];
    const errors = [];
    const schemas = {};
    const tools = [];
    const fileMerges = [];
    const outputProcessors = [];
    const chatParticipants = [];
    const fileOutputs = [];
    const mcpServerConfigs = [];
    const mcpClients = [];
    const disposables = [];
    let prediction;
    m = (0, performance_js_1.measure)("prompt.dom.render");
    await visitNode(node, {
        error: (n) => {
            errors.push(n.error);
        },
        text: async (n) => {
            if (n.resolved !== undefined)
                appendUser(n.resolved, n);
            else if (typeof n.value === "string")
                appendUser(n.value, n);
        },
        def: async (n) => {
            const value = n.resolved;
            if (value !== undefined) {
                if (n.prediction) {
                    if (prediction)
                        n.error = "duplicate prediction";
                    else
                        prediction = {
                            type: "content",
                            content: (0, liner_js_1.extractRange)(value.content, n),
                        };
                }
            }
        },
        assistant: async (n) => {
            const value = await n.resolved;
            if (value != undefined)
                appendAssistant(value, n);
        },
        system: async (n) => {
            const value = await n.resolved;
            if (value != undefined)
                appendSystem(value, n);
        },
        stringTemplate: async (n) => {
            const value = n.resolved;
            const role = n.role || "user";
            if (value != undefined) {
                if (role === "system")
                    appendSystem(value, n);
                else if (role === "assistant")
                    appendAssistant(value, n);
                else
                    appendUser(value, n);
            }
        },
        image: async (n) => {
            const value = n.resolved;
            if (value?.url) {
                images.push(value);
                appendUser(value, n);
            }
        },
        schema: (n) => {
            const { name: schemaName, value: schema, options } = n;
            if (schemas[schemaName])
                trace?.error("duplicate schema name: " + schemaName);
            schemas[schemaName] = schema;
            const { format = constants_js_1.SCHEMA_DEFAULT_FORMAT } = options || {};
            let schemaText;
            switch (format) {
                case "json":
                    schemaText = JSON.stringify(schema, null, 2);
                    break;
                case "yaml":
                    schemaText = (0, yaml_js_1.YAMLStringify)(schema);
                    break;
                default:
                    schemaText = (0, schema_js_1.JSONSchemaStringifyToTypeScript)(schema, {
                        typeName: schemaName,
                    });
                    break;
            }
            const text = `<${schemaName} lang="${format}-schema">
${(0, unwrappers_js_1.trimNewlines)(schemaText)}
</${schemaName}>`;
            appendUser(text, n);
            n.tokens = (0, tokens_js_1.approximateTokens)(text);
            if (trace && format !== "json")
                trace?.detailsFenced(`🧬 schema ${schemaName} as ${format}`, schemaText, format);
        },
        tool: (n) => {
            const { description, parameters, impl: fn, options, generator } = n;
            const { variant, variantDescription } = options || {};
            const name = (0, tools_js_1.escapeToolName)(variant ? `${n.name}_${variant}` : n.name);
            tools.push({
                spec: {
                    name,
                    description: variantDescription || description,
                    parameters,
                },
                generator,
                impl: fn,
                options,
            });
            trace?.detailsFenced(`🛠️ tool ${name}`, { description, parameters }, "yaml");
        },
        fileMerge: (n) => {
            fileMerges.push(n.fn);
            trace?.itemValue(`file merge`, n.fn);
        },
        outputProcessor: (n) => {
            outputProcessors.push(n.fn);
            trace?.itemValue(`output processor`, n.fn.name);
        },
        chatParticipant: (n) => {
            chatParticipants.push(n.participant);
            trace?.itemValue(`chat participant`, n.participant.options?.label || n.participant.generator.name);
        },
        fileOutput: (n) => {
            fileOutputs.push(n.output);
            trace?.itemValue(`file output`, n.output.pattern);
        },
        mcpServer: (n) => {
            if (n.config) {
                mcpServerConfigs.push(n.config);
                trace?.itemValue(`mcp server`, n.config.id);
            }
            if (n.client) {
                mcpClients.push(n.client);
                trace?.itemValue(`mcp client`, n.client.config.id);
            }
        },
    });
    if (mcpServerConfigs.length) {
        for (const mcpServer of mcpServerConfigs) {
            dbgMcp(`starting server ${mcpServer.id}`);
            const res = await runtimeHost.mcp.startMcpServer(mcpServer, {
                trace,
            });
            disposables.push(res);
            const mcpTools = await res.listToolCallbacks();
            dbgMcp(`tools %O`, mcpTools?.map((t) => t.spec.name));
            tools.push(...mcpTools);
        }
    }
    if (mcpClients.length) {
        for (const mcpClient of mcpClients) {
            dbgMcp(`using client ${mcpClient.config.id}`);
            const mcpTools = await mcpClient.listToolCallbacks();
            dbgMcp(`tools %O`, mcpTools?.map((t) => t.spec.name));
            tools.push(...mcpTools);
        }
    }
    m();
    const res = Object.freeze({
        images,
        schemas,
        tools,
        fileMerges,
        outputProcessors,
        chatParticipants,
        errors,
        messages,
        fileOutputs,
        prediction,
        disposables,
    });
    dbg(`${res.messages.length} messages, tools: %o`, res.tools.map((t) => t.spec.name));
    return res;
}
/**
 * Finalizes chat messages for processing.
 *
 * @param messages - The list of chat messages to finalize.
 * @param options - Additional configuration options.
 *   - fileOutputs: Rules for generating file outputs, described as pattern-description pairs.
 *   - responseType: The type of response expected (e.g., JSON, YAML).
 *   - responseSchema: Schema for validating or generating response objects.
 *   - trace: Object for logging trace information during processing.
 *   - secretScanning: Whether to run secret scanning on the messages to redact sensitive information.
 *
 * Adds system messages for file generation rules and response schema if specified.
 * Validates and adjusts chat messages based on schema requirements.
 * Scans and redacts secrets from messages when enabled.
 *
 * @returns An object containing response type and schema details.
 */
function finalizeMessages(model, messages, options) {
    dbg(`finalize messages for ${model}`);
    const m = (0, performance_js_1.measure)("prompt.dom.finalize");
    const { fileOutputs, trace, secretScanning } = options || {};
    if (fileOutputs?.length > 0) {
        (0, chat_js_1.appendSystemMessage)(messages, `
## File generation rules

When generating files, use the following rules which are formatted as "file glob: description":

${fileOutputs.map((fo) => `   ${fo.pattern}: ${fo.description || "generated file"}`)}
`);
    }
    const responseSchema = (0, parameters_js_1.promptParametersSchemaToJSONSchema)(options.responseSchema);
    let responseType = options.responseType;
    if (responseSchema && !responseType && responseType !== "json_schema") {
        const { provider } = (0, models_js_1.parseModelIdentifier)(model);
        const features = (0, features_js_1.providerFeatures)(provider);
        responseType = features?.responseType || "json";
        dbg(`response type: %s (auto)`, responseType);
    }
    if (responseType)
        trace?.itemValue(`response type`, responseType);
    if (responseSchema) {
        trace?.detailsFenced("📜 response schema", responseSchema);
        if (responseType !== "json_schema") {
            const typeName = "Output";
            const schemaTs = (0, schema_js_1.JSONSchemaStringifyToTypeScript)(responseSchema, {
                typeName,
            });
            (0, chat_js_1.appendSystemMessage)(messages, `## Output Schema
You are a service that translates user requests 
into ${responseType === "yaml" ? "YAML" : "JSON"} objects of type "${typeName}" 
according to the following TypeScript definitions:
<${typeName}>
${schemaTs}
</${typeName}>`);
        }
    }
    if (secretScanning !== false) {
        // this is a bit brutal, but we don't want to miss secrets
        // hidden in fields
        const secrets = (0, secretscanner_js_1.redactSecrets)(JSON.stringify(messages), { trace });
        if (Object.keys(secrets.found).length) {
            const newMessage = JSON.parse(secrets.text);
            messages.splice(0, messages.length, ...newMessage);
        }
    }
    m();
    return {
        responseType,
        responseSchema,
    };
}
//# sourceMappingURL=promptdom.js.map