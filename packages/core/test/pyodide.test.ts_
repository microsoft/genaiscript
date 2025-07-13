// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert, beforeAll } from "vitest";
import { createPythonRuntime } from "../src/pyodide.js";
import { TestHost } from "./testhost.js";

describe("PyodideRuntime", async () => {
  let runtime: PythonRuntime;

  beforeAll(async () => {
    TestHost.install();
    runtime = await createPythonRuntime();
  });
  test("should list current files from Python", async () => {
    const result = await runtime.run(`
import os
os.listdir('/workspace')
`);
    assert(Array.isArray(result));
  });
  test("should run Python code and return result", async () => {
    const result = await runtime.run("print('Hello, World!')");
    assert.equal(result, undefined); // Since print returns None in Python
  });
  test("should return Python version", async () => {
    const result = await runtime.run("import sys; sys.version");
    assert(result);
    assert(typeof result === "string");
    assert(result.includes("3."));
  });
  test("should handle Python exceptions", async () => {
    try {
      await runtime.run("raise ValueError('Test error')");
      assert.fail("Expected an error to be thrown");
    } catch (error) {
      assert(error instanceof Error);
      assert(error.message.includes("ValueError: Test error"));
    }
  });
  test("should install and use snowballstemmer", async () => {
    await runtime.import("snowballstemmer");
    const result = await runtime.run(`
            import snowballstemmer
            stemmer = snowballstemmer.stemmer('english')
            stemmer.stemWords(['running', 'jumps', 'easily'])
        `);
    assert(Array.isArray(result));
  });
  test("should set and get global variables", async () => {
    await runtime.run("x = 42");
    const result = runtime.globals.get<number>("x");
    assert.equal(result, 42);
  });

  test("should update global variables", async () => {
    runtime.globals.set("y", 100);
    const result = await runtime.run("y");
    assert.equal(result, 100);
  });

  test("should handle non-existent global variables", async () => {
    const result = runtime.globals.get("non_existent_var");
    assert.equal(result, undefined);
  });
});
