// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { test, describe, expect } from "vitest";
import { run } from "../src/api.js";

describe("api", async () => {
  await test("hello", async () => {
    const res = await run("hello");
    console.log(res);
    expect(res).toBeDefined();
  });
});
