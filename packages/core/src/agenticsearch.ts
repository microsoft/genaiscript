/**
 * This module provides agentic search functionality that combines multiple search strategies
 * with intelligent query rewriting using LLM for enhanced retrieval performance.
 */

import { TraceOptions } from "./trace"
import { CancellationOptions, checkCancelled } from "./cancellation"
import { vectorSearch } from "./vectorsearch"
import { bingSearch, tavilySearch } from "./websearch"
import { fuzzSearch } from "./fuzzsearch"
import { arrayify, assert } from "./util"
import { toWorkspaceFile, resolveFileContents } from "./file"
import { HTMLEscape } from "./htmlescape"

/**
 * Options for agentic search configuration
 */
export interface AgenticSearchOptions {
    /**
     * Maximum number of results to return
     */
    topK?: number
    
    /**
     * Minimum score threshold for results
     */
    minScore?: number
    
    /**
     * Whether to include web search results
     */
    includeWebSearch?: boolean
    
    /**
     * Whether to include vector search results  
     */
    includeVectorSearch?: boolean
    
    /**
     * Whether to include fuzzy search results
     */
    includeFuzzSearch?: boolean
    
    /**
     * Web search provider to use
     */
    webSearchProvider?: "bing" | "tavily"
    
    /**
     * Embeddings model for vector search
     */
    embeddingsModel?: string
    
    /**
     * Index name for vector search
     */
    indexName?: string
    
    /**
     * Number of query variations to generate
     */
    queryVariations?: number
    
    /**
     * Strategy for combining results
     */
    combinationStrategy?: "weighted" | "rrf" | "simple"
    
    /**
     * Weights for different search types (vector, web, fuzzy)
     */
    searchWeights?: {
        vector?: number
        web?: number
        fuzzy?: number
    }
}

/**
 * Result from agentic search with enhanced metadata
 */
export interface AgenticSearchResult extends WorkspaceFileWithScore {
    /**
     * Source of the result (vector, web, fuzzy, etc.)
     */
    source: string
    
    /**
     * Original query that produced this result
     */
    query: string
    
    /**
     * Additional metadata about the search result
     */
    metadata?: Record<string, any>
}

/**
 * Context for agentic search operations
 */
export interface AgenticSearchContext {
    /**
     * Function to run LLM prompts for query rewriting
     */
    runPrompt: (
        generator: string | PromptGenerator,
        options?: PromptGeneratorOptions
    ) => Promise<RunPromptResult>
    
    /**
     * Retrieval interface for search operations
     */
    retrieval: {
        vectorSearch: (
            query: string,
            files: WorkspaceFile[],
            options?: VectorSearchOptions
        ) => Promise<WorkspaceFileWithScore[]>
        webSearch: (
            query: string,
            options?: {
                count?: number
                provider?: "tavily" | "bing"
                ignoreMissingProvider?: boolean
            }
        ) => Promise<WorkspaceFile[]>
        fuzzSearch: (
            query: string,
            files: WorkspaceFile[],
            options?: FuzzSearchOptions
        ) => Promise<WorkspaceFileWithScore[]>
    }
}

/**
 * Generates query variations using LLM for improved search coverage
 */
async function generateQueryVariations(
    originalQuery: string,
    context: AgenticSearchContext,
    options?: {
        count?: number
        trace?: any
    }
): Promise<string[]> {
    const { count = 3, trace } = options || {}
    
    try {
        const result = await context.runPrompt(
            (_) => {
                _.$`You are an expert search query optimizer. Given a user's search query, generate ${count} alternative formulations that would help find relevant content.

Original query: "${originalQuery}"

Generate ${count} alternative search queries that:
1. Use different keywords/synonyms
2. Rephrase the intent
3. Include related concepts
4. Are concise and specific

Return only the alternative queries, one per line, without numbers or bullets.`
            },
            {
                model: "small",
                label: "query-rewriting",
                cache: true,
            }
        )
        
        if (result.error) {
            trace?.error(`Query rewriting failed: ${result.error.message}`)
            return [originalQuery]
        }
        
        const variations = result.text
            ?.split('\n')
            .map(q => q.trim())
            .filter(q => q.length > 0)
            .slice(0, count) || []
            
        return [originalQuery, ...variations]
    } catch (error) {
        trace?.error(`Query rewriting failed: ${error}`)
        return [originalQuery]
    }
}

