import { MemoryCache } from "./cache"
import { AGENT_MEMORY_CACHE_NAME, TOKEN_NO_ANSWER } from "./constants"
import { errorMessage } from "./error"
import { HTMLEscape } from "./html"
import { prettifyMarkdown } from "./markdown"
import { unthink } from "./think"
import { MarkdownTrace } from "./trace"
import { logVerbose } from "./util"

export async function agentQueryMemory(
    ctx: ChatGenerationContext,
    query: string
) {
    if (!query) return undefined

    const memories = await loadMemories()
    if (!memories?.length) return undefined

    let memoryAnswer: string | undefined
    // always pre-query memory with cheap model
    const res = await ctx.runPrompt(
        async (_) => {
            _.$`Return the contextual information useful to answer QUERY from the content in  MEMORY.
            - Use MEMORY as the only source of information.
            - If you cannot find relevant information to answer QUERY, return ${TOKEN_NO_ANSWER}. DO NOT INVENT INFORMATION.
            - Be concise. Keep it short. The output is used by another LLM.
            - Provide important details like identifiers and names.`.role(
                "system"
            )
            _.def("QUERY", query)
            await defMemory(_)
        },
        {
            model: "memory",
            system: [],
            flexTokens: 20000,
            label: "agent memory query",
        }
    )
    if (!res.error)
        memoryAnswer = res.text.includes(TOKEN_NO_ANSWER) ? "" : res.text
    else logVerbose(`agent memory query error: ${errorMessage(res.error)}`)
    return memoryAnswer
}

export async function agentAddMemory(
    agent: string,
    query: string,
    text: string,
    trace: MarkdownTrace
) {
    text = unthink(text)
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
        `🧠 agent memory: ${HTMLEscape(query)}`,
        HTMLEscape(prettifyMarkdown(cachedValue.answer)),
        "markdown"
    )
}

async function loadMemories() {
    const cache = MemoryCache.byName<
        { agent: string; query: string },
        {
            agent: string
            query: string
            answer: string
        }
    >(AGENT_MEMORY_CACHE_NAME, { lookupOnly: true })
    const memories = await cache?.values()
    return memories
}

export async function traceAgentMemory(trace: MarkdownTrace) {
    const memories = await loadMemories()
    if (memories) {
        try {
            trace.startDetails("🧠 agent memory")
            memories
                .reverse()
                .forEach(({ agent, query, answer }) =>
                    trace.detailsFenced(
                        `👤 ${agent}: ${HTMLEscape(query)}`,
                        HTMLEscape(prettifyMarkdown(answer)),
                        "markdown"
                    )
                )
        } finally {
            trace.endDetails()
        }
    }
}

async function defMemory(ctx: ChatTurnGenerationContext) {
    const cache = MemoryCache.byName<
        { agent: string; query: string },
        {
            agent: string
            query: string
            answer: string
        }
    >(AGENT_MEMORY_CACHE_NAME)
    const memories = await cache.values()
    memories.reverse().forEach(({ agent, query, answer }, index) =>
        ctx.def(
            "MEMORY",
            `${agent}> ${query}?
            ${answer}
            `,
            {
                flex: memories.length - index,
            }
        )
    )
}
