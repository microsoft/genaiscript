// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert, beforeEach } from "vitest";
import { writePoem } from "../src/poem-function";

describe(`runtime`, () => {
  test(`dynamic import`, async () => {
    const { prompt } = await import("@genaiscript/runtime");
    const res = await prompt`write a poem`;
    console.log(res.text);
    // Add assertions if needed
  });

  test(`poem function`, async () => {
    await writePoem();
  });
});
