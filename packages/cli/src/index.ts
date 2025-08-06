#!/usr/bin/env node

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { installGlobals } from "@genaiscript/core";
import { cli } from "./cli.js";

installGlobals();
await cli();
