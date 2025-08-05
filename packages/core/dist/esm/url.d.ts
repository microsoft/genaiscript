import { URL } from "node:url";
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
export declare function uriRedact(url: string): string;
/**
 * Attempts to parse a given URL string into a URL object.
 *
 * @param url - The URL string to be parsed. If the input is empty or invalid, the function returns undefined.
 * @returns A URL object if parsing is successful, otherwise undefined.
 */
export declare function uriTryParse(url: string): URL;
/**
 * Extracts and returns the scheme of a given URL.
 *
 * Removes the trailing colon from the protocol of the URL object and converts it to lowercase.
 *
 * @param uri - The URL object from which the scheme is to be extracted.
 * @returns The URL scheme in lowercase without the trailing colon.
 */
export declare function uriScheme(uri: URL): string;
//# sourceMappingURL=url.d.ts.map