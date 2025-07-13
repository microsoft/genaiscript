// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { RESOURCE_HASH_LENGTH } from "./constants.js";
import { runtimeHost } from "./host.js";
import { dotGenaiscriptPath } from "./workdir.js";
import { join } from "node:path";
import { CancellationOptions } from "./cancellation.js";
import { tryResolveResource } from "./resources.js";
import { TraceOptions } from "./trace.js";
import { genaiscriptDebug } from "./debug.js";
import { hash } from "./crypto.js";
const dbg = genaiscriptDebug("scripts:resolve");

/**
 * Attempts to resolve a script from the provided URL and manages caching.
 *
 * @param url - The URL of the resource to resolve.
 * @param options - Optional tracing and cancellation options.
 *   - TraceOptions: Includes trace-level details for debugging purposes.
 *   - CancellationOptions: Optionally permits cancellation during the process.
 * @returns The filename of the resolved script or undefined if resolution fails.
 *
 * If the resource is found, it checks for cached content. If cached, it computes a hash
 * and resolves the resource file within a managed `.genaiscript/resources` directory.
 * If no cached content is found, it returns the filename of the first file in the resource.
 */
export async function tryResolveScript(
  url: string,
  options?: TraceOptions & CancellationOptions,
): Promise<string> {
  const resource = await tryResolveResource(url, options);
  if (!resource) return undefined;

  const { uri, files } = resource;
  dbg(`resolved resource %s %d`, uri, files?.length);
  if (!files?.length) return undefined;

  const cache = files.some((f) => f.content);
  if (!cache) return files[0].filename;
  else {
    const sha = await hash([files], {
      length: RESOURCE_HASH_LENGTH,
    });
    const fn = dotGenaiscriptPath("resources", uri.protocol, uri.hostname, sha);
    dbg(`resolved cache: %s`, fn);
    const cached = files.map((f) => ({
      ...f,
      filename: join(fn, f.filename),
    }));
    await runtimeHost.workspace.writeFiles(cached);
    return cached[0].filename;
  }
}
