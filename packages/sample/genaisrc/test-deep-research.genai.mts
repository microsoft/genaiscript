script({
    title: "Test Deep Research Helper",
    description: "Simple test of the deep research runtime helper",
    parameters: {
        testTopic: {
            description: "Topic to test research on",
            type: "string",
            default: "JavaScript programming trends",
        },
    },
})

const { output, vars } = env
const { testTopic } = vars

try {
    // Import the runtime helper
    const { deepResearch } = await import("genaiscript/runtime")
    
    console.log("✅ Successfully imported deepResearch helper")
    
    // Test with minimal parameters
    const result = await deepResearch({
        topic: testTopic,
        breadth: 2,  // Small breadth for testing
        depth: 1,    // Shallow depth for testing  
        searchResultsPerQuery: 3,
        onProgress: (progress) => {
            console.log(`Research progress: ${progress.completedQueries}/${progress.totalQueries} queries`)
        }
    })
    
    console.log("✅ Deep research completed successfully!")
    
    // Output basic results
    output.appendContent(`# Deep Research Test Results

## Topic: ${testTopic}

### Report Summary
**Title:** ${result.report.title}

**Executive Summary:** ${result.report.executiveSummary}

### Statistics
- Iterations: ${result.stats.iterations}
- Searches: ${result.stats.searchesConducted}
- Findings: ${result.stats.findingsDiscovered}
- Sources: ${result.stats.sourcesConsulted}

### Key Findings
${result.report.keyFindings.map((f, i) => `${i + 1}. ${f.finding} (Confidence: ${f.confidence})`).join('\n')}

### Test Status
✅ **SUCCESS**: Deep research helper is working correctly!
`)

} catch (error) {
    console.error("❌ Test failed:", error)
    
    output.appendContent(`# Deep Research Test Results

## ❌ Test Failed

**Error:** ${error.message}

**Stack:** 
\`\`\`
${error.stack}
\`\`\`

This indicates an issue with the deep research helper implementation.
`)
}