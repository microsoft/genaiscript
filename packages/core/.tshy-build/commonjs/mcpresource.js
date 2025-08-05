"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceManager = void 0;
const bufferlike_js_1 = require("./bufferlike.js");
const constants_js_1 = require("./constants.js");
const debug_1 = __importDefault(require("debug"));
const filetype_js_1 = require("./filetype.js");
const crypto_js_1 = require("./crypto.js");
const file_js_1 = require("./file.js");
const secretscanner_js_1 = require("./secretscanner.js");
const dbg = (0, debug_1.default)("genaiscript:resource");
class ResourceManager extends EventTarget {
    _resources = {};
    async resources() {
        return Object.values(this._resources).map((r) => r.reference);
    }
    async readResource(uri) {
        dbg(`reading resource: ${uri}`);
        const resource = this._resources[uri];
        return resource?.content;
    }
    async clear() {
        this._resources = {};
        this.dispatchEvent(new Event(constants_js_1.CHANGE));
    }
    async publishResource(name, body, options) {
        dbg(`publishing ${typeof body}`);
        const res = await createResource(name, body, options);
        await this.upsertResource(res.reference, res.content);
        const { reference } = res;
        return reference.uri;
    }
    async upsertResource(reference, content) {
        dbg(`upsert ${reference.uri}`);
        if (!reference?.uri)
            throw new Error("Resource reference must have a uri");
        const current = await (0, crypto_js_1.hash)(this._resources[reference.uri]);
        if (!content)
            delete this._resources[reference.uri];
        else
            this._resources[reference.uri] = { reference, content };
        const update = await (0, crypto_js_1.hash)(this._resources[reference.uri]);
        if (current !== update) {
            dbg(`resource changed: ${reference.uri}`);
            this.dispatchEvent(new CustomEvent(constants_js_1.RESOURCE_CHANGE, {
                detail: {
                    reference,
                    content,
                },
            }));
        }
        this.dispatchEvent(new Event(constants_js_1.CHANGE));
    }
}
exports.ResourceManager = ResourceManager;
async function createResource(name, body, options) {
    const { description } = options || {};
    if (!name)
        throw new Error("Resource name is required");
    const content = await resolveResourceContents(body, options);
    if (!content.uri) {
        content.uri = `${constants_js_1.MCP_RESOURCE_PROTOCOL}://resources/${await (0, crypto_js_1.hash)(JSON.stringify(content), {
            length: 32,
        })}`;
    }
    const reference = {
        name,
        description,
        uri: content.uri, // may be undefined
        mimeType: content.mimeType,
    };
    return {
        reference,
        content: { contents: [content] },
    };
}
async function resolveResourceContents(body, options) {
    const { trace, uri, mimeType, secretScanning } = options || {};
    if (typeof body === "string") {
        if (secretScanning !== false) {
            const redacted = await (0, secretscanner_js_1.redactSecrets)(body, { trace });
            body = redacted.text;
        }
        return {
            uri,
            mimeType: mimeType || "text/plain",
            text: body,
        };
    }
    else if (typeof body === "object" &&
        (body.content || body.filename)) {
        const file = body;
        await (0, file_js_1.resolveFileContent)(file, options);
        if (file.encoding)
            return {
                uri: uri || file.filename,
                mimeType: file.type || "application/octet-stream",
                blob: file.content,
            };
        else {
            if (secretScanning !== false) {
                const redacted = await (0, secretscanner_js_1.redactSecrets)(file.content, { trace });
                file.content = redacted.text;
            }
            return {
                uri: uri || file.filename,
                mimeType: file.type || "text/plain",
                text: file.content,
            };
        }
    }
    else {
        const bytes = await (0, bufferlike_js_1.resolveBufferLike)(body, options);
        const mime = await (0, filetype_js_1.fileTypeFromBuffer)(bytes);
        return {
            uri: uri,
            mimeType: mimeType || mime?.mime || "application/octet-stream",
            blob: bytes.toString("base64"),
        };
    }
}
//# sourceMappingURL=mcpresource.js.map