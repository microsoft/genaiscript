"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveUndiciProxyAgent = resolveUndiciProxyAgent;
exports.resolveHttpsProxyAgent = resolveHttpsProxyAgent;
const debug_js_1 = require("./debug.js");
const error_js_1 = require("./error.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("fetch:proxy");
function resolveProxyUrl() {
    const proxy = process.env.HTTPS_PROXY ||
        process.env.HTTP_PROXY ||
        process.env.https_proxy ||
        process.env.http_proxy;
    return proxy;
}
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
async function resolveUndiciProxyAgent() {
    // We create a proxy based on Node.js environment variables.
    const proxy = resolveProxyUrl();
    if (!proxy)
        return null;
    dbg(`proxy (undici): %s`, proxy);
    const { ProxyAgent } = await import("undici");
    const agent = new ProxyAgent(proxy);
    agent.on(`connect`, (info) => dbg(`connect: %s`, info.href));
    agent.on(`connectionError`, (err) => dbg(`connection error: %s`, (0, error_js_1.errorMessage)(err)));
    agent.on(`disconnect`, () => dbg(`disconnect`));
    return agent;
}
async function resolveHttpsProxyAgent() {
    const proxyUrl = resolveProxyUrl();
    if (!proxyUrl)
        return null;
    dbg(`proxy (proxy-agent): %s`, proxyUrl);
    const { ProxyAgent } = await import("proxy-agent");
    const agent = new ProxyAgent();
    agent.on(`connect`, () => dbg(`connect`));
    agent.on(`error`, (err) => dbg(`error: %s`, (0, error_js_1.errorMessage)(err)));
    return agent;
}
//# sourceMappingURL=proxy.js.map