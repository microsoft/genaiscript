// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { Debugger } from "debug";
import debug from "debug";

const _genaiscriptDebug = debug("genaiscript");
export function genaiscriptDebug(namespace: string): Debugger {
  return _genaiscriptDebug.extend(namespace);
}
