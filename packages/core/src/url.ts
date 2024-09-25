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
export function ellipseUri(url: string) {
    try {
        const uri = new URL(url) // Parse the URL string into a URL object.
        let res = `${uri.protocol}//${uri.hostname}${uri.pathname}` // Construct the base URL with protocol, hostname, and pathname.

        if (uri.search) res += `?...` // Append ellipses if there are query parameters.
        if (uri.hash) res += `#...` // Append ellipses if there is a fragment identifier.

        return res // Return the shortened URL.
    } catch {
        return undefined // Return undefined if the URL is invalid.
    }
}
