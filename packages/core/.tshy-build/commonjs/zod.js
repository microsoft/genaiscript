"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryZodToJsonSchema = tryZodToJsonSchema;
const zod_to_json_schema_1 = require("zod-to-json-schema");
/**
 * Converts a Zod schema to a JSON schema.
 * @param z The Zod schema to convert. Must have _def, refine, and safeParse properties.
 * @param options Additional options for conversion. Defaults to an empty object.
 * @returns The resulting JSON schema or undefined if input is invalid.
 */
function tryZodToJsonSchema(z, options) {
    if (!z || !z._def || !z.refine || !z.safeParse)
        return undefined;
    const schema = (0, zod_to_json_schema_1.zodToJsonSchema)(z, {
        target: "openAi",
        ...(options || {}),
    });
    return structuredClone(schema);
}
//# sourceMappingURL=zod.js.map