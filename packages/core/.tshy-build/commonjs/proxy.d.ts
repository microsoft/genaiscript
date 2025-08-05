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
export declare function resolveUndiciProxyAgent(): Promise<import("undici", { with: { "resolution-mode": "import" } }).ProxyAgent>;
export declare function resolveHttpsProxyAgent(): Promise<import("proxy-agent").ProxyAgent>;
//# sourceMappingURL=proxy.d.ts.map