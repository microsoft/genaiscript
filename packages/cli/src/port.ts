// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { findRandomOpenPort, isPortInUse, logWarn } from "@genaiscript/core";

export async function findOpenPort(defaultPort: number, options?: { port?: string }) {
  let port = parseInt(options.port) || defaultPort;
  if (await isPortInUse(port)) {
    if (options.port) throw new Error(`port ${port} in use`);
    const oldPort = port;
    port = await findRandomOpenPort();
    logWarn(`port ${oldPort} in use, using port ${port}`);
  }
  return port;
}
