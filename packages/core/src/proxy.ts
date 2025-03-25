import { HttpsProxyAgent } from "https-proxy-agent"

/**
 * Resolves and returns an HTTP proxy agent based on Node.js environment variables.
 *
 * The function checks the following environment variables in order to determine 
 * the proxy configuration:
 * - GENAISCRIPT_HTTPS_PROXY
 * - GENAISCRIPT_HTTP_PROXY
 * - HTTPS_PROXY
 * - HTTP_PROXY
 * - https_proxy
 * - http_proxy
 *
 * If a proxy is found, an instance of HttpsProxyAgent is created and returned. 
 * If no proxy is specified, the function returns null.
 *
 * @returns {HttpsProxyAgent | null} - The configured HTTP proxy agent or null if no proxy is set.
 */
export function resolveHttpProxyAgent() {
    // We create a proxy based on Node.js environment variables.
    const proxy =
        process.env.GENAISCRIPT_HTTPS_PROXY ||
        process.env.GENAISCRIPT_HTTP_PROXY ||
        process.env.HTTPS_PROXY ||
        process.env.HTTP_PROXY ||
        process.env.https_proxy ||
        process.env.http_proxy
    const agent = proxy ? new HttpsProxyAgent(proxy) : null
    return agent
}
