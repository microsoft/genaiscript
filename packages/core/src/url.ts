export function ellipseUri(url: string) {
    try {
        const uri = new URL(url)
        let res = `${uri.protocol}//${uri.hostname}${uri.pathname}`
        if (uri.search) res += `?...`
        if (uri.hash) res += `#...`
        return res
    } catch {
        return undefined
    }
}
