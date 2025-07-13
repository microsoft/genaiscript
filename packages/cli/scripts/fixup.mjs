// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { chmod } from "node:fs/promises";

await chmod("dist/src/index.js", 0o755);
