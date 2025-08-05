"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderMessagesToTerminal = renderMessagesToTerminal;
const image_js_1 = require("./image.js");
const terminal_js_1 = require("./terminal.js");
const util_js_1 = require("./util.js");
const yaml_js_1 = require("./yaml.js");
const filebytes_js_1 = require("./filebytes.js");
const consolecolor_js_1 = require("./consolecolor.js");
const constants_js_1 = require("./constants.js");
const cancellation_js_1 = require("./cancellation.js");
const pretty_js_1 = require("./pretty.js");
const debug_js_1 = require("./debug.js");
const schema_js_1 = require("./schema.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("chat:render");
function renderTrimmed(s, rows, width) {
    const lines = s.split(/\n/g).filter((l) => !!l);
    let trimmed = lines.slice(0);
    if (lines.length > rows) {
        const head = Math.min(rows >> 1, lines.length - 1);
        const tail = rows - head;
        trimmed = lines.slice(0, head);
        if (tail) {
            const hidden = lines.length - head - tail;
            if (hidden === 1)
                trimmed.push(lines.at(-tail - 1));
            else if (hidden > 0)
                trimmed.push(`... (${hidden} lines)`);
            trimmed.push(...lines.slice(-tail));
        }
    }
    const res = trimmed.map((l, i) => (0, consolecolor_js_1.wrapColor)(constants_js_1.CONSOLE_COLOR_DEBUG, constants_js_1.BOX_UP_AND_DOWN + (0, util_js_1.ellipse)(l, width) + "\n"));
    return res;
}
async function renderMessageContent(modelId, msg, options) {
    const { columns, rows, cancellationToken } = options;
    const content = typeof msg === "string" ? msg : msg.content;
    const margin = 2;
    const width = columns - margin;
    const render = (s) => renderTrimmed(s, rows, width);
    // Return the content directly if it's a simple string.
    if (typeof content === "string")
        return render(content);
    // If the content is an array, process each element based on its type.
    else if (Array.isArray(content)) {
        const res = [];
        for (const c of content) {
            (0, cancellation_js_1.checkCancelled)(cancellationToken);
            switch (c.type) {
                case "text":
                    res.push(...render(c.text));
                    break;
                case "image_url":
                    res.push(await (0, image_js_1.renderImageToTerminal)((0, filebytes_js_1.dataUriToBuffer)(c.image_url.url), {
                        columns,
                        rows,
                        cancellationToken,
                        modelId,
                    }));
                    break;
                case "input_audio":
                    res.push(...render(`🔊 audio`));
                    break;
                case "refusal":
                    res.push(...render(`🚫 ` + c.refusal));
                    break;
                default:
                    res.push(...render(`unknown`));
            }
        }
        return res;
    }
    else
        return [];
}
function renderToolCall(call, options) {
    const { columns } = options;
    const width = columns - 2;
    return (0, consolecolor_js_1.wrapColor)(constants_js_1.CONSOLE_COLOR_DEBUG, (0, util_js_1.ellipse)(`${constants_js_1.BOX_DOWN_UP_AND_RIGHT}${constants_js_1.BOX_RIGHT}${constants_js_1.BOX_RIGHT}📠 tool ${call.function.name} (${call.id})`, columns - 2) +
        `\n` +
        (call.function.arguments
            ? (0, consolecolor_js_1.wrapColor)(constants_js_1.CONSOLE_COLOR_DEBUG, `${constants_js_1.BOX_UP_AND_DOWN} ${(0, util_js_1.ellipse)(call.function.arguments, width)}\n`)
            : ""));
}
function renderMetadata(call) {
    const { metadata } = call;
    if (!metadata)
        return "";
    return (0, consolecolor_js_1.wrapColor)(constants_js_1.CONSOLE_COLOR_DEBUG, `${constants_js_1.BOX_DOWN_UP_AND_RIGHT}${constants_js_1.BOX_RIGHT}📊 ${Object.entries(metadata)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")}\n`);
}
/**
 * Renders a list of chat messages to an interactive terminal output.
 *
 * @param messages - The list of chat messages to render. Each message consists of role-specific content and attributes.
 * @param options - Configuration options for rendering:
 *   - system: Controls whether system messages are included. Defaults to true unless explicitly set to false.
 *   - user: Controls whether user messages are included. Defaults to true unless explicitly set to false.
 *   - assistant: Controls whether assistant messages are included. Defaults to true.
 *   - tools: Optional list of tools to be displayed, each containing metadata such as function names.
 *
 * @returns The formatted string output for terminal rendering.
 */
async function renderMessagesToTerminal(request, options) {
    const { model, temperature, metadata, response_format } = request;
    let messages = request.messages.slice(0);
    const { preview, system = undefined, // Include system messages unless explicitly set to false.
    user = undefined, // Include user messages unless explicitly set to false.
    assistant = true, // Include assistant messages by default.
    tools, } = options || {};
    const { columns } = (0, terminal_js_1.terminalSize)();
    dbg(`render %O`, messages);
    const msgRows = (msg, visibility) => msg === messages.at(-1)
        ? constants_js_1.CONTROL_CHAT_LAST
        : visibility === true
            ? constants_js_1.CONTROL_CHAT_EXPANDED
            : constants_js_1.CONTROL_CHAT_COLLAPSED;
    messages = messages.filter((msg) => {
        // Filter messages based on their roles.
        switch (msg.role) {
            case "system":
                return system !== false;
            case "user":
                return user !== false;
            case "assistant":
                return assistant !== false;
            default:
                return true;
        }
    });
    const res = [];
    if (model) {
        res.push((0, consolecolor_js_1.wrapColor)(constants_js_1.CONSOLE_COLOR_DEBUG, `${constants_js_1.BOX_DOWN_AND_RIGHT}${constants_js_1.BOX_RIGHT}💬 ${model} ${constants_js_1.CHAR_ENVELOPE} ${messages.length} ${(0, pretty_js_1.prettyTemperature)(temperature)}\n`));
    }
    if (response_format && preview) {
        const { type } = response_format;
        res.push((0, consolecolor_js_1.wrapColor)(constants_js_1.CONSOLE_COLOR_DEBUG, `${constants_js_1.BOX_DOWN_UP_AND_RIGHT}${constants_js_1.BOX_RIGHT}📦 ${type}\n`));
        if (type === "json_schema") {
            const { json_schema } = response_format;
            res.push((0, consolecolor_js_1.wrapColor)(constants_js_1.CONSOLE_COLOR_DEBUG, `${constants_js_1.BOX_UP_AND_DOWN} ${(0, schema_js_1.JSONSchemaToFunctionParameters)(json_schema.schema)}\n`));
        }
    }
    if (tools?.length && preview) {
        res.push((0, consolecolor_js_1.wrapColor)(constants_js_1.CONSOLE_COLOR_DEBUG, `${constants_js_1.BOX_DOWN_UP_AND_RIGHT}${constants_js_1.BOX_RIGHT}🔧 tools (${tools.length})\n`), (0, consolecolor_js_1.wrapColor)(constants_js_1.CONSOLE_COLOR_DEBUG, `${constants_js_1.BOX_UP_AND_DOWN} ${tools.map((tool) => tool.function.name).join(", ")}`), "\n");
    }
    if (metadata && preview)
        res.push(renderMetadata(request));
    if (preview)
        for (const msg of messages) {
            const { role } = msg;
            switch (role) {
                case "system":
                    res.push((0, consolecolor_js_1.wrapColor)(constants_js_1.CONSOLE_COLOR_DEBUG, `${constants_js_1.BOX_DOWN_AND_RIGHT}${constants_js_1.BOX_RIGHT}📙 system\n`), ...(await renderMessageContent(model, msg, {
                        columns,
                        rows: msgRows(msg, system),
                    })));
                    break;
                case "user":
                    res.push((0, consolecolor_js_1.wrapColor)(constants_js_1.CONSOLE_COLOR_DEBUG, `${constants_js_1.BOX_DOWN_AND_RIGHT}${constants_js_1.BOX_RIGHT}👤 user\n`));
                    res.push(...(await renderMessageContent(model, msg, {
                        columns,
                        rows: msgRows(msg, user),
                    })));
                    break;
                case "assistant":
                    res.push((0, consolecolor_js_1.wrapColor)(constants_js_1.CONSOLE_COLOR_DEBUG, `${constants_js_1.BOX_DOWN_AND_RIGHT}${constants_js_1.BOX_RIGHT}🤖 assistant ${msg.name ? msg.name : ""}\n`));
                    if (msg.reasoning_content)
                        res.push((0, consolecolor_js_1.wrapColor)(constants_js_1.CONSOLE_COLOR_DEBUG, `${constants_js_1.BOX_UP_AND_DOWN}${constants_js_1.BOX_RIGHT}🤔 reasoning\n`), msg.reasoning_content, "\n");
                    res.push(...(await renderMessageContent(model, msg, {
                        columns,
                        rows: msgRows(msg, assistant),
                    })));
                    if (msg.tool_calls?.length)
                        res.push(...msg.tool_calls.map((call) => renderToolCall(call, { columns })));
                    break;
                case "tool":
                    res.push((0, consolecolor_js_1.wrapColor)(constants_js_1.CONSOLE_COLOR_DEBUG, `${constants_js_1.BOX_DOWN_AND_RIGHT}${constants_js_1.BOX_RIGHT}🔧 tool ${msg.tool_call_id || ""}\n`), ...(await renderMessageContent(model, msg, {
                        columns,
                        rows: msgRows(msg, undefined),
                    })));
                    break;
                default:
                    res.push((0, consolecolor_js_1.wrapColor)(constants_js_1.CONSOLE_COLOR_DEBUG, `${constants_js_1.BOX_DOWN_AND_RIGHT}${constants_js_1.BOX_RIGHT}${role}\n`), ...(await renderMessageContent(model, (0, yaml_js_1.YAMLStringify)(msg), {
                        columns,
                        rows: msgRows(msg, undefined),
                    })));
                    break;
            }
        }
    // Join the result array into a single markdown string.
    return res.filter((s) => s !== undefined).join("");
}
//# sourceMappingURL=chatrenderterminal.js.map