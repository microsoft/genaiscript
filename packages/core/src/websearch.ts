import debug from "debug";
const dbg = debug("genaiscript:websearch");

import { deleteUndefinedValues } from "./cleaners";
import {
  BING_SEARCH_ENDPOINT,
  DOCS_WEB_SEARCH_BING_SEARCH_URL,
  DOCS_WEB_SEARCH_TAVILY_URL,
  TAVILY_ENDPOINT,
} from "./constants";
import { createFetch } from "./fetch";
import { runtimeHost } from "./host";
import { MarkdownTrace, TraceOptions } from "./trace";
import { logVerbose } from "./util";

/**
 * Converts an object into a URL search parameters string.
 * Iterates over object properties and appends them to a URLSearchParams instance.
 * @param o - The object to be converted.
 * @returns A string representing URL search parameters.
 */
function toURLSearchParams(o: any) {
  const params = new URLSearchParams();
  for (const key in o) {
    if (o.hasOwnProperty(key) && o[key] !== undefined) {
      params.append(key, o[key]);
    }
  }
  return params.toString();
}

/**
 * Performs a Bing search using the given query and options.
 * Utilizes the Bing Search API to construct and execute the request with query parameters.
 * Handles API key retrieval, query parameter construction, and API response processing.
 * Logs the search response status and traces the query execution.
 * @param q - The search query string.
 * @param options - Optional parameters including whether to ignore a missing API key, endpoint, result count, region, freshness, response filter, safe search settings, and trace options.
 * @returns A Promise resolving to a list of search responses, each containing a URL and snippet.
 * @throws Error if the API key is missing or if the request fails.
 */
export async function bingSearch(
  q: string,
  options?: {
    ignoreMissingApiKey?: boolean;
    endPoint?: string;
    count?: number;
    cc?: string;
    freshness?: string;
    responseFilter?: string;
    safeSearch?: string;
  } & TraceOptions,
): Promise<WorkspaceFile[]> {
  const {
    ignoreMissingApiKey,
    trace,
    endPoint = BING_SEARCH_ENDPOINT,
    count,
    cc,
    freshness,
    responseFilter = "Webpages",
    safeSearch = "strict",
  } = options || {};

  // Return an empty response if the query is empty.
  dbg(`checking if query is empty`);
  if (!q) return [];

  // Retrieve the API key from the runtime host.
  dbg(`retrieving BING_SEARCH_API_KEY from runtime host`);
  const apiKey = await runtimeHost.readSecret("BING_SEARCH_API_KEY");
  dbg(`retrieving BING_SEARCH_API_KEY from runtime host`);
  if (!apiKey) {
    if (ignoreMissingApiKey) return undefined;
    dbg(`BING_SEARCH_API_KEY not found, checking ignoreMissingApiKey option`);
    throw new Error(
      `BING_SEARCH_API_KEY secret is required to use bing search. See ${DOCS_WEB_SEARCH_BING_SEARCH_URL}.`,
      { cause: "missing key" },
    );
  }

  try {
    trace?.startDetails(`bing: search`);
    dbg(`initiating Bing search trace`);
    trace?.itemValue(`query`, q);
    dbg(`trace started for Bing search`);
    // Construct the query string using provided and default parameters.
    const query = toURLSearchParams({
      q,
      count,
      cc,
      freshness,
      responseFilter,
      safeSearch,
    });

    // Construct the full URL for the search request.
    const url = endPoint + "?" + query;

    // Create a fetch function for making the HTTP request.
    dbg(`constructing full URL for Bing search request: ${url}`);
    const fetch = await createFetch({ trace });
    dbg(`creating fetch instance for Bing search`);
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
      },
    });

    // Log the search response status for tracing purposes.
    trace?.itemValue(`status`, res.status + " " + res.statusText);
    dbg(`received response status: ${res.status} ${res.statusText}`);

    // Throw an error if the response is not OK, and log details for debugging.
    if (!res.ok) {
      dbg(
        `response not OK, logging error details: status ${res.status}, statusText ${res.statusText}`,
      );
      trace?.detailsFenced("error response", await res.text());
      throw new Error(`Bing search failed: ${res.status} ${res.statusText}`);
    }

    // Parse and return the JSON response, logging the results.
    const json = (await res.json()) as {
      webPages?: {
        value: {
          snippet: string;
          url: string;
        }[];
      };
    };
    trace?.detailsFenced("results", json, "yaml");
    dbg(`parsing and transforming JSON response for Bing search`);
    return (
      json.webPages?.value?.map(
        ({ snippet, url }) =>
          ({
            filename: url,
            content: snippet,
          }) satisfies WorkspaceFile,
      ) || []
    );
  } finally {
    trace?.endDetails();
  }
}

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
export async function tavilySearch(
  q: string,
  options?: {
    ignoreMissingApiKey?: boolean;
    endPoint?: string;
    count?: number;
  } & TraceOptions,
): Promise<WorkspaceFile[]> {
  const { trace, count, ignoreMissingApiKey, endPoint = TAVILY_ENDPOINT } = options || {};

  // Return an empty response if the query is empty.
  if (!q) return [];
  dbg(`query is empty, returning empty response`);

  // Retrieve the API key from the runtime host.
  dbg(`retrieving TAVILY_API_KEY from runtime host`);
  const apiKey = await runtimeHost.readSecret("TAVILY_API_KEY");
  if (!apiKey) {
    dbg(`TAVILY_API_KEY not found, checking ignoreMissingApiKey option`);
    if (ignoreMissingApiKey) return undefined;
    throw new Error(
      `TAVILY_API_KEY secret is required to use Tavily search. See ${DOCS_WEB_SEARCH_TAVILY_URL}.`,
      { cause: "missing key" },
    );
  }

  try {
    logVerbose(`tavily: search '${q}'`);
    dbg(`logging Tavily search query: ${q}`);
    trace?.startDetails(`tavily: search`);
    trace?.itemValue(`query`, q);

    // Construct the query string using provided and default parameters.
    dbg(`constructing body for Tavily search request`);
    const body = deleteUndefinedValues({
      query: q,
      api_key: apiKey,
      max_results: count,
    });

    // Create a fetch function for making the HTTP request.
    const fetch = await createFetch({ trace, retryOn: [429] });
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
      dbg(
        `response not OK, logging error details: status ${res.status}, statusText ${res.statusText}`,
      );
      dbg(`response not OK, logging error details`);
      const err = await res.text();
      trace?.detailsFenced("error response", err);
      logVerbose(err);
      throw new Error(`Tavily search failed: ${res.status} ${res.statusText}`);
    }

    // Parse and return the JSON response, logging the results.
    const json: {
      query: string;
      results: { url: string; content: string }[];
    } = await res.json();
    trace?.detailsFenced("results", json, "yaml");
    dbg(`parsing and transforming JSON response for Tavily search`);
    return json.results.map(
      ({ url, content }) => ({ filename: url, content }) satisfies WorkspaceFile,
    );
  } finally {
    trace?.endDetails();
  }
}
