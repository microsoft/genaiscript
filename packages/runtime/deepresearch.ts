/**
 * Options for conducting deep research using AI-powered iterative search.
 */
export type DeepResearchOptions = {
    /**
     * The research topic or query to investigate
     */
    topic: string
    
    /**
     * How many search queries to generate per iteration (breadth)
     * @default 4
     */
    breadth?: number
    
    /**
     * How many recursive research iterations to perform (depth)
     * @default 2
     */
    depth?: number
    
    /**
     * Maximum number of search results to analyze per query
     * @default 5
     */
    searchResultsPerQuery?: number
    
    /**
     * Context for running the research prompts
     */
    ctx?: ChatGenerationContext
    
    /**
     * Progress callback to track research progress
     */
    onProgress?: (progress: {
        currentDepth: number
        totalDepth: number
        currentQuery?: string
        completedQueries: number
        totalQueries: number
    }) => void
}

/**
 * Result from deep research containing findings and metadata
 */
export type DeepResearchResult = {
    /**
     * Structured research report
     */
    report: {
        title: string
        executiveSummary: string
        keyFindings: Array<{
            finding: string
            confidence: "high" | "medium" | "low"
            sources?: string[]
        }>
        gaps?: string[]
        furtherResearch?: string[]
    }
    
    /**
     * Research statistics
     */
    stats: {
        iterations: number
        searchesConducted: number
        findingsDiscovered: number
        sourcesConsulted: number
    }
    
    /**
     * All findings collected during research
     */
    allFindings: Array<{
        text: string
        query: string
        sourcesQuality: number
    }>
    
    /**
     * Sources consulted during research
     */
    sources: string[]
}