import { MemoryCache } from "./cache"
import { AGENT_MEMORY_CACHE_NAME } from "./constants"
import { MarkdownTrace } from "./trace"

export async function agentAddMemory(
    agent: string,
    query: string,
    text: string,
    trace: MarkdownTrace
) {
    const cache = MemoryCache.byName<
        { agent: string; query: string },
        {
            agent: string
            query: string
            answer: string
        }
    >(AGENT_MEMORY_CACHE_NAME)
    const cacheKey = { agent, query }
    const cachedValue = {
        ...cacheKey,
        answer: text,
    }
    await cache.set(cacheKey, cachedValue)
    trace.detailsFenced(
        `🧠 agent memory: ${query}`,
        cachedValue.answer,
        "markdown"
    )
}

export async function traceAgentMemory(trace: MarkdownTrace) {
    const cache = MemoryCache.byName<
        { agent: string; query: string },
        {
            agent: string
            query: string
            answer: string
        }
    >(AGENT_MEMORY_CACHE_NAME, { lookupOnly: true })
    if (cache) {
        const memories = await cache.values()
        try {
            trace.startDetails("🧠 agent memory")
            const res = memories
                .reverse()
                .forEach(({ agent, query, answer }) =>
                    trace.detailsFenced(
                        `${agent}> ${query}`,
                        answer,
                        "markdown"
                    )
                )
        } finally {
            trace.endDetails()
        }
    }
}