/**
 * Combines and ranks results from multiple search strategies using various algorithms
 */
function combineSearchResults(
    results: {
        vector?: AgenticSearchResult[]
        web?: AgenticSearchResult[]
        fuzzy?: AgenticSearchResult[]
    },
    options?: {
        strategy?: "weighted" | "rrf" | "simple"
        weights?: { vector?: number; web?: number; fuzzy?: number }
        topK?: number
    }
): AgenticSearchResult[] {
    const {
        strategy = "weighted",
        weights = { vector: 0.4, web: 0.4, fuzzy: 0.2 },
        topK = 10
    } = options || {}
    
    const allResults: AgenticSearchResult[] = []
    
    // Add results from each source
    if (results.vector) {
        allResults.push(...results.vector)
    }
    if (results.web) {
        allResults.push(...results.web)
    }
    if (results.fuzzy) {
        allResults.push(...results.fuzzy)
    }
    
    if (strategy === "simple") {
        // Simple concatenation with deduplication
        const uniqueResults = new Map<string, AgenticSearchResult>()
        allResults.forEach(result => {
            const key = result.filename || result.content?.substring(0, 100)
            if (!uniqueResults.has(key) || result.score > uniqueResults.get(key)!.score) {
                uniqueResults.set(key, result)
            }
        })
        return Array.from(uniqueResults.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, topK)
    }
    
    if (strategy === "rrf") {
        // Reciprocal Rank Fusion
        const rrfResults = new Map<string, { result: AgenticSearchResult; rrf: number }>()
        const k = 60 // RRF parameter
        
        Object.entries(results).forEach(([source, sourceResults]) => {
            if (!sourceResults) return
            sourceResults.forEach((result, rank) => {
                const key = result.filename || result.content?.substring(0, 100)
                const rrfScore = 1 / (k + rank + 1)
                const weight = weights[source as keyof typeof weights] || 1
                
                if (rrfResults.has(key)) {
                    rrfResults.get(key)!.rrf += rrfScore * weight
                } else {
                    rrfResults.set(key, {
                        result: { ...result, source },
                        rrf: rrfScore * weight
                    })
                }
            })
        })
        
        return Array.from(rrfResults.values())
            .sort((a, b) => b.rrf - a.rrf)
            .map(item => ({ ...item.result, score: item.rrf }))
            .slice(0, topK)
    }
    
    // Weighted strategy (default)
    const weightedResults = new Map<string, AgenticSearchResult>()
    allResults.forEach(result => {
        const key = result.filename || result.content?.substring(0, 100)
        const weight = weights[result.source as keyof typeof weights] || 1
        const weightedScore = result.score * weight
        
        if (!weightedResults.has(key) || weightedScore > weightedResults.get(key)!.score) {
            weightedResults.set(key, { ...result, score: weightedScore })
        }
    })
    
    return Array.from(weightedResults.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
}

/**
 * Performs agentic search using multiple strategies with intelligent query rewriting
 * and result combination algorithms.
 */
export async function agenticSearch(
    query: string,
    files: WorkspaceFile[],
    context: AgenticSearchContext,
    options?: AgenticSearchOptions & TraceOptions & CancellationOptions
): Promise<AgenticSearchResult[]> {
    const {
        topK = 10,
        minScore = 0,
        includeWebSearch = true,
        includeVectorSearch = true,
        includeFuzzSearch = true,
        webSearchProvider,
        embeddingsModel,
        indexName,
        queryVariations = 2,
        combinationStrategy = "weighted",
        searchWeights = { vector: 0.4, web: 0.4, fuzzy: 0.2 },
        trace,
        cancellationToken,
        ...searchOptions
    } = options || {}
    
    assert(!!query, "Search query is required")
    
    const searchTrace = trace?.startTraceDetails(
        `🎯 agentic search <code>${HTMLEscape(query)}</code>`
    )
    
    try {
        searchTrace?.itemValue("strategy", combinationStrategy)
        searchTrace?.itemValue("queryVariations", queryVariations)
        
        // Step 1: Generate query variations using LLM
        checkCancelled(cancellationToken)
        const queries = await generateQueryVariations(query, context, {
            count: queryVariations,
            trace: searchTrace
        })
        
        searchTrace?.itemValue("generatedQueries", queries.length)
        
        // Step 2: Prepare files for search
        const searchFiles = arrayify(files).map(toWorkspaceFile)
        if (searchFiles.length > 0) {
            await resolveFileContents(searchFiles)
        }
        checkCancelled(cancellationToken)
        
        // Step 3: Execute searches in parallel
        const searchResults: {
            vector?: AgenticSearchResult[]
            web?: AgenticSearchResult[]
            fuzzy?: AgenticSearchResult[]
        } = {}
        
        const searchPromises: Promise<void>[] = []
        
        // Vector search
        if (includeVectorSearch && searchFiles.length > 0) {
            searchPromises.push(
                (async () => {
                    try {
                        const vectorResults: AgenticSearchResult[] = []
                        for (const q of queries) {
                            checkCancelled(cancellationToken)
                            const results = await context.retrieval.vectorSearch(q, searchFiles, {
                                topK: Math.ceil(topK / queries.length),
                                minScore,
                                embeddingsModel,
                                indexName,
                                ...searchOptions
                            })
                            vectorResults.push(
                                ...results.map(r => ({
                                    ...r,
                                    source: "vector",
                                    query: q,
                                }))
                            )
                        }
                        searchResults.vector = vectorResults
                        searchTrace?.itemValue("vectorResults", vectorResults.length)
                    } catch (error) {
                        searchTrace?.error(`Vector search failed: ${error}`)
                        searchResults.vector = []
                    }
                })()
            )
        }
        
        // Web search
        if (includeWebSearch) {
            searchPromises.push(
                (async () => {
                    try {
                        const webResults: AgenticSearchResult[] = []
                        for (const q of queries) {
                            checkCancelled(cancellationToken)
                            const results = await context.retrieval.webSearch(q, {
                                provider: webSearchProvider,
                                count: Math.ceil(topK / queries.length),
                                ...searchOptions
                            })
                            webResults.push(
                                ...results.map(r => ({
                                    ...r,
                                    score: 1.0, // Web results don't have inherent scores
                                    source: "web",
                                    query: q,
                                }))
                            )
                        }
                        searchResults.web = webResults
                        searchTrace?.itemValue("webResults", webResults.length)
                    } catch (error) {
                        searchTrace?.error(`Web search failed: ${error}`)
                        searchResults.web = []
                    }
                })()
            )
        }
        
        // Fuzzy search
        if (includeFuzzSearch && searchFiles.length > 0) {
            searchPromises.push(
                (async () => {
                    try {
                        const fuzzyResults: AgenticSearchResult[] = []
                        for (const q of queries) {
                            checkCancelled(cancellationToken)
                            const results = await context.retrieval.fuzzSearch(q, searchFiles, {
                                topK: Math.ceil(topK / queries.length),
                                minScore,
                                ...searchOptions
                            })
                            fuzzyResults.push(
                                ...results.map(r => ({
                                    ...r,
                                    source: "fuzzy",
                                    query: q,
                                }))
                            )
                        }
                        searchResults.fuzzy = fuzzyResults
                        searchTrace?.itemValue("fuzzyResults", fuzzyResults.length)
                    } catch (error) {
                        searchTrace?.error(`Fuzzy search failed: ${error}`)
                        searchResults.fuzzy = []
                    }
                })()
            )
        }
        
        // Wait for all searches to complete
        await Promise.all(searchPromises)
        checkCancelled(cancellationToken)
        
        // Step 4: Combine and rank results
        const combinedResults = combineSearchResults(searchResults, {
            strategy: combinationStrategy,
            weights: searchWeights,
            topK
        })
        
        // Apply minimum score filter
        const filteredResults = combinedResults.filter(r => r.score >= minScore)
        
        searchTrace?.itemValue("finalResults", filteredResults.length)
        searchTrace?.files(filteredResults, {
            maxLength: 0,
            skipIfEmpty: true
        })
        
        return filteredResults
        
    } finally {
        searchTrace?.endDetails()
    }
}