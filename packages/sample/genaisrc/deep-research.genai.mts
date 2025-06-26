script({
    title: "Deep Research",
    description:
        "Performs comprehensive research on a topic using web searches and multiple iterations with breadth and depth control",
    parameters: {
        topic: {
            description: "The topic to research",
            type: "string",
            default: "quantum computing advancements in the last year",
        },
        breadth: {
            description: "Number of search queries to generate per iteration (breadth)",
            type: "number",
            default: 4,
        },
        depth: {
            description: "Number of recursive research iterations to perform (depth)",
            type: "number",
            default: 2,
        },
        searchResultsPerQuery: {
            description: "Maximum number of search results to analyze per query",
            type: "number",
            default: 5,
        },
        showProgress: {
            description: "Whether to show research progress",
            type: "boolean",
            default: true,
        },
    },
})

const { output, vars } = env
const { topic, breadth, depth, searchResultsPerQuery, showProgress } = vars

// Import the runtime helper
const { deepResearch } = await import("genaiscript/runtime")

// Conduct deep research using the runtime helper
const result = await deepResearch({
    topic,
    breadth,
    depth,
    searchResultsPerQuery,
    onProgress: showProgress ? (progress) => {
        console.log(`Research Progress: Depth ${progress.currentDepth}/${progress.totalDepth}, ` +
                   `Query ${progress.completedQueries}/${progress.totalQueries}` +
                   (progress.currentQuery ? ` - "${progress.currentQuery}"` : ""))
    } : undefined
})

// Output the research report
output.appendContent("\n" + MD.stringify(result.report, { headings: 1 }))

// Add research statistics
output.appendContent(`\n\n## Research Statistics

- **Iterations completed:** ${result.stats.iterations}
- **Searches conducted:** ${result.stats.searchesConducted}  
- **Findings discovered:** ${result.stats.findingsDiscovered}
- **Sources consulted:** ${result.stats.sourcesConsulted}

### All Findings
${result.allFindings.map(f => `- ${f.text} (Quality: ${f.sourcesQuality}/10)`).join('\n')}

### Sources
${result.sources.map(s => `- ${s}`).join('\n')}
`)
