// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert, beforeEach } from "vitest";
import { tryZodToJsonSchema } from "../src/zod.js";
import { z } from "zod";

describe("tryZodToJsonSchema Function", () => {
  let validZodSchema: ZodTypeLike;
  let invalidZodSchema: any;

  beforeEach(() => {
    validZodSchema = z.object({
      name: z.string(),
      age: z.number(),
    });

    invalidZodSchema = {
      _def: null,
      refine: null,
      safeParse: null,
    };
  });

  test("should convert valid Zod schema to JSON schema", () => {
    const jsonSchema = tryZodToJsonSchema(validZodSchema);
    assert.deepEqual(jsonSchema, {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name", "age"],
      additionalProperties: false,
      $schema: "https://json-schema.org/draft/2019-09/schema#",
    });
  });

  test("should return undefined for invalid Zod schema", () => {
    const jsonSchema = tryZodToJsonSchema(invalidZodSchema);
    assert.strictEqual(jsonSchema, undefined);
  });

  test("should apply the additional options correctly", () => {
    const jsonSchema = tryZodToJsonSchema(validZodSchema, {
      optionKey: "optionValue",
    });
    assert.deepEqual(jsonSchema, {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name", "age"],
      additionalProperties: false,
      $schema: "https://json-schema.org/draft/2019-09/schema#",
    });
  });
});
