"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tavilySearch = tavilySearch;
const debug_1 = __importDefault(require("debug"));
const dbg = (0, debug_1.default)("genaiscript:websearch");
const cleaners_js_1 = require("./cleaners.js");
const constants_js_1 = require("./constants.js");
const fetch_js_1 = require("./fetch.js");
const host_js_1 = require("./host.js");
const util_js_1 = require("./util.js");
/**
 * Performs a Tavily search using the given query and options.
 * Uses the Tavily Search API to construct and execute the request with query parameters.
 * Handles API key retrieval, request construction, and error management.
 * Logs the query and response details for tracing purposes.
 * @param q - The search query string.
 * @param options - Optional parameters including trace, endpoint, count, and API key handling. If ignoreMissingApiKey is true, the function returns undefined when the API key is missing.
 * @returns A Promise resolving to a list of search responses, each containing a URL and content.
 * @throws Error if the API key is missing or if the search request fails.
 */
async function tavilySearch(q, options) {
    const { trace, count, ignoreMissingApiKey, endPoint = constants_js_1.TAVILY_ENDPOINT } = options || {};
    // Return an empty response if the query is empty.
    if (!q)
        return [];
    dbg(`query is empty, returning empty response`);
    // Retrieve the API key from the runtime runtimeHost.
    dbg(`retrieving TAVILY_API_KEY from runtime host`);
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const apiKey = await runtimeHost.readSecret("TAVILY_API_KEY");
    if (!apiKey) {
        dbg(`TAVILY_API_KEY not found, checking ignoreMissingApiKey option`);
        if (ignoreMissingApiKey)
            return undefined;
        throw new Error(`TAVILY_API_KEY secret is required to use Tavily search. See ${constants_js_1.DOCS_WEB_SEARCH_TAVILY_URL}.`, { cause: "missing key" });
    }
    try {
        (0, util_js_1.logVerbose)(`tavily: search '${q}'`);
        dbg(`logging Tavily search query: ${q}`);
        trace?.startDetails(`tavily: search`);
        trace?.itemValue(`query`, q);
        // Construct the query string using provided and default parameters.
        dbg(`constructing body for Tavily search request`);
        const body = (0, cleaners_js_1.deleteUndefinedValues)({
            query: q,
            api_key: apiKey,
            max_results: count,
        });
        // Create a fetch function for making the HTTP request.
        const fetch = await (0, fetch_js_1.createFetch)({ trace, retryOn: [429] });
        dbg(`creating fetch instance for Tavily search`);
        const res = await fetch(endPoint, {
            method: "POST",
            headers: {
                ["Content-Type"]: "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(body),
        });
        // Log the search response status for tracing purposes.
        trace?.itemValue(`status`, res.status + " " + res.statusText);
        dbg(`received response status: ${res.status} ${res.statusText}`);
        // Throw an error if the response is not OK, and log details for debugging.
        if (!res.ok) {
            dbg(`response not OK, logging error details: status ${res.status}, statusText ${res.statusText}`);
            dbg(`response not OK, logging error details`);
            const err = await res.text();
            trace?.detailsFenced("error response", err);
            (0, util_js_1.logVerbose)(err);
            throw new Error(`Tavily search failed: ${res.status} ${res.statusText}`);
        }
        // Parse and return the JSON response, logging the results.
        const json = await res.json();
        trace?.detailsFenced("results", json, "yaml");
        dbg(`parsing and transforming JSON response for Tavily search`);
        return json.results.map(({ url, content }) => ({ filename: url, content }));
    }
    finally {
        trace?.endDetails();
    }
}
//# sourceMappingURL=websearch.js.map