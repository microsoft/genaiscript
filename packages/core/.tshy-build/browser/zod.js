// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { zodToJsonSchema as _zodToJsonSchema } from "zod-to-json-schema";
/**
 * Converts a Zod schema to a JSON schema.
 * @param z The Zod schema to convert. Must have _def, refine, and safeParse properties.
 * @param options Additional options for conversion. Defaults to an empty object.
 * @returns The resulting JSON schema or undefined if input is invalid.
 */
export function tryZodToJsonSchema(z, options) {
    if (!z || !z._def || !z.refine || !z.safeParse)
        return undefined;
    const schema = _zodToJsonSchema(z, {
        target: "openAi",
        ...(options || {}),
    });
    return structuredClone(schema);
}
//# sourceMappingURL=zod.js.map