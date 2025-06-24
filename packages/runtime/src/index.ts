// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export * from "./version.js";
export * from "./docker.js";
export * from "./input.js";
export * from "./log.js";
export * from "./nodehost.js";
export * from "./playwright.js";
export * from "./runtime.js";
export * from "./classify.js";
export * from "./makeitbetter.js";
export * from "./cast.js";
export * from "./filetree.js";
export * from "./markdownifypdf.js";

import { installGlobals } from "@genaiscript/core";
import { NodeHost } from "./nodehost.js";

installGlobals();

async function main() {
  await NodeHost.install(undefined, undefined);
}

main().catch((err) => {
  console.error("Error during NodeHost installation:", err);
  process.exit(1);
});
