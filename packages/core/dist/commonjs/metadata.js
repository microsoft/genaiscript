"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadataValidate = metadataValidate;
exports.metadataMerge = metadataMerge;
const cleaners_js_1 = require("./cleaners.js");
const debug_js_1 = require("./debug.js");
const util_js_1 = require("./util.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("metadata");
function metadataValidate(metadata) {
    if (!metadata)
        return undefined;
    const entries = Object.entries(metadata);
    if (entries.length > 16)
        throw new Error("Metadata can only have 16 entries");
    // keep the first 16 entries
    for (let [key, value] of entries) {
        if (key.length > 64)
            throw new Error("Invalid metadata key, key too long");
        if (value === undefined)
            delete metadata[key];
        if (typeof value !== "string")
            value = String(value);
        if (value.length > 512)
            value = (0, util_js_1.ellipse)(value, 512);
    }
    dbg(`%O`, metadata);
    return metadata;
}
function metadataMerge(script, options) {
    const update = script.metadata;
    const source = options;
    if (!source && !update)
        return undefined;
    const res = {
        ...(source || {}),
        ...(update || {}),
    };
    (0, cleaners_js_1.deleteUndefinedValues)(res);
    const extras = (0, cleaners_js_1.deleteUndefinedValues)({
        script: script.id,
        group: script.group,
        title: script.title,
        description: script.description,
    });
    for (const [key, value] of Object.entries(extras)) {
        if (Object.keys(res).length >= 16)
            break;
        if (res[key] === undefined)
            res[key] = (0, util_js_1.ellipse)(value, 512);
    }
    return metadataValidate(res);
}
//# sourceMappingURL=metadata.js.map