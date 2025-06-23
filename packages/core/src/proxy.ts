// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { genaiscriptDebug } from "./debug.js";
const dbg = genaiscriptDebug("proxy");

/**
 * Resolves an HTTP proxy agent based on environment variables.
 *
 * This function checks various environment variables to locate
 * a proxy configuration. If a proxy is found, it returns an
 * instance of `HttpsProxyAgent` configured with the proxy URL;
 * otherwise, it returns null.
 *
 * Environment variables checked (in order of precedence):
 * - `GENAISCRIPT_HTTPS_PROXY`
 * - `GENAISCRIPT_HTTP_PROXY`
 * - `HTTPS_PROXY`
 * - `HTTP_PROXY`
 * - `https_proxy`
 * - `http_proxy`
 *
 * @returns An instance of `HttpsProxyAgent` if a proxy is configured,
 *          or null if no proxy is detected.
 */
export async function resolveHttpProxyAgent() {
  // We create a proxy based on Node.js environment variables.
  const proxy =
    process.env.GENAISCRIPT_HTTPS_PROXY ||
    process.env.GENAISCRIPT_HTTP_PROXY ||
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.https_proxy ||
    process.env.http_proxy;
  if (proxy) dbg(`proxy: %s`, proxy);
  if (!proxy) return null;

  const { ProxyAgent } = await import("undici");
  const agent = new ProxyAgent(proxy);
  return agent;
}
