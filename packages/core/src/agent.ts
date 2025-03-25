import { MemoryCache } from "./cache"
import {
    AGENT_MEMORY_CACHE_NAME,
    AGENT_MEMORY_FLEX_TOKENS,
    TOKEN_NO_ANSWER,
} from "./constants"
import { errorMessage } from "./error"
import { GenerationOptions } from "./generation"
import { HTMLEscape } from "./html"
import { prettifyMarkdown } from "./markdown"
import { MarkdownTrace, TraceOptions } from "./trace"
import { logVerbose } from "./util"

/**
 * Queries the agent's memory to retrieve contextual information relevant to a given query.
 * Pre-processes memory using a lightweight model and utilizes it as the sole source of information.
 *
 * - If the query is empty or no memories exist, returns undefined.
 * - Executes a prompt-based query on memory to extract useful details.
 * - Response excludes fabricated information and adheres to concise formatting.
 * - Returns the textual memory answer or an empty string if no relevant match is found.
 *
 * @param ctx - The chat generation context responsible for executing prompt-based memory queries.
 * @param query - Input query for which relevant memory details are retrieved.
 * @param options - Generation and tracing options performing user state management and result tracing.
 * @returns Memory answer or undefined if no relevant memories are retrieved.
 */
export async function agentQueryMemory(
    ctx: ChatGenerationContext,
    query: string,
    options: Pick<GenerationOptions, "userState"> & Required<TraceOptions>
) {
    if (!query) return undefined

    const memories = await loadMemories(options)
    if (!memories?.length) return undefined

    let memoryAnswer: string | undefined
    // always pre-query memory with cheap model
    const res = await ctx.runPrompt(
        async (_) => {
            _.$`Return the contextual information useful to answer <QUERY> from the content in <MEMORY>.
            - Use MEMORY as the only source of information.
            - If you cannot find relevant information to answer <QUERY>, return ${TOKEN_NO_ANSWER}. DO NOT INVENT INFORMATION.
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
            flexTokens: AGENT_MEMORY_FLEX_TOKENS,
            label: "agent memory query",
        }
    )
    if (!res.error)
        memoryAnswer = res.text.includes(TOKEN_NO_ANSWER) ? "" : res.text
    else logVerbose(`agent memory query error: ${errorMessage(res.error)}`)
    return memoryAnswer
}

/**
 * Adds a memory entry for a given agent and query. Stores the query, agent,
 * and corresponding text/answer into a memory cache. Updates the trace with
 * details of the memory entry for auditing purposes.
 *
 * @param agent - Identifier for the agent associated with the memory.
 * @param query - The query or context associated with the memory entry.
 * @param text - The response or answer to be stored in association with the query.
 * @param options - Configuration options, including user state and tracing details.
 */
export async function agentAddMemory(
    agent: string,
    query: string,
    text: string,
    options: Pick<GenerationOptions, "userState"> & Required<TraceOptions>
) {
    const { trace } = options || {}
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

async function loadMemories(options: Pick<GenerationOptions, "userState">) {
    const cache = MemoryCache.byName<
        { agent: string; query: string },
        {
            agent: string
            query: string
            answer: string
        }
    >(AGENT_MEMORY_CACHE_NAME, {
        lookupOnly: true,
        userState: options.userState,
    })
    const memories = await cache?.values()
    return memories
}

/**
 * Traces the agent memory and logs the details in a structured format.
 *
 * Initiates a trace section for agent memory, retrieves stored memory entries,
 * and iterates over them in reverse order. For each memory entry, logs the agent,
 * corresponding query, and the associated answer in a fenced Markdown format.
 * Closes the trace section after processing all entries.
 *
 * Requires memory loading functionality and tracing options. Useful for debugging
 * or visualizing the memory contents in a readable format.
 */
export async function traceAgentMemory(
    options: Pick<GenerationOptions, "userState"> & Required<TraceOptions>
) {
    const { trace } = options || {}
    const memories = await loadMemories(options)
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
