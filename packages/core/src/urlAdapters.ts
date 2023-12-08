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
