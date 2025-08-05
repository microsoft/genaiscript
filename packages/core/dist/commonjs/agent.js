"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentCreateCache = agentCreateCache;
exports.agentQueryMemory = agentQueryMemory;
exports.agentAddMemory = agentAddMemory;
exports.traceAgentMemory = traceAgentMemory;
const cache_js_1 = require("./cache.js");
const constants_js_1 = require("./constants.js");
const error_js_1 = require("./error.js");
const htmlescape_js_1 = require("./htmlescape.js");
const pretty_js_1 = require("./pretty.js");
const util_js_1 = require("./util.js");
const debug_1 = __importDefault(require("debug"));
const dbg = (0, debug_1.default)("agent:memory");
function agentCreateCache(options) {
    const cache = (0, cache_js_1.createCache)(constants_js_1.AGENT_MEMORY_CACHE_NAME, {
        type: "memory",
        userState: options.userState,
        lookupOnly: options.lookupOnly,
    });
    return cache;
}
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
async function agentQueryMemory(cache, ctx, query) {
    if (!query)
        return undefined;
    const memories = await loadMemories(cache);
    if (!memories?.length)
        return undefined;
    let memoryAnswer;
    // always pre-query memory with cheap model
    dbg(`query: ${query}`);
    const res = await ctx.runPrompt(async (_) => {
        _.$ `Return the contextual information useful to answer <QUERY> from the content in <MEMORY>.
            - Use MEMORY as the only source of information.
            - If you cannot find relevant information to answer <QUERY>, return ${constants_js_1.TOKEN_NO_ANSWER}. DO NOT INVENT INFORMATION.
            - Be concise. Keep it short. The output is used by another LLM.
            - Provide important details like identifiers and names.`.role("system");
        _.def("QUERY", query);
        await defMemory(cache, _);
    }, {
        model: "memory",
        system: [],
        flexTokens: constants_js_1.AGENT_MEMORY_FLEX_TOKENS,
        label: "agent memory query",
        cache: "agent_memory",
    });
    if (!res.error)
        memoryAnswer = res.text.includes(constants_js_1.TOKEN_NO_ANSWER) ? "" : res.text;
    else
        dbg(`error: ${(0, error_js_1.errorMessage)(res.error)}`);
    dbg(`answer: ${(0, util_js_1.ellipse)(memoryAnswer, 128)}`);
    return memoryAnswer;
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
async function agentAddMemory(cache, agent, query, text, options) {
    const { trace } = options || {};
    const cacheKey = { agent, query };
    const cachedValue = {
        ...cacheKey,
        answer: text,
        createdAt: Date.now(),
    };
    dbg(`add ${agent}: ${(0, util_js_1.ellipse)(query, 80)} -> ${(0, util_js_1.ellipse)(text, 128)}`);
    await cache.set(cacheKey, cachedValue);
    trace?.detailsFenced(`🧠 agent memory: ${(0, htmlescape_js_1.HTMLEscape)(query)}`, (0, htmlescape_js_1.HTMLEscape)((0, pretty_js_1.prettifyMarkdown)(cachedValue.answer)), "markdown");
}
async function loadMemories(cache) {
    const memories = await cache?.values();
    memories?.sort((l, r) => l.createdAt - r.createdAt);
    return memories;
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
async function traceAgentMemory(options) {
    const { trace } = options || {};
    if (!trace)
        return;
    const cache = agentCreateCache({
        userState: options.userState,
        lookupOnly: true,
    });
    const memories = await loadMemories(cache);
    if (memories?.length) {
        try {
            trace?.startDetails("🧠 agent memory");
            memories
                .reverse()
                .forEach(({ agent, query, answer }) => trace?.detailsFenced(`👤 ${agent}: ${(0, htmlescape_js_1.HTMLEscape)(query)}`, (0, htmlescape_js_1.HTMLEscape)((0, pretty_js_1.prettifyMarkdown)(answer)), "markdown"));
        }
        finally {
            trace?.endDetails();
        }
    }
}
async function defMemory(cache, ctx) {
    const memories = await cache.values();
    memories.reverse().forEach(({ agent, query, answer }, index) => ctx.def("MEMORY", `${agent}> ${query}?
            ${answer}
            `, {
        flex: memories.length - index,
    }));
}
//# sourceMappingURL=agent.js.map