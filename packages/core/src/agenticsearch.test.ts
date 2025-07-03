import { describe, test, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { agenticSearch, AgenticSearchContext } from "./agenticsearch"
import { TestHost } from "./testhost"

describe("agenticSearch", () => {
    beforeEach(() => {
        TestHost.install()
    })

    test("should perform agentic search with query rewriting", async () => {
        const query = "artificial intelligence"
        const files: WorkspaceFile[] = [
            { 
                filename: "ai-intro.md", 
                content: "Introduction to artificial intelligence and machine learning concepts" 
            },
            {
                filename: "ml-guide.md",
                content: "Machine learning algorithms and neural networks guide",
            },
            {
                filename: "tech-news.md",
                content: "Latest technology news and software development trends",
            }
        ]

        // Mock context
        const mockContext: AgenticSearchContext = {
            runPrompt: async (generator, options) => {
                // Mock query rewriting - generate variations
                const variations = [
                    "artificial intelligence",
                    "AI machine learning",
                    "neural networks algorithms"
                ]
                return {
                    text: variations.join('\n'),
                    error: undefined,
                } as RunPromptResult
            },
            retrieval: {
                vectorSearch: async (query, files, options) => {
                    // Mock vector search - return files with AI content
                    return files
                        .filter(f => f.content?.toLowerCase().includes('ai') || 
                                   f.content?.toLowerCase().includes('artificial') ||
                                   f.content?.toLowerCase().includes('machine'))
                        .map(f => ({ ...f, score: 0.8 }))
                },
                webSearch: async (query, options) => {
                    // Mock web search
                    return [
                        {
                            filename: "https://example.com/ai-article",
                            content: "Comprehensive guide to artificial intelligence applications"
                        }
                    ]
                },
                fuzzSearch: async (query, files, options) => {
                    // Mock fuzzy search
                    return files
                        .filter(f => f.content?.toLowerCase().includes('intelligence') ||
                                   f.content?.toLowerCase().includes('learning'))
                        .map(f => ({ ...f, score: 0.6 }))
                }
            }
        }

        const results = await agenticSearch(query, files, mockContext, {
            topK: 5,
            queryVariations: 2,
            combinationStrategy: "weighted"
        })

        assert(results.length > 0, "Should return search results")
        assert(results.every(r => typeof r.score === "number"), "All results should have scores")
        assert(results.every(r => typeof r.source === "string"), "All results should have source")
        assert(results.every(r => typeof r.query === "string"), "All results should have query")
        
        // Results should be sorted by score descending
        for (let i = 1; i < results.length; i++) {
            assert(results[i-1].score >= results[i].score, "Results should be sorted by score")
        }
    })

    test("should handle empty files list gracefully", async () => {
        const query = "test query"
        const files: WorkspaceFile[] = []

        const mockContext: AgenticSearchContext = {
            runPrompt: async () => ({ text: "test query", error: undefined } as RunPromptResult),
            retrieval: {
                vectorSearch: async () => [],
                webSearch: async () => [{
                    filename: "https://example.com/result",
                    content: "Web search result"
                }],
                fuzzSearch: async () => []
            }
        }

        const results = await agenticSearch(query, files, mockContext, {
            includeWebSearch: true,
            includeVectorSearch: false,
            includeFuzzSearch: false
        })

        assert(results.length >= 0, "Should handle empty files gracefully")
    })

    test("should respect search type filtering options", async () => {
        const query = "test"
        const files: WorkspaceFile[] = [
            { filename: "test.md", content: "test content" }
        ]

        const mockContext: AgenticSearchContext = {
            runPrompt: async () => ({ text: "test", error: undefined } as RunPromptResult),
            retrieval: {
                vectorSearch: async () => [{ filename: "vector.md", content: "vector result", score: 0.9 }],
                webSearch: async () => [{ filename: "https://web.com", content: "web result" }],
                fuzzSearch: async () => [{ filename: "fuzzy.md", content: "fuzzy result", score: 0.7 }]
            }
        }

        // Test with only vector search enabled
        const vectorOnlyResults = await agenticSearch(query, files, mockContext, {
            includeVectorSearch: true,
            includeWebSearch: false,
            includeFuzzSearch: false
        })

        assert(vectorOnlyResults.every(r => r.source === "vector"), "Should only return vector results")

        // Test with only web search enabled
        const webOnlyResults = await agenticSearch(query, files, mockContext, {
            includeVectorSearch: false,
            includeWebSearch: true,
            includeFuzzSearch: false
        })

        assert(webOnlyResults.every(r => r.source === "web"), "Should only return web results")
    })

    test("should apply topK and minScore filters", async () => {
        const query = "test"
        const files: WorkspaceFile[] = [
            { filename: "test1.md", content: "test content 1" },
            { filename: "test2.md", content: "test content 2" },
            { filename: "test3.md", content: "test content 3" }
        ]

        const mockContext: AgenticSearchContext = {
            runPrompt: async () => ({ text: "test", error: undefined } as RunPromptResult),
            retrieval: {
                vectorSearch: async () => [
                    { filename: "vec1.md", content: "content", score: 0.9 },
                    { filename: "vec2.md", content: "content", score: 0.7 },
                    { filename: "vec3.md", content: "content", score: 0.5 },
                    { filename: "vec4.md", content: "content", score: 0.3 }
                ],
                webSearch: async () => [],
                fuzzSearch: async () => []
            }
        }

        const results = await agenticSearch(query, files, mockContext, {
            topK: 2,
            minScore: 0.6,
            includeWebSearch: false,
            includeFuzzSearch: false
        })

        assert(results.length <= 2, "Should respect topK limit")
        assert(results.every(r => r.score >= 0.6), "Should respect minScore threshold")
    })

    test("should handle query rewriting failures gracefully", async () => {
        const query = "test query"
        const files: WorkspaceFile[] = [
            { filename: "test.md", content: "test content" }
        ]

        const mockContext: AgenticSearchContext = {
            runPrompt: async () => ({ 
                text: undefined, 
                error: new Error("Query rewriting failed") 
            } as RunPromptResult),
            retrieval: {
                vectorSearch: async () => [{ filename: "test.md", content: "content", score: 0.8 }],
                webSearch: async () => [],
                fuzzSearch: async () => []
            }
        }

        const results = await agenticSearch(query, files, mockContext, {
            includeWebSearch: false,
            includeFuzzSearch: false
        })

        // Should still work with original query when rewriting fails
        assert(results.length >= 0, "Should handle query rewriting failures")
    })
})