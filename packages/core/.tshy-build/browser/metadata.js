// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { deleteUndefinedValues } from "./cleaners.js";
import { genaiscriptDebug } from "./debug.js";
import { ellipse } from "./util.js";
const dbg = genaiscriptDebug("metadata");
export function metadataValidate(metadata) {
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
            value = ellipse(value, 512);
    }
    dbg(`%O`, metadata);
    return metadata;
}
export function metadataMerge(script, options) {
    const update = script.metadata;
    const source = options;
    if (!source && !update)
        return undefined;
    const res = {
        ...(source || {}),
        ...(update || {}),
    };
    deleteUndefinedValues(res);
    const extras = deleteUndefinedValues({
        script: script.id,
        group: script.group,
        title: script.title,
        description: script.description,
    });
    for (const [key, value] of Object.entries(extras)) {
        if (Object.keys(res).length >= 16)
            break;
        if (res[key] === undefined)
            res[key] = ellipse(value, 512);
    }
    return metadataValidate(res);
}
//# sourceMappingURL=metadata.js.map