import { HttpsProxyAgent } from "https-proxy-agent"

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
