"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAzureContentSafetyClientConfigured = isAzureContentSafetyClientConfigured;
exports.createAzureContentSafetyClient = createAzureContentSafetyClient;
const fetch_js_1 = require("./fetch.js");
const cleaners_js_1 = require("./cleaners.js");
const constants_js_1 = require("./constants.js");
const host_js_1 = require("./host.js");
const yaml_js_1 = require("./yaml.js");
const cleaners_js_2 = require("./cleaners.js");
const chunkers_js_1 = require("./chunkers.js");
const cache_js_1 = require("./cache.js");
const fetchtext_js_1 = require("./fetchtext.js");
const debug_js_1 = require("./debug.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("contentsafety:azure");
class AzureContentSafetyClient {
    options;
    id;
    cache;
    constructor(options) {
        this.options = options;
        this.cache = (0, cache_js_1.createCache)("azurecontentsafety", {
            ...(options || {}),
            type: "fs",
        });
    }
    async detectHarmfulContent(content, options) {
        const { trace } = this.options || {};
        const { maxAllowedSeverity = 0 } = options || {};
        const route = "text:analyze";
        try {
            dbg(`detecting harmful content`);
            trace?.startDetails("🛡️ content safety: detecting harmful content");
            const fetcher = await this.createClient(route);
            const analyze = async (text) => {
                trace?.fence((0, yaml_js_1.YAMLStringify)(text), "yaml");
                const body = { text };
                const cached = await this.cache.get({ route, body, options });
                if (cached) {
                    trace?.itemValue("cached", (0, yaml_js_1.YAMLStringify)(cached));
                    return cached;
                }
                const res = await fetcher(body);
                if (!res.ok) {
                    dbg((0, fetch_js_1.statusToMessage)(res));
                    throw new Error(`Azure Content Safety API failed with status ${res.status}`);
                }
                const resBody = (await res.json());
                const harmfulContentDetected = resBody.categoriesAnalysis?.some(({ severity }) => severity > maxAllowedSeverity);
                const r = { harmfulContentDetected, ...resBody };
                await this.cache.set({ route, body, options }, r);
                return r;
            };
            const inputs = (0, cleaners_js_1.arrayify)(await content);
            for (const input of inputs) {
                const text = typeof input === "string" ? input : input.content;
                const filename = typeof input === "string" ? undefined : input.filename;
                for (const chunk of (0, chunkers_js_1.chunkString)(text, constants_js_1.AZURE_CONTENT_SAFETY_PROMPT_SHIELD_MAX_LENGTH)) {
                    const res = await analyze(chunk);
                    if (res.harmfulContentDetected)
                        return {
                            ...res,
                            filename,
                            chunk,
                        };
                }
            }
            trace?.item("no harmful content detected");
            dbg(`no harmful content detected`);
            return { harmfulContentDetected: false };
        }
        finally {
            trace?.endDetails();
        }
    }
    async detectPromptInjection(content) {
        const options = {};
        const { trace } = this.options || {};
        const route = "text:shieldPrompt";
        try {
            dbg(`detecting prompt injection`);
            trace?.startDetails("🛡️ content safety: detecting prompt injection");
            const input = (0, cleaners_js_1.arrayify)(await content);
            const userPrompts = input.filter((i) => typeof i === "string");
            const documents = input.filter((i) => typeof i === "object");
            const fetcher = await this.createClient(route);
            const shieldPrompt = async (body) => {
                trace?.fence((0, yaml_js_1.YAMLStringify)(body), "yaml");
                const cached = await this.cache.get({ route, body, options });
                if (cached) {
                    trace?.itemValue("cached", (0, yaml_js_1.YAMLStringify)(cached));
                    return cached;
                }
                const res = await fetcher(body);
                if (!res.ok) {
                    dbg((0, fetch_js_1.statusToMessage)(res));
                    throw new Error(`Azure Content Safety API failed with status ${res.status}`);
                }
                const resBody = (await res.json());
                const attackDetected = !!resBody.userPromptAnalysis?.attackDetected ||
                    resBody.documentsAnalysis?.some((doc) => doc.attackDetected);
                const r = { attackDetected };
                await this.cache.set({ route, body, options: {} }, r);
                return r;
            };
            for (const userPrompt of userPrompts) {
                for (const chunk of (0, chunkers_js_1.chunkString)(userPrompt, constants_js_1.AZURE_CONTENT_SAFETY_PROMPT_SHIELD_MAX_LENGTH)) {
                    const res = await shieldPrompt({
                        userPrompt: chunk,
                        documents: [],
                    });
                    if (res.attackDetected)
                        return {
                            ...res,
                            chunk,
                        };
                }
            }
            for (const document of documents) {
                for (const chunk of (0, chunkers_js_1.chunkString)(document.content, constants_js_1.AZURE_CONTENT_SAFETY_PROMPT_SHIELD_MAX_LENGTH)) {
                    const res = await shieldPrompt({
                        userPrompt: "",
                        documents: [chunk],
                    });
                    if (res.attackDetected)
                        return {
                            ...res,
                            filename: document.filename,
                            chunk,
                        };
                }
            }
            trace.item("no attack detected");
            dbg(`no attack detected`);
            return { attackDetected: false };
        }
        finally {
            trace?.endDetails();
        }
    }
    async createClient(route, options) {
        const { trace } = this.options || {};
        const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
        const endpoint = (0, cleaners_js_2.trimTrailingSlash)(process.env.AZURE_CONTENT_SAFETY_ENDPOINT || process.env.AZURE_CONTENT_SAFETY_API_ENDPOINT);
        const credentialsType = ((process.env.AZURE_CONTENT_SAFETY_CREDENTIALS_TYPE ||
            process.env.AZURE_CONTENT_SAFETY_API_CREDENTIALS_TYPE)
            ?.toLowerCase()
            ?.trim() || "default");
        const apiKey = process.env.AZURE_CONTENT_SAFETY_KEY || process.env.AZURE_CONTENT_SAFETY_API_KEY;
        let apiToken;
        if (!apiKey) {
            dbg(`requesting Azure token`);
            const { token } = await runtimeHost.azureToken.token(credentialsType, options);
            apiToken = token.token;
        }
        const version = process.env.AZURE_CONTENT_SAFETY_VERSION || "2024-09-01";
        dbg(`azure version: %s`, version);
        if (!endpoint)
            throw new Error(`AZURE_CONTENT_SAFETY_ENDPOINT is not set. See ${constants_js_1.DOCS_CONFIGURATION_CONTENT_SAFETY_URL} for help.`);
        if (!apiKey && !apiToken)
            throw new Error(`AZURE_CONTENT_SAFETY_KEY is not set or not signed in with Azure. See ${constants_js_1.DOCS_CONFIGURATION_CONTENT_SAFETY_URL} for help.`);
        const headers = {
            "Content-Type": "application/json",
            "User-Agent": "genaiscript",
        };
        if (apiKey)
            headers["Ocp-Apim-Subscription-Key"] = apiKey;
        if (apiToken)
            headers["Authorization"] = `Bearer ${apiToken}`;
        const fetch = await (0, fetch_js_1.createFetch)(this.options);
        const url = `${endpoint}/contentsafety/${route}?api-version=${version}`;
        const fetcher = async (body) => {
            (0, fetchtext_js_1.traceFetchPost)(trace, url, headers, body);
            return await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
            });
        };
        return fetcher;
    }
}
/**
 * Determines if the Azure Content Safety client is configured by checking for the presence of a valid endpoint.
 *
 * @returns {boolean} - Returns true if the Azure Content Safety API endpoint is configured, false otherwise.
 *
 * Environment Variables:
 * - AZURE_CONTENT_SAFETY_ENDPOINT: The base endpoint for the Azure Content Safety API, if provided.
 * - AZURE_CONTENT_SAFETY_API_ENDPOINT: Alternative variable for the base endpoint, if the primary variable is not set.
 *
 * The function trims trailing slashes from the endpoint before validation.
 */
function isAzureContentSafetyClientConfigured() {
    const endpoint = (0, cleaners_js_2.trimTrailingSlash)(process.env.AZURE_CONTENT_SAFETY_ENDPOINT || process.env.AZURE_CONTENT_SAFETY_API_ENDPOINT);
    return !!endpoint;
}
/**
 * Creates an Azure Content Safety client to detect harmful content and prompt injection in text or documents.
 *
 * @param options - Configuration options for the client.
 * - Includes properties for tracing operations, cancellation signals, and additional configurations.
 * - `signal` - Optional AbortSignal for request cancellation.
 *
 * @returns An object implementing ContentSafety, with methods:
 * - `detectHarmfulContent`: Analyzes text or documents for harmful content.
 * - `detectPromptInjection`: Analyzes text or documents for prompt injection attacks.
 */
function createAzureContentSafetyClient(options) {
    const client = new AzureContentSafetyClient(options);
    return {
        id: client.id,
        detectHarmfulContent: client.detectHarmfulContent.bind(client),
        detectPromptInjection: client.detectPromptInjection.bind(client),
    };
}
//# sourceMappingURL=azurecontentsafety.js.map