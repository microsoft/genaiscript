#!/usr/bin/env node

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { installGlobals } from "@genaiscript/core";
import { cli } from "./cli.js";

// Export the global functions for import support
export { script, $, def, writeText, defFileOutput } from "@genaiscript/runtime";

// Run CLI if this is the main entry point
if (import.meta.url === `file://${process.argv[1]}`) {
    installGlobals();
    await cli();
}
