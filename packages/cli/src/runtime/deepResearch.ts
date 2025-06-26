/// <reference path="../../genaisrc/genaiscript.d.ts" />

import type { DeepResearchOptions, DeepResearchResult } from "../../../runtime/deepresearch"

/**
 * GenAIScript Deep Research Runtime Helper
 * Provides comprehensive iterative research functionality using web searches and AI analysis.
 */

/**
 * Conducts comprehensive iterative research on a topic using web searches and AI analysis.
 * Inspired by the deep-research project, this function performs multiple rounds of searches,
 * analyzes results, generates follow-up questions, and produces a structured research report.
 *
 * @param options - Configuration options for the deep research process
 * @returns A comprehensive research result with findings, report, and metadata
 */
export async function deepResearch(
    options: DeepResearchOptions
): Promise<DeepResearchResult> {
    const {
        topic,
        breadth = 4,
        depth = 2,
        searchResultsPerQuery = 5,
        ctx = env.generator,
        onProgress
    } = options

    // Initialize research state
    let researchMemory = {
        topic,
        startTime: new Date().toISOString(),
        iterations: 0,
        searches: [],
        findings: [],
        questions: {
            asked: [],
            pending: [],
        },
        sources: [],
        primaryQuestion: "",
        subtopics: [],
        completionTime: "",
        report: {},
    }

    const reportProgress = (update: any) => {
        if (onProgress) {
            onProgress({
                currentDepth: depth - Math.floor(researchMemory.iterations / breadth),
                totalDepth: depth,
                currentQuery: update.currentQuery,
                completedQueries: researchMemory.iterations,
                totalQueries: breadth * depth,
                ...update
            })
        }
    }

    // Step 1: Generate initial research questions
    const questionsResult = await ctx.runPrompt(
        (promptCtx) => {
            promptCtx.$`You are an expert researcher tasked with planning a comprehensive investigation on the topic: "${topic}".
      
Break down this topic into:
1. A clear primary research question
2. ${breadth} specific search queries that would yield valuable information
3. Important subtopics that should be explored

Generate search queries that are specific, varied in perspective, and would provide comprehensive information.`
        },
        {
            label: "generate_research_questions",
            model: "large",
            cache: "deep-research",
            responseSchema: {
                type: "object",
                properties: {
                    primaryQuestion: {
                        type: "string",
                        description: "The main research question",
                    },
                    searchQueries: {
                        type: "array",
                        items: { type: "string" },
                        description: "Specific search queries to use for web searches",
                    },
                    subtopics: {
                        type: "array",
                        items: { type: "string" },
                        description: "Subtopics to explore within the main topic",
                    },
                },
                required: ["primaryQuestion", "searchQueries", "subtopics"],
            },
        }
    )

    if (!questionsResult.json)
        throw new Error("Failed to generate research questions")
        
    researchMemory.primaryQuestion = questionsResult.json.primaryQuestion
    researchMemory.questions.pending = questionsResult.json.searchQueries || []
    researchMemory.subtopics = questionsResult.json.subtopics || []

    // Step 2: Iterative research loop
    const totalIterations = Math.min(breadth * depth, researchMemory.questions.pending.length)
    
    while (
        researchMemory.iterations < totalIterations &&
        researchMemory.questions.pending.length > 0
    ) {
        const query = researchMemory.questions.pending.shift()
        researchMemory.questions.asked.push(query)
        researchMemory.iterations++

        reportProgress({ currentQuery: query })

        // Perform web search
        let searchResults
        try {
            searchResults = await retrieval.webSearch(query, { count: searchResultsPerQuery })
        } catch (error) {
            console.error("Search error:", error)
            searchResults = []
        }

        if (searchResults.length === 0) {
            continue
        }

        // Store source URLs
        searchResults.forEach((result) => {
            if (
                result.filename &&
                !researchMemory.sources.includes(result.filename)
            ) {
                researchMemory.sources.push(result.filename)
            }
        })

        // Format and analyze search results
        const searchContent = searchResults
            .map((result, index) => {
                const content = result.content || "No content available"
                return `[Source ${index + 1}: ${result.filename}]\n${content.substring(0, 2000)}...\n`
            })
            .join("\n\n")

        const analysisResult = await ctx.runPrompt(
            (promptCtx) => {
                promptCtx.def("SEARCH_RESULTS", searchContent)
                promptCtx.$`You are an expert research analyst. Review these search results for the query: "${query}" in <SEARCH_RESULTS>.

Analyze these results to identify:
1. Key findings and facts (max 5)
2. New questions that arise from this information (max 3)
3. Assess the quality and reliability of these sources (1-10 scale)`
            },
            {
                label: `analyze_search_results_${researchMemory.iterations}`,
                model: "small",
                cache: "deep-research",
                responseSchema: {
                    type: "object",
                    properties: {
                        summary: {
                            type: "string",
                            description: "Brief summary of the search results",
                        },
                        keyFindings: {
                            type: "array",
                            items: { type: "string" },
                            description: "Key facts or findings from the search results",
                        },
                        newQuestions: {
                            type: "array",
                            items: { type: "string" },
                            description: "New questions that arise from these findings",
                        },
                        sourcesQuality: {
                            type: "number",
                            minimum: 1,
                            maximum: 10,
                            description: "Rating of the quality of the sources (1-10)",
                        },
                    },
                    required: ["summary", "keyFindings", "newQuestions", "sourcesQuality"],
                },
            }
        )

        // Store results
        researchMemory.searches.push({
            query,
            timestamp: new Date().toISOString(),
            sourcesCount: searchResults.length,
            analysis: analysisResult.json,
        })

        // Add findings
        researchMemory.findings = [
            ...researchMemory.findings,
            ...analysisResult.json.keyFindings.map((finding) => ({
                text: finding,
                query: query,
                sourcesQuality: analysisResult.json.sourcesQuality,
            })),
        ]

        // Add new questions for further research (depth control)
        if (researchMemory.iterations < totalIterations) {
            const newQuestions = analysisResult.json.newQuestions.filter(
                (q) =>
                    !researchMemory.questions.asked.includes(q) &&
                    !researchMemory.questions.pending.includes(q)
            )
            // Limit new questions to maintain breadth/depth balance
            const questionsToAdd = newQuestions.slice(0, Math.max(1, Math.floor(breadth / 2)))
            researchMemory.questions.pending.push(...questionsToAdd)
        }
    }

    // Step 3: Generate comprehensive research report
    const allFindings = researchMemory.findings
        .map(
            (f) =>
                `- ${f.text} (Source: ${f.query}, Quality: ${f.sourcesQuality}/10)`
        )
        .join("\n")

    const report = await ctx.runPrompt(
        (promptCtx) => {
            promptCtx.def("RESEARCH_TOPIC", topic)
            promptCtx.def("PRIMARY_QUESTION", researchMemory.primaryQuestion)
            promptCtx.def("FINDINGS", allFindings)
            promptCtx.def("SEARCHES", researchMemory.questions.asked.join("\n- "))
            promptCtx.def("SOURCES", researchMemory.sources.join("\n- "))

            promptCtx.$`You are an expert researcher creating a comprehensive report on <RESEARCH_TOPIC>.

Create a structured research report with these elements:
1. A descriptive title
2. An executive summary of findings  
3. Key findings with confidence levels (high/medium/low)
4. Knowledge gaps requiring further research
5. Recommendations for further research

Base your analysis on the findings in <FINDINGS> from searches conducted: <SEARCHES>.
Sources consulted: <SOURCES>`
        },
        {
            label: "generate_research_report",
            model: "large",
            cache: "deep-research",
            responseSchema: {
                type: "object",
                properties: {
                    title: {
                        type: "string",
                        description: "Descriptive title for the research report",
                    },
                    executiveSummary: {
                        type: "string",
                        description: "Concise summary of the entire research",
                    },
                    keyFindings: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                finding: { type: "string" },
                                confidence: {
                                    type: "string",
                                    enum: ["high", "medium", "low"],
                                },
                                sources: { type: "array", items: { type: "string" } },
                            },
                            required: ["finding", "confidence"],
                        },
                    },
                    gaps: {
                        type: "array",
                        items: { type: "string" },
                        description: "Knowledge gaps that require further research",
                    },
                    furtherResearch: {
                        type: "array",
                        items: { type: "string" },
                        description: "Suggested areas for further investigation",
                    },
                },
                required: ["title", "executiveSummary", "keyFindings"],
            },
        }
    )

    researchMemory.completionTime = new Date().toISOString()
    researchMemory.report = report.json

    return {
        report: report.json,
        stats: {
            iterations: researchMemory.iterations,
            searchesConducted: researchMemory.questions.asked.length,
            findingsDiscovered: researchMemory.findings.length,
            sourcesConsulted: researchMemory.sources.length,
        },
        allFindings: researchMemory.findings,
        sources: researchMemory.sources,
    }
}

// Re-export types for external use
export type { DeepResearchOptions, DeepResearchResult }