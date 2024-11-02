/**
 * Defines the structure for a URL adapter that can convert friendly URLs
 * to fetchable URLs and adapt response bodies to strings.
 */
export interface UrlAdapter {
    /**
     * Optional content type for the URL adapter.
     * Can be either "text/plain" or "application/json".
     */
    contentType?: "text/plain" | "application/json"

    /**
     * Converts a friendly URL into a URL that can be used to fetch the content.
     * @param url - The friendly URL to be converted.
     * @returns The fetchable URL if there's a match, otherwise undefined.
     */
    matcher: (url: string) => string

    /**
     * Optional adapter function to convert the body of the response to a string.
     * @param body - The response body to be converted.
     * @returns The converted string or undefined.
     */
    adapter?: (body: string | any) => string | undefined
}

/**
 * Default implementations of URL adapters.
 * Currently, it includes an adapter for GitHub blob URLs.
 */
export const defaultUrlAdapters: UrlAdapter[] = [
    {
        /**
         * Matches GitHub blob URLs and converts them to raw content URLs.
         * Extracts user, repository, and file path from the blob URL.
         * Constructs a raw URL using the extracted components.
         * @param url - The GitHub blob URL.
         * @returns The corresponding raw URL or undefined if no match is found.
         */
        matcher: (url) => {
            const m = /^https:\/\/github.com\/(\w+)\/(\w+)\/blob\/(.+)#?/i.exec(
                url
            )
            return m
                ? `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}`
                : undefined
        },
    },
]
