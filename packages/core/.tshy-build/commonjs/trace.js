"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownTrace = exports.TraceChunkEvent = void 0;
const constants_js_1 = require("./constants.js");
const yaml_1 = require("yaml");
const yaml_js_1 = require("./yaml.js");
const error_js_1 = require("./error.js");
const host_js_1 = require("./host.js");
const util_js_1 = require("./util.js");
const precision_js_1 = require("./precision.js");
const mkmd_js_1 = require("./mkmd.js");
const htmlescape_js_1 = require("./htmlescape.js");
const node_path_1 = require("node:path");
const node_url_1 = require("node:url");
const indent_js_1 = require("./indent.js");
const csv_js_1 = require("./csv.js");
const ini_js_1 = require("./ini.js");
const traceparser_js_1 = require("./traceparser.js");
const filecache_js_1 = require("./filecache.js");
const id_js_1 = require("./id.js");
const diff_js_1 = require("./diff.js");
const pretty_js_1 = require("./pretty.js");
const strict_1 = __importDefault(require("node:assert/strict"));
const utf8_js_1 = require("./utf8.js");
class TraceChunkEvent extends Event {
    chunk;
    inner;
    progress;
    constructor(chunk, inner, progress) {
        super(constants_js_1.TRACE_CHUNK);
        this.chunk = chunk;
        this.inner = inner;
        this.progress = progress;
        (0, strict_1.default)(typeof chunk === "string", `chunk must be a string, got ${typeof chunk}`);
    }
    clone() {
        const ev = new TraceChunkEvent(this.chunk, this.inner, this.progress);
        return ev;
    }
}
exports.TraceChunkEvent = TraceChunkEvent;
class MarkdownTrace extends EventTarget {
    options;
    _errors = [];
    detailsDepth = 0;
    _content = [];
    _tree;
    constructor(options) {
        super();
        this.options = options;
        this.options = options || {};
    }
    disableChangeDispatch = 0;
    dispatchChange() {
        if (!this.disableChangeDispatch)
            this.dispatchEvent(new Event(constants_js_1.CHANGE));
    }
    get tree() {
        if (!this._tree)
            this._tree = (0, traceparser_js_1.parseTraceTree)(this.content, { parseItems: true });
        return this._tree;
    }
    get content() {
        return this._content
            .map((c) => (typeof c === "string" ? c : c.content))
            .join("")
            .replace(/(\r?\n){3,}/g, "\n\n");
    }
    startTraceDetails(title, options) {
        const trace = new MarkdownTrace({ ...this.options });
        trace.addEventListener(constants_js_1.TRACE_CHUNK, (ev) => this.dispatchEvent(ev.clone()));
        trace.addEventListener(constants_js_1.TRACE_DETAILS, () => this.dispatchEvent(new Event(constants_js_1.TRACE_DETAILS)));
        trace.startDetails(title, options);
        this._content.push(trace);
        return trace;
    }
    chatProgress(progress) {
        const { inner, responseChunk, reasoningChunk } = progress;
        if (!responseChunk && !reasoningChunk)
            return;
        if (!inner && responseChunk) {
            this._content.push(responseChunk);
            this._tree = undefined;
            this.dispatchChange();
        }
        if (responseChunk)
            this.dispatchEvent(new TraceChunkEvent(responseChunk, inner, progress));
    }
    appendContent(value) {
        if (value !== undefined && value !== null && value !== "") {
            if (typeof value !== "string")
                this.fence(value, "json");
            else {
                this._content.push(value);
                this._tree = undefined;
                this.dispatchChange();
                this.dispatchEvent(new TraceChunkEvent(value, false));
            }
        }
    }
    appendToken(content) {
        if (!content)
            return;
        this.appendContent(content.includes("`")
            ? `\`\`\` ${content.replace(/\r?\n/g, " ")} \`\`\` `
            : `\`${content.replace(/\r?\n/g, " ")}\` `);
    }
    diff(left, right, options) {
        const d = (0, diff_js_1.diffCreatePatch)(left, right, options);
        this.fence(d, "diff");
    }
    /**
     * Logs a markdown table
     * @param rows
     */
    table(rows, options) {
        if (!rows?.length)
            return;
        const md = (0, csv_js_1.dataToMarkdownTable)(rows, options);
        this.appendContent(`\n\n${md}\n\n`);
    }
    startDetails(title, options) {
        const { success, expanded } = options || {};
        this.detailsDepth++;
        title = title?.trim() || "";
        this.appendContent(`\n\n<details class="${constants_js_1.TOOL_ID}"${expanded ? ` open="true"` : ""}>
<summary>
${this.toResultIcon(success, "")}${title}
</summary>

`);
    }
    endDetails() {
        if (this.detailsDepth > 0) {
            this.detailsDepth--;
            this.appendContent(`\n</details>\n\n`);
            this.dispatchEvent(new Event(constants_js_1.TRACE_DETAILS));
        }
    }
    disableChange(f) {
        try {
            this.disableChangeDispatch++;
            f();
        }
        finally {
            this.disableChangeDispatch--;
            this.dispatchChange();
        }
    }
    video(name, filepath, alt) {
        const url = (0, node_url_1.pathToFileURL)((0, node_path_1.resolve)(filepath));
        this.appendContent((0, indent_js_1.dedent) `
            -   ${name}
            
            <video src="${url.href}" title="${(0, htmlescape_js_1.HTMLEscape)(name)}" aria-label="${(0, htmlescape_js_1.HTMLEscape)(alt || name)}" controls="true"></video>
            
            `);
    }
    audio(name, filepath, alt) {
        const url = (0, node_url_1.pathToFileURL)((0, node_path_1.resolve)(filepath));
        this.appendContent((0, indent_js_1.dedent) `
            -   ${name}
            
            <audio src="${url.href}" title="${(0, htmlescape_js_1.HTMLEscape)(name)}" aria-label="${(0, htmlescape_js_1.HTMLEscape)(alt || name)}" controls="true"></audio>
            
            `);
    }
    file(file) {
        const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
        const { content, filename } = file;
        if (!content) {
            this.itemValue(filename, "no content");
        }
        else {
            this.item(filename);
            const ext = (0, node_path_1.extname)(filename).slice(1);
            this.fence((0, util_js_1.ellipse)(content, constants_js_1.TRACE_MAX_FILE_SIZE), ext);
        }
    }
    details(title, body, options) {
        this.disableChange(() => {
            this.startDetails(title, options);
            if (body) {
                if (typeof body === "string")
                    this.appendContent(body);
                else
                    this.appendContent((0, yaml_1.stringify)(body));
            }
            this.endDetails();
        });
    }
    detailsFenced(title, body, contentType, options) {
        this.disableChange(() => {
            this.startDetails(title, options);
            this.fence(body, contentType);
            this.endDetails();
        });
    }
    item(message) {
        if (!message)
            return;
        this.appendContent(`-   ${message}\n`);
    }
    p(text) {
        if (!text)
            return;
        this.appendContent(`\n\n${text}\n\n`);
    }
    itemLink(name, url, title) {
        if (!name)
            return;
        const urlStr = typeof url === "string" ? url : url?.toString();
        if (!urlStr)
            this.item(`<${name}>`);
        else
            this.item(`[${name}${title ? ` "${title}"` : ""}](${urlStr})`);
    }
    itemValue(name, value, unit) {
        if (value === undefined || (typeof value === "number" && isNaN(value)))
            return;
        if (typeof value === "function")
            this.item(`${name}: ${value.name || "anonymous"}`);
        else if (typeof value === "object" || Array.isArray(value)) {
            const txt = (0, yaml_js_1.YAMLStringify)(value);
            if (txt.includes("\n")) {
                this.item(`${name}:`);
                this.fence((0, yaml_js_1.YAMLStringify)(value));
            }
            else
                this.item(`${name}: ${txt}`);
        }
        else
            this.item(`${name}: ${value}${unit ?? ""}`);
    }
    log(message) {
        this.fence(message ?? "");
    }
    startFence(language) {
        this.appendContent(`\n\`\`\`\`${language}\n`);
    }
    endFence() {
        this.appendContent("\n````\n");
    }
    fence(message, contentType) {
        if (message === undefined || message === null || message === "")
            return;
        if (contentType === "markdown")
            contentType = "md";
        if (contentType === "md" && Array.isArray(message)) {
            this.appendContent((0, csv_js_1.dataToMarkdownTable)(message));
            return;
        }
        let res;
        if (typeof message !== "string") {
            if (contentType === "json") {
                res = JSON.stringify(message, null, 2);
            }
            else if (contentType === "ini") {
                res = (0, ini_js_1.INIStringify)(message);
            }
            else if (contentType === "csv") {
                res = (0, csv_js_1.CSVStringify)(Array.isArray(message) ? message : [message], { header: true });
            }
            else {
                res = (0, yaml_1.stringify)(message);
                contentType = "yaml";
            }
        }
        else
            res = message;
        if (res.length > constants_js_1.TRACE_MAX_FENCE_SIZE) {
            const fn = `${(0, id_js_1.generateId)()}.${contentType || "txt"}`;
            res = (0, util_js_1.ellipse)(res, constants_js_1.TRACE_MAX_FENCE_SIZE);
        }
        this.appendContent((0, mkmd_js_1.fenceMD)(res, contentType));
    }
    tip(message) {
        this.appendContent(`> ${message}\n`);
    }
    heading(level, message) {
        this.appendContent(`\n\n${"#".repeat(level)} ${message}\n\n`);
    }
    async image(urlOrImage, caption) {
        const imageUrl = await (0, filecache_js_1.fileCacheImage)(urlOrImage, {
            trace: this,
            ...this.options,
        });
        if (!imageUrl)
            return;
        return this.appendContent(`\n\n![${caption || ""}](${imageUrl})\n\n`);
    }
    toResultIcon(value, missing) {
        return value === true ? constants_js_1.EMOJI_SUCCESS : value === false ? constants_js_1.EMOJI_FAIL : missing;
    }
    resultItem(value, message) {
        this.item(`${this.toResultIcon(value, constants_js_1.EMOJI_UNDEFINED)} ${message}`);
    }
    error(message, error) {
        this.disableChange(() => {
            const err = {
                message,
                error: (0, error_js_1.serializeError)(error),
            };
            this._errors.push(err);
            this.renderError(err, { details: true });
        });
    }
    get errors() {
        const traces = this._content.filter((c) => typeof c !== "string");
        return this._errors.concat(...traces.map((t) => t.errors));
    }
    renderErrors() {
        while (this.detailsDepth > 0)
            this.endDetails();
        const errors = this.errors || [];
        if (errors.length) {
            this.disableChange(() => {
                try {
                    this.startDetails(`${constants_js_1.EMOJI_FAIL} Errors`);
                    errors.forEach((e) => this.renderError(e, { details: true }));
                }
                finally {
                    this.endDetails();
                }
            });
        }
    }
    renderError(e, options) {
        const { message, error } = e;
        const emsg = (0, error_js_1.errorMessage)(error);
        const msg = [message, emsg].filter((m) => m).join(", ");
        this.disableChange(() => {
            this.item(msg);
            if (options.details && error?.stack) {
                this.appendContent(`> \`\`\`\`\`\`\`markdown`);
                this.appendContent(error.stack
                    .split(/\n/g)
                    .map((line) => `> ${line}`)
                    .join("\n"));
                this.appendContent(`\n> \`\`\`\`\`\`\`\n`);
            }
        });
    }
    warn(msg) {
        this.appendContent(`\n> [!WARNING]
> ${msg}\n`);
    }
    caution(msg) {
        this.appendContent(`\n> [!CAUTION]
> ${msg}\n`);
    }
    note(msg) {
        this.appendContent(`\n> [!NOTE]
> ${msg}\n`);
    }
    files(files, options) {
        const { model, maxLength, title, skipIfEmpty, secrets = {} } = options || {};
        if (skipIfEmpty && !files.length)
            return;
        this.disableChange(() => {
            try {
                if (title)
                    this.startDetails(title);
                if (model)
                    this.itemValue("model", model);
                const encoder = (0, utf8_js_1.createUTF8Encoder)();
                for (const file of files) {
                    const score = !isNaN(file.score)
                        ? `score: ${(0, precision_js_1.renderWithPrecision)(file.score || 0, 2)}`
                        : undefined;
                    let size;
                    let content;
                    if (file.encoding) {
                        size = (0, pretty_js_1.prettyBytes)(file.size ?? Buffer.from(file.content, file.encoding).length);
                    }
                    else {
                        content = file.content ?? "";
                        size = (0, pretty_js_1.prettyBytes)(file.size ?? encoder.encode(content).length);
                    }
                    const suffix = (0, util_js_1.toStringList)(size, score);
                    if (content && maxLength > 0) {
                        let preview = (0, util_js_1.ellipse)(content, maxLength).replace(/\b[A-Za-z0-9\-_]{20,40}\b/g, (m) => m.slice(0, 10) + "***");
                        for (const secret of Object.values(secrets))
                            preview = preview.replaceAll(secret, secret.slice(0, 3) + "*".repeat(secret.length - 3));
                        this.detailsFenced(`<code>${file.filename}</code>: ${suffix}`, preview, "text");
                    }
                    else
                        this.itemValue(`\`${file.filename}\``, (0, util_js_1.toStringList)(size, score));
                }
            }
            finally {
                if (title)
                    this.endDetails();
            }
        });
    }
}
exports.MarkdownTrace = MarkdownTrace;
//# sourceMappingURL=trace.js.map