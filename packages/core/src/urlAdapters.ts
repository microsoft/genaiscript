export interface UrlAdapter {
    contentType?: "text/plain" | "application/json"

    /**
     * Given a friendly URL, return a URL that can be used to fetch the content.
     * @param url
     * @returns
     */
    matcher: (url: string) => string

    /**
     * Convers the body of the response to a string.
     * @param body
     * @returns
     */
    adapter?: (body: string | any) => string | undefined
}

export const defaultUrlAdapters: UrlAdapter[] = [
    {
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
