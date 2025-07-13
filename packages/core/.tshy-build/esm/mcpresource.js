// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { resolveBufferLike } from "./bufferlike.js";
import { CHANGE, MCP_RESOURCE_PROTOCOL, RESOURCE_CHANGE } from "./constants.js";
import debug from "debug";
import { fileTypeFromBuffer } from "./filetype.js";
import { hash } from "./crypto.js";
import { resolveFileContent } from "./file.js";
import { redactSecrets } from "./secretscanner.js";
const dbg = debug("genaiscript:resource");
export class ResourceManager extends EventTarget {
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
        this.dispatchEvent(new Event(CHANGE));
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
        const current = await hash(this._resources[reference.uri]);
        if (!content)
            delete this._resources[reference.uri];
        else
            this._resources[reference.uri] = { reference, content };
        const update = await hash(this._resources[reference.uri]);
        if (current !== update) {
            dbg(`resource changed: ${reference.uri}`);
            this.dispatchEvent(new CustomEvent(RESOURCE_CHANGE, {
                detail: {
                    reference,
                    content,
                },
            }));
        }
        this.dispatchEvent(new Event(CHANGE));
    }
}
async function createResource(name, body, options) {
    const { description } = options || {};
    if (!name)
        throw new Error("Resource name is required");
    const content = await resolveResourceContents(body, options);
    if (!content.uri) {
        content.uri = `${MCP_RESOURCE_PROTOCOL}://resources/${await hash(JSON.stringify(content), {
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
            const redacted = await redactSecrets(body, { trace });
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
        await resolveFileContent(file, options);
        if (file.encoding)
            return {
                uri: uri || file.filename,
                mimeType: file.type || "application/octet-stream",
                blob: file.content,
            };
        else {
            if (secretScanning !== false) {
                const redacted = await redactSecrets(file.content, { trace });
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
        const bytes = await resolveBufferLike(body, options);
        const mime = await fileTypeFromBuffer(bytes);
        return {
            uri: uri,
            mimeType: mimeType || mime?.mime || "application/octet-stream",
            blob: bytes.toString("base64"),
        };
    }
}
//# sourceMappingURL=mcpresource.js.map