// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { CHANGE, EMOJI_FAIL, EMOJI_SUCCESS, EMOJI_UNDEFINED, TOOL_ID, TRACE_CHUNK, TRACE_DETAILS, TRACE_MAX_FENCE_SIZE, TRACE_MAX_FILE_SIZE, } from "./constants.js";
import { stringify as yamlStringify } from "yaml";
import { YAMLStringify } from "./yaml.js";
import { errorMessage, serializeError } from "./error.js";
import { host } from "./host.js";
import { ellipse, toStringList } from "./util.js";
import { renderWithPrecision } from "./precision.js";
import { fenceMD } from "./mkmd.js";
import { HTMLEscape } from "./htmlescape.js";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { dedent } from "./indent.js";
import { CSVStringify, dataToMarkdownTable } from "./csv.js";
import { INIStringify } from "./ini.js";
import { parseTraceTree } from "./traceparser.js";
import { fileCacheImage } from "./filecache.js";
import { generateId } from "./id.js";
import { diffCreatePatch } from "./diff.js";
import { prettyBytes } from "./pretty.js";
import assert from "node:assert/strict";
export class TraceChunkEvent extends Event {
    chunk;
    inner;
    progress;
    constructor(chunk, inner, progress) {
        super(TRACE_CHUNK);
        this.chunk = chunk;
        this.inner = inner;
        this.progress = progress;
        assert(typeof chunk === "string", `chunk must be a string, got ${typeof chunk}`);
    }
    clone() {
        const ev = new TraceChunkEvent(this.chunk, this.inner, this.progress);
        return ev;
    }
}
export class MarkdownTrace extends EventTarget {
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
            this.dispatchEvent(new Event(CHANGE));
    }
    get tree() {
        if (!this._tree)
            this._tree = parseTraceTree(this.content, { parseItems: true });
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
        trace.addEventListener(TRACE_CHUNK, (ev) => this.dispatchEvent(ev.clone()));
        trace.addEventListener(TRACE_DETAILS, () => this.dispatchEvent(new Event(TRACE_DETAILS)));
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
        const d = diffCreatePatch(left, right, options);
        this.fence(d, "diff");
    }
    /**
     * Logs a markdown table
     * @param rows
     */
    table(rows, options) {
        if (!rows?.length)
            return;
        const md = dataToMarkdownTable(rows, options);
        this.appendContent(`\n\n${md}\n\n`);
    }
    startDetails(title, options) {
        const { success, expanded } = options || {};
        this.detailsDepth++;
        title = title?.trim() || "";
        this.appendContent(`\n\n<details class="${TOOL_ID}"${expanded ? ` open="true"` : ""}>
<summary>
${this.toResultIcon(success, "")}${title}
</summary>

`);
    }
    endDetails() {
        if (this.detailsDepth > 0) {
            this.detailsDepth--;
            this.appendContent(`\n</details>\n\n`);
            this.dispatchEvent(new Event(TRACE_DETAILS));
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
        const url = pathToFileURL(resolve(filepath));
        this.appendContent(dedent `
            -   ${name}
            
            <video src="${url.href}" title="${HTMLEscape(name)}" aria-label="${HTMLEscape(alt || name)}" controls="true"></video>
            
            `);
    }
    audio(name, filepath, alt) {
        const url = pathToFileURL(resolve(filepath));
        this.appendContent(dedent `
            -   ${name}
            
            <audio src="${url.href}" title="${HTMLEscape(name)}" aria-label="${HTMLEscape(alt || name)}" controls="true"></audio>
            
            `);
    }
    file(file) {
        const { content, filename } = file;
        if (!content) {
            this.itemValue(filename, "no content");
        }
        else {
            this.item(filename);
            const ext = host.path.extname(filename).slice(1);
            this.fence(ellipse(content, TRACE_MAX_FILE_SIZE), ext);
        }
    }
    details(title, body, options) {
        this.disableChange(() => {
            this.startDetails(title, options);
            if (body) {
                if (typeof body === "string")
                    this.appendContent(body);
                else
                    this.appendContent(yamlStringify(body));
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
            const txt = YAMLStringify(value);
            if (txt.includes("\n")) {
                this.item(`${name}:`);
                this.fence(YAMLStringify(value));
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
            this.appendContent(dataToMarkdownTable(message));
            return;
        }
        let res;
        if (typeof message !== "string") {
            if (contentType === "json") {
                res = JSON.stringify(message, null, 2);
            }
            else if (contentType === "ini") {
                res = INIStringify(message);
            }
            else if (contentType === "csv") {
                res = CSVStringify(Array.isArray(message) ? message : [message], { header: true });
            }
            else {
                res = yamlStringify(message);
                contentType = "yaml";
            }
        }
        else
            res = message;
        if (res.length > TRACE_MAX_FENCE_SIZE) {
            const fn = `${generateId()}.${contentType || "txt"}`;
            res = ellipse(res, TRACE_MAX_FENCE_SIZE);
        }
        this.appendContent(fenceMD(res, contentType));
    }
    tip(message) {
        this.appendContent(`> ${message}\n`);
    }
    heading(level, message) {
        this.appendContent(`\n\n${"#".repeat(level)} ${message}\n\n`);
    }
    async image(urlOrImage, caption) {
        const imageUrl = await fileCacheImage(urlOrImage, {
            trace: this,
            ...this.options,
        });
        if (!imageUrl)
            return;
        return this.appendContent(`\n\n![${caption || ""}](${imageUrl})\n\n`);
    }
    toResultIcon(value, missing) {
        return value === true ? EMOJI_SUCCESS : value === false ? EMOJI_FAIL : missing;
    }
    resultItem(value, message) {
        this.item(`${this.toResultIcon(value, EMOJI_UNDEFINED)} ${message}`);
    }
    error(message, error) {
        this.disableChange(() => {
            const err = {
                message,
                error: serializeError(error),
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
                    this.startDetails(`${EMOJI_FAIL} Errors`);
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
        const emsg = errorMessage(error);
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
                const encoder = host.createUTF8Encoder();
                for (const file of files) {
                    const score = !isNaN(file.score)
                        ? `score: ${renderWithPrecision(file.score || 0, 2)}`
                        : undefined;
                    let size;
                    let content;
                    if (file.encoding) {
                        size = prettyBytes(file.size ?? Buffer.from(file.content, file.encoding).length);
                    }
                    else {
                        content = file.content ?? "";
                        size = prettyBytes(file.size ?? encoder.encode(content).length);
                    }
                    const suffix = toStringList(size, score);
                    if (content && maxLength > 0) {
                        let preview = ellipse(content, maxLength).replace(/\b[A-Za-z0-9\-_]{20,40}\b/g, (m) => m.slice(0, 10) + "***");
                        for (const secret of Object.values(secrets))
                            preview = preview.replaceAll(secret, secret.slice(0, 3) + "*".repeat(secret.length - 3));
                        this.detailsFenced(`<code>${file.filename}</code>: ${suffix}`, preview, "text");
                    }
                    else
                        this.itemValue(`\`${file.filename}\``, toStringList(size, score));
                }
            }
            finally {
                if (title)
                    this.endDetails();
            }
        });
    }
}
//# sourceMappingURL=trace.js.map