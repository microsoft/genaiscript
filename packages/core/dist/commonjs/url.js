"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.uriRedact = uriRedact;
exports.uriTryParse = uriTryParse;
exports.uriScheme = uriScheme;
const node_url_1 = require("node:url");
/**
 * Utility functions for handling URL shortening.
 *
 * Provides functionality to shorten URLs by displaying only the protocol,
 * hostname, and pathname. Adds ellipses for query parameters or fragments.
 *
 * Tags: URL, Shorten, Ellipse, Parsing
 */
/**
 * Shortens a given URL to display only the protocol, hostname, and pathname.
 * Adds ellipses if query parameters or fragments are present.
 *
 * @param url - The complete URL to be shortened.
 * @returns A shortened version of the URL or undefined if parsing fails.
 */
function uriRedact(url) {
    if (!url)
        return undefined;
    const uri = uriTryParse(url);
    if (!uri)
        return undefined;
    let res = `${uri.protocol}//${uri.hostname}${uri.pathname}`; // Construct the base URL with protocol, hostname, and pathname.
    if (uri.search)
        res += `?...`; // Append ellipses if there are query parameters.
    if (uri.hash)
        res += `#...`; // Append ellipses if there is a fragment identifier.
    return res; // Return the shortened URL.
}
/**
 * Attempts to parse a given URL string into a URL object.
 *
 * @param url - The URL string to be parsed. If the input is empty or invalid, the function returns undefined.
 * @returns A URL object if parsing is successful, otherwise undefined.
 */
function uriTryParse(url) {
    if (!url)
        return undefined;
    try {
        return new node_url_1.URL(url);
    }
    catch (error) {
        return undefined;
    }
}
/**
 * Extracts and returns the scheme of a given URL.
 *
 * Removes the trailing colon from the protocol of the URL object and converts it to lowercase.
 *
 * @param uri - The URL object from which the scheme is to be extracted.
 * @returns The URL scheme in lowercase without the trailing colon.
 */
function uriScheme(uri) {
    return uri.protocol.replace(/:$/, "").toLowerCase();
}
//# sourceMappingURL=url.js.map