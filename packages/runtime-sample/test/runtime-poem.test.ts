// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test } from "vitest";
import { writePoem } from "../src/poem-function";
import { initialize } from "@genaiscript/runtime";

describe(`runtime`, async () => {
  await initialize();
  await test(`dynamic import`, async () => {
    const res = await prompt`write a poem`.options({ model: "echo" });
    console.log(res.text);
    // Add assertions if needed
  });

  await test(`poem function`, async () => {
    await writePoem();
  });
});
