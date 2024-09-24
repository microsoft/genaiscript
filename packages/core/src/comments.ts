import { JSONLineCache } from "./cache"
import { COMMENTS_CACHE } from "./constants"

export interface CommentKey {
    uri: string
    line: number
    source: string
}

export function commentsCache(options?: { snapshot?: boolean }) {
    const cache = JSONLineCache.byName<CommentKey, CommentThread>(
        COMMENTS_CACHE,
        options
    )
    return cache
}

export async function commentsForSource(source: string) {
    const cache = commentsCache()
    const entries = await cache.entries()
    return entries.map(({ val }) => val).filter((c) => c.source === source)
}
