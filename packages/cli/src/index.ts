#!/usr/bin/env node

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { cli } from "./cli.js";
export * from "./ambient.js";

await cli();
