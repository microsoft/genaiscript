import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { TOMLParse, TOMLTryParse } from "./toml";

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

  await test("TOMLParse parses valid TOML", () => {
    const result = TOMLParse(validToml);
    assert.deepEqual(result, {
      package: {
        name: "test",
        version: "1.0.0",
      },
    });
  });

  await test("TOMLParse throws on invalid TOML", () => {
    assert.throws(() => TOMLParse(invalidToml));
  });

  await test("TOMLTryParse returns object for valid TOML", () => {
    const result = TOMLTryParse(validToml);
    assert.deepEqual(result, {
      package: {
        name: "test",
        version: "1.0.0",
      },
    });
  });

  await test("TOMLTryParse returns default value for invalid TOML", () => {
    const defaultValue = { error: true };
    const result = TOMLTryParse(invalidToml, { defaultValue });
    assert.deepEqual(result, defaultValue);
  });
});
