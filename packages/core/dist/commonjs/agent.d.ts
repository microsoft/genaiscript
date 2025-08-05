import type { GenerationOptions } from "./generation.js";
import type { TraceOptions } from "./trace.js";
import type { ChatGenerationContext, WorkspaceFileCache } from "./types.js";
export type AgentMemoryCacheKey = {
    agent: string;
    query: string;
};
export type AgentMemoryCacheValue = AgentMemoryCacheKey & {
    answer: string;
    createdAt: number;
};
export type AgentMemoryCache = WorkspaceFileCache<AgentMemoryCacheKey, AgentMemoryCacheValue>;
export declare function agentCreateCache(options: Pick<GenerationOptions, "userState"> & {
    lookupOnly?: boolean;
}): AgentMemoryCache;
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
export declare function agentQueryMemory(cache: AgentMemoryCache, ctx: ChatGenerationContext, query: string): Promise<string>;
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
export declare function agentAddMemory(cache: AgentMemoryCache, agent: string, query: string, text: string, options: Required<TraceOptions>): Promise<void>;
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
export declare function traceAgentMemory(options: Pick<GenerationOptions, "userState"> & Required<TraceOptions>): Promise<void>;
//# sourceMappingURL=agent.d.ts.map