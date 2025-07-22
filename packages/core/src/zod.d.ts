import type { JSONSchema, ZodTypeLike } from "./types.js";
/**
 * Converts a Zod schema to a JSON schema.
 * @param z The Zod schema to convert. Must have _def, refine, and safeParse properties.
 * @param options Additional options for conversion. Defaults to an empty object.
 * @returns The resulting JSON schema or undefined if input is invalid.
 */
export declare function tryZodToJsonSchema(z: ZodTypeLike, options?: object): JSONSchema;
//# sourceMappingURL=zod.d.ts.map