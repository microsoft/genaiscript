// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert } from "vitest";
import { TOMLParse, TOMLTryParse } from "../src/toml.js";

describe("TOML", async () => {
  const validToml = `
[package]
name = "test"
version = "1.0.0"
    `;
  const invalidToml = `
[package
name = test
version = 1.0.0
    `;

  test("TOMLParse parses valid TOML", () => {
    const result = TOMLParse(validToml);
    assert.deepEqual(result, {
      package: {
        name: "test",
        version: "1.0.0",
      },
    });
  });

  test("TOMLParse throws on invalid TOML", () => {
    assert.throws(() => TOMLParse(invalidToml));
  });

  test("TOMLTryParse returns object for valid TOML", () => {
    const result = TOMLTryParse(validToml);
    assert.deepEqual(result, {
      package: {
        name: "test",
        version: "1.0.0",
      },
    });
  });

  test("TOMLTryParse returns default value for invalid TOML", () => {
    const defaultValue = { error: true };
    const result = TOMLTryParse(invalidToml, { defaultValue });
    assert.deepEqual(result, defaultValue);
  });
});
