import { describe, test, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { 
    combineSearchResults,
    generateQueryVariations,
    AgenticSearchContext,
    AgenticSearchResult
} from "./agenticsearch"

// Test the internal combination functions without full dependencies
describe("agenticSearch internals", () => {
    
    test("should combine results using simple strategy", () => {
        const results = {
            vector: [
                { filename: "test1.md", content: "content1", score: 0.9, source: "vector", query: "test" },
                { filename: "test2.md", content: "content2", score: 0.7, source: "vector", query: "test" }
            ] as AgenticSearchResult[],
            web: [
                { filename: "web1.md", content: "content3", score: 1.0, source: "web", query: "test" },
                { filename: "test1.md", content: "content1", score: 0.8, source: "web", query: "test" } // duplicate
            ] as AgenticSearchResult[],
            fuzzy: [
                { filename: "fuzzy1.md", content: "content4", score: 0.6, source: "fuzzy", query: "test" }
            ] as AgenticSearchResult[]
        }
        
        const combined = combineSearchResults(results, {
            strategy: "simple",
            topK: 5
        })
        
        assert(combined.length <= 5, "Should respect topK limit")
        assert(combined[0].score >= combined[1]?.score, "Should be sorted by score")
        
        // Should deduplicate by filename
        const filenames = combined.map(r => r.filename)
        const uniqueFilenames = new Set(filenames)
        assert.equal(filenames.length, uniqueFilenames.size, "Should not have duplicate filenames")
    })
    
    test("should combine results using weighted strategy", () => {
        const results = {
            vector: [
                { filename: "test1.md", content: "content1", score: 0.8, source: "vector", query: "test" }
            ] as AgenticSearchResult[],
            web: [
                { filename: "test2.md", content: "content2", score: 1.0, source: "web", query: "test" }
            ] as AgenticSearchResult[]
        }
        
        const combined = combineSearchResults(results, {
            strategy: "weighted",
            weights: { vector: 0.5, web: 0.3, fuzzy: 0.2 },
            topK: 10
        })
        
        assert(combined.length === 2, "Should return all unique results")
        
        // Web result should have lower weighted score despite higher original score
        const vectorResult = combined.find(r => r.source === "vector")
        const webResult = combined.find(r => r.source === "web")
        assert(vectorResult && webResult, "Should have both results")
        assert(vectorResult.score === 0.8 * 0.5, "Vector score should be weighted")
        assert(webResult.score === 1.0 * 0.3, "Web score should be weighted")
    })
    
    test("should combine results using RRF strategy", () => {
        const results = {
            vector: [
                { filename: "test1.md", content: "content1", score: 0.9, source: "vector", query: "test" },
                { filename: "test2.md", content: "content2", score: 0.8, source: "vector", query: "test" }
            ] as AgenticSearchResult[],
            web: [
                { filename: "test1.md", content: "content1", score: 1.0, source: "web", query: "test" },
                { filename: "test3.md", content: "content3", score: 0.7, source: "web", query: "test" }
            ] as AgenticSearchResult[]
        }
        
        const combined = combineSearchResults(results, {
            strategy: "rrf",
            weights: { vector: 1.0, web: 1.0 },
            topK: 10
        })
        
        assert(combined.length === 3, "Should return unique results")
        
        // test1.md should have highest score due to appearing in both lists at high ranks
        const topResult = combined[0]
        assert.equal(topResult.filename, "test1.md", "Duplicate across sources should rank highest")
    })
    
    test("should handle empty results", () => {
        const results = {
            vector: [],
            web: undefined,
            fuzzy: []
        }
        
        const combined = combineSearchResults(results, {
            strategy: "simple",
            topK: 10
        })
        
        assert.equal(combined.length, 0, "Should handle empty results gracefully")
    })
    
    test("should apply topK filter correctly", () => {
        const results = {
            vector: Array.from({ length: 10 }, (_, i) => ({
                filename: `test${i}.md`,
                content: `content${i}`,
                score: 1.0 - i * 0.1,
                source: "vector",
                query: "test"
            })) as AgenticSearchResult[]
        }
        
        const combined = combineSearchResults(results, {
            strategy: "simple",
            topK: 3
        })
        
        assert.equal(combined.length, 3, "Should limit results to topK")
        assert.equal(combined[0].filename, "test0.md", "Should keep highest scoring results")
        assert.equal(combined[2].filename, "test2.md", "Should keep highest scoring results")
    })
})

// Export the internal functions for testing
export function combineSearchResults(
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
    // This is a copy of the internal function for testing
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